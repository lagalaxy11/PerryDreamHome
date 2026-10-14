import React, { useRef, useState } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Bounds, Html, RoundedBox } from '@react-three/drei';
import { DEVICES, WALL_THICKNESS as T } from './devices';

// Night-time "dollhouse" of the floor plan: no roof, low front walls, taller
// back walls, and every lamp / AC is clickable.

const FLOOR = 0.3; // slab thickness; furniture and fixtures sit on top of it
const TALL = 9.5; // exterior walls on the far side
const INTERIOR = 3; // partitions between rooms
const LOW = 1; // exterior walls on the camera side
const CEILING_Y = 9.6;

const FLOOR_COLORS = {
  great: '#7a5a42', kitchen: '#b9b2a6', master: '#6e513d', bath: '#c9cdd2', hall: '#7a5a42', kid: '#8c6c50',
};
const WARM = '#ffc985';
const AIR_COLORS = { cool: '#8fd0ff', heat: '#ffad70', dry: '#c4ecff', fan: '#e6ecff' };

const bounds = (r) => ({
  minX: r.position[0] - r.width / 2, maxX: r.position[0] + r.width / 2,
  minZ: r.position[2] - r.depth / 2, maxZ: r.position[2] + r.depth / 2,
});
const overlap = (a0, a1, b0, b1) => Math.min(a1, b1) - Math.max(a0, b0);

function hasNeighbor(room, rooms, side) {
  const b = bounds(room);
  return rooms.some((other) => {
    if (other === room) return false;
    const o = bounds(other);
    const near = (a, c) => Math.abs(a - c) < 0.01;
    if (side === '-x') return near(o.maxX, b.minX) && overlap(o.minZ, o.maxZ, b.minZ, b.maxZ) > 0.5;
    if (side === '+x') return near(o.minX, b.maxX) && overlap(o.minZ, o.maxZ, b.minZ, b.maxZ) > 0.5;
    if (side === '-z') return near(o.maxZ, b.minZ) && overlap(o.minX, o.maxX, b.minX, b.maxX) > 0.5;
    return near(o.minZ, b.maxZ) && overlap(o.minX, o.maxX, b.minX, b.maxX) > 0.5;
  });
}

function Wall({ args, position }) {
  return (
    <mesh position={position}>
      <boxGeometry args={args} />
      <meshStandardMaterial color="#e9e4f0" roughness={0.95} />
    </mesh>
  );
}

function RoomShell({ room, rooms }) {
  const { width: w, depth: d } = room;
  const [cx, , cz] = room.position;
  const height = (side) => {
    if (hasNeighbor(room, rooms, side)) return INTERIOR;
    return side.startsWith('-') ? Math.min(TALL, room.height) : LOW;
  };
  const h = { '-x': height('-x'), '+x': height('+x'), '-z': height('-z'), '+z': height('+z') };
  const win = (len) => Math.min(5, len * 0.3);

  return (
    <group position={[cx, 0, cz]}>
      <mesh position={[0, FLOOR / 2, 0]}>
        <boxGeometry args={[w, FLOOR, d]} />
        <meshStandardMaterial color={FLOOR_COLORS[room.type]} roughness={0.85} />
      </mesh>
      <Wall args={[T, h['-x'], d]} position={[-w / 2 + T / 2, h['-x'] / 2, 0]} />
      <Wall args={[T, h['+x'], d]} position={[w / 2 - T / 2, h['+x'] / 2, 0]} />
      <Wall args={[w, h['-z'], T]} position={[0, h['-z'] / 2, -d / 2 + T / 2]} />
      <Wall args={[w, h['+z'], T]} position={[0, h['+z'] / 2, d / 2 - T / 2]} />

      {/* Night windows on the tall walls */}
      {h['-x'] === TALL && (
        <mesh position={[-w / 2 + T + 0.02, 5.2, -0.2 * d]} rotation={[0, Math.PI / 2, 0]}>
          <planeGeometry args={[win(d), 4]} />
          <meshStandardMaterial color="#0e1633" emissive="#2a3c78" emissiveIntensity={0.7} />
        </mesh>
      )}
      {h['-z'] === TALL && (
        <mesh position={[-0.2 * w, 5.2, -d / 2 + T + 0.02]}>
          <planeGeometry args={[win(w), 4]} />
          <meshStandardMaterial color="#0e1633" emissive="#2a3c78" emissiveIntensity={0.7} />
        </mesh>
      )}

      {/* HTML label: drei's <Text> fetches a font from a CDN, which breaks offline LAN use */}
      <Html position={[0, FLOOR + 0.05, d / 2 - 1.6]} center zIndexRange={[5, 0]} style={{ pointerEvents: 'none' }}>
        <span className="sh-room-label">{room.name}</span>
      </Html>
    </group>
  );
}

