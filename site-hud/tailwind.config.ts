import type { Config } from 'tailwindcss';

// Tailwind handles layout and spacing only. Everything visual (glows, frames,
// scanlines, the reticle) is bespoke CSS in src/app/globals.css, on the tokens below.
const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        void: '#05070d',
        cyan: { DEFAULT: '#00d9ff', hi: '#3ef2ff' },
        amber: { DEFAULT: '#ffb020' },
        ink: { DEFAULT: '#dff6ff', 2: '#9fbfcc', 3: '#5f7f8c' },
      },
      fontFamily: {
        display: ['var(--font-display)', 'system-ui', 'sans-serif'],
        body: ['var(--font-body)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
      },
      screens: { xs: '420px' },
    },
  },
  plugins: [],
};

export default config;
