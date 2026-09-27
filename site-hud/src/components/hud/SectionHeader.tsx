'use client';

import { m } from 'framer-motion';
import { EASE } from '@/lib/animation';
import { useHUD } from '../HUDProvider';
import { ScrambleText } from './ScrambleText';

/** "01 // CAPABILITIES" eyebrow that decodes in, a title and an optional lead. */
export function SectionHeader({
  code,
  eyebrow,
  title,
  lead,
  id,
  align = 'left',
}: {
  code: string;
  eyebrow: string;
  title: React.ReactNode;
  lead?: string;
  id: string;
  align?: 'left' | 'center';
}) {
  const { reduced } = useHUD();
  const fade = (delay: number) => ({
    initial: reduced ? false : ({ opacity: 0, y: 18 } as const),
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, amount: 0.5 },
    transition: { duration: 0.7, delay, ease: EASE.hud },
  });
  return (
    <header className={`sec-head sec-head--${align}`}>
      <p className="eyebrow">
        <span className="eyebrow__code">{code}</span>
        <span className="eyebrow__sep" aria-hidden="true">
          {'//'}
        </span>
        <ScrambleText text={eyebrow} />
      </p>
      <m.h2 id={id} className="h2 reveal" {...fade(0.1)}>
        {title}
      </m.h2>
      {lead && (
        <m.p className="lead reveal" {...fade(0.22)}>
          {lead}
        </m.p>
      )}
    </header>
  );
}