// Soft radial glow drawn around lit fixtures.
let haloTexture;
function getHalo() {
  if (!haloTexture) {
    const size = 128;
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext('2d');
    const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    g.addColorStop(0, 'rgba(255,230,190,1)');
    g.addColorStop(0.25, 'rgba(255,200,130,0.45)');
    g.addColorStop(1, 'rgba(255,190,120,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
    haloTexture = new THREE.CanvasTexture(canvas);
  }
  return haloTexture;
}

function Halo({ on, level, position, scale }) {
  return (
    <sprite position={position} scale={[scale, scale, 1]} visible={on}>
      <spriteMaterial map={getHalo()} transparent opacity={0.35 + 0.55 * level} depthWrite={false} blending={THREE.AdditiveBlending} />
    </sprite>
  );
}

function Shade({ on, level, position, args }) {
  return (
    <mesh position={position}>
      <cylinderGeometry args={args} />
      <meshStandardMaterial color="#f4ead9" emissive={WARM} emissiveIntensity={on ? 0.6 + 1.6 * level : 0} roughness={0.6} />
    </mesh>
  );
}

const DARK = '#2b2b33';

// Each fixture returns its geometry plus where its light comes from.
function fixtureParts(fixture, on, level) {
  switch (fixture) {
    case 'floor':
      return {
        light: { y: 5.4, intensity: 60 },
        halo: { y: 5.6, scale: 4 },
        top: 6.6,
        parts: (
          <>
            <mesh position={[0, FLOOR + 0.08, 0]}><cylinderGeometry args={[0.6, 0.6, 0.15, 24]} /><meshStandardMaterial color={DARK} /></mesh>
            <mesh position={[0, FLOOR + 2.6, 0]}><cylinderGeometry args={[0.07, 0.07, 5, 8]} /><meshStandardMaterial color={DARK} /></mesh>
            <Shade on={on} level={level} position={[0, 5.7, 0]} args={[0.55, 0.85, 1.1, 24, 1, true]} />
          </>
        ),
      };
    case 'table':
      return {
        light: { y: 3.3, intensity: 25 },
        halo: { y: 3.4, scale: 2.6 },
        top: 4,
        parts: (
          <>
            <mesh position={[0, FLOOR + 1, 0]}><boxGeometry args={[1.6, 2, 1.6]} /><meshStandardMaterial color="#5a4637" /></mesh>
            <mesh position={[0, FLOOR + 2.4, 0]}><cylinderGeometry args={[0.22, 0.3, 0.8, 16]} /><meshStandardMaterial color="#d8d0c4" /></mesh>
            <Shade on={on} level={level} position={[0, 3.5, 0]} args={[0.35, 0.55, 0.65, 20, 1, true]} />
          </>
        ),
      };
    case 'pendant':
      return {
        light: { y: 6.6, intensity: 70 },
        halo: { y: 6.9, scale: 7 },
        top: 10,
        parts: [-2.5, 0, 2.5].map((x) => (
          <group key={x} position={[x, 0, 0]}>
            <mesh position={[0, 8.6, 0]}><cylinderGeometry args={[0.03, 0.03, 2.8, 6]} /><meshStandardMaterial color={DARK} /></mesh>
            <Shade on={on} level={level} position={[0, 7, 0]} args={[0.15, 0.7, 0.8, 20, 1, true]} />
          </group>
        )),
      };
    case 'strip':
      return {
        light: { y: 4.4, z: 2.5, intensity: 18 },
        halo: { y: 4.6, z: 0.3, scale: 3.5 },
        top: 5.4,
        parts: (
          <mesh position={[0, 4.6, 0]}>
            <boxGeometry args={[4, 0.22, 0.2]} />
            <meshStandardMaterial color="#f4ead9" emissive={WARM} emissiveIntensity={on ? 0.8 + 2 * level : 0} />
          </mesh>
        ),
      };
    default: // ceiling
      return {
        light: { y: CEILING_Y - 0.8, intensity: 90 },
        halo: { y: CEILING_Y - 0.2, scale: 6 },
        top: CEILING_Y + 0.8,
        parts: (
          <mesh position={[0, CEILING_Y, 0]}>
            <cylinderGeometry args={[1.3, 1.1, 0.25, 32]} />
            <meshStandardMaterial color="#f4ead9" emissive={WARM} emissiveIntensity={on ? 0.8 + 2 * level : 0} />
          </mesh>
        ),
      };
  }
}

function useHover() {
  const [hovered, setHovered] = useState(false);
  return [hovered, {
    onPointerOver: (e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = 'pointer'; },
    onPointerOut: () => { setHovered(false); document.body.style.cursor = ''; },
  }];
}

// Ignore clicks that were really drags of the camera.
const isClick = (e) => e.delta < 6;

function Tooltip({ y, title, detail }) {
  return (
    <Html position={[0, y, 0]} center zIndexRange={[10, 0]} style={{ pointerEvents: 'none' }}>
      <div className="sh-tooltip"><strong>{title}</strong><span>{detail}</span></div>
    </Html>
  );
}

function Lamp({ device, placement, state, linked, onClick }) {
  const [hovered, hoverProps] = useHover();
  const level = (state.brightness ?? 100) / 100;
  const { light, halo, top, parts } = fixtureParts(device.fixture, state.on, level);
  return (
    <group
      position={placement.position}
      rotation={[0, placement.rotationY, 0]}
      onClick={(e) => { if (!isClick(e)) return; e.stopPropagation(); onClick(device.id); }}
      {...hoverProps}
    >
      {parts}
      {/* Always mounted (intensity 0 when off) so toggling doesn't recompile shaders */}
      <pointLight position={[0, light.y, light.z || 0]} color={WARM} intensity={state.on ? light.intensity * level : 0} decay={2} distance={40} />
      <Halo on={state.on} level={level} position={[0, halo.y, halo.z || 0]} scale={halo.scale} />
      {/* Generous invisible hit area so small fixtures are easy to tap */}
      <mesh position={[0, top / 2, 0]} visible={false}>
        <boxGeometry args={[device.fixture === 'pendant' || device.fixture === 'strip' ? 6 : 3, top, 3]} />
      </mesh>
      {hovered && (
        <Tooltip
          y={top + 1}
          title={device.name}
          detail={`${state.on ? `On${state.brightness < 100 ? ` · ${state.brightness}%` : ''}` : 'Off'}${linked ? ' · Kasa' : ''}`}
        />
      )}
    </group>
  );
}

const STREAKS = 9;

function Airflow({ color }) {
  const refs = useRef([]);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime * 0.45;
    refs.current.forEach((mesh, i) => {
      if (!mesh) return;
      const p = (t + i / STREAKS) % 1;
      mesh.position.set(((i * 7) % STREAKS) / (STREAKS - 1) * 2.6 - 1.3, -0.5 - p * 3.4, 0.5 + p * 3);
      mesh.material.opacity = Math.sin(p * Math.PI) * 0.55;
    });
  });
  return Array.from({ length: STREAKS }, (_, i) => (
    <mesh key={i} ref={(m) => (refs.current[i] = m)} rotation={[Math.atan2(3.4, 3) - Math.PI / 2, 0, 0]}>
      <boxGeometry args={[0.05, 1.4, 0.05]} />
      <meshBasicMaterial color={color} transparent depthWrite={false} blending={THREE.AdditiveBlending} />
    </mesh>
  ));
}

