'use client';

import { useEffect, useRef } from 'react';
import { animate, m, useInView } from 'framer-motion';
import { GAUGES, GUARANTEES, PILLARS, type Gauge as GaugeData } from '@/data/stats';
import { EASE } from '@/lib/animation';
import { useHUD } from '../HUDProvider';
import { HUDFrame } from '../hud/HUDFrame';
import { SectionHeader } from '../hud/SectionHeader';

const START = 135; // degrees, gauge arc opens at the bottom
const SWEEP = 270;
const R = 78;

function polar(deg: number, r: number) {
  const a = (deg * Math.PI) / 180;
  return [100 + Math.cos(a) * r, 100 + Math.sin(a) * r];
}

function arc(r: number, from: number, to: number) {
  const [x0, y0] = polar(from, r);
  const [x1, y1] = polar(to, r);
  const large = to - from > 180 ? 1 : 0;
  return `M ${x0.toFixed(2)} ${y0.toFixed(2)} A ${r} ${r} 0 ${large} 1 ${x1.toFixed(2)} ${y1.toFixed(2)}`;
}

// 55 ticks across the sweep, every 9th long
const TICKS = Array.from({ length: 55 }, (_, i) => {
  const deg = START + (i / 54) * SWEEP;
  const long = i % 9 === 0;
  const [x0, y0] = polar(deg, 90);
  const [x1, y1] = polar(deg, long ? 81 : 85);
  return `M${x0.toFixed(1)} ${y0.toFixed(1)}L${x1.toFixed(1)} ${y1.toFixed(1)}`;
}).join('');

function Gauge({ g, index }: { g: GaugeData; index: number }) {
  const { reduced } = useHUD();
  const ref = useRef<HTMLDivElement>(null);
  const num = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.5 });
  const on = inView || reduced;
  const end = START + SWEEP * g.sweep;
  const [nx, ny] = polar(end, R);

  // server HTML carries the final value (no-JS, crawlers); zero it on the client until it counts up
  useEffect(() => {
    if (num.current && !document.documentElement.dataset.motion) num.current.textContent = '0';
  }, []);

  useEffect(() => {
    if (!on || !num.current) return;
    if (reduced) {
      num.current.textContent = String(g.value);
      return;
    }
    const controls = animate(0, g.value, {
      duration: 1.4,
      delay: 0.3 + index * 0.12,
      ease: EASE.hud,
      onUpdate: (v) => {
        if (num.current) num.current.textContent = String(Math.round(v));
      },
    });
    return () => controls.stop();
  }, [on, reduced, g.value, index]);

  return (
    <div ref={ref} className="gauge">
      <svg viewBox="0 0 200 200" className="gauge__dial" aria-hidden="true">
        <path d={TICKS} className="gauge__ticks" />
        <path d={arc(R, START, START + SWEEP)} className="gauge__track" />
        <m.path
          d={arc(R, START, end)}
          className="gauge__value"
          initial={reduced ? false : { pathLength: 0 }}
          animate={on ? { pathLength: 1 } : undefined}
          transition={{ duration: 1.4, delay: 0.3 + index * 0.12, ease: EASE.hud }}
        />
        <m.circle
          cx={nx}
          cy={ny}
          r="4.5"
          className="gauge__tip"
          initial={reduced ? false : { opacity: 0 }}
          animate={on ? { opacity: 1 } : undefined}
          transition={{ delay: 1.5 + index * 0.12 }}
        />
        <circle cx="100" cy="100" r="58" className="gauge__inner" />
      </svg>
      <div className="gauge__read">
        <p className="gauge__num">
          <span className="sr-only">{`${g.from !== undefined ? `${g.from} to ` : ''}${g.value}${g.suffix ?? ''}`}</span>
          <span aria-hidden="true">
            {g.from !== undefined && <span className="gauge__from">{g.from}–</span>}
            <span ref={num} className="gauge__count" style={{ minWidth: `${String(g.value).length}ch` }}>
              {g.value}
            </span>
            {g.suffix && <span className="gauge__suffix">{g.suffix}</span>}
          </span>
        </p>
        <p className="gauge__label">{g.label}</p>
      </div>
      <p className="gauge__sub">{g.sub}</p>
    </div>
  );
}

/**
 * 04 — Why us. Stat counters inside instrument dials, then the three reasons
 * founders pick the studio and the standing guarantees. All figures are
 * published on the live site (see src/data/stats.ts).
 */
export function WhyUs() {
  return (
    <section id="why" data-hud-section className="why" aria-labelledby="why-title">
      <SectionHeader
        code="04"
        eyebrow="Why us"
        id="why-title"
        align="center"
        title={
          <>
            Less risk. Faster ship.
            <br />
            Senior hands only.
          </>
        }
      />
      <div className="why__gauges">
        {GAUGES.map((g, i) => (
          <Gauge key={g.id} g={g} index={i} />
        ))}
      </div>
      <div className="why__pillars">
        {PILLARS.map((p, i) => (
          <HUDFrame key={p.k} className="pillar" delay={i * 0.12} label={`R-0${i + 1}`}>
            <h3 className="pillar__k">{p.k}</h3>
            <p className="pillar__v">{p.v}</p>
          </HUDFrame>
        ))}
      </div>
      <ul className="why__guarantees" aria-label="Guarantees">
        {GUARANTEES.map((g) => (
          <li key={g}>{g}</li>
        ))}
      </ul>
    </section>
  );
}
