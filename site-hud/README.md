# site-hud: "JARVIS HUD"

A cinematic, holographic single-page site for Soni Consultancy Services, in the
style of an Iron Man / JARVIS heads-up display. It is a standalone Next.js app
inside the static-site repo. It is **not deployed** and **not** part of the static
site's S3 sync. The repo root is still the live site's deploy artifact.

## Run it

```bash
cd site-hud
npm ci
npm run dev        # http://localhost:5190
npm run build      # static export → out/
npm start          # serve out/ on http://localhost:4190
npm run lint && npm run typecheck
```

URL flags for testing:

| Flag | Effect |
|---|---|
| `?tier=0\|1\|2` | Force a device tier. 0 = CSS-only HUD, 1 = lite 3D, 2 = full 3D + postprocessing |
| `?motion=reduce` | Force the reduced-motion version |
| `?boot=0` | Skip the boot sequence (it also plays only once per browser session) |

## Stack

| | |
|---|---|
| App | Next.js 14 (App Router, `output: 'export'`) · React 18 · TypeScript |
| 3D | three.js · React Three Fiber 8 · drei (`PerformanceMonitor`) · `@react-three/postprocessing` (bloom, chromatic aberration, glitch, scanline, noise, vignette) |
| Motion | Framer Motion (UI reveals, `LazyMotion` with async features) · GSAP + ScrollTrigger (pinned horizontal process) · Lenis (smooth wheel scroll) |
| Styling | Tailwind for layout. The HUD visuals are bespoke CSS on design tokens in `src/app/globals.css` |
| Fonts | Rajdhani · Exo 2 · JetBrains Mono, self-hosted at build time by `next/font` |

Palette: near-black navy `#05070d`, cyan `#00d9ff` / `#3ef2ff`, amber `#ffb020`.
Those are the only accents.

## Structure

```
src/
  app/                layout (fonts, inline boot/motion script), page, globals.css
  components/
    sections/         Hero · Capabilities · Process (+ Schematics) · Proof · WhyUs · Contact
    hud/              HUDFrame · CornerBrackets · GlitchText · ScrambleText · HoloButton · SectionHeader
    three/            Scene (the R3F canvas) · ReactorCore · DataCore · Environment (grid, gates, dust)
                      · Landmarks (dial, beacon) · CameraRig · Effects · path + geometry helpers
    BootSequence · Cursor (targeting reticle) · Nav · ScrollLadder · SceneMount · SmoothScroll
    Backdrop (CSS HUD + CSS reactor + overlays) · HUDProvider · Footer
  data/               site.ts · capabilities.ts · process.ts · projects.ts · stats.ts
  lib/
    shaders/          hologram, glow, particles, grid, radar sweep, beam, fading lines
    animation.ts      palette, easing, HUD boot-up timing, boot script, per-tier budgets, camera path
    device.ts         device tier detection
    engine.ts         on-demand GSAP/ScrollTrigger loader (desktop only)
    contact.ts        contact form adapter (SWAP POINT)
    live.ts           per-frame values shared by the DOM and the scene
    scroll.ts         Lenis handle, section tracking, anchor scrolling
```

## How it works

- **One fixed WebGL canvas** sits behind the page. The camera flies a Catmull-Rom path
  keyed to scroll (`CAMERA_PATH` in `lib/animation.ts`). One keyframe per section, and two
  extra keys make it strafe sideways while the process timeline is pinned. Pointer
  parallax and a scroll-speed FOV kick sit on top.
- **Scene landmarks per section**: the arc-reactor core (hero), a data core whose satellite
  nodes ride the same angle as the DOM module orbit (capabilities), HUD gate frames you fly
  through, a giant instrument dial (why us) and a transmission beacon that pulses faster
  while the form sends and flares when it lands (contact). A holographic floor grid and a
  dust field run the whole length.
- **DOM ↔ scene** communicate through the mutable `live` object, so no React re-render
  happens at 60fps.
- **Panels boot**: corner brackets snap in, then the chamfered frame draws its stroke, then a
  scan line sweeps the panel, then the content fades up (`HUDFrame`).
- **Boot sequence**: server-rendered, so the hero never flashes. The h1 underneath is painted
  at full opacity from the first frame and stays the LCP element. A CSS failsafe hides the
  boot after 7s even if JavaScript never runs.

## Tiers, mobile and reduced motion

`lib/device.ts` decides once, before any 3D code is requested:

- **Tier 0**: phones, tablets, touch-first devices, software renderers (SwiftShader, llvmpipe),
  Save-Data. The three.js bundle is never downloaded. They get the CSS HUD: CSS reactor,
  perspective grid, dust layers, scanlines. GSAP and Lenis are not loaded either.
- **Tier 1**: up to 4 cores, 4 GB or less, or older integrated GPUs. Lite 3D, fewer particles,
  DPR ≤ 1.25, no postprocessing.
- **Tier 2**: full scene, bloom/aberration/glitch/scanlines, DPR ≤ 1.5, MSAA.
- At runtime drei's `PerformanceMonitor` drops DPR, then effects, if the frame rate falls.

**Reduced motion** keeps the look and drops the movement. There is no Lenis, no camera
flight or parallax, no pinned horizontal scroll (the process becomes a vertical timeline),
no orbit (the modules become a grid) and no postprocessing. The scene renders on demand as
a dimmed still, the boot is cut to a short fade, and reveals resolve to their end state.

## Swap points

- **Portfolio**: `src/data/projects.ts`. Name, sector, duration, outcome, metrics, stack, status,
  image, link. Images go in `public/portfolio/`. The file header repeats the NDA rules.
- **Contact backend**: `src/lib/contact.ts`. **Not chosen yet.** The form runs as a dry
  run and tells the visitor nothing was sent. Set `NEXT_PUBLIC_CONTACT_MODE=endpoint` and
  `NEXT_PUBLIC_CONTACT_ENDPOINT=…` to POST JSON anywhere: the existing lead pipeline, a Next
  route handler (then remove `output: 'export'`), or a form service. Field names mirror the
  live site's forms.

## Content rules

The live site's hard rules apply here too (see `../CLAUDE.md`):
- All copy and every number comes from the live site. Nothing is invented. Sources are
  noted at the top of each `src/data/*` file.
- Portfolio products stay NDA-pseudonymised. There are no store links, and "Live on…"
  is a plain badge.
- The Flutter module has no published case study behind it, so its readout lists no
  results. Only React Native, MERN/Next.js and AI name field work.

## Measured (production build, local static server)

Lighthouse 12:

| | Performance | Accessibility | Best practices | LCP | TBT | CLS |
|---|---|---|---|---|---|---|
| Mobile (simulated 4× CPU, slow 4G) | 81–82 | 100 | 100 | 4.9 s simulated, 0.24 s observed | 10–60 ms | 0 |
| Mobile (DevTools-applied throttling) | 89 | | | 2.4 s | 140 ms | 0.002 |
| Desktop | 97–98 | 100 | 100 | 1.0 s | 0–20 ms | 0.008 |

Lighthouse's headless Chrome renders WebGL in software, so those runs measure the CSS tier.
The WebGL chunks (three.js + R3F + postprocessing, ~240 KB gzipped) is requested only at
tier ≥ 1, after the browser is idle, and is never part of LCP. First-load JS for the page
is 137 KB gzipped.
