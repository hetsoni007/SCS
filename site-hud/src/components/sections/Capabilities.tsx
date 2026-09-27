'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { CAPABILITIES, type Capability } from '@/data/capabilities';
import { live } from '@/lib/live';
import { useMedia } from '@/lib/useMedia';
import { useHUD } from '../HUDProvider';
import { SectionHeader } from '../hud/SectionHeader';

const N = CAPABILITIES.length;
const SPEED = (Math.PI * 2) / 70; // one full orbit every 70s

function Module({
  cap,
  open,
  onEnter,
  onLeave,
  onToggle,
  setRef,
  orbit,
}: {
  cap: Capability;
  open: boolean;
  onEnter: () => void;
  onLeave: () => void;
  onToggle: () => void;
  setRef?: (el: HTMLDivElement | null) => void;
  orbit: boolean;
}) {
  const panelId = `mod-${cap.id}`;
  return (
    <div
      ref={setRef}
      className={`module${open ? ' is-open' : ''}${orbit ? ' module--orbit' : ''}`}
      onPointerEnter={orbit ? onEnter : undefined}
      onPointerLeave={orbit ? onLeave : undefined}
    >
      <span className="module__corners" aria-hidden="true" />
      <button
        type="button"
        className="module__head"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={onToggle}
        onFocus={orbit ? onEnter : undefined}
        onBlur={orbit ? onLeave : undefined}
      >
        <span className="module__code">{cap.code}</span>
        <span className="module__name">{cap.name}</span>
        <span className="module__status" aria-hidden="true">
          <i /> {open ? 'Readout' : 'Online'}
        </span>
      </button>
      <div id={panelId} className="module__readout" role="region" aria-label={`${cap.name} readout`}>
        <div className="module__readout-inner">
          <p className="module__summary">{cap.summary}</p>
          <dl className="module__data">
            {cap.readout.map((r) => (
              <div key={r.k}>
                <dt>{r.k}</dt>
                <dd>{r.v}</dd>
              </div>
            ))}
          </dl>
          {cap.link && (
            <a className="laser module__link" href={cap.link.href}>
              {cap.link.label} <span aria-hidden="true">→</span>
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * 01 — Capabilities. On desktop the five modules orbit the 3D data core. Hover,
 * focus or click a module to pause the orbit and expand its readout (click pins it
 * open). On phones, tablets and under reduced motion they are a static grid of
 * the same expandable modules.
 */
export function Capabilities() {
  const { reduced } = useHUD();
  const wide = useMedia('(min-width: 1024px) and (min-height: 620px)');
  const orbit = wide && !reduced;

  const [hovered, setHovered] = useState(-1);
  const [pinned, setPinned] = useState(-1);
  const [gridOpen, setGridOpen] = useState(0);
  const stage = useRef<HTMLDivElement>(null);
  const els = useRef<(HTMLDivElement | null)[]>([]);
  const active = orbit ? (pinned >= 0 ? pinned : hovered) : gridOpen;
  const activeRef = useRef(active);
  activeRef.current = active;

  useEffect(() => {
    live.activeModule = orbit ? active : -1;
  }, [active, orbit]);

  // the orbit: transforms written straight to the DOM from a rAF loop
  useEffect(() => {
    if (!orbit || !stage.current) return;
    const el = stage.current;
    const modules = els.current;
    let rx = 0;
    let ry = 0;
    const measure = () => {
      rx = el.clientWidth * 0.33;
      ry = el.clientHeight * 0.26;
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);

    let visible = true;
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting), { rootMargin: '10% 0px' });
    io.observe(el);

    let angle = live.orbitAngle || -Math.PI / 2;
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const deltaMs = Math.min(100, now - last);
      last = now;
      if (!visible) return;
      if (activeRef.current < 0) angle += (deltaMs / 1000) * SPEED;
      live.orbitAngle = angle;
      for (let i = 0; i < N; i++) {
        const m = modules[i];
        if (!m) continue;
        const a = angle + (i / N) * Math.PI * 2;
        const depth = (Math.sin(a) + 1) / 2; // 0 = back, 1 = front
        const isActive = i === activeRef.current;
        const s = isActive ? 1 : 0.8 + depth * 0.2;
        m.style.transform = `translate3d(${Math.cos(a) * rx}px, ${Math.sin(a) * ry}px, 0) translate(-50%, -50%) scale(${s})`;
        m.style.opacity = String(isActive ? 1 : 0.5 + depth * 0.5);
        m.style.zIndex = String(isActive ? 200 : Math.round(depth * 100));
      }
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      modules.forEach((m) => {
        if (!m) return;
        m.style.transform = '';
        m.style.opacity = '';
        m.style.zIndex = '';
      });
    };
  }, [orbit]);

  const enter = useCallback((i: number) => setHovered(i), []);
  const leave = useCallback(() => setHovered(-1), []);

  return (
    <section id="capabilities" data-hud-section className="caps" aria-labelledby="caps-title">
      <div className="caps__head">
        <SectionHeader
          code="01"
          eyebrow="Capabilities"
          id="caps-title"
          title={
            <>
              Five systems.
              <br />
              One senior team.
            </>
          }
          lead={orbit ? undefined : 'Tap a module to read it out.'}
        />
      </div>

      {orbit ? (
        <div ref={stage} className="orbit">
          <span className="orbit__ellipse" aria-hidden="true" />
          <p className="orbit__hint">Hover a module to read it out · click to pin it open</p>
          {CAPABILITIES.map((cap, i) => (
            <Module
              key={cap.id}
              cap={cap}
              orbit
              open={active === i}
              setRef={(el) => {
                els.current[i] = el;
              }}
              onEnter={() => enter(i)}
              onLeave={leave}
              onToggle={() => setPinned((p) => (p === i ? -1 : i))}
            />
          ))}
        </div>
      ) : (
        <div className="caps__grid">
          {CAPABILITIES.map((cap, i) => (
            <Module
              key={cap.id}
              cap={cap}
              orbit={false}
              open={gridOpen === i}
              onEnter={() => {}}
              onLeave={() => {}}
              onToggle={() => setGridOpen((o) => (o === i ? -1 : i))}
            />
          ))}
        </div>
      )}
    </section>
  );
}
