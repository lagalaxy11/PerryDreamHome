# Kasa Home

Your home as a 3D model you can tap. Tap a lamp and the real light switches;
tap an AC for its controls. Works on your phone, and runs entirely on your
home network.

It controls TP-Link **Kasa** plugs, power strips, dimmers, switches and bulbs
through a small local bridge ([`bridge/`](bridge/README.md)).

## Quick start

On a computer that stays on and is on the same Wi-Fi as your Kasa devices:

```sh
git clone https://github.com/lagalaxy11/kasa-home.git && cd kasa-home
npm install && npm run build

python3 -m venv .venv && source .venv/bin/activate
pip install -r bridge/requirements.txt

# Needed for newer Kasa firmware (your Kasa app login; used locally only)
export KASA_USERNAME="you@example.com" KASA_PASSWORD="…"

BRIDGE_HOST=0.0.0.0 BRIDGE_TOKEN="some-long-random-string" npm run bridge
```

Then on your phone, open `http://<that computer's IP>:8787`, enter the token,
and use your browser's **Add to Home screen** option to keep it handy.

1. Tap the badge at the top of the panel. You'll see every Kasa device the
   bridge found.
2. Link each lamp / AC in the model to its Kasa device. Kasa devices you
   don't link still appear under **Other Kasa devices**.

## Make it your home

Edit [`src/home.config.js`](src/home.config.js): rooms are rectangles in feet
(top-left corner, width, depth), and each lamp or AC has a room and a
position. Rebuild with `npm run build`. The default layout is a placeholder
apartment.

## Develop

```sh
npm run bridge     # terminal 1 (or the fake devices below)
npm run dev        # terminal 2; /api is proxied to the bridge
```

No Kasa devices handy? `python bridge/dev/fake_kasa.py` emulates a plug, a
dimmer and a power strip; see [`bridge/README.md`](bridge/README.md).

| | |
| --- | --- |
| `src/home.config.js` | rooms, lamps and ACs |
| `src/store.js` | device state, simulation, syncing with the bridge |
| `src/Scene.jsx` | the 3D model |
| `src/ControlPanel.jsx` | the panel: device list, AC controls, linking |
| `bridge/kasa_bridge.py` | local server that talks to the Kasa devices |

## Notes

- **ACs**: Kasa only switches power. Linking an AC to a Kasa plug makes its
  on/off real; temperature and mode are tracked in the app only, and the room
  temperature shown is simulated.
- Without the bridge running, everything is simulated, so the app works as a
  demo anywhere.
