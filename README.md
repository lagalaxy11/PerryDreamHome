# Perry Dream Home

3D visualizer for the house, built with React Three Fiber.

- **Design**: resize the rooms with the panel on the right.
- **Smart Home**: a night-time view of the floor plan. Tap a lamp to switch it, or tap an AC for its controls. Devices are simulated until you link them to TP-Link Kasa plugs, switches and bulbs through the local bridge (see [`bridge/README.md`](bridge/README.md)).

```sh
npm install
npm run dev
```

## Where things live

| | |
| --- | --- |
| `src/layout.js` | room sizes and positions (shared by both views) |
| `src/smarthome/devices.js` | every lamp and AC: which room, where, and its default state |
| `src/smarthome/store.js` | device state, simulation, and syncing with the Kasa bridge |
| `src/smarthome/Scene.jsx` | the 3D dollhouse, fixtures and AC units |
| `src/smarthome/ControlPanel.jsx` | the control panel (device list, AC controls, device linking) |
| `bridge/` | Python bridge to Kasa devices on your network |
