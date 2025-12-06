import React from 'react';
import { useControls } from 'leva';
import Room from './Room';

export default function House() {
  // Task 1: Interactivity (Leva)
  // Hardcoded initial state dimensions
  const {
    grWidth, grHeight, grDepth,
    kWidth, kHeight, kDepth
  } = useControls('Dimensions', {
    // Great Room: 25' x 25' x 14' high
    grWidth: { value: 25, min: 10, max: 50, step: 1, label: 'Great Room Width' },
    grDepth: { value: 25, min: 10, max: 50, step: 1, label: 'Great Room Depth' },
    grHeight: { value: 14, min: 8, max: 20, step: 1, label: 'Great Room Height' },

    // Kitchen: 20' x 20' x 12' high
    kWidth: { value: 20, min: 10, max: 40, step: 1, label: 'Kitchen Width' },
    kDepth: { value: 20, min: 10, max: 40, step: 1, label: 'Kitchen Depth' },
    kHeight: { value: 12, min: 8, max: 20, step: 1, label: 'Kitchen Height' },
  });

  // Base Colors
  const colors = {
    greatRoom: '#e0e0e0',
    kitchen: '#d0d0d0',
    master: '#d8e2dc',
    kids: '#ffe5d9',
    hallway: '#f0f0f0'
  };

  // --- Layout Logic ---

  // 1. Great Room (Center Reference)
  // We'll treat Great Room's CENTER as (0, grHeight/2, 0) relative to the group,
  // but to keep the shared wall with Kitchen at X=0, we should shift everything.
  // Strategy:
  // Shared Wall is at X=0.
  // Great Room extends X: [0, grWidth]. Center X = grWidth/2.
  // Kitchen extends X: [-kWidth, 0]. Center X = -kWidth/2.
  // Both aligned at Z=0 (Centers). (Assuming they are side-by-side).

  const grPosition = [grWidth / 2, grHeight / 2, 0];
  const kPosition = [-kWidth / 2, kHeight / 2, 0];

  // 3. East Wing: Master Suite + Bath
  // Extends SOUTH from the Great Room's East side.
  // Great Room East Edge X = grWidth.
  // Let's attach Master Suite to the South face of the Great Room, aligned to the East edge.
  // Great Room South Edge Z = grDepth / 2.
  // Master Suite (20x20).
  const msWidth = 20;
  const msDepth = 20;
  const msHeight = 12; // Matching kitchen height

  // Position:
  // X: Aligned with Great Room East Edge (X=grWidth).
  // Wait, if it extends South from the East *side*, does it mean it sticks out of the East wall?
  // Or is it an "L" shape?
  // "U" shape usually means wings are parallel.
  // If Kitchen is West and Great Room is East (of Kitchen), then:
  // West Wing extends South from Kitchen.
  // East Wing extends South from Great Room.

  // Master Suite Center Z:
  // Starts at Z = grDepth / 2.
  // Center Z = grDepth / 2 + msDepth / 2.
  // X Position: Let's align it with the Great Room Center or Right edge.
  // Let's align with Right (East) Edge to make it distinct?
  // Or just Center of Great Room?
  // Let's align Center X with Great Room Center X for a cleaner look if GR is wide.
  // But GR width varies.
  // Let's fix it relative to the shared wall (0).
  // Great Room Center X = grWidth / 2.
  // Let's align Master Suite Center X with Great Room Center X.
  const msPosition = [grWidth / 2, msHeight / 2, grDepth / 2 + msDepth / 2];

  // Master Bath (15x15) attached to Master Suite (South).
  const mbWidth = 15;
  const mbDepth = 15;
  const mbHeight = 12;

  // Starts at Master Suite South Edge (msPosition.z + msDepth/2).
  const mbPosition = [
    msPosition[0], // Align with Master Suite
    mbHeight / 2,
    msPosition[2] + msDepth / 2 + mbDepth / 2
  ];

  // 4. West Wing: Hallway + 3 Kids' Rooms
  // Extends SOUTH from Kitchen.
  // Kitchen Center X = -kWidth / 2.
  // Kitchen South Edge Z = kDepth / 2.

  // Hallway (connecting rooms).
  // Let's say Hallway is 6' wide and runs South.
  // Aligned with Kitchen Center?
  const hallWidth = 6;
  // Length needs to fit 3 rooms (14' each) + some spacing?
  // Let's say rooms are attached to the West side of the Hallway.
  // Rooms: 14x14.
  const roomSize = 14;
  const roomHeight = 10;

  // Hallway Length: 3 * roomSize.
  const hallDepth = 3 * roomSize;
  const hallHeight = 10;

  // Hallway Position:
  // Starts at Kitchen South Edge.
  // Center Z = kDepth / 2 + hallDepth / 2.
  // Center X = -kWidth / 2.
  const hallPosition = [-kWidth / 2, hallHeight / 2, kDepth / 2 + hallDepth / 2];

  // Kids' Rooms (West of Hallway).
  // Attached to West face of Hallway.
  // Hallway West Edge X = hallPosition.x - hallWidth / 2.
  // Room Center X = Hallway West Edge - roomSize / 2.
  const roomCenterX = hallPosition[0] - hallWidth / 2 - roomSize / 2;

  // Room Z positions:
  // Room 1: Top section of hallway.
  // Room 2: Middle.
  // Room 3: Bottom.
  // Start Z of Hallway = kDepth / 2.

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
        color={colors.greatRoom}
      />

      {/* 2. Kitchen */}
      <Room
        name="Kitchen"
        position={kPosition}
        width={kWidth}
        height={kHeight}
        depth={kDepth}
        color={colors.kitchen}
      />

      {/* 3. East Wing */}
      {/* Master Suite */}
      <Room
        name="Master Suite"
        position={msPosition}
        width={msWidth}
        height={msHeight}
        depth={msDepth}
        color={colors.master}
      />
      {/* Master Bath */}
      <Room
        name="Master Bath"
        position={mbPosition}
        width={mbWidth}
        height={mbHeight}
        depth={mbDepth}
        color={colors.master}
      />

      {/* 4. West Wing */}
      {/* Hallway */}
      <Room
        name="Hallway"
        position={hallPosition}
        width={hallWidth}
        height={hallHeight}
        depth={hallDepth}
        color={colors.hallway}
      />

      {/* Kids Rooms */}
      <Room
        name="Kid 1"
        position={room1Pos}
        width={roomSize}
        height={roomHeight}
        depth={roomSize}
        color={colors.kids}
      />
      <Room
        name="Kid 2"
        position={room2Pos}
        width={roomSize}
        height={roomHeight}
        depth={roomSize}
        color={colors.kids}
      />
      <Room
        name="Kid 3"
        position={room3Pos}
        width={roomSize}
        height={roomHeight}
        depth={roomSize}
        color={colors.kids}
      />
    </group>
  );
}
