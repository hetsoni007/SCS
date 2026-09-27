'use client';

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { LazyMotion, MotionConfig } from 'framer-motion';
import { detectTier, prefersReducedMotion, type Tier } from '@/lib/device';

interface HUDState {
  /** null until detected on the client (SSR renders the tier-0 markup) */
  tier: Tier | null;
  tierReason: string;
  reduced: boolean;
  booted: boolean;
  setBooted: (v: boolean) => void;
  sceneReady: boolean;
  setSceneReady: (v: boolean) => void;
}

const HUDContext = createContext<HUDState | null>(null);

// Framer's animation features arrive in their own chunk, after first paint
const loadMotionFeatures = () => import('@/lib/motion-features').then((m) => m.default);

export function useHUD() {
  const ctx = useContext(HUDContext);
  if (!ctx) throw new Error('useHUD must be used inside <HUDProvider>');
  return ctx;
}

export function HUDProvider({ children }: { children: ReactNode }) {
  const [tier, setTier] = useState<Tier | null>(null);
  const [tierReason, setTierReason] = useState('');
  const [reduced, setReduced] = useState(false);
  const [booted, setBooted] = useState(false);
  const [sceneReady, setSceneReady] = useState(false);

  useEffect(() => {
    const html = document.documentElement;
    const profile = detectTier();
    setTier(profile.tier);
    setTierReason(profile.reason);
    html.dataset.tier = String(profile.tier);

    const apply = () => {
      const r = prefersReducedMotion();
      setReduced(r);
      if (r) html.dataset.motion = 'reduce';
      else delete html.dataset.motion;
    };
    apply();
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('scene-ready', sceneReady);
  }, [sceneReady]);

  const value = useMemo(
    () => ({ tier, tierReason, reduced, booted, setBooted, sceneReady, setSceneReady }),
    [tier, tierReason, reduced, booted, sceneReady],
  );

  return (
    <HUDContext.Provider value={value}>
      <LazyMotion features={loadMotionFeatures} strict>
        <MotionConfig reducedMotion={reduced ? 'always' : 'never'}>{children}</MotionConfig>
      </LazyMotion>
    </HUDContext.Provider>
  );
}
