/**
 * Shader materials for the holographic scene.
 *
 * All outputs go through <colorspace_fragment> so hex colours match the CSS.
 * Colours are pushed above 1.0 where things should bloom. The composer renders
 * in half-float, so those values survive into the bloom pass at tier 2. At tier 1
 * they simply clamp.
 */
import * as THREE from 'three';
import { COLORS } from '../animation';

const color = (hex: string) => new THREE.Color(hex);

/* ── Hologram: fresnel rim + scrolling scanlines + travelling band + flicker ── */

const holoVertex = /* glsl */ `
  varying vec3 vN;
  varying vec3 vV;
  varying vec3 vW;
  void main() {
    vec4 local = vec4(position, 1.0);
    vec3 nrm = normal;
    #ifdef USE_INSTANCING
      local = instanceMatrix * local;
      nrm = mat3(instanceMatrix) * nrm;
    #endif
    vec4 w = modelMatrix * local;
    vW = w.xyz;
    vN = normalize(mat3(modelMatrix) * nrm);
    vV = cameraPosition - w.xyz;
    gl_Position = projectionMatrix * viewMatrix * w;
  }
`;

const holoFragment = /* glsl */ `
  uniform vec3 uColor;
  uniform vec3 uRim;
  uniform float uTime;
  uniform float uOpacity;
  uniform float uPing;
  uniform float uFlicker;
  varying vec3 vN;
  varying vec3 vV;
  varying vec3 vW;
  float hash(float n) { return fract(sin(n) * 43758.5453123); }
  void main() {
    vec3 n = normalize(vN);
    vec3 v = normalize(vV);
    float fres = pow(1.0 - abs(dot(n, v)), 2.0);
    float scan = 0.72 + 0.28 * sin(vW.y * 30.0 - uTime * 4.0);
    float band = smoothstep(0.985, 1.0, sin(vW.y * 1.3 - uTime * 1.7));
    float flick = 1.0 - uFlicker * step(0.93, hash(floor(uTime * 15.0))) * 0.5;
    vec3 col = mix(uColor, uRim, fres) * (1.0 + uPing * 1.4 + band * 1.6);
    float a = (0.2 + fres * 0.95 + band * 0.8) * scan * flick * uOpacity;
    gl_FragColor = vec4(col, a);
    #include <colorspace_fragment>
  }
`;

export function hologramMaterial(opts: { color?: string; rim?: string; opacity?: number; wireframe?: boolean; flicker?: number } = {}) {
  return new THREE.ShaderMaterial({
    vertexShader: holoVertex,
    fragmentShader: holoFragment,
    uniforms: {
      uColor: { value: color(opts.color ?? COLORS.cyan) },
      uRim: { value: color(opts.rim ?? COLORS.cyanHi).multiplyScalar(1.6) },
      uTime: { value: 0 },
      uOpacity: { value: opts.opacity ?? 1 },
      uPing: { value: 0 },
      uFlicker: { value: opts.flicker ?? 1 },
    },
    wireframe: opts.wireframe ?? false,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
  });
}

/* ── Glow core: bright centre falling off to the silhouette ── */

const glowFragment = /* glsl */ `
  uniform vec3 uColor;
  uniform float uIntensity;
  uniform float uOpacity;
  varying vec3 vN;
  varying vec3 vV;
  varying vec3 vW;
  void main() {
    float d = max(dot(normalize(vN), normalize(vV)), 0.0);
    float core = pow(d, 1.6);
    gl_FragColor = vec4(uColor * (0.5 + core * uIntensity), core * uOpacity);
    #include <colorspace_fragment>
  }
`;

