import React from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Sky, Environment, ContactShadows } from '@react-three/drei';
import House from './components/House';
import { Leva } from 'leva';

function App() {
  return (
    <>
      <Leva collapsed={false} />
      <Canvas shadows camera={{ position: [50, 40, 50], fov: 45 }}>
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

        <ContactShadows position={[0, -0.01, 0]} opacity={0.4} scale={100} blur={2} far={10} resolution={256} color="#000000" />
        <gridHelper args={[200, 200, 0x111111, 0x111111]} position={[0, -0.01, 0]} />

        <OrbitControls makeDefault autoRotate={false} />
      </Canvas>
    </>
  );
}

export default App;
