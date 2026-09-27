'use client';

import { m } from 'framer-motion';
import { EASE, HUD_TIMING } from '@/lib/animation';

const CORNERS = [
  { key: 'tl', style: { top: 0, left: 0, borderTopWidth: 1.5, borderLeftWidth: 1.5 }, origin: '0% 0%' },
  { key: 'tr', style: { top: 0, right: 0, borderTopWidth: 1.5, borderRightWidth: 1.5 }, origin: '100% 0%' },
  { key: 'br', style: { bottom: 0, right: 0, borderBottomWidth: 1.5, borderRightWidth: 1.5 }, origin: '100% 100%' },
  { key: 'bl', style: { bottom: 0, left: 0, borderBottomWidth: 1.5, borderLeftWidth: 1.5 }, origin: '0% 100%' },
] as const;

/**
 * Four L-shaped corner brackets. They are the first thing to appear when a HUD
 * panel boots: they snap out from their corners before the frame stroke draws.
 */
export function CornerBrackets({
  show,
  size = 14,
  inset = -1,
  tone = 'cyan',
  delay = 0,
  instant = false,
}: {
  show: boolean;
  size?: number;
  inset?: number;
  tone?: 'cyan' | 'amber';
  delay?: number;
  instant?: boolean;
}) {
  return (
    <span className="brackets" aria-hidden="true" style={{ inset }}>
      {CORNERS.map((c, i) => (
        <m.span
          key={c.key}
          className={`bracket bracket--${tone}`}
          style={{ ...c.style, width: size, height: size, transformOrigin: c.origin }}
          initial={instant ? false : { opacity: 0, scale: 2.4 }}
          animate={show ? { opacity: 1, scale: 1 } : undefined}
          transition={{ duration: HUD_TIMING.brackets.duration, delay: delay + i * 0.04, ease: EASE.hud }}
        />
      ))}
    </span>
  );
}