function ACUnit({ device, placement, state, selected, linked, onClick }) {
  const [hovered, hoverProps] = useHover();
  const y = 8;
  return (
    <group
      position={placement.position}
      rotation={[0, placement.rotationY, 0]}
      onClick={(e) => { if (!isClick(e)) return; e.stopPropagation(); onClick(device.id); }}
      {...hoverProps}
    >
      <group position={[0, y, 0]}>
        <RoundedBox args={[3.4, 1.1, 0.8]} radius={0.25} smoothness={3}>
          <meshStandardMaterial
            color="#f5f6fa"
            emissive={selected ? '#3b82f6' : '#000000'}
            emissiveIntensity={selected ? 0.35 : 0}
            roughness={0.4}
          />
        </RoundedBox>
        <mesh position={[0, -0.32, 0.38]}>
          <boxGeometry args={[2.8, 0.12, 0.06]} />
          <meshStandardMaterial color="#9aa3b5" />
        </mesh>
        <mesh position={[1.35, 0.25, 0.41]}>
          <sphereGeometry args={[0.06, 12, 12]} />
          <meshBasicMaterial color={state.on ? (state.mode === 'heat' ? '#ff9a52' : '#5ac8ff') : '#30343f'} />
        </mesh>
        {state.on && <Airflow color={AIR_COLORS[state.mode] || AIR_COLORS.cool} />}
      </group>
      {hovered && (
        <Tooltip
          y={y + 1.8}
          title={device.name}
          detail={`${state.on ? `${state.mode} to ${state.target}°F` : 'Off'} · room ${state.current.toFixed(1)}°F${linked ? ' · Kasa' : ''}`}
        />
      )}
    </group>
  );
}

export default function SmartScene({ rooms, placements, devices, mapping, selectedId, onLight, onAC }) {
  return (
    <>
      <hemisphereLight args={['#7b7fd1', '#1c1735', 0.9]} />
      <directionalLight position={[-40, 60, -20]} intensity={0.35} color="#9fb0ff" />

      <Bounds fit observe margin={1.05}>
        {rooms.map((room) => <RoomShell key={room.id} room={room} rooms={rooms} />)}
      </Bounds>

      {DEVICES.map((device) => {
        const placement = placements[device.id];
        if (!placement) return null;
        const props = { device, placement, state: devices[device.id], linked: Boolean(mapping[device.id]) };
        return device.kind === 'light'
          ? <Lamp key={device.id} {...props} onClick={onLight} />
          : <ACUnit key={device.id} {...props} selected={selectedId === device.id} onClick={onAC} />;
      })}
    </>
  );
}