export function glowMaterial(hex: string = COLORS.core, intensity = 2.4) {
  return new THREE.ShaderMaterial({
    vertexShader: holoVertex,
    fragmentShader: glowFragment,
    uniforms: {
      uColor: { value: color(hex) },
      uIntensity: { value: intensity },
      uOpacity: { value: 1 },
    },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
}

/* ── Lines that fade in with distance and vanish just before the camera ── */

const fadeLineVertex = /* glsl */ `
  varying float vDist;
  varying vec3 vW;
  varying vec3 vCol;
  void main() {
    vec4 w = modelMatrix * vec4(position, 1.0);
    vW = w.xyz;
    vDist = distance(w.xyz, cameraPosition);
    #ifdef USE_COLOR
      vCol = color;
    #else
      vCol = vec3(1.0);
    #endif
    gl_Position = projectionMatrix * viewMatrix * w;
  }
`;

const fadeLineFragment = /* glsl */ `
  uniform vec3 uColor;
  uniform float uOpacity;
  uniform float uNear;
  uniform float uFar;
  uniform float uTime;
  uniform float uPing;
  varying float vDist;
  varying vec3 vW;
  varying vec3 vCol;
  void main() {
    float a = smoothstep(uFar, uFar * 0.35, vDist) * smoothstep(uNear, uNear * 2.5, vDist);
    float pulse = 0.78 + 0.22 * sin(uTime * 2.2 + vW.z * 0.35 + vW.x * 0.2);
    gl_FragColor = vec4(uColor * vCol * pulse * (1.0 + uPing), a * uOpacity);
    #include <colorspace_fragment>
  }
`;

export function fadeLineMaterial(opts: { color?: string; opacity?: number; near?: number; far?: number; vertexColors?: boolean } = {}) {
  return new THREE.ShaderMaterial({
    vertexShader: fadeLineVertex,
    fragmentShader: fadeLineFragment,
    uniforms: {
      uColor: { value: color(opts.color ?? '#ffffff') },
      uOpacity: { value: opts.opacity ?? 1 },
      uNear: { value: opts.near ?? 0.8 },
      uFar: { value: opts.far ?? 40 },
      uTime: { value: 0 },
      uPing: { value: 0 },
    },
    vertexColors: opts.vertexColors ?? false,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
}

/* ── Particles: twinkling round points, ~7% amber, distance-faded ── */

const particleVertex = /* glsl */ `
  attribute float aScale;
  attribute float aSeed;
  uniform float uTime;
  uniform float uSize;
  uniform float uPixelRatio;
  uniform float uDrift;
  uniform float uFar;
  varying float vAlpha;
  varying float vAmber;
  void main() {
    vec3 p = position;
    p.y += sin(uTime * 0.25 + aSeed * 6.2831) * 0.22 * uDrift;
    p.x += cos(uTime * 0.18 + aSeed * 12.0) * 0.16 * uDrift;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    float depth = -mv.z;
    gl_PointSize = uSize * aScale * uPixelRatio / max(depth, 0.1);
    float twinkle = 0.55 + 0.45 * sin(uTime * (0.8 + aSeed * 2.4) + aSeed * 40.0);
    vAlpha = twinkle * smoothstep(uFar, uFar * 0.25, depth) * smoothstep(0.3, 1.6, depth);
    vAmber = step(0.93, fract(aSeed * 7.13));
  }
`;

const particleFragment = /* glsl */ `
  uniform vec3 uColor;
  uniform vec3 uAmber;
  uniform float uOpacity;
  varying float vAlpha;
  varying float vAmber;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.0, d);
    a *= a;
    gl_FragColor = vec4(mix(uColor, uAmber, vAmber), a * vAlpha * uOpacity);
    #include <colorspace_fragment>
  }
`;

export function particleMaterial(opts: { size?: number; opacity?: number; far?: number; pixelRatio?: number } = {}) {
  return new THREE.ShaderMaterial({
    vertexShader: particleVertex,
    fragmentShader: particleFragment,
    uniforms: {
      uTime: { value: 0 },
      uSize: { value: opts.size ?? 26 },
      uPixelRatio: { value: opts.pixelRatio ?? 1 },
      uDrift: { value: 1 },
      uFar: { value: opts.far ?? 40 },
      uColor: { value: color(COLORS.cyanHi).multiplyScalar(1.3) },
      uAmber: { value: color(COLORS.amber).multiplyScalar(1.3) },
      uOpacity: { value: opts.opacity ?? 1 },
    },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
}

/** Fills position / aScale / aSeed for a Points geometry from a sampler. */
export function particleGeometry(count: number, sample: (i: number, out: THREE.Vector3) => void) {
  const pos = new Float32Array(count * 3);
  const scale = new Float32Array(count);
  const seed = new Float32Array(count);
  const v = new THREE.Vector3();
  for (let i = 0; i < count; i++) {
    sample(i, v);
    pos[i * 3] = v.x;
    pos[i * 3 + 1] = v.y;
    pos[i * 3 + 2] = v.z;
    scale[i] = 0.35 + Math.pow(Math.random(), 3) * 1.6;
    seed[i] = Math.random();
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('aScale', new THREE.BufferAttribute(scale, 1));
  g.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
  return g;
}

/* ── Holographic floor grid (anti-aliased with fwidth) with travelling pulses ── */

const gridVertex = /* glsl */ `
  varying vec3 vW;
  void main() {
    vec4 w = modelMatrix * vec4(position, 1.0);
    vW = w.xyz;
    gl_Position = projectionMatrix * viewMatrix * w;
  }
`;

const gridFragment = /* glsl */ `
  uniform vec3 uColor;
  uniform vec3 uAmber;
  uniform vec3 uCam;
  uniform float uTime;
  uniform float uOpacity;
  varying vec3 vW;
  float gridLine(vec2 p, float size) {
    vec2 q = p / size;
    vec2 g = abs(fract(q - 0.5) - 0.5) / fwidth(q);
    return 1.0 - min(min(g.x, g.y), 1.0);
  }
  void main() {
    float fine = gridLine(vW.xz, 1.0) * 0.28;
    float major = gridLine(vW.xz, 5.0) * 0.7;
    float dist = length(vW.xz - uCam.xz);
    float fade = smoothstep(34.0, 3.0, dist);
    float pulseZ = mod(vW.z + uTime * 7.0, 36.0);
    float pulse = exp(-pow(pulseZ - 18.0, 2.0) * 0.08);
    float lines = max(fine, major);
    vec3 col = mix(uColor, uAmber, pulse * 0.35) * (1.0 + pulse * 1.8);
    gl_FragColor = vec4(col, lines * fade * uOpacity * (0.55 + pulse * 0.9));
    #include <colorspace_fragment>
  }
`;

export function gridMaterial() {
  return new THREE.ShaderMaterial({
    vertexShader: gridVertex,
    fragmentShader: gridFragment,
    uniforms: {
      uColor: { value: color(COLORS.cyan) },
      uAmber: { value: color(COLORS.amber) },
      uCam: { value: new THREE.Vector3() },
      uTime: { value: 0 },
      uOpacity: { value: 0.55 },
    },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
}

/* ── Radar sweep disc behind the reactor ── */

const sweepFragment = /* glsl */ `
  uniform vec3 uColor;
  uniform float uTime;
  uniform float uOpacity;
  varying vec2 vUv2;
  void main() {
    vec2 p = vUv2;
    float r = length(p);
    float ang = atan(p.y, p.x) / 6.2831853 + 0.5;
    float sweep = fract(ang - uTime * 0.12);
    float wedge = pow(smoothstep(0.8, 1.0, sweep), 4.0);
    float f = fract(r * 4.0);
    float rings = 1.0 - smoothstep(0.0, 0.012, min(f, 1.0 - f));
    float edge = smoothstep(1.0, 0.92, r) * smoothstep(0.12, 0.2, r);
    gl_FragColor = vec4(uColor, (wedge * 0.18 + rings * 0.22) * edge * uOpacity);
    #include <colorspace_fragment>
  }
`;

const sweepVertex = /* glsl */ `
  uniform float uRadius;
  varying vec2 vUv2;
  void main() {
    vUv2 = position.xy / uRadius;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export function sweepMaterial(radius: number) {
  return new THREE.ShaderMaterial({
    vertexShader: sweepVertex,
    fragmentShader: sweepFragment,
    uniforms: {
      uColor: { value: color(COLORS.cyan) },
      uTime: { value: 0 },
      uOpacity: { value: 0.55 },
      uRadius: { value: radius },
    },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
  });
}

/* ── Vertical beam for the contact beacon ── */

const beamFragment = /* glsl */ `
  uniform vec3 uColor;
  uniform float uTime;
  uniform float uOpacity;
  uniform float uBoost;
  varying vec2 vUv;
  varying float vDist;
  void main() {
    float up = pow(1.0 - vUv.y, 1.6);
    float flow = 0.7 + 0.3 * sin(vUv.y * 60.0 - uTime * 9.0);
    float near = smoothstep(26.0, 13.0, vDist); // only visible once the camera nears the beacon
    gl_FragColor = vec4(uColor * (1.0 + uBoost * 2.0), up * flow * near * uOpacity * (0.6 + uBoost));
    #include <colorspace_fragment>
  }
`;

const uvVertex = /* glsl */ `
  varying vec2 vUv;
  varying float vDist;
  void main() {
    vUv = uv;
    vec4 w = modelMatrix * vec4(position, 1.0);
    vDist = distance(w.xyz, cameraPosition);
    gl_Position = projectionMatrix * viewMatrix * w;
  }
`;

export function beamMaterial(hex: string = COLORS.cyanHi, opacity = 0.9) {
  return new THREE.ShaderMaterial({
    vertexShader: uvVertex,
    fragmentShader: beamFragment,
    uniforms: {
      uColor: { value: color(hex).multiplyScalar(1.4) },
      uTime: { value: 0 },
      uOpacity: { value: opacity },
      uBoost: { value: 0 },
    },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
  });
}

/** Plain additive line/mesh colour that can exceed 1.0 for bloom. */
export function brightBasic(hex: string, boost = 1.5, opacity = 1) {
  return new THREE.MeshBasicMaterial({
    color: color(hex).multiplyScalar(boost),
    transparent: true,
    opacity,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    toneMapped: false,
  });
}

export function brightLine(hex: string, boost = 1.2, opacity = 1) {
  return new THREE.LineBasicMaterial({
    color: color(hex).multiplyScalar(boost),
    transparent: true,
    opacity,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    toneMapped: false,
    fog: true,
  });
}
