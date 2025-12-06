import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows, Plane } from '@react-three/drei';
import House from './components/House';
import { Leva } from 'leva';
import { useArchitecturalMaterials } from './hooks/useArchitecturalMaterials';

function Ground() {
  const { grass } = useArchitecturalMaterials();
  return (
    <Plane args={[200, 200]} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
      <meshStandardMaterial {...grass} color="#555" />
      {/* Tinted dark (#555) to blend with grass texture for a "paver" or "dark grass" look */}
    </Plane>
  );
}

function Scene() {
  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight
        position={[20, 30, 20]}
        intensity={1.2}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0001}
      />

      <Environment preset="sunset" background />

      <House />
      <Ground />

      <ContactShadows
        position={[0, 0.01, 0]}
        opacity={0.7}
        scale={100}
        blur={2}
        far={5}
        resolution={1024}
        color="#000000"
      />
    </>
  );
}

function App() {
  return (
    <>
      <Leva collapsed={false} />
      <Canvas shadows camera={{ position: [30, 10, 30], fov: 45 }}>
        <Suspense fallback={null}>
          <Scene />
        </Suspense>
        <OrbitControls makeDefault autoRotate={false} minPolarAngle={0} maxPolarAngle={Math.PI / 2.1} />
      </Canvas>
    </>
  );
}

export default App;
