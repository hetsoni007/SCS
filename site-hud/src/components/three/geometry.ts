/**
 * Line geometry builders for the HUD primitives (tick dials, arcs, gate frames).
 * Everything is LineSegments-friendly: pairs of points in a flat Float32Array.
 */
import * as THREE from 'three';

/** Radial tick marks in the XY plane. Every `majorEvery`th tick is longer. */
export function tickRing(count: number, r: number, len: number, majorEvery = 10, majorLen = len * 2.2) {
  const pts: number[] = [];
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2;
    const l = i % majorEvery === 0 ? majorLen : len;
    const c = Math.cos(a);
    const s = Math.sin(a);
    pts.push(c * r, s * r, 0, c * (r + l), s * (r + l), 0);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
  return g;
}

/** An arc as line segments in the XY plane. */
export function arcLine(r: number, start: number, length: number, segments = 96) {
  const pts: number[] = [];
  for (let i = 0; i < segments; i++) {
    const a0 = start + (i / segments) * length;
    const a1 = start + ((i + 1) / segments) * length;
    pts.push(Math.cos(a0) * r, Math.sin(a0) * r, 0, Math.cos(a1) * r, Math.sin(a1) * r, 0);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
  return g;
}

/**
 * A HUD "gate": chamfered rectangle + inner corner brackets + top ticks.
 * Returned as raw segment points in local space (XY plane, facing +Z).
 */
export function gateSegments(w: number, h: number, chamfer: number): number[] {
  const x = w / 2;
  const y = h / 2;
  const c = chamfer;
  const outline: [number, number][] = [
    [-x + c, y], [x - c * 3, y], [x - c * 3, y], [x, y - c * 3],
    [x, y - c * 3], [x, -y + c], [x, -y + c], [x - c, -y],
    [x - c, -y], [-x + c * 3, -y], [-x + c * 3, -y], [-x, -y + c * 3],
    [-x, -y + c * 3], [-x, y - c], [-x, y - c], [-x + c, y],
  ];
  const pts: number[] = [];
  for (const [px, py] of outline) pts.push(px, py, 0);

  // inner brackets
  const ix = x - c * 1.6;
  const iy = y - c * 1.6;
  const b = Math.min(w, h) * 0.12;
  for (const [sx, sy] of [[-1, 1], [1, 1], [1, -1], [-1, -1]] as const) {
    pts.push(sx * ix, sy * iy, 0, sx * (ix - b), sy * iy, 0);
    pts.push(sx * ix, sy * iy, 0, sx * ix, sy * (iy - b), 0);
  }

  // measurement ticks along the top edge
  const ticks = 13;
  for (let i = 0; i < ticks; i++) {
    const tx = -x * 0.4 + (i / (ticks - 1)) * x * 0.8;
    const tl = i % 6 === 0 ? c * 0.9 : c * 0.45;
    pts.push(tx, y + c * 0.6, 0, tx, y + c * 0.6 + tl, 0);
  }
  return pts;
}

/** Transforms flat local segment points by a matrix, appending into `out`. */
export function pushTransformed(out: number[], local: number[], m: THREE.Matrix4) {
  const v = new THREE.Vector3();
  for (let i = 0; i < local.length; i += 3) {
    v.set(local[i], local[i + 1], local[i + 2]).applyMatrix4(m);
    out.push(v.x, v.y, v.z);
  }
}
