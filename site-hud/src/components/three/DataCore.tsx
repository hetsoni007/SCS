'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { COLORS, SCENE_ANCHORS } from '@/lib/animation';
import { live } from '@/lib/live';
import { CAPABILITIES } from '@/data/capabilities';
import { brightBasic, brightLine, glowMaterial, hologramMaterial } from '@/lib/shaders';

const ORBIT_R = 1.75; // inside the DOM ellipse, so nodes never sit under a module card
const TILT = 0.35; // radians; front of the orbit dips toward the viewer, like the DOM orbit
const N = CAPABILITIES.length;
const X_AXIS = new THREE.Vector3(1, 0, 0);
const cyan = new THREE.Color(COLORS.cyanHi).multiplyScalar(1.6);
const amber = new THREE.Color(COLORS.amber).multiplyScalar(2);

/**
 * Capabilities centrepiece. A rotating nested polyhedron with one satellite node
 * per capability. Nodes ride the same angle as the DOM module orbit
 * (live.orbitAngle), and the focused module's node turns amber with a tether beam.
 */
export function DataCore({ reduced }: { reduced: boolean }) {
  const octa = useRef<THREE.Mesh>(null!);
  const dodeca = useRef<THREE.LineSegments>(null!);
  const nodes = useRef<(THREE.Mesh | null)[]>([]);

  const r = useMemo(() => {
    const beamGeo = new THREE.BufferGeometry();
    beamGeo.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0, 0, 0, 0], 3));
    const beamMat = brightLine(COLORS.amber, 1.6, 0.9);
    return {
      octaGeo: new THREE.OctahedronGeometry(0.72, 0),
      octaMat: hologramMaterial({ wireframe: true, opacity: 1 }),
      octaFill: hologramMaterial({ opacity: 0.25 }),
      dodecaGeo: new THREE.EdgesGeometry(new THREE.DodecahedronGeometry(1.08, 0)),
      dodecaMat: brightLine(COLORS.cyan, 1, 0.5),
      coreGeo: new THREE.SphereGeometry(0.15, 24, 12),
      coreMat: glowMaterial(COLORS.core, 2.6),
      orbitGeo: new THREE.TorusGeometry(ORBIT_R, 0.008, 4, 200),
      orbitMat: brightBasic(COLORS.cyan, 1.4, 0.7),
      nodeGeo: new THREE.IcosahedronGeometry(0.085, 1),
      nodeMats: CAPABILITIES.map(() => brightBasic(COLORS.cyanHi, 1.6)),
      beamGeo,
      beamMat,
      // a THREE.Line via <primitive>: R3F's <line> intrinsic collides with SVG's in the JSX types
      beam: new THREE.Line(beamGeo, beamMat),
    };
  }, []);

  useEffect(
    () => () => {
      [r.octaGeo, r.dodecaGeo, r.coreGeo, r.orbitGeo, r.nodeGeo, r.beamGeo].forEach((g) => g.dispose());
      [r.octaMat, r.octaFill, r.dodecaMat, r.coreMat, r.orbitMat, r.beamMat, ...r.nodeMats].forEach((m) => m.dispose());
    },
    [r],
  );

  const tmp = useMemo(() => new THREE.Vector3(), []);

  useFrame((state, dt) => {
    const t = state.clock.elapsedTime;
    r.octaMat.uniforms.uTime.value = t;
    r.octaFill.uniforms.uTime.value = t;
    r.octaMat.uniforms.uPing.value = live.ping;
    if (!reduced) {
      octa.current.rotation.y += dt * 0.4;
      octa.current.rotation.z += dt * 0.15;
      dodeca.current.rotation.y -= dt * 0.18;
      dodeca.current.rotation.x += dt * 0.07;
    }

    const active = live.activeModule;
    const pos = r.beamGeo.attributes.position as THREE.BufferAttribute;
    r.beam.visible = active >= 0;
    for (let i = 0; i < N; i++) {
      const node = nodes.current[i];
      if (!node) continue;
      const a = live.orbitAngle + (i / N) * Math.PI * 2;
      // same parametrisation as the DOM orbit: x = cos, depth = sin (front = lower)
      tmp.set(Math.cos(a) * ORBIT_R, 0, Math.sin(a) * ORBIT_R).applyAxisAngle(X_AXIS, TILT);
      node.position.copy(tmp);
      const on = i === active;
      node.scale.setScalar(THREE.MathUtils.damp(node.scale.x, on ? 2 : 1, 8, dt));
      (node.material as THREE.MeshBasicMaterial).color.lerp(on ? amber : cyan, 1 - Math.exp(-dt * 10));
      if (on) {
        pos.setXYZ(1, tmp.x, tmp.y, tmp.z);
        pos.needsUpdate = true;
      }
    }
  });

  return (
    <group position={SCENE_ANCHORS.dataCore}>
      <mesh ref={octa} geometry={r.octaGeo} material={r.octaMat}>
        <mesh geometry={r.octaGeo} material={r.octaFill} scale={0.98} />
      </mesh>
      <lineSegments ref={dodeca} geometry={r.dodecaGeo} material={r.dodecaMat} />
      <mesh geometry={r.coreGeo} material={r.coreMat} />
      <mesh geometry={r.orbitGeo} material={r.orbitMat} rotation={[Math.PI / 2 + TILT, 0, 0]} />
      {CAPABILITIES.map((c, i) => (
        <mesh
          key={c.id}
          ref={(el) => {
            nodes.current[i] = el;
          }}
          geometry={r.nodeGeo}
          material={r.nodeMats[i]}
        />
      ))}
      <primitive object={r.beam} />
    </group>
  );
}
