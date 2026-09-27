'use client';

import { useEffect, useRef } from 'react';
import { SECTIONS } from '@/data/site';
import { live } from '@/lib/live';
import { useActiveSection } from '@/lib/useActiveSection';

/**
 * Right-edge altitude ladder (desktop). Ticks per section, a marker that rides
 * live.track, and a readout of the current sector. Clicking a tick jumps there.
 */
export function ScrollLadder() {
  const marker = useRef<HTMLSpanElement>(null);
  const readout = useRef<HTMLSpanElement>(null);
  const active = useActiveSection();
  const n = SECTIONS.length - 1;

  useEffect(() => {
    // matches the CSS breakpoint where the ladder is shown
    if (!window.matchMedia('(min-width: 1180px) and (min-height: 640px)').matches) return;
    let last = -1;
    let raf = 0;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      const t = live.track;
      if (Math.abs(t - last) < 0.001) return;
      last = t;
      if (marker.current) marker.current.style.transform = `translateY(${(t / n) * 100}%)`;
      if (readout.current) readout.current.textContent = t.toFixed(2).padStart(5, '0');
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [n]);

  const current = SECTIONS.find((s) => s.id === active) ?? SECTIONS[0];

  return (
    <aside className="ladder" aria-label="Page sections">
      <div className="ladder__head" aria-hidden="true">
        <span>SECTOR</span>
        <b>{current.code}</b>
      </div>
      <div className="ladder__track">
        <span className="ladder__rail" aria-hidden="true">
          <span ref={marker} className="ladder__marker" />
        </span>
        {SECTIONS.map((s, i) => (
          <a
            key={s.id}
            href={`#${s.id}`}
            className={`ladder__tick${active === s.id ? ' is-active' : ''}`}
            style={{ top: `${(i / n) * 100}%` }}
            aria-current={active === s.id ? 'true' : undefined}
          >
            <span className="ladder__label">{s.label}</span>
          </a>
        ))}
      </div>
      <div className="ladder__foot" aria-hidden="true">
        TRK <span ref={readout}>00.00</span>
      </div>
    </aside>
  );
}
