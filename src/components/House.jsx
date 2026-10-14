import React from 'react';
import Room from './Room';

export default function House({ rooms }) {
  return (
    <group>
      {rooms.map((room) => (
        <Room
          key={room.id}
          name={room.name}
          position={room.position}
          width={room.width}
          height={room.height}
          depth={room.depth}
        />
      ))}
    </group>
  );
}
