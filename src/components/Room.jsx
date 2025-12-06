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
  const floorY = -height / 2 + slabThickness / 2;
  const ceilingY = height / 2 - slabThickness / 2;

  // Roof sits ON TOP of the room height.
  // Room top is at height/2.
  // Roof thickness = 0.5 (thin box).
  // Roof center Y = height/2 + 0.5/2 = height/2 + 0.25.
  const roofThickness = 0.5;
  const roofY = height / 2 + roofThickness / 2;

  // Glass Height: Space between floor and ceiling slabs
  const glassHeight = height - (slabThickness * 2);

  // Materials definition
  // Walls: Warm plaster
  const wallMaterial = <meshStandardMaterial color="#e8e4dc" roughness={0.9} />;

  // Floor (Internal): Simple wood/tan
  const floorMaterial = <meshStandardMaterial color="#d2b48c" roughness={0.8} />;

  // Glass: Realistic clear glass
  const glassMaterial = (
    <meshPhysicalMaterial
      transmission={1}
      roughness={0}
      thickness={0.5}
      ior={1.5}
      transparent
      color="white"
    />
  );

  // Roof: Dark Charcoal
  const roofMaterial = <meshStandardMaterial color="#333333" roughness={0.9} />;

  return (
    <group position={position}>
      {/* 1. Floor Slab (Internal) */}
      <Box args={[width, slabThickness, depth]} position={[0, floorY, 0]} receiveShadow castShadow>
        {floorMaterial}
      </Box>

      {/* 2. Ceiling Slab (Internal Top of Box) */}
      <Box args={[width, slabThickness, depth]} position={[0, ceilingY, 0]} receiveShadow castShadow>
        {wallMaterial}
      </Box>

      {/* 3. The New Roof (External, Overhanging) */}
      {/* Overhangs walls by 1 foot (unit) on all sides -> width + 2, depth + 2 */}
      <Box
        args={[width + 2, roofThickness, depth + 2]}
        position={[0, roofY, 0]}
        receiveShadow castShadow
      >
        {roofMaterial}
      </Box>

      {/* 4. Side Walls (Solid Plaster) - East/West (+X/-X) */}
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

      {/* 5. Windows (Glass) - North/South (+Z/-Z) */}
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
