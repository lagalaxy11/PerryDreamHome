// Every controllable device in the house.
//
// Placement is relative to the room it lives in so it follows the room when
// its dimensions change in the Design view:
//   at:    [fx, fz] fraction of the room's width/depth from its center (-0.5..0.5)
//   wall:  for wall-mounted devices, which wall ('-x' or '-z'; the walls facing the camera)
//   along: fraction along that wall from its center (-0.5..0.5)
//
// Light fixtures: 'ceiling' | 'floor' | 'table' | 'pendant' | 'strip'
export const DEVICES = [
  // Great Room
  { id: 'great-floor', kind: 'light', room: 'great', name: 'Floor Lamp', fixture: 'floor', at: [-0.4, -0.38] },
  { id: 'great-ceiling', kind: 'light', room: 'great', name: 'Ceiling Light', fixture: 'ceiling', at: [0.02, 0.05] },
  { id: 'great-reading', kind: 'light', room: 'great', name: 'Reading Lamp', fixture: 'floor', at: [0.4, 0.3] },
  { id: 'great-ac', kind: 'ac', room: 'great', name: 'Great Room AC', wall: '-z', along: 0.3 },

  // Kitchen
  { id: 'kitchen-pendants', kind: 'light', room: 'kitchen', name: 'Island Pendants', fixture: 'pendant', at: [0, 0.08] },
  { id: 'kitchen-cabinet', kind: 'light', room: 'kitchen', name: 'Cabinet Lights', fixture: 'strip', wall: '-z', along: 0.1 },

  // East wing
  { id: 'master-bedside', kind: 'light', room: 'master', name: 'Bedside Lamp', fixture: 'table', at: [-0.24, -0.4] },
  { id: 'master-ceiling', kind: 'light', room: 'master', name: 'Ceiling Light', fixture: 'ceiling', at: [0.05, 0.2] },
  { id: 'master-ac', kind: 'ac', room: 'master', name: 'Master AC', wall: '-x', along: 0.22 },
  { id: 'bath-vanity', kind: 'light', room: 'bath', name: 'Vanity Light', fixture: 'strip', wall: '-x', along: 0.15 },

  // West wing
  { id: 'hall-lights', kind: 'light', room: 'hall', name: 'Hall Lights', fixture: 'ceiling', at: [0, 0] },
  { id: 'kid1-ceiling', kind: 'light', room: 'kid1', name: 'Kid 1 Light', fixture: 'ceiling', at: [0.1, 0.1] },
  { id: 'kid1-ac', kind: 'ac', room: 'kid1', name: 'Kid 1 AC', wall: '-x', along: 0.22 },
  { id: 'kid2-ceiling', kind: 'light', room: 'kid2', name: 'Kid 2 Light', fixture: 'ceiling', at: [0.1, 0.1] },
  { id: 'kid2-ac', kind: 'ac', room: 'kid2', name: 'Kid 2 AC', wall: '-x', along: 0.22 },
  { id: 'kid3-ceiling', kind: 'light', room: 'kid3', name: 'Kid 3 Light', fixture: 'ceiling', at: [0.1, 0.1] },
  { id: 'kid3-ac', kind: 'ac', room: 'kid3', name: 'Kid 3 AC', wall: '-x', along: 0.22 },
];

// Thermostat range in °F.
export const TEMP_MIN = 60;
export const TEMP_MAX = 86;

export const AC_MODES = ['cool', 'heat', 'dry', 'fan'];
export const FAN_SPEEDS = ['auto', 'low', 'med', 'high'];

const OFF_BY_DEFAULT = new Set(['kid2-ceiling', 'kid3-ceiling']);
const AC_DEFAULTS = { 'great-ac': { on: true, target: 72 }, 'master-ac': { on: true, target: 70 } };

export function defaultState(device) {
  if (device.kind === 'light') return { on: !OFF_BY_DEFAULT.has(device.id), brightness: 100 };
  return {
    on: false,
    target: 74,
    current: 78,
    mode: 'cool',
    fan: 'auto',
    eco: false,
    sleep: false,
    swing: true,
    ...AC_DEFAULTS[device.id],
  };
}

export const WALL_THICKNESS = 0.5;

// World-space placement for each device, given the current room layout.
// Returns { [deviceId]: { position: [x, y, z], rotationY, room } }.
export function placeDevices(rooms) {
  const byId = Object.fromEntries(rooms.map((r) => [r.id, r]));
  const out = {};
  for (const device of DEVICES) {
    const room = byId[device.room];
    if (!room) continue;
    const [cx, , cz] = room.position;
    if (device.wall) {
      const inset = WALL_THICKNESS + 0.45;
      out[device.id] = device.wall === '-z'
        ? { room, rotationY: 0, position: [cx + device.along * room.width, 0, cz - room.depth / 2 + inset] }
        : { room, rotationY: Math.PI / 2, position: [cx - room.width / 2 + inset, 0, cz + device.along * room.depth] };
    } else {
      const [fx, fz] = device.at;
      out[device.id] = { room, rotationY: 0, position: [cx + fx * room.width, 0, cz + fz * room.depth] };
    }
  }
  return out;
}
