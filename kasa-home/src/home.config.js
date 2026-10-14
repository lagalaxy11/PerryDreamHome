// ─────────────────────────────────────────────────────────────────────────────
// Your home. Edit this file to match your place; the 3D model and the control
// panel are generated from it.
//
// Units are feet. Picture the floor plan from above: x runs left → right, z runs
// top → bottom (the top of the plan is the far side in the 3D view). Each room
// is a rectangle given by its top-left corner (x, z), width (x) and depth (z).
// Rooms that share an edge get a low partition wall between them.
//
// floor: 'wood' | 'tile' | 'carpet' | 'concrete'
// ─────────────────────────────────────────────────────────────────────────────

export const HOME_NAME = 'Home';

export const ROOMS = [
  { id: 'living', name: 'Living Room', x: 0, z: 0, width: 18, depth: 15, floor: 'wood' },
  { id: 'kitchen', name: 'Kitchen', x: 18, z: 0, width: 11, depth: 9, floor: 'tile' },
  { id: 'bath', name: 'Bathroom', x: 18, z: 9, width: 11, depth: 6, floor: 'tile' },
  { id: 'bedroom', name: 'Bedroom', x: 0, z: 15, width: 16, depth: 12, floor: 'carpet' },
  { id: 'office', name: 'Office', x: 16, z: 15, width: 13, depth: 12, floor: 'wood' },
];

// Lamps and ACs shown in the model. Link each one to a real Kasa device in the
// app (tap the badge at the top of the panel). Kasa devices you don't place
// here still show up in the panel under "Other Kasa devices".
//
//   at:     [fx, fz] position inside the room as a fraction from its center
//           (-0.5 = left/top edge, 0.5 = right/bottom edge)
//   wall:   for wall-mounted things, '-x' (left wall) or '-z' (top wall),
//           the two walls facing the camera
//   along:  position along that wall as a fraction from its center
//   fixture (lights): 'ceiling' | 'floor' | 'table' | 'pendant' | 'strip'
export const DEVICES = [
  { id: 'living-floor', kind: 'light', room: 'living', name: 'Floor Lamp', fixture: 'floor', at: [-0.4, -0.38] },
  { id: 'living-ceiling', kind: 'light', room: 'living', name: 'Ceiling Light', fixture: 'ceiling', at: [0.05, 0.05] },
  { id: 'living-ac', kind: 'ac', room: 'living', name: 'Living AC', wall: '-z', along: 0.25 },

  { id: 'kitchen-pendants', kind: 'light', room: 'kitchen', name: 'Pendants', fixture: 'pendant', at: [0, 0.1] },

  { id: 'bath-vanity', kind: 'light', room: 'bath', name: 'Vanity Light', fixture: 'strip', wall: '-z', along: 0 },

  { id: 'bedroom-lamp', kind: 'light', room: 'bedroom', name: 'Bedside Lamp', fixture: 'table', at: [-0.38, -0.3] },
  { id: 'bedroom-ceiling', kind: 'light', room: 'bedroom', name: 'Ceiling Light', fixture: 'ceiling', at: [0.1, 0.1] },
  { id: 'bedroom-ac', kind: 'ac', room: 'bedroom', name: 'Bedroom AC', wall: '-x', along: 0.15 },

  { id: 'office-desk', kind: 'light', room: 'office', name: 'Desk Lamp', fixture: 'table', at: [0.3, -0.3] },
  { id: 'office-ac', kind: 'ac', room: 'office', name: 'Office AC', wall: '-z', along: -0.2 },
];

// Thermostat range (°F) for the AC controls.
export const TEMP_MIN = 60;
export const TEMP_MAX = 86;
// Where a room's simulated temperature drifts when its AC is off.
export const OUTDOOR_F = 84;
