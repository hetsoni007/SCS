import type { Metadata, Viewport } from 'next';
import { Exo_2, JetBrains_Mono, Rajdhani } from 'next/font/google';
import { BOOT } from '@/lib/animation';
import { SITE } from '@/data/site';
import './globals.css';

// next/font downloads and self-hosts these at build time: no runtime font CDN.
const display = Rajdhani({ subsets: ['latin'], weight: ['500', '600', '700'], variable: '--font-display', display: 'swap' });
const body = Exo_2({ subsets: ['latin'], variable: '--font-body', display: 'swap' });
const mono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono', display: 'swap' });

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: 'Soni Consultancy Services — Senior-led app studio',
  description:
    'React Native, MERN, Next.js, Flutter and AI integration builds for founders and CTOs. Senior-led. Fixed-price. No bloat.',
  // Concept build, not deployed. Remove `robots` if this ever replaces the live site.
  robots: { index: false, follow: false },
  icons: { icon: '/favicon.svg' },
};

export const viewport: Viewport = {
  themeColor: '#05070d',
  colorScheme: 'dark',
  width: 'device-width',
  initialScale: 1,
};

// Runs before first paint: reduced-motion flag, and skip the boot if it already
// played this session (or ?boot=0 for testing).
const bootScript = `(function(){try{var d=document.documentElement,q=location.search;
if(matchMedia('(prefers-reduced-motion: reduce)').matches||/[?&]motion=reduce/.test(q))d.setAttribute('data-motion','reduce');
if(sessionStorage.getItem('${BOOT.storageKey}')||/[?&]boot=0/.test(q))d.classList.add('booted');}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${mono.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: bootScript }} />
        <noscript>
          <style>{`.boot{display:none!important}.reveal,.hud-frame__body,.hud-frame__label,.bracket,.nav,.proj{opacity:1!important;transform:none!important}.hud-frame__svg path{opacity:1!important;stroke-dashoffset:0!important}`}</style>
        </noscript>
      </head>
      <body>{children}</body>
    </html>
  );
}
