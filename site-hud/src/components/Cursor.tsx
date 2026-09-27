'use client';

import { useEffect, useRef } from 'react';
import { ping } from '@/lib/live';

const TARGETS = 'a, button, [role="button"], input, select, textarea, label, [data-lock]';
const IDLE = 34; // reticle box size when not locked, px
const FIRE = 22; // box size while the pointer is down
const PAD = 8; // lock-on padding around a target, px
const C = 10; // corner bracket size, px (matches CSS)

/**
 * Targeting-reticle cursor. A centre pip tracks the pointer exactly; the reticle
 * trails it (CSS transition, not a rAF loop, so it never freezes in a throttled
 * tab). Over an interactive element the brackets "lock on" and expand to frame
 * it. Only on fine pointers with hover; under reduced motion it snaps instead
 * of easing (CSS).
 */
export function Cursor() {
  const pip = useRef<HTMLDivElement>(null);
  const reticle = useRef<HTMLDivElement>(null);
  const parts = useRef<(HTMLElement | SVGSVGElement | null)[]>([]);

  useEffect(() => {
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    const html = document.documentElement;
    html.classList.add('has-reticle');
    let locked: Element | null = null;
    let firing = false;
    let x = -100;
    let y = -100;

    // corners tl, tr, br, bl, then ring and tag — all positioned by transform
    const place = () => {
      let x0: number;
      let y0: number;
      let w: number;
      let h: number;
      if (locked && locked.isConnected) {
        const b = locked.getBoundingClientRect();
        x0 = b.left - PAD;
        y0 = b.top - PAD;
        w = b.width + PAD * 2;
        h = b.height + PAD * 2;
      } else {
        const s = firing ? FIRE : IDLE;
        x0 = x - s / 2;
        y0 = y - s / 2;
        w = h = s;
      }
      const at = [
        [x0, y0],
        [x0 + w - C, y0],
        [x0 + w - C, y0 + h - C],
        [x0, y0 + h - C],
        [x0 + w / 2 - IDLE / 2, y0 + h / 2 - IDLE / 2],
        [x0, y0 - 16],
      ];
      parts.current.forEach((el, i) => {
        if (el) el.style.transform = `translate3d(${at[i][0]}px, ${at[i][1]}px, 0)`;
      });
    };

    const onMove = (e: PointerEvent) => {
      x = e.clientX;
      y = e.clientY;
      if (pip.current) pip.current.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      html.classList.add('reticle-on');
      place();
    };
    const onOver = (e: PointerEvent) => {
      const t = (e.target as Element | null)?.closest?.(TARGETS) ?? null;
      if (t === locked) return;
      locked = t;
      reticle.current?.classList.toggle('is-locked', !!t);
      place();
    };
    const onDown = () => {
      firing = true;
      reticle.current?.classList.add('is-firing');
      place();
      ping(0.25);
    };
    const onUp = () => {
      firing = false;
      reticle.current?.classList.remove('is-firing');
      place();
    };
    const onLeave = () => html.classList.remove('reticle-on');
    const onScroll = () => locked && place();

    window.addEventListener('pointermove', onMove, { passive: true });
    document.addEventListener('pointerover', onOver, { passive: true });
    window.addEventListener('pointerdown', onDown, { passive: true });
    window.addEventListener('pointerup', onUp, { passive: true });
    document.documentElement.addEventListener('pointerleave', onLeave);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      html.classList.remove('has-reticle', 'reticle-on');
      window.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerover', onOver);
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointerup', onUp);
      document.documentElement.removeEventListener('pointerleave', onLeave);
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  return (
    <div className="reticle-layer" aria-hidden="true">
      <div ref={reticle} className="reticle">
        {(['tl', 'tr', 'br', 'bl'] as const).map((c, i) => (
          <i
            key={c}
            ref={(el) => {
              parts.current[i] = el;
            }}
            className={`reticle__c reticle__c--${c}`}
          />
        ))}
        <svg
          ref={(el) => {
            parts.current[4] = el;
          }}
          className="reticle__ring"
          viewBox="0 0 40 40"
        >
          <circle cx="20" cy="20" r="15" />
        </svg>
        <span
          ref={(el) => {
            parts.current[5] = el;
          }}
          className="reticle__tag"
        >
          LOCK
        </span>
      </div>
      <div ref={pip} className="reticle-pip" />
    </div>
  );
}
