import { SITE } from '@/data/site';
import { Logo } from './Nav';

export function Footer() {
  return (
    <footer className="footer">
      <div className="footer__brand">
        <Logo />
        <div>
          <p className="footer__name">{SITE.name}</p>
          <p className="footer__tag">React Native · MERN · Next.js · Flutter · AI</p>
        </div>
      </div>
      <ul className="footer__links" aria-label="Contact">
        <li>
          <a className="laser" href={`mailto:${SITE.email}`}>
            {SITE.email}
          </a>
        </li>
        <li>
          <a className="laser" href={SITE.whatsapp} target="_blank" rel="noopener noreferrer">
            WhatsApp {SITE.phone}
          </a>
        </li>
        <li>
          <a className="laser" href={SITE.calendly} target="_blank" rel="noopener noreferrer">
            Book a call
          </a>
        </li>
      </ul>
      <ul className="footer__links" aria-label="Social">
        {SITE.socials.map((s) => (
          <li key={s.label}>
            <a className="laser" href={s.href} target="_blank" rel="noopener noreferrer">
              {s.label}
            </a>
          </li>
        ))}
      </ul>
      <p className="footer__legal">
        © 2026 {SITE.name}. All rights reserved. <a className="laser" href="#top">Back to top ↑</a>
      </p>
    </footer>
  );
}
