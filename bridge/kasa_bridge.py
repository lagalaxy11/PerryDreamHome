"""Local bridge between the Perry Dream Home web app and TP-Link Kasa devices.

Browsers can't speak the Kasa protocols (raw TCP / KLAP), so this small server
runs on a machine on the same network as the devices and exposes a JSON API:

  GET  /api/health                 bridge status
  GET  /api/devices                cached state of every Kasa device found
  POST /api/devices/{id}           {"on": bool, "brightness": 1-100}
  POST /api/discover               re-scan the network
  GET  /api/mapping                {appDeviceId: kasaDeviceId}
  PUT  /api/mapping                replace the mapping

If ../dist exists (run `npm run build`), the web app is served at / as well,
so a phone on the same Wi-Fi can open http://<this-machine>:8787.

Configuration (environment variables):
  BRIDGE_HOST        interface to listen on (default 127.0.0.1; use 0.0.0.0 for LAN access)
  BRIDGE_PORT        default 8787
  BRIDGE_TOKEN       if set, /api requests need "Authorization: Bearer <token>"
  KASA_USERNAME      TP-Link account email (needed by newer KLAP firmware)
  KASA_PASSWORD      TP-Link account password
  KASA_HOSTS         comma-separated device IPs to add without broadcast discovery
  KASA_DISCOVERY_TARGET  broadcast address (default 255.255.255.255)
  KASA_POLL_SECONDS  how often device state is refreshed (default 2)
  MAPPING_FILE       where the mapping is stored (default bridge/mapping.json)
"""

from __future__ import annotations

import asyncio
import json
import logging
import os
import time
from pathlib import Path

from aiohttp import web
from kasa import Credentials, Device, Discover, Module

log = logging.getLogger("kasa_bridge")

HERE = Path(__file__).resolve().parent
DIST = HERE.parent / "dist"

DISCOVERY_EVERY = 300  # seconds between background re-scans
DEVICE_TIMEOUT = 5


def env_list(name: str) -> list[str]:
    return [v.strip() for v in os.environ.get(name, "").split(",") if v.strip()]


