'use client';

import { useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { PerformanceMonitor } from '@react-three/drei';
import { COLORS, CAMERA_PATH, QUALITY } from '@/lib/animation';
import type { Tier } from '@/lib/device';
import { CameraRig } from './CameraRig';
import { DataCore } from './DataCore';
import { Effects } from './Effects';
import { DustField, HoloGrid, ScanGates } from './Environment';
import { Beacon, DialRing } from './Landmarks';
import { ReactorCore } from './ReactorCore';

/** Signals the page once the scene has actually drawn (shaders compiled). */
function FirstFrame({ onReady }: { onReady: () => void }) {
  const frames = useRef(0);
  const done = useRef(false);
  useFrame((state) => {
    if (done.current) return;
    frames.current += 1;
    if (frames.current >= 2) {
      done.current = true;
      onReady();
    } else {
      state.invalidate(); // with frameloop="demand" (reduced motion) nothing else asks for frame 2
    }
  });
  return null;
}

/**
 * The single, persistent WebGL canvas behind the whole page. Loaded with
 * next/dynamic (ssr: false) from SceneMount, only at tier ≥ 1.
 *
 * Under reduced motion the frameloop is "demand": the scene draws when needed
 * (resize, mount) and holds still otherwise.
 */
export default function Scene({ tier, reduced, onReady }: { tier: Exclude<Tier, 0>; reduced: boolean; onReady: () => void }) {
  const q = QUALITY[tier];
  const [dpr, setDpr] = useState(q.dpr[1]);
  const [effects, setEffects] = useState(q.effects && !reduced);

  return (
    <Canvas
      className="scene-canvas"
      dpr={dpr}
      frameloop={reduced ? 'demand' : 'always'}
      gl={{ antialias: !effects, alpha: false, stencil: false, powerPreference: 'high-performance' }}
      camera={{ fov: 45, near: 0.1, far: 160, position: CAMERA_PATH[0].pos }}
      aria-hidden="true"
      tabIndex={-1}
    >
      <color attach="background" args={[COLORS.void]} />
      <fog attach="fog" args={[COLORS.void, 14, 60]} />
      {/* drei: drop DPR, then effects, if the frame rate falls on this machine */}
      <PerformanceMonitor
        onDecline={() => {
          if (dpr > 1) setDpr(1);
          else setEffects(false);
        }}
        flipflops={3}
      />
      <CameraRig reduced={reduced} />
      <ReactorCore shell={q.shell} reduced={reduced} />
      <DataCore reduced={reduced} />
      <HoloGrid />
      <ScanGates />
      <DialRing reduced={reduced} />
      <Beacon reduced={reduced} />
      <DustField count={q.dust} reduced={reduced} />
      {effects && <Effects multisampling={q.multisampling} />}
      <FirstFrame onReady={onReady} />
    </Canvas>
  );
}
