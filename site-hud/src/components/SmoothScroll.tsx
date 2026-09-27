'use client';

import { useEffect } from 'react';
import { live } from '@/lib/live';
import { DESKTOP_QUERY, loadEngine } from '@/lib/engine';
import { getLenis, measureSections, scrollToId, setLenis, updateTrack } from '@/lib/scroll';
import { useHUD } from './HUDProvider';

/**
 * The motion engine for the DOM:
 *  • in-page anchor links (smooth via Lenis on desktop, native elsewhere)
 *  • scroll lock while the boot sequence runs
 *  • desktop only, loaded on demand: Lenis smooth scroll driven by GSAP's ticker
 *    and feeding ScrollTrigger, section tracking → live.track / live.velocity
 *    (camera path) and pointer tracking → live.px / live.py (parallax).
 *    Lenis is skipped under reduced motion.
 */
export function SmoothScroll() {
  const { reduced, booted } = useHUD();

  // anchors work everywhere, engine or not
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const a = (e.target as Element | null)?.closest?.('a[href^="#"]') as HTMLAnchorElement | null;
      if (!a) return;
      const id = a.getAttribute('href')!.slice(1);
      if (!id || !document.getElementById(id)) return;
      e.preventDefault();
      scrollToId(id, reduced);
      history.replaceState(null, '', `#${id}`);
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, [reduced]);

  useEffect(() => {
    if (!window.matchMedia(DESKTOP_QUERY).matches) return;
    let cancelled = false;
    let cleanup = () => {};

    const onPointer = (e: PointerEvent) => {
      live.px = (e.clientX / window.innerWidth) * 2 - 1;
      live.py = -((e.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener('pointermove', onPointer, { passive: true });

    Promise.all([loadEngine(), reduced ? null : import('lenis')]).then(([{ gsap, ScrollTrigger }, lenisMod]) => {
      if (cancelled) return;
      const lenis = lenisMod ? new lenisMod.default({ lerp: 0.09, smoothWheel: true, wheelMultiplier: 1 }) : null;
      if (lenis) {
        lenis.on('scroll', ScrollTrigger.update);
        setLenis(lenis);
        if (document.documentElement.classList.contains('is-locked')) lenis.stop();
      }
      const tick = (time: number) => {
        lenis?.raf(time * 1000);
        updateTrack(window.scrollY, window.innerHeight);
        const v = lenis ? lenis.velocity : 0;
        live.velocity += (v - live.velocity) * 0.18;
      };
      gsap.ticker.add(tick);
      gsap.ticker.lagSmoothing(0);
      const onRefresh = () => measureSections();
      ScrollTrigger.addEventListener('refresh', onRefresh);
      measureSections();
      document.fonts?.ready.then(() => !cancelled && ScrollTrigger.refresh());
      cleanup = () => {
        gsap.ticker.remove(tick);
        ScrollTrigger.removeEventListener('refresh', onRefresh);
        lenis?.destroy();
        setLenis(null);
      };
    });

    return () => {
      cancelled = true;
      window.removeEventListener('pointermove', onPointer);
      cleanup();
    };
  }, [reduced]);

  // lock scrolling during the boot sequence
  useEffect(() => {
    const html = document.documentElement;
    if (!booted) {
      html.classList.add('is-locked');
      getLenis()?.stop();
      return;
    }
    html.classList.remove('is-locked');
    getLenis()?.start();
    if (window.matchMedia(DESKTOP_QUERY).matches) {
      loadEngine().then(({ ScrollTrigger }) => requestAnimationFrame(() => ScrollTrigger.refresh()));
    }
  }, [booted]);

  return null;
}
