import React from 'react';
import { useControls, folder } from 'leva';
import Room from './Room';

export default function House() {
  // Task 1: Interactivity (Leva)
  // Reorganized into folders for cleaner UI
  const {
    grWidth, grHeight, grDepth,
    kWidth, kHeight, kDepth
  } = useControls({
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

  // --- Layout Logic ---
  // Shared Wall is at X=0.
  // Great Room extends X: [0, grWidth]. Center X = grWidth/2.
  // Kitchen extends X: [-kWidth, 0]. Center X = -kWidth/2.

  const grPosition = [grWidth / 2, grHeight / 2, 0];
  const kPosition = [-kWidth / 2, kHeight / 2, 0];

  // 3. East Wing: Master Suite + Bath
  const msWidth = 20;
  const msDepth = 20;
  const msHeight = 12; // Matching kitchen height

  // Align Center X with Great Room Center X
  const msPosition = [grWidth / 2, msHeight / 2, grDepth / 2 + msDepth / 2];

  // Master Bath (15x15) attached to Master Suite (South).
  const mbWidth = 15;
  const mbDepth = 15;
  const mbHeight = 12;

  const mbPosition = [
    msPosition[0], // Align with Master Suite
    mbHeight / 2,
    msPosition[2] + msDepth / 2 + mbDepth / 2
  ];

  // 4. West Wing: Hallway + 3 Kids' Rooms
  // Extends SOUTH from Kitchen.
  const hallWidth = 6;
  const roomSize = 14;
  const roomHeight = 10;

  const hallDepth = 3 * roomSize;
  const hallHeight = 10;

  // Hallway Position: Starts at Kitchen South Edge.
  const hallPosition = [-kWidth / 2, hallHeight / 2, kDepth / 2 + hallDepth / 2];

  // Kids' Rooms (West of Hallway).
  const roomCenterX = hallPosition[0] - hallWidth / 2 - roomSize / 2;

  const room1Pos = [roomCenterX, roomHeight / 2, kDepth / 2 + roomSize / 2];
  const room2Pos = [roomCenterX, roomHeight / 2, kDepth / 2 + roomSize + roomSize / 2];
  const room3Pos = [roomCenterX, roomHeight / 2, kDepth / 2 + 2 * roomSize + roomSize / 2];

  return (
    <group>
      {/* 1. Great Room */}
      <Room
        name="Great Room"
        position={grPosition}
        width={grWidth}
        height={grHeight}
        depth={grDepth}
      />

      {/* 2. Kitchen */}
      <Room
        name="Kitchen"
        position={kPosition}
        width={kWidth}
        height={kHeight}
        depth={kDepth}
      />

      {/* 3. East Wing */}
      {/* Master Suite */}
      <Room
        name="Master Suite"
        position={msPosition}
        width={msWidth}
        height={msHeight}
        depth={msDepth}
      />
      {/* Master Bath */}
      <Room
        name="Master Bath"
        position={mbPosition}
        width={mbWidth}
        height={mbHeight}
        depth={mbDepth}
      />

      {/* 4. West Wing */}
      {/* Hallway */}
      <Room
        name="Hallway"
        position={hallPosition}
        width={hallWidth}
        height={hallHeight}
        depth={hallDepth}
      />

      {/* Kids Rooms */}
      <Room
        name="Kid 1"
        position={room1Pos}
        width={roomSize}
        height={roomHeight}
        depth={roomSize}
      />
      <Room
        name="Kid 2"
        position={room2Pos}
        width={roomSize}
        height={roomHeight}
        depth={roomSize}
      />
      <Room
        name="Kid 3"
        position={room3Pos}
        width={roomSize}
        height={roomHeight}
        depth={roomSize}
      />
    </group>
  );
}
