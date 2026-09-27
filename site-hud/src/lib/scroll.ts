/**
 * Smooth-scroll handle + section tracking.
 *
 * Lenis drives the scroll (when motion is allowed), GSAP's ticker drives Lenis,
 * and ScrollTrigger listens to Lenis. `live.track` is computed from cached
 * section offsets so the per-frame work is arithmetic only, with no layout reads.
 */
import type Lenis from 'lenis';
import { live } from './live';

let lenis: Lenis | null = null;
let offsets: { top: number; height: number }[] = [];

export function setLenis(instance: Lenis | null) {
  lenis = instance;
}

export function getLenis() {
  return lenis;
}

/** Measure every [data-hud-section] once. Call on load, resize and ScrollTrigger refresh. */
export function measureSections() {
  const els = Array.from(document.querySelectorAll<HTMLElement>('[data-hud-section]'));
  const y = window.scrollY;
  offsets = els.map((el) => {
    const r = el.getBoundingClientRect();
    return { top: r.top + y, height: r.height };
  });
}

/**
 * track = i when section i's centre sits on the viewport centre; fractional between.
 */
export function updateTrack(scrollY: number, viewportH: number) {
  if (!offsets.length) return;
  const mid = scrollY + viewportH / 2;
  const n = offsets.length;
  let track = 0;
  for (let i = 0; i < n; i++) {
    const s = offsets[i];
    const centre = s.top + s.height / 2;
    if (mid < centre) {
      if (i === 0) {
        track = 0;
      } else {
        const p = offsets[i - 1];
        const prevCentre = p.top + p.height / 2;
        track = i - 1 + (mid - prevCentre) / Math.max(1, centre - prevCentre);
      }
      break;
    }
    track = i;
  }
  live.track = Math.min(n - 1, Math.max(0, track));
}

export function scrollToId(id: string, reduced: boolean) {
  const el = document.getElementById(id);
  if (!el) return;
  if (lenis && !reduced) {
    lenis.scrollTo(el, { offset: 0, duration: 1.4 });
  } else {
    el.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
  }
  // move focus for keyboard + screen reader users without a second jump
  el.setAttribute('tabindex', '-1');
  el.focus({ preventScroll: true });
}
