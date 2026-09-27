'use client';

import { useEffect, useState } from 'react';
import { SECTIONS, type SectionId } from '@/data/site';

/** The section crossing the middle band of the viewport. Updates only on change. */
export function useActiveSection(): SectionId {
  const [active, setActive] = useState<SectionId>('top');
  useEffect(() => {
    const els = SECTIONS.map((s) => document.getElementById(s.id)).filter(Boolean) as HTMLElement[];
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive(e.target.id as SectionId);
      },
      { rootMargin: '-45% 0px -45% 0px' },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
  return active;
}
