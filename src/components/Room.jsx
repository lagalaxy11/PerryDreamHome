import React from 'react';
import { Box, Text, Edges } from '@react-three/drei';

export default function Room({
  position = [0, 0, 0],
  width = 10,
  height = 10,
  depth = 10,
  color = 'white',
  name = 'Room',
  opacity = 1
}) {
  return (
    <group position={position}>
      {/* Main Room Volume */}
      <Box args={[width, height, depth]} castShadow receiveShadow>
        <meshStandardMaterial
          color={color}
          roughness={0.8}
          metalness={0.1}
          transparent={opacity < 1}
          opacity={opacity}
        />
        <Edges color="black" threshold={15} />
      </Box>

      {/* Room Label floating inside */}
      <Text
        position={[0, 0, 0]}
        fontSize={2}
        color="black"
        anchorX="center"
        anchorY="middle"
      >
        {name}
      </Text>
    </group>
  );
}
