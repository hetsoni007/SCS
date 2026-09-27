'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useHUD } from './HUDProvider';

// three.js, R3F, drei and postprocessing live in this chunk. It is never part of
// the initial bundle and never requested at tier 0.
const Scene = dynamic(() => import('./three/Scene'), { ssr: false, loading: () => null });

/**
 * Fixed full-viewport layer behind the page. Requests the WebGL scene once the
 * browser is idle (while the boot sequence plays), then cross-fades it in over
 * the CSS backdrop once it has drawn its first frames.
 */
export function SceneMount() {
  const { tier, reduced, sceneReady, setSceneReady } = useHUD();
  const [load, setLoad] = useState(false);

  useEffect(() => {
    if (!tier) return;
    let cancelled = false;
    const go = () => {
      if (!cancelled) setLoad(true);
    };
    const w = window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number; cancelIdleCallback?: (id: number) => void };
    if (w.requestIdleCallback) {
      const id = w.requestIdleCallback(go, { timeout: 1600 });
      return () => {
        cancelled = true;
        w.cancelIdleCallback?.(id);
      };
    }
    const id = window.setTimeout(go, 500);
    return () => {
      cancelled = true;
      window.clearTimeout(id);
    };
  }, [tier]);

  // reduced motion holds the camera on the hero pose; dim that still frame once the
  // hero scrolls away so it doesn't sit bright behind the later sections
  const [dim, setDim] = useState(false);
  useEffect(() => {
    if (!reduced) return;
    const on = () => setDim(window.scrollY > window.innerHeight * 0.6);
    on();
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, [reduced]);

  return (
    <div className={`scene-layer${sceneReady ? ' is-ready' : ''}${reduced && dim ? ' is-dim' : ''}`} aria-hidden="true">
      {load && tier ? <Scene tier={tier} reduced={reduced} onReady={() => setSceneReady(true)} /> : null}
    </div>
  );
}
