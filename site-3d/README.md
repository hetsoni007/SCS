# site-3d: "Compile"

An interactive, WebGL-forward rebuild of soniconsultancyservices.com. It has the
same content as the live site (verbatim, see `CONTENT.md`) and an original visual
system (`DESIGN.md`).

This is a standalone Vite app inside the static-site repo. It is **not deployed**
and it is **not** part of the static site's S3 sync. The repo root is still the live
site's deploy artifact.

## Run it

```bash
cd site-3d
NODE_OPTIONS=--dns-result-order=ipv4first npm ci   # IPv4 first: the IPv6 route to npm is very slow on this machine
npm run dev        # http://localhost:5178
npm run build      # typecheck + production build → dist/
npm run preview    # serve dist/ on http://localhost:4178
```

Useful URL flags:
- `?tier=high|medium|low|off` forces a 3D quality tier. `off` shows the no-WebGL
  line-drawing posters.
- The boot loader runs once per browser session. Clear `sessionStorage` to see it again.

## The concept

The site is a build in progress. Every 3D object has a **source** state (cyanotype
wireframe) and a **build** state (lit material). A vermilion scan plane is the moment
of compilation. Page loads compile in, route changes decompile and recompile inside
one persistent canvas, and the HUD reads like a build log. The full rationale is in
`DESIGN.md`.

## Stack

| | |
|---|---|
| App | Vite 8 · React 19 · TypeScript · React Router 7 |
| 3D | three.js 0.186 · @react-three/fiber 9 · `postprocessing` (bloom, high tier only) · cannon-es (contact keycaps) |
| Motion | GSAP + ScrollTrigger (the only DOM motion engine) · Lenis inertia scroll |
| State | Zustand (theme, tier, page ↔ scene channels) plus a plain mutable `live` object for per-frame values |
| Styling | Tailwind 3 for layout utilities only. Everything visual is bespoke CSS on design tokens |
| Fonts | Fraunces (variable) + IBM Plex Sans/Mono, self-hosted woff2 |

`@react-three/drei` is not used. The few helpers that would have come from it
(rounded box, lightformer environment, frame-time monitor, anchor tracking) are small
and written in-house (`src/three/`). This keeps the dependency tree lean. drei pulls
in hls.js, MediaPipe and ~20 other packages.

## How it fits together

```
src/
  content/          verbatim copy, typed (transcribed from CONTENT.md)
  pages/            one component per route; semantic HTML, all content lives here
  components/       shell (nav, footer, boot loader, cursor, grain, HUD, transition) + UI blocks
  lib/              motion (GSAP/Lenis), reveals, route transition, GPU tier, tilt, lead POST
  three/
    Stage.tsx       the ONE persistent <Canvas>: env lighting, bloom, perf monitor, pause-when-covered
    registry.ts     lazy import() per scene; nothing three.js is in the main bundle
    compile.ts      the signature shader (patches MeshStandardMaterial) + wireframe material
    rig.ts          anchors: DOM placeholders ([data-anchor]) mapped into world space
    scenes/         one scene per route (Home, Services, Work, Case, AI, DevOps, …)
    parts/          phone rig, morphing point cloud, backdrop, screen textures, plates
```

**Anchors.** Pages place empty, sized `<div data-anchor="pose">` placeholders in their
layout. Scenes project those rects into world space every frame and fly objects to
them. This is why the 3D sits correctly at every breakpoint, and why scrolling reads
as choreography. Mobile layouts simply use different anchors.

**Page ↔ scene.** Discrete state (active service, highlighted layer, calculator scope)
goes through Zustand channels (`useStore().ch`). Continuous values (scroll progress
through a pinned section) go through `live.chan`, so nothing re-renders at 60fps.

## Content rules

The live site's hard rules still apply here (see `../CLAUDE.md`):
- Portfolio products stay NDA-pseudonymised. There are no store links, and
  "Live on…" is a plain badge.
- Concepts (Web3 Creator, Fan Investment) stay labelled "Product & UI/UX design concept".
- Healthcare Staffing figures are shown as research ("From the research"), not results.
- Products without screens get an abstract plate, never an invented UI.
- The DevOps dashboard keeps its "Illustrative demo · sample data" label.
- The AI page chat is a scripted demo. It is labelled as such and answers only
  with the published FAQ.

## Forms and leads

The forms post to the same API Gateway → Lambda → SES pipeline as the live site, with
the same payload shapes. On `localhost` (dev or preview) they are a **dry run**: the
payload is logged to the console, nothing is sent, and the UI still shows success. Set
`VITE_LEADS_LIVE=true` to force real sends. The live API only accepts the production
origin anyway.

## Links out

Pages that exist on the live site but aren't rebuilt here open the live site in a new
tab: individual blog posts, privacy, WordPress, the geo landing pages, the cloud-cost
and DevOps-maturity tools, and the scoping-guide PDF.

## Not included (on purpose)

GA4, Meta Pixel, LinkedIn Insight and Tawk.to are not included. This is a showcase
build and should not report analytics from local runs. It is also a client-rendered
SPA. The live site is static HTML, which crawlers read without JavaScript. Before
this could replace it, it would need per-route prerendering.

## Measured (production build, headless Chrome on Apple M1)

| | FCP | LCP | TBT | CLS | axe (WCAG 2.1 AA) |
|---|---|---|---|---|---|
| Desktop, unthrottled (/, /services/, /work/, /contact/) | 0.1–0.9 s | 0.1–1.2 s | 0–35 ms | ≤ 0.04 | 0 violations |
| Mobile, Slow 4G + 4× CPU (/, /services/, /work/, /contact/) | ~2.0 s | ~2.65 s | 160–245 ms | 0.001 | 0 violations |

Initial JS is about 150 KB gzip. The three.js chunk (~242 KB gzip) loads only after
first paint, when the main thread is idle.

Dev builds expose `window.__gsap`, `window.__ST` and `window.__r3f` for debugging and
automated checks. They are stripped from production builds.
