import * as THREE from 'three';
import { CAMERA_PATH, type CamKey } from '@/lib/animation';

function catmull(p0: number, p1: number, p2: number, p3: number, s: number) {
  const s2 = s * s;
  const s3 = s2 * s;
  return 0.5 * (2 * p1 + (-p0 + p2) * s + (2 * p0 - 5 * p1 + 4 * p2 - p3) * s2 + (-p0 + 3 * p1 - 3 * p2 + p3) * s3);
}

function set(out: THREE.Vector3, key: [number, number, number]) {
  return out.set(key[0], key[1], key[2]);
}

/**
 * Samples the camera flight at a scroll `track` value with a Catmull-Rom spline
 * through the keyframes in lib/animation.ts.
 */
export function samplePath(t: number, outPos: THREE.Vector3, outTarget: THREE.Vector3, keys: CamKey[] = CAMERA_PATH) {
  const n = keys.length;
  if (t <= keys[0].t) {
    set(outPos, keys[0].pos);
    set(outTarget, keys[0].target);
    return;
  }
  if (t >= keys[n - 1].t) {
    set(outPos, keys[n - 1].pos);
    set(outTarget, keys[n - 1].target);
    return;
  }
  let i = 0;
  while (i < n - 2 && t > keys[i + 1].t) i++;
  const a = keys[Math.max(0, i - 1)];
  const b = keys[i];
  const c = keys[i + 1];
  const d = keys[Math.min(n - 1, i + 2)];
  const s = (t - b.t) / (c.t - b.t);
  outPos.set(
    catmull(a.pos[0], b.pos[0], c.pos[0], d.pos[0], s),
    catmull(a.pos[1], b.pos[1], c.pos[1], d.pos[1], s),
    catmull(a.pos[2], b.pos[2], c.pos[2], d.pos[2], s),
  );
  outTarget.set(
    catmull(a.target[0], b.target[0], c.target[0], d.target[0], s),
    catmull(a.target[1], b.target[1], c.target[1], d.target[1], s),
    catmull(a.target[2], b.target[2], c.target[2], d.target[2], s),
  );
}
