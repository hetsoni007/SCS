'use client';

import { useEffect, useState } from 'react';
import { m } from 'framer-motion';
import { SECTIONS, SITE } from '@/data/site';
import { EASE } from '@/lib/animation';
import { useActiveSection } from '@/lib/useActiveSection';
import { useHUD } from './HUDProvider';
import { HoloButton } from './hud/HoloButton';

export function Logo() {
  return (
    <svg viewBox="0 0 40 40" className="logo" aria-hidden="true">
      <path d="M20 2 36 11v18L20 38 4 29V11z" className="logo__hex" />
      <circle cx="20" cy="20" r="8.5" className="logo__ring" />
      <circle cx="20" cy="20" r="3.4" className="logo__core" />
    </svg>
  );
}

export function Nav() {
  const { booted, reduced } = useHUD();
  const active = useActiveSection();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 40);
    on();
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const links = SECTIONS.slice(1);

  return (
    <m.header
      className={`nav${scrolled ? ' nav--solid' : ''}${open ? ' nav--open' : ''}`}
      initial={reduced ? false : { opacity: 0, y: -16 }}
      animate={booted ? { opacity: 1, y: 0 } : undefined}
      transition={{ duration: 0.6, delay: 0.25, ease: EASE.hud }}
    >
      <a href="#top" className="nav__brand">
        <Logo />
        <span className="nav__name">
          <b>SCS</b>
          <span>{SITE.name}</span>
        </span>
        <span className="sr-only">, back to top</span>
      </a>
      <nav aria-label="Sections" className="nav__links">
        {links.map((s) => (
          <a key={s.id} href={`#${s.id}`} className={`laser nav__link${active === s.id ? ' is-active' : ''}`} aria-current={active === s.id ? 'true' : undefined}>
            <span className="nav__code">{s.code}</span>
            {s.label}
          </a>
        ))}
      </nav>
      <div className="nav__cta">
        <span className="nav__status" aria-hidden="true">
          <i /> Online
        </span>
        <HoloButton href={SITE.calendly} external size="sm">
          Book a call
        </HoloButton>
      </div>
      <button
        type="button"
        className="nav__burger"
        aria-expanded={open}
        aria-controls="mobile-menu"
        aria-label={open ? 'Close menu' : 'Open menu'}
        onClick={() => setOpen((o) => !o)}
      >
        <i />
        <i />
      </button>
      <div id="mobile-menu" className="nav__sheet" hidden={!open}>
        {links.map((s) => (
          <a key={s.id} href={`#${s.id}`} onClick={() => setOpen(false)}>
            <span className="nav__code">{s.code}</span>
            {s.label}
          </a>
        ))}
        <HoloButton href={SITE.calendly} external>
          Book a free call
        </HoloButton>
      </div>
    </m.header>
  );
}
