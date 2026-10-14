# Kasa bridge

The app controls TP-Link Kasa plugs, power strips, dimmers, switches and
bulbs. Browsers can't speak the Kasa protocols, so this small
Python server runs on a computer on your home Wi-Fi (a Mac, PC or Raspberry Pi
that stays on). It finds your devices and gives the web app a simple API.

```
phone / laptop browser ──HTTP──▶ kasa_bridge.py ──Kasa protocol (LAN)──▶ plugs, bulbs, switches
```

Built on [python-kasa](https://github.com/python-kasa/python-kasa), which
handles older firmware (the XOR protocol on port 9999) as well as newer
firmware that requires your TP-Link login (KLAP).

## Setup

Requires Python 3.11+.

```sh
python3 -m venv .venv
source .venv/bin/activate            # Windows: .venv\Scripts\activate
pip install -r bridge/requirements.txt
```

Newer devices (most bought since ~2023, plus anything updated to recent
firmware) only answer if you pass your TP-Link / Kasa app login. It is used
locally to authenticate with the device; nothing is sent to the cloud:

```sh
export KASA_USERNAME="you@example.com"
export KASA_PASSWORD="your Kasa app password"
```

Check what the bridge can see with python-kasa's own CLI:

```sh
kasa discover
```

## Run it

### While developing (`npm run dev`)

```sh
python bridge/kasa_bridge.py          # terminal 1
npm run dev                           # terminal 2
```

Vite forwards `/api` to the bridge on `127.0.0.1:8787`. Open the app and the
badge in the top-right of the panel changes from *Simulated* to *Kasa*.

### On your phone

Build the app once, then let the bridge serve it to your network:

```sh
npm run build
BRIDGE_HOST=0.0.0.0 BRIDGE_TOKEN="pick-a-long-random-string" python bridge/kasa_bridge.py
```

Open `http://<computer's LAN IP>:8787` on your phone, then enter the token
when the app asks for it. The token is saved in that browser. Without a token,
anyone on your Wi-Fi could switch your devices.

## Link devices

Tap the badge at the top of the panel and choose which Kasa device backs each
lamp or AC in the model (`src/home.config.js`). Links are stored by the bridge in `bridge/mapping.json`
(keyed by MAC address, so renaming a device in the Kasa app is fine) and are
shared by every browser.

Anything left unlinked stays simulated, so you can link devices one at a time.
Kasa devices that aren't linked to anything still show in the panel under
**Other Kasa devices** and can be switched from there.

**About the ACs:** Kasa makes plugs, not thermostats. Linking an AC to a Kasa
plug or outlet switches its power for real. Temperature, mode, fan, eco and
sleep are kept in the app only. That works well for window units with
mechanical controls or an auto-restart feature, which resume their last
setting when power returns. Mini-splits generally need their own integration
(IR blaster, Sensibo, or the vendor's API), which can be added as another
bridge later.

## Configuration

| Variable | Default | |
| --- | --- | --- |
| `BRIDGE_HOST` | `127.0.0.1` | `0.0.0.0` to allow other devices on your network |
| `BRIDGE_PORT` | `8787` | |
| `BRIDGE_TOKEN` | *(none)* | require `Authorization: Bearer <token>` on `/api` |
| `KASA_USERNAME` / `KASA_PASSWORD` | *(none)* | TP-Link login for newer firmware |
| `KASA_HOSTS` | *(none)* | comma-separated device IPs, for networks where broadcast discovery doesn't work (VLANs, Docker, mesh guest networks) |
| `KASA_DISCOVERY_TARGET` | `255.255.255.255` | broadcast address to scan |
| `KASA_POLL_SECONDS` | `2` | how often device state is refreshed |
| `MAPPING_FILE` | `bridge/mapping.json` | |

## API

| | |
| --- | --- |
| `GET /api/health` | bridge status |
| `GET /api/devices` | every device: `id`, `alias`, `model`, `type`, `host`, `online`, `on`, `brightness` (null if not dimmable). Each power-strip outlet is its own device. |
| `POST /api/devices/{id}` | `{"on": true}`, `{"brightness": 40}` or both |
| `POST /api/discover` | re-scan the network now (it also re-scans every 5 minutes) |
| `GET` / `PUT /api/mapping` | `{ "great-floor": "<kasa id>", ... }` |

`POST` and `PUT` require `Content-Type: application/json`. Browsers can't
send that cross-site without a CORS preflight, which the bridge never
approves, so other websites can't control your devices.

## Try it without hardware

`dev/fake_kasa.py` emulates a plug, a dimmer and a 3-outlet strip on
loopback addresses (Linux; see the file for macOS):

```sh
python bridge/dev/fake_kasa.py &
KASA_HOSTS=127.0.0.11,127.0.0.12,127.0.0.13 python bridge/kasa_bridge.py
```

## Tests

```sh
python -m unittest discover -s bridge/tests
```

The tests run the real HTTP API and python-kasa against the emulated devices.
