import React from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Sky, Environment, ContactShadows } from '@react-three/drei';
import House from './components/House';
import { Leva } from 'leva';

function App() {
  return (
    <>
      <Leva collapsed={false} />
      <Canvas shadows camera={{ position: [30, 10, 30], fov: 45 }}>
        <ambientLight intensity={0.5} />
        <directionalLight
          position={[10, 20, 10]}
          intensity={1.5}
          castShadow
          shadow-mapSize={[2048, 2048]}
        />
        <Sky sunPosition={[100, 20, 100]} />
        <Environment preset="city" />

        <House />

        {/* ContactShadows for grounded feel */}
        <ContactShadows position={[0, -0.01, 0]} opacity={0.6} scale={100} blur={2.5} far={10} resolution={256} color="#000000" />
        {/* Removed gridHelper for cleaner Clay Render look */}

        <OrbitControls makeDefault autoRotate={false} minPolarAngle={0} maxPolarAngle={Math.PI / 2.1} />
      </Canvas>
    </>
  );
}

export default App;
