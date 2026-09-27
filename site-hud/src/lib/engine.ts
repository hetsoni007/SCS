/**
 * On-demand motion engine. GSAP, ScrollTrigger and Lenis are only needed on
 * desktop (smooth wheel scrolling, the pinned process timeline, the camera
 * flight), so phones and tablets never download or evaluate them. That keeps
 * mobile main-thread work, and with it LCP and TBT, down.
 */
import type { gsap as GSAP } from 'gsap';
import type { ScrollTrigger as ST } from 'gsap/ScrollTrigger';

export type Engine = { gsap: typeof GSAP; ScrollTrigger: typeof ST };

let engine: Promise<Engine> | null = null;

export function loadEngine(): Promise<Engine> {
  engine ??= Promise.all([import('gsap'), import('gsap/ScrollTrigger')]).then(([g, s]) => {
    g.gsap.registerPlugin(s.ScrollTrigger);
    return { gsap: g.gsap, ScrollTrigger: s.ScrollTrigger };
  });
  return engine;
}

/** Desktop with a real mouse/trackpad: the only place the engine runs. */
export const DESKTOP_QUERY = '(hover: hover) and (pointer: fine) and (min-width: 1024px)';
