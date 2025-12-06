import React from 'react';
import { Box, Text } from '@react-three/drei';

export default function Room({
  position = [0, 0, 0],
  width = 10,
  height = 10,
  depth = 10,
  name = 'Room',
}) {
  // Dimensions for components
  const slabThickness = 0.5;
  const wallThickness = 0.5;

  // Calculate vertical positions
  // Local y=0 is the center of the total height.
  // Total height = height.
  // Bottom = -height/2. Top = height/2.
  const floorY = -height / 2 + slabThickness / 2;
  const roofY = height / 2 - slabThickness / 2;

  // Glass Height: Space between floor and roof slabs
  const glassHeight = height - (slabThickness * 2);

  // Materials
  const wallMaterial = <meshStandardMaterial color="#f0f0f0" roughness={0.8} />;
  const floorMaterial = <meshStandardMaterial color="#d2b48c" roughness={0.8} />;
  const glassMaterial = <meshStandardMaterial color="lightblue" opacity={0.3} transparent roughness={0.1} />;

  return (
    <group position={position}>
      {/* 1. Floor Slab */}
      <Box args={[width, slabThickness, depth]} position={[0, floorY, 0]} receiveShadow castShadow>
        {floorMaterial}
      </Box>

      {/* 2. Roof Slab */}
      <Box args={[width, slabThickness, depth]} position={[0, roofY, 0]} receiveShadow castShadow>
        {wallMaterial}
      </Box>

      {/* 3. Side Walls (Solid Plaster) - East/West (+X/-X) */}
      {/* Left Wall (-X) */}
      <Box
        args={[wallThickness, glassHeight, depth]}
        position={[-width / 2 + wallThickness / 2, 0, 0]}
        castShadow receiveShadow
      >
        {wallMaterial}
      </Box>
      {/* Right Wall (+X) */}
      <Box
        args={[wallThickness, glassHeight, depth]}
        position={[width / 2 - wallThickness / 2, 0, 0]}
        castShadow receiveShadow
      >
        {wallMaterial}
      </Box>

      {/* 4. Windows (Glass) - North/South (+Z/-Z) */}
      {/* Front Window (+Z) */}
      <Box
        args={[width - (wallThickness * 2), glassHeight, 0.1]}
        position={[0, 0, depth / 2 - 0.05]}
      >
        {glassMaterial}
      </Box>
      {/* Back Window (-Z) */}
      <Box
        args={[width - (wallThickness * 2), glassHeight, 0.1]}
        position={[0, 0, -depth / 2 + 0.05]}
      >
        {glassMaterial}
      </Box>

      {/* Room Label */}
      <Text
        position={[0, 0, 0]}
        fontSize={1.5}
        color="#333"
        anchorX="center"
        anchorY="middle"
      >
        {name}
      </Text>
    </group>
  );
}
