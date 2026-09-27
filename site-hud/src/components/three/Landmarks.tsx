'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { COLORS, SCENE_ANCHORS } from '@/lib/animation';
import { live } from '@/lib/live';
import { beamMaterial, brightBasic, brightLine, glowMaterial, hologramMaterial } from '@/lib/shaders';
import { arcLine, tickRing } from './geometry';

/** Why-us backdrop: a giant instrument dial that frames the gauge panels. */
export function DialRing({ reduced }: { reduced: boolean }) {
  const outer = useRef<THREE.Group>(null!);
  const inner = useRef<THREE.Group>(null!);
  const r = useMemo(
    () => ({
      ticks: tickRing(180, 4.0, 0.12, 15, 0.34),
      tickMat: brightLine(COLORS.cyan, 1, 0.55),
      ring: new THREE.TorusGeometry(3.7, 0.01, 4, 240),
      ringMat: brightBasic(COLORS.cyanHi, 1.5, 0.6),
      arcA: arcLine(4.55, 0.4, Math.PI * 1.2, 160),
      arcAMat: brightLine(COLORS.cyanHi, 1.3, 0.6),
      arcB: arcLine(4.85, 3.9, Math.PI * 0.4, 80),
      arcBMat: brightLine(COLORS.amber, 1.5, 0.85),
    }),
    [],
  );
  useEffect(
    () => () => {
      [r.ticks, r.ring, r.arcA, r.arcB].forEach((g) => g.dispose());
      [r.tickMat, r.ringMat, r.arcAMat, r.arcBMat].forEach((m) => m.dispose());
    },
    [r],
  );
  useFrame((_, dt) => {
    if (reduced) return;
    outer.current.rotation.z += dt * 0.03;
    inner.current.rotation.z -= dt * 0.08;
  });
  return (
    <group position={SCENE_ANCHORS.dial}>
      <group ref={outer}>
        <lineSegments geometry={r.ticks} material={r.tickMat} />
        <lineSegments geometry={r.arcA} material={r.arcAMat} />
      </group>
      <group ref={inner}>
        <mesh geometry={r.ring} material={r.ringMat} />
        <lineSegments geometry={r.arcB} material={r.arcBMat} />
      </group>
    </group>
  );
}

const RINGS = 3;
const RING_PERIOD = 3.2;

/**
 * Contact backdrop: a transmission beacon. A vertical beam, a holographic emitter
 * and ground rings that pulse outward. Pulses speed up while a transmission is
 * in flight and flare on ping (form sent).
 */
const BEACON_AT = new THREE.Vector3(...SCENE_ANCHORS.beacon);

export function Beacon({ reduced }: { reduced: boolean }) {
  const group = useRef<THREE.Group>(null!);
  const emitter = useRef<THREE.Mesh>(null!);
  const rings = useRef<(THREE.Mesh | null)[]>([]);
  const phase = useRef(0);
  const r = useMemo(
    () => ({
      beam: new THREE.CylinderGeometry(0.05, 0.05, 40, 8, 1, true),
      beamMat: beamMaterial(COLORS.cyanHi, 0.95),
      halo: new THREE.CylinderGeometry(0.32, 0.32, 40, 16, 1, true),
      haloMat: beamMaterial(COLORS.cyan, 0.22),
      emitterGeo: new THREE.OctahedronGeometry(0.55, 0),
      emitterMat: hologramMaterial({ wireframe: true }),
      coreGeo: new THREE.SphereGeometry(0.18, 20, 10),
      coreMat: glowMaterial(COLORS.core, 3),
      ringGeo: new THREE.RingGeometry(0.97, 1.0, 96),
      ringMats: Array.from({ length: RINGS }, () => brightBasic(COLORS.cyanHi, 1.6, 0)),
      baseGeo: new THREE.RingGeometry(0.9, 0.93, 64),
      baseMat: brightBasic(COLORS.amber, 1.6, 0.8),
    }),
    [],
  );
  useEffect(
    () => () => {
      [r.beam, r.halo, r.emitterGeo, r.coreGeo, r.ringGeo, r.baseGeo].forEach((g) => g.dispose());
      [r.beamMat, r.haloMat, r.emitterMat, r.coreMat, r.baseMat, ...r.ringMats].forEach((m) => m.dispose());
    },
    [r],
  );
  useFrame((state, dt) => {
    // only exists once the camera approaches; from the why-us pose it would sit between the gauges
    group.current.visible = state.camera.position.distanceTo(BEACON_AT) < 24;
    if (!group.current.visible) return;
    const t = state.clock.elapsedTime;
    const boost = Math.max(live.ping, live.transmitting ? 0.6 : 0);
    r.beamMat.uniforms.uTime.value = t;
    r.haloMat.uniforms.uTime.value = t;
    r.beamMat.uniforms.uBoost.value = boost;
    r.haloMat.uniforms.uBoost.value = boost;
    r.emitterMat.uniforms.uTime.value = t;
    r.emitterMat.uniforms.uPing.value = boost;
    if (reduced) return;
    emitter.current.rotation.y += dt * (0.6 + boost * 4);
    phase.current += dt * (1 + boost * 2.5);
    for (let i = 0; i < RINGS; i++) {
      const ring = rings.current[i];
      if (!ring) continue;
      const k = ((phase.current / RING_PERIOD + i / RINGS) % 1 + 1) % 1;
      ring.scale.setScalar(0.4 + k * 7);
      r.ringMats[i].opacity = (1 - k) * (0.7 + boost * 0.3);
    }
  });
  return (
    <group ref={group} position={SCENE_ANCHORS.beacon}>
      <mesh geometry={r.beam} material={r.beamMat} position={[0, 20, 0]} />
      <mesh geometry={r.halo} material={r.haloMat} position={[0, 20, 0]} />
      <mesh ref={emitter} geometry={r.emitterGeo} material={r.emitterMat} position={[0, 0.3, 0]}>
        <mesh geometry={r.coreGeo} material={r.coreMat} />
      </mesh>
      <group rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.25, 0]}>
        <mesh geometry={r.baseGeo} material={r.baseMat} />
        {r.ringMats.map((m, i) => (
          <mesh
            key={i}
            ref={(el) => {
              rings.current[i] = el;
            }}
            geometry={r.ringGeo}
            material={m}
          />
        ))}
      </group>
    </group>
  );
}
