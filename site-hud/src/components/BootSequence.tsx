'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { BOOT } from '@/lib/animation';
import { ping } from '@/lib/live';
import { useHUD } from './HUDProvider';

type Phase = 'run' | 'exit' | 'done';

/** Builds the typing timeline: when each line starts, how long it types. */
function schedule(charMs: number) {
  let t = 120;
  return BOOT.lines.map((line, i) => {
    const speed = i === BOOT.lines.length - 1 ? charMs * 2.2 : charMs; // WELCOME types slower
    const start = t;
    const dur = line.length * speed;
    t += dur + BOOT.linePauseMs;
    return { start, dur, len: line.length };
  });
}

/**
 * First-load boot: "INITIALIZING SYSTEM… CALIBRATING… WELCOME" typed over a
 * scan animation, then a CRT power-off that reveals the hero. It is server-rendered
 * so the hero never flashes first. It plays once per session (an inline script
 * adds html.booted to skip it), can be skipped with any key or click, and is cut
 * to a short fade under reduced motion. A CSS failsafe hides it after 7s even if
 * JavaScript never runs.
 */
export function BootSequence() {
  const { setBooted } = useHUD();
  const [phase, setPhase] = useState<Phase>('run');
  const [typed, setTyped] = useState<number[]>(() => BOOT.lines.map(() => 0));
  const [pct, setPct] = useState(0);
  const exiting = useRef(false);

  const finish = useCallback(() => {
    if (exiting.current) return;
    exiting.current = true;
    setTyped(BOOT.lines.map((l) => l.length));
    setPct(100);
    try {
      sessionStorage.setItem(BOOT.storageKey, '1');
    } catch {
      /* private mode: boot again next time, harmless */
    }
    setPhase('exit');
    setBooted(true);
    ping(1);
    // read the attribute the inline head script set, so this callback never changes identity
    const reduced = document.documentElement.dataset.motion === 'reduce';
    window.setTimeout(() => setPhase('done'), reduced ? 250 : BOOT.exitMs);
  }, [setBooted]);

  useEffect(() => {
    if (document.documentElement.classList.contains('booted')) {
      exiting.current = true;
      setPhase('done');
      setBooted(true);
      return;
    }

    const html = document.documentElement;
    const isReduced = html.dataset.motion === 'reduce';
    if (isReduced) {
      setTyped(BOOT.lines.map((l) => l.length));
      setPct(100);
      const id = window.setTimeout(finish, 700);
      return () => window.clearTimeout(id);
    }

    const plan = schedule(BOOT.charMs);
    const last = plan[plan.length - 1];
    const typingEnd = last.start + last.dur;
    const t0 = performance.now();
    let raf = 0;
    let holdTimer = 0;
    const frame = (now: number) => {
      const e = now - t0;
      setTyped(plan.map((p) => Math.max(0, Math.min(p.len, Math.floor((e - p.start) / (p.dur / p.len))))));
      setPct(Math.min(100, Math.round((e / typingEnd) * 100)));
      if (e < typingEnd) raf = requestAnimationFrame(frame);
      else holdTimer = window.setTimeout(finish, BOOT.holdMs);
    };
    raf = requestAnimationFrame(frame);

    const skip = (e: KeyboardEvent | PointerEvent | WheelEvent) => {
      if (e instanceof KeyboardEvent && e.key === 'Tab') return; // let keyboard users reach the skip button
      finish();
    };
    window.addEventListener('keydown', skip);
    window.addEventListener('pointerdown', skip);
    window.addEventListener('wheel', skip, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(holdTimer);
      window.removeEventListener('keydown', skip);
      window.removeEventListener('pointerdown', skip);
      window.removeEventListener('wheel', skip);
    };
  }, [finish, setBooted]);

  if (phase === 'done') return null;

  const current = typed.findIndex((n, i) => n < BOOT.lines[i].length);
  const logDone = BOOT.log.map((_, i) => pct >= 30 + i * 28);

  return (
    <div className={`boot boot--${phase}`}>
      <div className="boot__grid" aria-hidden="true" />
      <div className="boot__scan" aria-hidden="true" />
      <svg className="boot__reticle" viewBox="0 0 200 200" aria-hidden="true">
        <circle cx="100" cy="100" r="92" className="boot__ring boot__ring--a" />
        <circle cx="100" cy="100" r="78" className="boot__ring boot__ring--b" />
        <circle cx="100" cy="100" r="64" className="boot__ring boot__ring--c" />
        <path d="M100 0v18M100 182v18M0 100h18M182 100h18" className="boot__cross" />
      </svg>
      <div className="boot__panel" role="status" aria-live="off">
        <div className="boot__head" aria-hidden="true">
          <span>SCS · HUD</span>
          <span>{String(pct).padStart(3, '0')}%</span>
        </div>
        {BOOT.lines.map((line, i) => (
          <p key={line} className={`boot__line${i === BOOT.lines.length - 1 ? ' boot__line--welcome' : ''}`}>
            <span className="boot__prompt" aria-hidden="true">
              &gt;
            </span>
            <span aria-hidden="true">{line.slice(0, typed[i])}</span>
            {i === current && <span className="boot__caret" aria-hidden="true" />}
          </p>
        ))}
        <span className="sr-only">Loading Soni Consultancy Services</span>
        <div className="boot__bar" aria-hidden="true">
          <i style={{ transform: `scaleX(${pct / 100})` }} />
        </div>
        <ul className="boot__log" aria-hidden="true">
          {BOOT.log.map((k, i) => (
            <li key={k} className={logDone[i] ? 'is-ok' : ''}>
              <span>{k}</span>
              <span className="boot__dots" />
              <span>{logDone[i] ? 'OK' : '··'}</span>
            </li>
          ))}
        </ul>
      </div>
      <button type="button" className="boot__skip" onClick={finish}>
        Skip intro <span aria-hidden="true">⏎</span>
      </button>
    </div>
  );
}
