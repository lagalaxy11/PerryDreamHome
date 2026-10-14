"""End-to-end tests: the bridge's HTTP API against emulated Kasa devices.

    pip install -r bridge/requirements.txt
    python -m unittest discover -s bridge/tests
"""

import sys
import tempfile
import unittest
from pathlib import Path

from aiohttp.test_utils import TestClient, TestServer

ROOT = Path(__file__).resolve().parents[1]
sys.path[:0] = [str(ROOT), str(ROOT / "dev")]

import fake_kasa  # noqa: E402
from kasa_bridge import KasaHub, create_app  # noqa: E402

PLUG = "50:C7:BF:00:00:15"  # first_ip=21 -> MAC suffix 0x15
DIMMER = "50:C7:BF:00:00:16"
JSON = {"Content-Type": "application/json"}


class BridgeTest(unittest.IsolatedAsyncioTestCase):
    token = ""

    async def asyncSetUp(self):
        self.fakes = fake_kasa.make_devices(first_ip=21)
        self.handles = await fake_kasa.serve(self.fakes)
        self.hub = KasaHub()
        self.hub.target = "127.255.255.255"
        self.hub.static_hosts = list(self.fakes)
        self.hub.credentials = None
        await self.hub.discover()

        self.tmp = tempfile.TemporaryDirectory()
        app = create_app(self.hub, Path(self.tmp.name) / "mapping.json", token=self.token, run_hub=False)
        self.client = TestClient(TestServer(app))
        await self.client.start_server()

    async def asyncTearDown(self):
        await self.client.close()
        await self.hub.close()
        for handle in self.handles:
            handle.close()
        self.tmp.cleanup()

    def headers(self, extra=None):
        h = dict(extra or {})
        if self.token:
            h["Authorization"] = f"Bearer {self.token}"
        return h

    async def post(self, path, body, headers=JSON):
        return await self.client.post(path, json=body, headers=self.headers(headers))

    async def devices(self):
        res = await self.client.get("/api/devices", headers=self.headers())
        self.assertEqual(res.status, 200)
        return {d["alias"]: d for d in (await res.json())["devices"]}


class ApiTest(BridgeTest):
    async def test_lists_plug_dimmer_and_each_strip_outlet(self):
        devices = await self.devices()
        self.assertEqual(sorted(devices), ["Bedside Lamp", "Desk Lamp", "Kitchen Pendants", "Living Floor Lamp", "Window AC"])
        self.assertEqual(devices["Kitchen Pendants"]["brightness"], 60)
        self.assertIsNone(devices["Living Floor Lamp"]["brightness"])
        self.assertEqual(devices["Window AC"]["type"], "stripsocket")
        self.assertTrue(all(d["online"] for d in devices.values()))

    async def test_switches_a_plug(self):
        res = await self.post(f"/api/devices/{PLUG}", {"on": False})
        self.assertEqual(res.status, 200)
        self.assertFalse((await res.json())["on"])
        self.assertEqual(self.fakes["127.0.0.21"].sysinfo["relay_state"], 0)

    async def test_switches_one_strip_outlet_only(self):
        ac = (await self.devices())["Window AC"]
        res = await self.post(f"/api/devices/{ac['id']}", {"on": True})
        self.assertEqual(res.status, 200)
        states = [c["state"] for c in self.fakes["127.0.0.23"].sysinfo["children"]]
        self.assertEqual(states, [1, 1, 0])

    async def test_dims_without_forcing_on(self):
        res = await self.post(f"/api/devices/{DIMMER}", {"on": False, "brightness": 30})
        body = await res.json()
        self.assertEqual((body["on"], body["brightness"]), (False, 30))

    async def test_rejects_bad_input(self):
        cases = [
            ({"on": "yes"}, 400),
            ({"brightness": 0}, 400),
            ({"brightness": True}, 400),
            ({}, 400),
        ]
        for body, status in cases:
            with self.subTest(body=body):
                self.assertEqual((await self.post(f"/api/devices/{PLUG}", body)).status, status)
        self.assertEqual((await self.post(f"/api/devices/{PLUG}", {"brightness": 50})).status, 400)  # not dimmable
        self.assertEqual((await self.post("/api/devices/nope", {"on": True})).status, 404)

    async def test_requires_json_content_type(self):
        res = await self.client.post(f"/api/devices/{PLUG}", data='{"on": false}',
                                     headers=self.headers({"Content-Type": "text/plain"}))
        self.assertEqual(res.status, 415)
        self.assertEqual(self.fakes["127.0.0.21"].sysinfo["relay_state"], 1)

    async def test_mapping_round_trip_drops_empty_links(self):
        res = await self.client.put("/api/mapping", json={"great-floor": PLUG, "kitchen-pendants": ""},
                                    headers=self.headers(JSON))
        self.assertEqual(await res.json(), {"great-floor": PLUG})
        res = await self.client.get("/api/mapping", headers=self.headers())
        self.assertEqual(await res.json(), {"great-floor": PLUG})
        bad = await self.client.put("/api/mapping", json={"x": 1}, headers=self.headers(JSON))
        self.assertEqual(bad.status, 400)

    async def test_offline_device_reports_and_fails_cleanly(self):
        for handle in self.handles[:2]:  # plug's TCP + UDP
            handle.close()
        self.fakes["127.0.0.21"].unplug()
        await self.hub.refresh()
        self.assertFalse((await self.devices())["Living Floor Lamp"]["online"])
        self.assertTrue((await self.devices())["Kitchen Pendants"]["online"])
        res = await self.post(f"/api/devices/{PLUG}", {"on": True})
        self.assertEqual(res.status, 502)


class TokenTest(BridgeTest):
    token = "s3cret"

    async def test_rejects_missing_token(self):
        res = await self.client.get("/api/devices")
        self.assertEqual(res.status, 401)

    async def test_accepts_token(self):
        self.assertIn("Living Floor Lamp", await self.devices())


if __name__ == "__main__":
    unittest.main()
