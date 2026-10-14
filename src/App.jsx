import React, { Suspense, useMemo, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows, Plane } from '@react-three/drei';
import House from './components/House';
import SmartHomeView from './smarthome/SmartHomeView';
import { computeLayout, useHouseDims } from './layout';
import { Leva } from 'leva';
import './smarthome/smarthome.css';

function Ground() {
  return (
    <Plane args={[200, 200]} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
      <meshStandardMaterial color="#2d4c1e" roughness={1} />
    </Plane>
  );
}

function Scene({ rooms }) {
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

      <House rooms={rooms} />
      <Ground />

      <ContactShadows
        position={[0, 0.01, 0]}
        opacity={0.5}
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
  const [mode, setMode] = useState('design');
  const dims = useHouseDims();
  const rooms = useMemo(() => computeLayout(dims), [dims]);

  return (
    <>
      <Leva collapsed={false} hidden={mode !== 'design'} />
      <div className="mode-switch" role="tablist" aria-label="View">
        <button role="tab" aria-selected={mode === 'design'} onClick={() => setMode('design')}>Design</button>
        <button role="tab" aria-selected={mode === 'smart'} onClick={() => setMode('smart')}>Smart Home</button>
      </div>
      {mode === 'design' ? (
        <Canvas shadows camera={{ position: [40, 6, 40], fov: 45 }}>
          <Suspense fallback={null}>
            <Scene rooms={rooms} />
          </Suspense>
          <OrbitControls makeDefault autoRotate={false} minPolarAngle={0} maxPolarAngle={Math.PI / 2.1} />
        </Canvas>
      ) : (
        <SmartHomeView rooms={rooms} />
      )}
    </>
  );
}

export default App;
