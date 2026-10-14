import { useControls, folder } from 'leva';

// Editable dimensions (feet) for the rooms exposed in the Leva panel.
export function useHouseDims() {
  return useControls({
    'Great Room': folder({
      grWidth: { value: 25, min: 10, max: 50, step: 1, label: 'Width' },
      grDepth: { value: 25, min: 10, max: 50, step: 1, label: 'Depth' },
      grHeight: { value: 14, min: 8, max: 20, step: 1, label: 'Height' },
    }),
    'Kitchen': folder({
      kWidth: { value: 20, min: 10, max: 40, step: 1, label: 'Width' },
      kDepth: { value: 20, min: 10, max: 40, step: 1, label: 'Depth' },
      kHeight: { value: 12, min: 8, max: 20, step: 1, label: 'Height' },
    })
  });
}

// --- Layout Logic ---
// Shared Wall is at X=0.
// Great Room extends X: [0, grWidth]. Kitchen extends X: [-kWidth, 0].
// East Wing (Master Suite + Bath) extends south of the Great Room.
// West Wing (Hallway + 3 Kids' Rooms) extends south of the Kitchen.
// Positions are room centers; Y is height / 2 so floors sit on the ground.
export function computeLayout({ grWidth, grHeight, grDepth, kWidth, kHeight, kDepth }) {
  const msWidth = 20, msDepth = 20, msHeight = 12;
  const mbWidth = 15, mbDepth = 15, mbHeight = 12;
  const msPosition = [grWidth / 2, msHeight / 2, grDepth / 2 + msDepth / 2];

  const hallWidth = 6;
  const roomSize = 14;
  const roomHeight = 10;
  const hallDepth = 3 * roomSize;
  const hallHeight = 10;
  const hallPosition = [-kWidth / 2, hallHeight / 2, kDepth / 2 + hallDepth / 2];
  const kidX = hallPosition[0] - hallWidth / 2 - roomSize / 2;

  const kid = (n) => ({
    id: `kid${n}`,
    name: `Kid ${n}`,
    type: 'kid',
    position: [kidX, roomHeight / 2, kDepth / 2 + (n - 1) * roomSize + roomSize / 2],
    width: roomSize,
    height: roomHeight,
    depth: roomSize,
  });

  return [
    { id: 'great', name: 'Great Room', type: 'great', position: [grWidth / 2, grHeight / 2, 0], width: grWidth, height: grHeight, depth: grDepth },
    { id: 'kitchen', name: 'Kitchen', type: 'kitchen', position: [-kWidth / 2, kHeight / 2, 0], width: kWidth, height: kHeight, depth: kDepth },
    { id: 'master', name: 'Master Suite', type: 'master', position: msPosition, width: msWidth, height: msHeight, depth: msDepth },
    {
      id: 'bath', name: 'Master Bath', type: 'bath',
      position: [msPosition[0], mbHeight / 2, msPosition[2] + msDepth / 2 + mbDepth / 2],
      width: mbWidth, height: mbHeight, depth: mbDepth,
    },
    { id: 'hall', name: 'Hallway', type: 'hall', position: hallPosition, width: hallWidth, height: hallHeight, depth: hallDepth },
    kid(1),
    kid(2),
    kid(3),
  ];
}