class KasaHub:
    """Owns the Device objects, keeps their state fresh and applies commands."""

    def __init__(self) -> None:
        user, pw = os.environ.get("KASA_USERNAME"), os.environ.get("KASA_PASSWORD")
        self.credentials = Credentials(user, pw) if user and pw else None
        self.target = os.environ.get("KASA_DISCOVERY_TARGET", "255.255.255.255")
        self.static_hosts = env_list("KASA_HOSTS")
        self.poll_seconds = float(os.environ.get("KASA_POLL_SECONDS", "2"))

        self.roots: dict[str, Device] = {}  # host -> top-level device
        self.offline: set[str] = set()  # hosts whose last update failed
        self.discovered_at: float | None = None
        self._discover_lock = asyncio.Lock()
        self._update_locks: dict[str, asyncio.Lock] = {}

    # --- discovery -------------------------------------------------------

    async def discover(self) -> None:
        async with self._discover_lock:
            found: dict[str, Device] = {}
            try:
                found.update(await Discover.discover(
                    target=self.target, credentials=self.credentials, discovery_timeout=3,
                ))
            except Exception:  # noqa: BLE001 - discovery errors shouldn't kill the bridge
                log.exception("Broadcast discovery failed")
            for host in self.static_hosts:
                if host in found:
                    continue
                try:
                    dev = await Discover.discover_single(host, credentials=self.credentials, discovery_timeout=3)
                    if dev:
                        found[host] = dev
                except Exception as err:  # noqa: BLE001
                    log.warning("Could not reach %s: %s", host, err)

            for host, dev in found.items():
                old = self.roots.get(host)
                if old is not None and old is not dev:
                    await self._close(old)
                self.roots[host] = dev
                await self._update(host)
            self.discovered_at = time.time()
            log.info("Discovery done: %d device(s)", len(self.roots))

    # --- state -----------------------------------------------------------

    async def _update(self, host: str) -> None:
        lock = self._update_locks.setdefault(host, asyncio.Lock())
        async with lock:
            try:
                await asyncio.wait_for(self.roots[host].update(), DEVICE_TIMEOUT)
                self.offline.discard(host)
            except Exception as err:  # noqa: BLE001
                if host not in self.offline:
                    log.warning("%s went offline: %s", host, err)
                self.offline.add(host)

    async def refresh(self) -> None:
        await asyncio.gather(*(self._update(h) for h in list(self.roots)))

    async def run(self) -> None:
        """Background loop: periodic refresh plus an occasional re-scan."""
        await self.discover()
        last_scan = time.monotonic()
        while True:
            await asyncio.sleep(self.poll_seconds)
            if time.monotonic() - last_scan > DISCOVERY_EVERY:
                await self.discover()
                last_scan = time.monotonic()
            else:
                await self.refresh()

    def _entries(self):
        """Yield (host, controllable device, parent or None).

        Power strips expose each outlet as its own device; the strip itself is skipped.
        """
        for host, root in self.roots.items():
            children = getattr(root, "children", None) or []
            if children and root.device_type in (Device.Type.Strip, Device.Type.WallSwitch):
                for child in children:
                    yield host, child, root
            else:
                yield host, root, None

    def snapshot(self) -> list[dict]:
        out = []
        for host, dev, parent in self._entries():
            online = host not in self.offline
            try:
                light = dev.modules.get(Module.Light)
                dimmable = bool(light and light.has_feature("brightness"))
                out.append({
                    "id": dev.device_id,
                    "alias": dev.alias,
                    "model": (parent or dev).model,
                    "type": dev.device_type.name.lower(),
                    "host": host,
                    "parent": parent.device_id if parent else None,
                    "online": online,
                    "on": bool(dev.is_on),
                    "brightness": light.brightness if dimmable else None,
                })
            except Exception as err:  # noqa: BLE001 - never initialised (offline since discovery)
                log.debug("Skipping %s: %s", host, err)
        return sorted(out, key=lambda d: (d["alias"] or "").lower())

    def find(self, device_id: str):
        for host, dev, _ in self._entries():
            try:
                if dev.device_id == device_id:
                    return host, dev
            except Exception:  # noqa: BLE001
                continue
        return None, None

    async def set_state(self, device_id: str, on: bool | None, brightness: int | None) -> dict | None:
        host, dev = self.find(device_id)
        if dev is None:
            return None
        async with self._update_locks.setdefault(host, asyncio.Lock()):
            if brightness is not None:
                light = dev.modules.get(Module.Light)
                if not (light and light.has_feature("brightness")):
                    raise web.HTTPBadRequest(text=json.dumps({"error": "Device is not dimmable"}),
                                             content_type="application/json")
                await asyncio.wait_for(light.set_brightness(brightness), DEVICE_TIMEOUT)
            if on is True:
                await asyncio.wait_for(dev.turn_on(), DEVICE_TIMEOUT)
            elif on is False:
                await asyncio.wait_for(dev.turn_off(), DEVICE_TIMEOUT)
        await self._update(host)
        return next((d for d in self.snapshot() if d["id"] == device_id), None)

    async def _close(self, dev: Device) -> None:
        try:
            await dev.disconnect()
        except Exception:  # noqa: BLE001
            pass

    async def close(self) -> None:
        for dev in self.roots.values():
            await self._close(dev)


class MappingStore:
    """Persists which Kasa device backs each device in the app."""

    def __init__(self, path: Path) -> None:
        self.path = path

    def load(self) -> dict[str, str]:
        try:
            data = json.loads(self.path.read_text())
            return {str(k): str(v) for k, v in data.items() if v}
        except FileNotFoundError:
            return {}
        except (OSError, ValueError, AttributeError):
            log.exception("Ignoring unreadable mapping file %s", self.path)
            return {}

    def save(self, mapping: dict[str, str]) -> None:
        tmp = self.path.with_suffix(".tmp")
        tmp.write_text(json.dumps(mapping, indent=2, sort_keys=True) + "\n")
        tmp.replace(self.path)


# --- HTTP layer -------------------------------------------------------------

def json_error(status: int, message: str) -> web.Response:
    return web.json_response({"error": message}, status=status)


@web.middleware
async def security(request: web.Request, handler):
    if request.path.startswith("/api/"):
        token = request.app["token"]
        if token and request.headers.get("Authorization") != f"Bearer {token}":
            return json_error(401, "Missing or wrong bridge token")
        # Requiring JSON makes browsers send a CORS preflight for cross-site
        # requests, which this server never approves, so random websites
        # can't flip your lights.
        if request.method in ("POST", "PUT") and request.content_type != "application/json":
            return json_error(415, "Content-Type must be application/json")
    return await handler(request)


async def health(request: web.Request) -> web.Response:
    hub: KasaHub = request.app["hub"]
    return web.json_response({
        "ok": True,
        "bridge": "kasa",
        "devices": len(hub.snapshot()),
        "discoveredAt": hub.discovered_at,
    })


