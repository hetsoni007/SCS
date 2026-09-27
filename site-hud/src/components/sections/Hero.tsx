'use client';

import { useEffect, useState } from 'react';
import { m } from 'framer-motion';
import { SITE } from '@/data/site';
import { EASE } from '@/lib/animation';
import { useHUD } from '../HUDProvider';
import { CssReactor } from '../Backdrop';
import { GlitchText } from '../hud/GlitchText';
import { HoloButton } from '../hud/HoloButton';
import { ScrambleText } from '../hud/ScrambleText';

function Uptime({ running }: { running: boolean }) {
  const [s, setS] = useState(0);
  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => setS((v) => v + 1), 1000);
    return () => window.clearInterval(id);
  }, [running]);
  const hh = String(Math.floor(s / 3600)).padStart(2, '0');
  const mm = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
  const ss = String(s % 60).padStart(2, '0');
  return (
    <span suppressHydrationWarning>
      {hh}:{mm}:{ss}
    </span>
  );
}

const RENDER_LABEL = ['CSS · LITE', 'WEBGL · LITE', 'WEBGL · FULL'];

/**
 * 00 — Core. The reactor (3D, or the CSS reactor at tier 0) sits behind the
 * upper half; the studio name glitches in when the boot sequence completes.
 * The h1 is painted at full opacity from the first frame (it is the LCP element).
 */
export function Hero() {
  const { booted, reduced, tier } = useHUD();
  const fade = (delay: number) => ({
    initial: reduced ? false : ({ opacity: 0, y: 14 } as const),
    animate: booted ? { opacity: 1, y: 0 } : undefined,
    transition: { duration: 0.7, delay, ease: EASE.hud },
  });

  return (
    <section id="top" data-hud-section className="hero" aria-labelledby="hero-title">
      <div className="hero__stage">
        <CssReactor />
      </div>

      <m.dl className="telemetry telemetry--l reveal" {...fade(0.55)}>
        <div>
          <dt>SYS</dt>
          <dd>
            <i className="dot" /> Online
          </dd>
        </div>
        <div>
          <dt>Coverage</dt>
          <dd>{SITE.coverage.join(' · ')}</dd>
        </div>
        <div>
          <dt>Proposal</dt>
          <dd>≤ 48h, fixed price</dd>
        </div>
        <div>
          <dt>Team</dt>
          <dd>Senior engineers only</dd>
        </div>
      </m.dl>

      <m.dl className="telemetry telemetry--r reveal" {...fade(0.65)} aria-hidden="true">
        <div>
          <dt>Render</dt>
          <dd>{tier === null ? '—' : RENDER_LABEL[tier]}</dd>
        </div>
        <div>
          <dt>Motion</dt>
          <dd>{reduced ? 'Reduced' : 'Full'}</dd>
        </div>
        <div>
          <dt>Uptime</dt>
          <dd>
            <Uptime running={booted} />
          </dd>
        </div>
      </m.dl>

      <div className="hero__copy">
        <p className="eyebrow eyebrow--center">
          <ScrambleText text="React Native · MERN · Next.js · Flutter · AI" start={booted} duration={900} />
        </p>
        <h1 id="hero-title" className="hero__title">
          <GlitchText text={SITE.name} active={booted} />
        </h1>
        <m.p className="hero__tagline reveal" {...fade(0.3)}>
          {SITE.tagline}
        </m.p>
        <m.p className="hero__sub reveal" {...fade(0.4)}>
          React Native, MERN, Next.js and Flutter app builds with AI integrated — for founders and CTOs who want working
          software every week.
        </m.p>
        <m.div className="hero__ctas reveal" {...fade(0.5)}>
          <HoloButton href="#contact">Initiate project</HoloButton>
          <HoloButton href={SITE.calendly} external variant="ghost">
            Book a free call
          </HoloButton>
        </m.div>
      </div>

      <m.a href="#capabilities" className="hero__cue reveal" {...fade(0.9)}>
        <span>Scroll to engage</span>
        <i aria-hidden="true" />
      </m.a>
    </section>
  );
}
