"""Emulates a few legacy Kasa devices so the bridge can be tried without hardware.

Each fake listens on its own loopback address (127.0.0.11, .12, ...) on the real
Kasa port 9999 (UDP discovery + TCP commands, XOR "autokey" protocol).

    python bridge/dev/fake_kasa.py
    KASA_HOSTS=127.0.0.11,127.0.0.12,127.0.0.13 python bridge/kasa_bridge.py

Linux answers on all of 127.0.0.0/8 out of the box; on macOS add the aliases
first: `sudo ifconfig lo0 alias 127.0.0.11` (and .12, .13).
"""

from __future__ import annotations

import asyncio
import json
import struct

PORT = 9999


def encrypt(plain: bytes) -> bytes:
    key, out = 171, bytearray()
    for b in plain:
        key ^= b
        out.append(key)
    return bytes(out)


def decrypt(cipher: bytes) -> bytes:
    key, out = 171, bytearray()
    for b in cipher:
        out.append(key ^ b)
        key = b
    return bytes(out)


def base_sysinfo(n: int, model: str, alias: str, dev_name: str) -> dict:
    return {
        "sw_ver": "1.0.6 Build 200821 Rel.090909", "hw_ver": "5.0", "model": model,
        "deviceId": f"80060000000000000000000000000000000000{n:02d}",
        "oemId": "00000000000000000000000000000000", "hwId": "00000000000000000000000000000000",
        "rssi": -48, "latitude_i": 0, "longitude_i": 0, "alias": alias, "status": "new",
        "obd_src": "tplink", "mic_type": "IOT.SMARTPLUGSWITCH", "feature": "TIM",
        "mac": f"50:C7:BF:00:00:{n:02X}", "updating": 0, "led_off": 0, "on_time": 0,
        "icon_hash": "", "dev_name": dev_name, "active_mode": "none",
        "next_action": {"type": -1}, "ntc_state": 0, "err_code": 0,
    }


class FakeDevice:
    def __init__(self, sysinfo: dict) -> None:
        self.sysinfo = sysinfo
        self.connections: set[asyncio.Transport] = set()

    def unplug(self) -> None:
        """Drop open connections, like a device losing power."""
        for transport in list(self.connections):
            transport.close()

    def handle(self, request: dict) -> dict:
        child_ids = (request.pop("context", None) or {}).get("child_ids") or []
        response = {}
        for module, methods in request.items():
            response[module] = {}
            for method, params in (methods or {}).items():
                response[module][method] = self.call(module, method, params or {}, child_ids)
        return response

    def call(self, module: str, method: str, params: dict, child_ids: list[str]) -> dict:
        info = self.sysinfo
        if method == "get_sysinfo":
            return info
        if method == "set_relay_state":
            state = int(params["state"])
            if child_ids:
                for child in info["children"]:
                    if child["id"] in child_ids:
                        child["state"] = state
            else:
                info["relay_state"] = state
            return {"err_code": 0}
        if method == "set_brightness" and "brightness" in info:
            info["brightness"] = int(params["brightness"])
            return {"err_code": 0}
        if method == "set_dimmer_transition" and "brightness" in info:
            # Like the real HS220: a transition to a brightness turns the dimmer on.
            brightness = int(params["brightness"])
            if brightness:
                info["brightness"] = brightness
            info["relay_state"] = int(brightness > 0)
            return {"err_code": 0}
        if method == "get_dimmer_parameters":
            return {"minThreshold": 1, "fadeOnTime": 0, "fadeOffTime": 0, "gentleOnTime": 3000,
                    "gentleOffTime": 10000, "rampRate": 30, "bulb_type": 1, "err_code": 0}
        if method == "get_time":
            return {"year": 2026, "month": 10, "mday": 14, "hour": 18, "min": 0, "sec": 0, "err_code": 0}
        if method == "get_timezone":
            return {"index": 6, "err_code": 0}
        if method == "get_info" and module == "cnCloud":
            return {"username": "", "server": "n-devs.tplinkcloud.com", "binded": 0,
                    "cld_connection": 0, "illegalType": 0, "stopConnect": 0, "tcspStatus": 0,
                    "fwDlPage": "", "tcspInfo": "", "fwNotifyType": 0, "err_code": 0}
        if method in ("get_rules", "get_next_action"):
            return {"rule_list": [], "enable": 0, "version": 2, "err_code": 0}
        return {"err_code": 0}


