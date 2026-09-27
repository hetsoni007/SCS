/**
 * Animation configs shared by the DOM (Framer Motion, GSAP) and the scene.
 */
import type { Tier } from './device';

/** Brand palette — the only accents allowed are cyan and amber. */
export const COLORS = {
  void: '#05070d',
  cyan: '#00d9ff',
  cyanHi: '#3ef2ff',
  amber: '#ffb020',
  core: '#c8fbff',
} as const;

export const EASE = {
  /** snappy-out used for HUD panels "locking" into place */
  hud: [0.16, 1, 0.3, 1] as [number, number, number, number],
  /** linear-ish draw for strokes */
  draw: [0.65, 0, 0.35, 1] as [number, number, number, number],
};

/**
 * The HUD boot-up choreography for every panel:
 * corner brackets → frame stroke draws → scan sweep → content.
 */
export const HUD_TIMING = {
  brackets: { delay: 0, duration: 0.35 },
  stroke: { delay: 0.18, duration: 0.9 },
  scan: { delay: 0.45, duration: 0.8 },
  content: { delay: 0.55, duration: 0.6, stagger: 0.07 },
};

/** Boot sequence script. Typed character by character over a scan animation. */
export const BOOT = {
  lines: ['INITIALIZING SYSTEM...', 'CALIBRATING...', 'WELCOME'],
  log: ['core.reactor', 'hud.render', 'uplink'],
  charMs: 26,
  linePauseMs: 170,
  holdMs: 380,
  exitMs: 620,
  /** key in sessionStorage — the boot plays once per browser session */
  storageKey: 'scs-hud-booted',
};

/** Per-tier WebGL budgets. Tier 0 never loads the scene. */
export const QUALITY: Record<Exclude<Tier, 0>, {
  dpr: [number, number];
  dust: number;
  shell: number;
  effects: boolean;
  multisampling: number;
}> = {
  1: { dpr: [1, 1.25], dust: 650, shell: 900, effects: false, multisampling: 0 },
  2: { dpr: [1, 1.5], dust: 1700, shell: 2400, effects: true, multisampling: 4 },
};

/**
 * Camera flight. One keyframe per scroll `track` value (see lib/live.ts).
 * Extra keyframes inside the process range make the camera strafe sideways
 * while the horizontal timeline is pinned.
 */
export interface CamKey {
  t: number;
  pos: [number, number, number];
  target: [number, number, number];
}

// Hero: the reactor sits at the origin and projects to ~38% from the top of the
// viewport (camera and target both lowered by 0.85).
// The in-between keys (0.5, 1.3) swing the camera past the reactor and the data
// core instead of flying through them.
export const CAMERA_PATH: CamKey[] = [
  { t: 0, pos: [0, -0.85, 8.5], target: [0, -0.85, 0] },
  { t: 0.5, pos: [3.6, 0.8, -1.2], target: [0.6, 0.2, -12] }, // swing past the reactor
  { t: 1, pos: [0, 1.4, -17.5], target: [0, 0.5, -26] }, // data core, projected ~57% down to sit inside the DOM orbit
  { t: 1.3, pos: [-4.6, 1.2, -25], target: [-5.5, -0.4, -40] }, // pass the core on its left
  { t: 1.62, pos: [-6.5, -0.6, -37], target: [-6.5, -1.6, -47] }, // process: strafe start
  { t: 2.38, pos: [6.5, -0.6, -43], target: [6.5, -1.6, -53] }, // process: strafe end
  { t: 3, pos: [0, 1.6, -58], target: [0, 0.4, -68] }, // proof
  { t: 4, pos: [0, 0, -70.5], target: [0, 0, -80] }, // why-us dial
  { t: 5, pos: [-3.2, 1.2, -89], target: [0, -0.6, -100] }, // contact beacon
];

export const SCENE_ANCHORS = {
  dataCore: [0, 0, -26] as [number, number, number],
  dial: [0, 0, -80] as [number, number, number],
  beacon: [0, -2.2, -100] as [number, number, number],
};
