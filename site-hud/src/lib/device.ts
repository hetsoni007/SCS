/**
 * Simple device tiering. Runs once on the client, before the WebGL bundle is
 * requested, so low-end devices never download three.js at all.
 *
 *   0 = no WebGL scene. Phones, tablets, touch-first devices, software renderers,
 *       Save-Data. They get the 2D/CSS version of the HUD.
 *   1 = lite 3D. Fewer particles, capped DPR, no postprocessing.
 *   2 = full 3D. Bloom, chromatic aberration, glitch, scanlines.
 *
 * Testing overrides: `?tier=0|1|2` and `?motion=reduce`.
 */

export type Tier = 0 | 1 | 2;

export interface DeviceProfile {
  tier: Tier;
  reason: string;
}

type NavigatorExtras = Navigator & {
  deviceMemory?: number;
  connection?: { saveData?: boolean };
};

export function detectTier(): DeviceProfile {
  const forced = new URLSearchParams(window.location.search).get('tier');
  if (forced === '0' || forced === '1' || forced === '2') {
    return { tier: Number(forced) as Tier, reason: 'url override' };
  }

  const nav = navigator as NavigatorExtras;
  const narrow = window.matchMedia('(max-width: 900px)').matches;
  const touchOnly = window.matchMedia('(pointer: coarse)').matches && !window.matchMedia('(pointer: fine)').matches;
  if (narrow || touchOnly) return { tier: 0, reason: 'mobile / touch' };
  if (nav.connection?.saveData) return { tier: 0, reason: 'save-data' };

  let renderer = '';
  try {
    const canvas = document.createElement('canvas');
    const gl = (canvas.getContext('webgl2') || canvas.getContext('webgl')) as WebGLRenderingContext | null;
    if (!gl) return { tier: 0, reason: 'no webgl' };
    const info = gl.getExtension('WEBGL_debug_renderer_info');
    renderer = info ? String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL)) : '';
    gl.getExtension('WEBGL_lose_context')?.loseContext();
  } catch {
    return { tier: 0, reason: 'no webgl' };
  }

  // CPU rasterisers would render the scene at a few fps. Show the CSS version instead.
  if (/swiftshader|llvmpipe|softpipe|software|basic render/i.test(renderer)) {
    return { tier: 0, reason: `software renderer (${renderer})` };
  }

  const cores = nav.hardwareConcurrency || 4;
  const memory = nav.deviceMemory ?? 8;
  // Older integrated GPUs. Iris Xe / Arc and Apple silicon are fine at tier 2.
  const weakGpu = /intel(?!.*(iris xe|arc))|mali|adreno \(tm\) [1-5]\d\d|powervr/i.test(renderer);
  if (cores <= 4 || memory <= 4 || weakGpu) {
    return { tier: 1, reason: `lite (${cores} cores, ${memory} GB, ${renderer || 'unknown gpu'})` };
  }
  return { tier: 2, reason: `full (${renderer || 'unknown gpu'})` };
}

export function prefersReducedMotion(): boolean {
  if (new URLSearchParams(window.location.search).get('motion') === 'reduce') return true;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
