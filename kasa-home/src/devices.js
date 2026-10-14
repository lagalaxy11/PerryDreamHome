import { DEVICES, ROOMS } from './home.config';

export { DEVICES, TEMP_MAX, TEMP_MIN, OUTDOOR_F, HOME_NAME } from './home.config';

export const AC_MODES = ['cool', 'heat', 'dry', 'fan'];
export const FAN_SPEEDS = ['auto', 'low', 'med', 'high'];
export const WALL_THICKNESS = 0.5;
export const CEILING_HEIGHT = 9;

// Rooms in the form the scene uses: center position plus size.
export const rooms = ROOMS.map((r) => ({
  ...r,
  position: [r.x + r.width / 2, CEILING_HEIGHT / 2, r.z + r.depth / 2],
  height: CEILING_HEIGHT,
}));

export function defaultState(device) {
  if (device.kind === 'light') return { on: false, brightness: 100 };
  return { on: false, target: 74, current: 78, mode: 'cool', fan: 'auto', eco: false, sleep: false, swing: true };
}

// Walls that have something mounted on them, per room: { roomId: Set('-x' | '-z') }.
export const mountedWalls = DEVICES.reduce((acc, d) => {
  if (d.wall) (acc[d.room] ||= new Set()).add(d.wall);
  return acc;
}, {});

// World-space placement for each device.
// Returns { [deviceId]: { position: [x, y, z], rotationY } }.
export function placeDevices() {
  const byId = Object.fromEntries(rooms.map((r) => [r.id, r]));
  const out = {};
  for (const device of DEVICES) {
    const room = byId[device.room];
    if (!room) {
      console.warn(`home.config.js: device "${device.id}" is in unknown room "${device.room}"`);
      continue;
    }
    const [cx, , cz] = room.position;
    if (device.wall) {
      const inset = WALL_THICKNESS + 0.45;
      out[device.id] = device.wall === '-z'
        ? { rotationY: 0, position: [cx + device.along * room.width, 0, cz - room.depth / 2 + inset] }
        : { rotationY: Math.PI / 2, position: [cx - room.width / 2 + inset, 0, cz + device.along * room.depth] };
    } else {
      const [fx, fz] = device.at;
      out[device.id] = { rotationY: 0, position: [cx + fx * room.width, 0, cz + fz * room.depth] };
    }
  }
  return out;
}
