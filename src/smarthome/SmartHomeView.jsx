import React, { Suspense, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, OrthographicCamera } from '@react-three/drei';
import SmartScene from './Scene';
import ControlPanel from './ControlPanel';
import { placeDevices } from './devices';
import { showView, toggle, useHome } from './store';

export default function SmartHomeView({ rooms }) {
  const s = useHome();
  const placements = useMemo(() => placeDevices(rooms), [rooms]);
  const selectedId = s.view.name === 'ac' ? s.view.id : null;

  return (
    <div className="sh-root">
      <div className="sh-stage">
        <Canvas dpr={[1, 2]} gl={{ antialias: true }} onPointerMissed={() => selectedId && showView({ name: 'home' })}>
          <OrthographicCamera makeDefault position={[70, 62, 70]} zoom={8} near={-500} far={1000} />
          <Suspense fallback={null}>
            <SmartScene
              rooms={rooms}
              placements={placements}
              devices={s.devices}
              mapping={s.bridge.mapping}
              selectedId={selectedId}
              onLight={toggle}
              onAC={(id) => showView(selectedId === id ? { name: 'home' } : { name: 'ac', id })}
            />
          </Suspense>
          <OrbitControls makeDefault enablePan={false} minPolarAngle={0.2} maxPolarAngle={1.2} minZoom={3} maxZoom={40} />
        </Canvas>
        <p className="sh-hint">Tap a lamp to switch it · tap an AC for controls · drag to rotate</p>
      </div>
      <ControlPanel rooms={rooms} />
    </div>
  );
}