async def list_devices(request: web.Request) -> web.Response:
    hub: KasaHub = request.app["hub"]
    return web.json_response({"devices": hub.snapshot(), "discoveredAt": hub.discovered_at})


async def rediscover(request: web.Request) -> web.Response:
    hub: KasaHub = request.app["hub"]
    await hub.discover()
    return web.json_response({"devices": hub.snapshot(), "discoveredAt": hub.discovered_at})


async def set_device(request: web.Request) -> web.Response:
    hub: KasaHub = request.app["hub"]
    try:
        body = await request.json()
    except ValueError:
        return json_error(400, "Body must be JSON")
    if not isinstance(body, dict):
        return json_error(400, "Body must be an object")
    on = body.get("on")
    brightness = body.get("brightness")
    if on is not None and not isinstance(on, bool):
        return json_error(400, "'on' must be true or false")
    if brightness is not None:
        if isinstance(brightness, bool) or not isinstance(brightness, int) or not 1 <= brightness <= 100:
            return json_error(400, "'brightness' must be an integer from 1 to 100")
    if on is None and brightness is None:
        return json_error(400, "Nothing to change")
    try:
        device = await hub.set_state(request.match_info["id"], on, brightness)
    except web.HTTPException:
        raise
    except Exception as err:  # noqa: BLE001
        log.warning("Command to %s failed: %s", request.match_info["id"], err)
        return json_error(502, f"Device did not respond: {err}")
    if device is None:
        return json_error(404, "Unknown device")
    return web.json_response(device)


async def get_mapping(request: web.Request) -> web.Response:
    return web.json_response(request.app["mapping"].load())


async def put_mapping(request: web.Request) -> web.Response:
    try:
        body = await request.json()
    except ValueError:
        return json_error(400, "Body must be JSON")
    if not isinstance(body, dict) or not all(
        isinstance(k, str) and isinstance(v, str) for k, v in body.items()
    ):
        return json_error(400, "Mapping must be an object of strings")
    mapping = {k: v for k, v in body.items() if v}
    request.app["mapping"].save(mapping)
    return web.json_response(mapping)


async def spa(request: web.Request) -> web.StreamResponse:
    """Serve the built web app, falling back to index.html for client routes."""
    rel = request.match_info.get("path", "")
    if rel == "api" or rel.startswith("api/"):
        return json_error(404, "Unknown API route")
    candidate = (DIST / rel).resolve()
    if rel and candidate.is_file() and DIST in candidate.parents:
        return web.FileResponse(candidate)
    return web.FileResponse(DIST / "index.html")


def create_app(hub: KasaHub | None = None, mapping_file: Path | None = None,
               token: str | None = None, run_hub: bool = True) -> web.Application:
    app = web.Application(middlewares=[security])
    app["hub"] = hub or KasaHub()
    app["mapping"] = MappingStore(mapping_file or Path(os.environ.get("MAPPING_FILE", HERE / "mapping.json")))
    app["token"] = token if token is not None else os.environ.get("BRIDGE_TOKEN", "")

    app.router.add_get("/api/health", health)
    app.router.add_get("/api/devices", list_devices)
    app.router.add_post("/api/discover", rediscover)
    app.router.add_post("/api/devices/{id}", set_device)
    app.router.add_get("/api/mapping", get_mapping)
    app.router.add_put("/api/mapping", put_mapping)
    if (DIST / "index.html").is_file():
        app.router.add_get("/{path:.*}", spa)

    if run_hub:
        async def start(app: web.Application):
            app["hub_task"] = asyncio.create_task(app["hub"].run())
            yield
            app["hub_task"].cancel()
            await app["hub"].close()

        app.cleanup_ctx.append(start)
    return app


def main() -> None:
    logging.basicConfig(level=os.environ.get("LOG_LEVEL", "INFO"),
                        format="%(asctime)s %(levelname)s %(name)s: %(message)s")
    host = os.environ.get("BRIDGE_HOST", "127.0.0.1")
    port = int(os.environ.get("BRIDGE_PORT", "8787"))
    if host not in ("127.0.0.1", "localhost") and not os.environ.get("BRIDGE_TOKEN"):
        log.warning("Listening on %s without BRIDGE_TOKEN: anyone on your network can control your devices", host)
    web.run_app(create_app(), host=host, port=port, print=lambda msg: log.info(msg))


if __name__ == "__main__":
    main()
