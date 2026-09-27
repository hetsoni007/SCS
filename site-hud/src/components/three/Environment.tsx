'use client';

import { useEffect, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { COLORS } from '@/lib/animation';
import { live } from '@/lib/live';
import { fadeLineMaterial, gridMaterial, particleGeometry, particleMaterial } from '@/lib/shaders';
import { gateSegments, pushTransformed } from './geometry';
import { samplePath } from './path';

/** Holographic floor grid spanning the whole flight path. */
export function HoloGrid() {
  const r = useMemo(() => ({ geo: new THREE.PlaneGeometry(90, 160, 1, 1), mat: gridMaterial() }), []);
  useEffect(
    () => () => {
      r.geo.dispose();
      r.mat.dispose();
    },
    [r],
  );
  useFrame((state) => {
    r.mat.uniforms.uTime.value = state.clock.elapsedTime;
    r.mat.uniforms.uCam.value.copy(state.camera.position);
  });
  return <mesh geometry={r.geo} material={r.mat} rotation={[-Math.PI / 2, 0, 0]} position={[0, -4.2, -52]} />;
}

// Track values between the focal objects, where the camera passes through a gate.
const GATE_TRACK = [0.72, 0.86, 1.5, 2.56, 2.74, 3.32, 3.58, 4.3, 4.52];

/**
 * HUD gate frames placed along the camera path, perpendicular to travel, so the
 * flight reads as passing through a sequence of targeting frames. One merged
 * LineSegments = one draw call; every fourth gate is amber.
 */
export function ScanGates() {
  const r = useMemo(() => {
    const pts: number[] = [];
    const cols: number[] = [];
    const a = new THREE.Vector3();
    const b = new THREE.Vector3();
    const pos = new THREE.Vector3();
    const tgt = new THREE.Vector3();
    const m = new THREE.Matrix4();
    const cyan = new THREE.Color(COLORS.cyan);
    const amber = new THREE.Color(COLORS.amber).multiplyScalar(1.3);
    const local = gateSegments(7.2, 4.2, 0.22);
    GATE_TRACK.forEach((t, i) => {
      samplePath(t - 0.02, a, tgt);
      samplePath(t + 0.02, b, tgt);
      samplePath(t, pos, tgt);
      m.lookAt(b, a, new THREE.Vector3(0, 1, 0)); // face along the travel direction
      m.setPosition(pos);
      const before = pts.length;
      pushTransformed(pts, local, m);
      const c = i % 4 === 2 ? amber : cyan;
      for (let k = before; k < pts.length; k += 3) cols.push(c.r, c.g, c.b);
    });
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
    return { geo, mat: fadeLineMaterial({ color: '#ffffff', opacity: 0.65, near: 1.4, far: 18, vertexColors: true }) };
  }, []);
  useEffect(
    () => () => {
      r.geo.dispose();
      r.mat.dispose();
    },
    [r],
  );
  useFrame((state) => {
    r.mat.uniforms.uTime.value = state.clock.elapsedTime;
    r.mat.uniforms.uPing.value = live.ping;
  });
  return <lineSegments geometry={r.geo} material={r.mat} frustumCulled={false} />;
}

/** Ambient dust across the whole flight volume, for depth. */
export function DustField({ count, reduced }: { count: number; reduced: boolean }) {
  const dpr = useThree((s) => s.viewport.dpr);
  const r = useMemo(() => {
    const geo = particleGeometry(count, (_, v) => {
      v.set((Math.random() - 0.5) * 36, -4 + Math.random() * 13, 14 - Math.random() * 126);
    });
    const mat = particleMaterial({ size: 22, far: 34, opacity: 0.8 });
    return { geo, mat };
  }, [count]);
  useEffect(() => {
    r.mat.uniforms.uPixelRatio.value = dpr;
    r.mat.uniforms.uDrift.value = reduced ? 0 : 1;
  }, [dpr, reduced, r]);
  useEffect(
    () => () => {
      r.geo.dispose();
      r.mat.dispose();
    },
    [r],
  );
  useFrame((state) => {
    r.mat.uniforms.uTime.value = state.clock.elapsedTime;
  });
  return <points geometry={r.geo} material={r.mat} frustumCulled={false} />;
}
