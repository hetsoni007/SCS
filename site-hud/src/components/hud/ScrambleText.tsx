'use client';

import { useEffect, useRef, useState } from 'react';
import { useInView } from 'framer-motion';
import { useHUD } from '../HUDProvider';

// ASCII only: every glyph exists in the mono font at the same advance, so decoding never reflows
const GLYPHS = '<>/\\|=+*#ABCDEFXYZ0123456789';

/**
 * Decodes text from random glyphs, left to right, when it scrolls into view (or
 * when `start` flips true). Screen readers get the final text from a visually hidden copy.
 */
export function ScrambleText({
  text,
  className = '',
  duration = 700,
  start,
}: {
  text: string;
  className?: string;
  duration?: number;
  start?: boolean;
}) {
  const { reduced } = useHUD();
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });
  const [out, setOut] = useState(text);
  // hidden (via CSS, only once JS has run) until it decodes, so it never flashes the final text first
  const [pending, setPending] = useState(true);
  const played = useRef(false);
  const go = start ?? inView;

  // reduced motion can be detected after a decode already started: settle on the final text
  useEffect(() => {
    if (!reduced) return;
    setPending(false);
    setOut(text);
  }, [reduced, text]);

  useEffect(() => {
    if (!go || played.current || reduced) return;
    played.current = true;
    setPending(false);
    let raf = 0;
    const t0 = performance.now();
    const frame = (now: number) => {
      const p = Math.min(1, (now - t0) / duration);
      const reveal = Math.floor(p * text.length);
      let s = '';
      for (let i = 0; i < text.length; i++) {
        const ch = text[i];
        s += i < reveal || ch === ' ' ? ch : GLYPHS[(Math.random() * GLYPHS.length) | 0];
      }
      setOut(s);
      if (p < 1) raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [go, reduced, text, duration]);

  return (
    <span ref={ref} className={`${className}${pending ? ' scramble--pending' : ''}`}>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">{out}</span>
    </span>
  );
}