class TcpProtocol(asyncio.Protocol):
    def __init__(self, device: FakeDevice) -> None:
        self.device = device
        self.buffer = b""

    def connection_made(self, transport) -> None:
        self.transport = transport
        self.device.connections.add(transport)

    def connection_lost(self, exc) -> None:
        self.device.connections.discard(self.transport)

    def data_received(self, data: bytes) -> None:
        self.buffer += data
        while len(self.buffer) >= 4:
            (length,) = struct.unpack(">I", self.buffer[:4])
            if len(self.buffer) < 4 + length:
                return
            payload, self.buffer = self.buffer[4:4 + length], self.buffer[4 + length:]
            reply = json.dumps(self.device.handle(json.loads(decrypt(payload)))).encode()
            self.transport.write(struct.pack(">I", len(reply)) + encrypt(reply))


class UdpProtocol(asyncio.DatagramProtocol):
    def __init__(self, device: FakeDevice) -> None:
        self.device = device

    def connection_made(self, transport) -> None:
        self.transport = transport

    def datagram_received(self, data: bytes, addr) -> None:
        try:
            request = json.loads(decrypt(data))
        except ValueError:
            return
        reply = json.dumps(self.device.handle(request)).encode()
        self.transport.sendto(encrypt(reply), addr)


def make_devices(first_ip: int = 11) -> dict[str, FakeDevice]:
    """A plug, a dimmer and a 3-outlet strip on 127.0.0.<first_ip>..+2."""
    plug = base_sysinfo(first_ip, "HS103(US)", "Living Floor Lamp", "Smart Wi-Fi Plug Mini")
    plug["relay_state"] = 1

    dimmer = base_sysinfo(first_ip + 1, "HS220(US)", "Kitchen Pendants", "Smart Wi-Fi Dimmer")
    dimmer.update(relay_state=0, brightness=60,
                  preferred_state=[{"index": i, "brightness": b} for i, b in enumerate((100, 75, 50, 25))])

    strip = base_sysinfo(first_ip + 2, "KP303(US)", "Bedroom Strip", "Smart Wi-Fi Power Strip")
    strip.update(child_num=3, children=[
        {"id": f"{strip['deviceId']}{i:02d}", "state": int(i == 0), "alias": alias,
         "on_time": 0, "next_action": {"type": -1}}
        for i, alias in enumerate(("Bedside Lamp", "Window AC", "Desk Lamp"))
    ])
    return {f"127.0.0.{first_ip + i}": dev for i, dev in enumerate(map(FakeDevice, (plug, dimmer, strip)))}


async def serve(devices: dict[str, FakeDevice]) -> list:
    """Start TCP + UDP listeners for each device; returns closables."""
    loop = asyncio.get_running_loop()
    handles = []
    for host, device in devices.items():
        server = await loop.create_server(lambda d=device: TcpProtocol(d), host, PORT)
        udp, _ = await loop.create_datagram_endpoint(lambda d=device: UdpProtocol(d), local_addr=(host, PORT))
        handles += [server, udp]
    return handles


async def main() -> None:
    devices = make_devices()
    await serve(devices)
    for host, device in devices.items():
        print(f"fake {device.sysinfo['model']:<10} '{device.sysinfo['alias']}' on {host}:{PORT}", flush=True)
    await asyncio.Event().wait()


if __name__ == "__main__":
    asyncio.run(main())
