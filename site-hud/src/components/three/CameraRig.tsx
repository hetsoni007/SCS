'use client';

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { live } from '@/lib/live';
import { samplePath } from './path';

const BASE_FOV = 45;

/**
 * Flies the camera along the scroll-linked path (lib/animation.ts CAMERA_PATH),
 * adds pointer parallax, and kicks the FOV slightly with scroll speed for a
 * "warp" feel. Under reduced motion the camera holds the hero pose.
 * It also owns the decay of the global `ping` impulse.
 */
export function CameraRig({ reduced }: { reduced: boolean }) {
  const pos = useMemo(() => new THREE.Vector3(), []);
  const target = useMemo(() => new THREE.Vector3(), []);
  const look = useMemo(() => new THREE.Vector3(), []);
  const first = useRef(true);

  useFrame((state, delta) => {
    const cam = state.camera as THREE.PerspectiveCamera;
    const dt = Math.min(delta, 0.1);
    samplePath(reduced ? 0 : live.track, pos, target);

    if (!reduced) {
      pos.x += live.px * 0.45;
      pos.y += live.py * 0.28;
    }

    if (first.current || reduced) {
      cam.position.copy(pos);
      look.copy(target);
      first.current = false;
    } else {
      const k = 1 - Math.exp(-dt * 3.4);
      cam.position.lerp(pos, k);
      look.lerp(target, k);
    }
    cam.lookAt(look);

    const speed = reduced ? 0 : Math.min(1, Math.abs(live.velocity) / 60);
    const fov = BASE_FOV + speed * 7;
    if (Math.abs(cam.fov - fov) > 0.01) {
      cam.fov = THREE.MathUtils.damp(cam.fov, fov, 4, dt);
      cam.updateProjectionMatrix();
    }

    live.ping = Math.max(0, live.ping - dt * 1.5);
  });

  return null;
}
