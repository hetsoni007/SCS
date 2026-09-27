'use client';

import { useEffect, useRef, useState, type ElementType, type ReactNode } from 'react';
import { m, useInView } from 'framer-motion';
import { EASE, HUD_TIMING } from '@/lib/animation';
import { useHUD } from '../HUDProvider';
import { CornerBrackets } from './CornerBrackets';

function chamferPath(w: number, h: number, c: number) {
  // chamfered top-left and bottom-right, square elsewhere; drawn from the top-left
  const o = 0.75; // half the stroke width, keeps the line inside the box
  return [
    `M ${c + o} ${o}`,
    `L ${w - o} ${o}`,
    `L ${w - o} ${h - c - o}`,
    `L ${w - c - o} ${h - o}`,
    `L ${o} ${h - o}`,
    `L ${o} ${c + o}`,
    'Z',
  ].join(' ');
}

/**
 * A HUD panel that "boots" when it scrolls into view:
 *   1. corner brackets snap in
 *   2. the chamfered frame draws itself (animated stroke)
 *   3. a scan line sweeps the panel
 *   4. the content fades up
 * Under reduced motion everything is simply present.
 */
export function HUDFrame({
  children,
  className = '',
  as: Tag = 'div',
  label,
  chamfer = 16,
  delay = 0,
  tone = 'cyan',
  amount = 0.25,
  id,
}: {
  children: ReactNode;
  className?: string;
  as?: ElementType;
  label?: string;
  chamfer?: number;
  delay?: number;
  tone?: 'cyan' | 'amber';
  amount?: number;
  id?: string;
}) {
  const { reduced } = useHUD();
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, amount });
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const box = entry.borderBoxSize?.[0];
      const w = box ? box.inlineSize : el.offsetWidth;
      const h = box ? box.blockSize : el.offsetHeight;
      setSize((s) => (s && Math.abs(s.w - w) < 0.5 && Math.abs(s.h - h) < 0.5 ? s : { w, h }));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const show = inView || reduced;
  const t = HUD_TIMING;

  return (
    <Tag ref={ref} id={id} className={`hud-frame hud-frame--${tone} ${show ? 'is-on' : ''} ${className}`}>
      {size && (
        <svg className="hud-frame__svg" width={size.w} height={size.h} viewBox={`0 0 ${size.w} ${size.h}`} aria-hidden="true">
          <m.path
            d={chamferPath(size.w, size.h, chamfer)}
            pathLength={1}
            initial={reduced ? false : { pathLength: 0, opacity: 0 }}
            animate={show ? { pathLength: 1, opacity: 1 } : undefined}
            transition={{ duration: t.stroke.duration, delay: delay + t.stroke.delay, ease: EASE.draw }}
          />
        </svg>
      )}
      <CornerBrackets show={show} delay={delay} tone={tone} instant={reduced} />
      {!reduced && show && size && (
        <span className="hud-frame__scan" aria-hidden="true">
          {/* transform, not top: a top animation counts as a layout shift every frame */}
          <m.i
            initial={{ y: 0, opacity: 0 }}
            animate={{ y: size.h + 40, opacity: [0, 1, 1, 0] }}
            transition={{ duration: t.scan.duration, delay: delay + t.scan.delay, ease: 'linear' }}
          />
        </span>
      )}
      {label && (
        <m.span
          className="hud-frame__label"
          initial={reduced ? false : { opacity: 0, x: -8 }}
          animate={show ? { opacity: 1, x: 0 } : undefined}
          transition={{ duration: 0.4, delay: delay + t.stroke.delay + 0.2, ease: EASE.hud }}
        >
          {label}
        </m.span>
      )}
      <m.div
        className="hud-frame__body"
        initial={reduced ? false : { opacity: 0, y: 10 }}
        animate={show ? { opacity: 1, y: 0 } : undefined}
        transition={{ duration: t.content.duration, delay: delay + t.content.delay, ease: EASE.hud }}
      >
        {children}
      </m.div>
    </Tag>
  );
}
