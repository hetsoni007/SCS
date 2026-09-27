'use client';

import type { ElementType } from 'react';

/**
 * Glitch-in text. The real text is always painted at full opacity (it is the LCP
 * element in the hero); the glitch lives entirely in two pseudo-element copies
 * that slice and offset in cyan and amber. `active` starts the glitch-in, after
 * which a faint idle glitch recurs every few seconds. Off under reduced motion
 * (handled in CSS).
 */
export function GlitchText({
  text,
  as: Tag = 'span',
  active,
  className = '',
  id,
}: {
  text: string;
  as?: ElementType;
  active: boolean;
  className?: string;
  id?: string;
}) {
  return (
    <Tag id={id} className={`glitch ${active ? 'glitch--in' : ''} ${className}`} data-text={text}>
      {text}
    </Tag>
  );
}
