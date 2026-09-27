'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { COLORS } from '@/lib/animation';
import { live } from '@/lib/live';
import {
  brightBasic,
  brightLine,
  glowMaterial,
  hologramMaterial,
  particleGeometry,
  particleMaterial,
  sweepMaterial,
} from '@/lib/shaders';
import { arcLine, tickRing } from './geometry';

const COILS = 10;
const { damp } = THREE.MathUtils;

/**
 * The hero centrepiece: an arc-reactor-style core. Glowing nucleus, holographic
 * icosahedron, amber coil ring, tick dial, gyroscope arcs, radar sweep and a
 * particle shell. Sits at the world origin.
 */
export function ReactorCore({ shell, reduced }: { shell: number; reduced: boolean }) {
  const dpr = useThree((s) => s.viewport.dpr);
  const root = useRef<THREE.Group>(null!);
  const inner = useRef<THREE.Mesh>(null!);
  const mid = useRef<THREE.LineSegments>(null!);
  const coils = useRef<THREE.Group>(null!);
  const ticks = useRef<THREE.LineSegments>(null!);
  const nucleus = useRef<THREE.Group>(null!);
  const points = useRef<THREE.Points>(null!);
  const arcRefs = useRef<(THREE.LineSegments | null)[]>([]);

  const r = useMemo(() => {
    const coilBox = new THREE.BoxGeometry(0.34, 0.13, 0.16);
    const coilFill = new THREE.InstancedMesh(
      coilBox,
      hologramMaterial({ color: COLORS.amber, rim: COLORS.amber, opacity: 0.32, flicker: 0.4 }),
      COILS,
    );
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const coilMatrices: THREE.Matrix4[] = [];
    for (let i = 0; i < COILS; i++) {
      const a = (i / COILS) * Math.PI * 2;
      q.setFromAxisAngle(new THREE.Vector3(0, 0, 1), a + Math.PI / 2);
      m.compose(new THREE.Vector3(Math.cos(a) * 1.2, Math.sin(a) * 1.2, 0), q, new THREE.Vector3(1, 1, 1));
      coilFill.setMatrixAt(i, m);
      coilMatrices.push(m.clone());
    }

    const arcs = [
      { r: 1.95, start: 0.2, len: Math.PI * 1.3, color: COLORS.cyan, op: 0.7, tilt: [0.35, 0, 0], speed: 0.22 },
      { r: 2.18, start: 2.4, len: Math.PI * 0.75, color: COLORS.amber, op: 0.85, tilt: [-0.25, 0.4, 0], speed: -0.3 },
      { r: 2.42, start: 4.0, len: Math.PI * 1.55, color: COLORS.cyanHi, op: 0.45, tilt: [0.1, -0.5, 0.2], speed: 0.14 },
    ].map((d) => ({ ...d, geo: arcLine(d.r, d.start, d.len, 140), mat: brightLine(d.color, 1.35, d.op) }));

    const haloMat = glowMaterial(COLORS.cyan, 1.1);
    haloMat.uniforms.uOpacity.value = 0.38;

    return {
      innerGeo: new THREE.IcosahedronGeometry(0.62, 1),
      innerMat: hologramMaterial({ wireframe: true, opacity: 0.95 }),
      midGeo: new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(0.92, 0)),
      midMat: brightLine(COLORS.cyan, 1, 0.5),
      coreGeo: new THREE.SphereGeometry(0.3, 32, 16),
      coreMat: glowMaterial(COLORS.core, 2.8),
      haloGeo: new THREE.SphereGeometry(0.6, 32, 16),
      haloMat,
      coilFill,
      coilEdges: new THREE.EdgesGeometry(coilBox),
      coilLine: brightLine(COLORS.amber, 1.3, 0.9),
      coilMatrices,
      ringGeo: new THREE.TorusGeometry(1.48, 0.012, 6, 200),
      ringMat: brightBasic(COLORS.cyanHi, 2),
      tickGeo: tickRing(120, 1.62, 0.07, 10, 0.17),
      tickMat: brightLine(COLORS.cyan, 1, 0.6),
      arcs,
      sweepGeo: new THREE.RingGeometry(0.4, 2.6, 96, 1),
      sweepMat: sweepMaterial(2.6),
      shellGeo: particleGeometry(shell, (_, v) => {
        v.randomDirection().multiplyScalar(2.7 + Math.pow(Math.random(), 0.7) * 3.1);
        v.y *= 0.72;
      }),
      shellMat: particleMaterial({ size: 34, far: 30 }),
    };
  }, [shell]);

  useEffect(() => {
    r.shellMat.uniforms.uPixelRatio.value = dpr;
  }, [dpr, r]);

  useEffect(
    () => () => {
      [r.innerGeo, r.midGeo, r.coreGeo, r.haloGeo, r.coilEdges, r.ringGeo, r.tickGeo, r.sweepGeo, r.shellGeo].forEach((g) => g.dispose());
      [r.innerMat, r.midMat, r.coreMat, r.haloMat, r.coilLine, r.ringMat, r.tickMat, r.sweepMat, r.shellMat].forEach((m) => m.dispose());
      r.coilFill.geometry.dispose();
      (r.coilFill.material as THREE.Material).dispose();
      r.arcs.forEach((a) => {
        a.geo.dispose();
        a.mat.dispose();
      });
    },
    [r],
  );

  useFrame((state, dt) => {
    const t = state.clock.elapsedTime;
    const p = live.ping;
    r.innerMat.uniforms.uTime.value = t;
    r.innerMat.uniforms.uPing.value = p;
    (r.coilFill.material as THREE.ShaderMaterial).uniforms.uTime.value = t;
    r.sweepMat.uniforms.uTime.value = t;
    r.shellMat.uniforms.uTime.value = t;
    r.coreMat.uniforms.uIntensity.value = 2.8 + p * 3;
    if (reduced) return;

    const vel = Math.min(1, Math.abs(live.velocity) / 40);
    inner.current.rotation.y += dt * (0.35 + vel * 2.2);
    inner.current.rotation.x += dt * 0.12;
    mid.current.rotation.y -= dt * 0.22;
    mid.current.rotation.z += dt * 0.08;
    coils.current.rotation.z += dt * (0.2 + vel * 1.4);
    ticks.current.rotation.z -= dt * 0.05;
    r.arcs.forEach((a, i) => {
      const obj = arcRefs.current[i];
      if (obj) obj.rotation.z += dt * a.speed * (1 + vel * 2);
    });
    points.current.rotation.y += dt * 0.025;
    const pulse = 1 + Math.sin(t * 2.2) * 0.05 + p * 0.45;
    nucleus.current.scale.setScalar(pulse);

    // mouse parallax + a lean-back as the page scrolls away from the hero
    const away = Math.min(live.track, 1);
    root.current.rotation.x = damp(root.current.rotation.x, -live.py * 0.22 + away * 0.55, 3, dt);
    root.current.rotation.y = damp(root.current.rotation.y, live.px * 0.32, 3, dt);
  });

  return (
    <group ref={root} scale={0.72}>
      <mesh geometry={r.sweepGeo} material={r.sweepMat} position={[0, 0, -0.35]} />
      <group ref={nucleus}>
        <mesh geometry={r.coreGeo} material={r.coreMat} />
        <mesh geometry={r.haloGeo} material={r.haloMat} />
      </group>
      <mesh ref={inner} geometry={r.innerGeo} material={r.innerMat} />
      <lineSegments ref={mid} geometry={r.midGeo} material={r.midMat} />
      <group ref={coils}>
        <primitive object={r.coilFill} />
        {r.coilMatrices.map((mat, i) => (
          <lineSegments key={i} geometry={r.coilEdges} material={r.coilLine} matrix={mat} matrixAutoUpdate={false} />
        ))}
      </group>
      <mesh geometry={r.ringGeo} material={r.ringMat} />
      <lineSegments ref={ticks} geometry={r.tickGeo} material={r.tickMat} />
      {r.arcs.map((a, i) => (
        <group key={i} rotation={a.tilt as [number, number, number]}>
          <lineSegments
            ref={(el) => {
              arcRefs.current[i] = el;
            }}
            geometry={a.geo}
            material={a.mat}
          />
        </group>
      ))}
      <points ref={points} geometry={r.shellGeo} material={r.shellMat} />
    </group>
  );
}
