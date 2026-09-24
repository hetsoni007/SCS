# DESIGN.md: "Compile"

The visual system for the 3D rebuild of soniconsultancyservices.com. Content is 1:1
with the live site (see `CONTENT.md`). Everything below (concept, palette, type,
layout, motion, 3D) was designed for this build and does not reuse the live site's
look. The live site is black and gold, glassmorphism, Inter and centred card grids.

---

## 1. Concept: the site is a build

SCS turns a plan into a shipped app. The site shows that happening.

Every object on the site has two states:

| state | what it looks like | what it stands for |
|---|---|---|
| **Source** | cyanotype wireframe, thin lines, slightly transparent | the plan, the scope, the brief |
| **Build** | solid, lit, physically shaded material | the shipped product |

A **vermilion scan plane** is the moment of compilation. It sweeps through an object
and turns line into matter. Scroll position, route changes and user input all drive
this "compiler":

- **First load** is a cold build. A boot log streams the site's real modules, then
  the scan sweeps the viewport.
- **Route change** is a rebuild. The current scene decompiles back to source, the
  scan crosses the screen, and the next scene compiles in. The same WebGL canvas is
  used throughout, so it reads as one continuous space.
- **Scroll** is build progress. The HUD shows `route · section · %` like a build log.
- **Hover on primary buttons** plays a miniature scan wipe.

Four motifs, used consistently:

1. **Scan plane**: 1px vermilion line with a soft bloom. Used in 3D shaders, the
   loader, route transitions, button hovers and image reveals.
2. **Build log**: IBM Plex Mono, timestamped (`[00.42] ✓ mounted /services`).
   Appears in the loader, the transitions and the HUD.
3. **Drafting marks**: registration crosshairs (⌖), corner brackets, dimension lines
   with values (`├── 8 wk ──┤`) and a faint 12-column drafting grid. They replace
   cards and glass panels. Content sits on hairlines, not in boxes.
4. **Exploded view**: the phone comes apart into layers (Interface, Logic, Intelligence)
   to explain the services on the homepage.

What we deliberately avoid: glass cards, blob gradients, purple/blue "AI" glows,
centred hero + 3-card grid, default shadcn/Tailwind look, drop shadows.

---

## 2. Colour

Two themes. **Night shift** (dark) is the default. **Blueprint paper** (light) is
available from the theme toggle. All colours are CSS custom properties on `:root`
(`src/styles/tokens.css`). The 3D scenes read the same values from `src/three/palette.ts`.

### Night shift (default)
| token | hex | use | contrast on bg |
|---|---|---|---|
| `--bg` | `#0B0E11` | graphite page | — |
| `--bg-raise` | `#12171C` | raised strips, inputs | — |
| `--bg-sunk` | `#07090B` | footer, deep panels | — |
| `--fg` | `#ECE7DC` | bone: primary text | 15.7 |
| `--fg-2` | `#A8B0B5` | secondary text | 8.8 |
| `--fg-3` | `#7F8A91` | tertiary / captions | 5.5 |
| `--signal` | `#FF5A1F` | vermilion: build, CTAs, scan | 6.2 |
| `--on-signal` | `#150702` | text on vermilion buttons | 6.3 on signal |
| `--cyan` | `#86BCD9` | cyanotype: wireframes, source state, "ok" | 9.4 |
| `--line` | `rgba(222,232,240,.09)` | hairlines | — |
| `--line-2` | `rgba(222,232,240,.18)` | emphasised hairlines, inputs | — |

### Blueprint paper (light)
| token | hex | contrast on bg |
|---|---|---|
| `--bg` | `#EEEAE1` | — |
| `--bg-raise` | `#F7F4EE` | — |
| `--fg` | `#12161A` | 15.1 |
| `--fg-2` | `#424A50` | 7.5 |
| `--fg-3` | `#5C656B` | 5.0 |
| `--signal` | `#B8360A` | 4.9 (paper text on it: 5.4) |
| `--cyan` | `#2A6A8F` | 4.9 |

Rules:
- Vermilion is rationed. Use it for one action per viewport plus the scan and the
  cursor. Never use it for body text in light mode below 18px.
- Cyan means *source/plan* and also *healthy/ok*. It never appears on a CTA.
- There are no gradients except the scan-line bloom and the 3D lighting.

---

## 3. Type

| role | family | notes |
|---|---|---|
| **Display** | **Fraunces** (variable: `opsz` 9–144, `wght`, `SOFT`, `WONK`, italic) | An editorial old-style serif, unusual for a dev studio. It gives a "craft" voice against the technical drafting marks. Headlines use `opsz 144`, `wght 340`. Emphasis words use the *italic* with `WONK 1`. Hover on large links raises `SOFT` 0 → 100. |
| **Workhorse** | **IBM Plex** superfamily. Plex Sans for prose, Plex Mono for labels, data and the build log | An engineering-lineage grotesk. The mono uses the same metrics, so labels and prose sit together cleanly. |

All fonts are self-hosted woff2 in `public/fonts/`. There are no font CDNs. Fraunces
roman is preloaded and everything uses `font-display: swap`.

Fluid scale (`clamp`, 360 → 1600px viewport):

| token | size | line-height | family |
|---|---|---|---|
| `display-xl` | 3.1rem → 8.6rem | .9 | Fraunces |
| `display` | 2.6rem → 6rem | .95 | Fraunces |
| `h2` | 2.1rem → 4.2rem | 1.0 | Fraunces |
| `h3` | 1.35rem → 1.9rem | 1.15 | Fraunces |
| `lead` | 1.1rem → 1.35rem | 1.5 | Plex Sans |
| `body` | 1rem | 1.62 | Plex Sans |
| `small` | .875rem | 1.5 | Plex Sans |
| `label` | .72rem, uppercase, `+.12em` | 1.2 | Plex Mono |
| `data` | 1rem–1.4rem, tabular | 1.2 | Plex Mono |

Display tracking is `-0.025em`. Labels use `+0.12em`. Prose never goes beyond 68ch.

---

## 4. Space and grid

- Base unit **4px**. Scale: 4 · 8 · 12 · 16 · 24 · 32 · 48 · 64 · 96 · 128 · 192.
- **12-column grid**, max content width 1440px. Gutter `clamp(16px, 2.2vw, 32px)`.
  Page margin `clamp(16px, 4.5vw, 72px)`. On phones the side gutter is 16px.
- **Drafting grid**: faint vertical hairlines on the column edges, shown only on
  desktop and only in sections marked `data-grid`.
- Section rhythm: `padding-block: clamp(88px, 13vh, 176px)`.
- Radius: **2px** everywhere. Chips are square-cornered tags, never pills. The only
  circles are the cursor ring and the status dots.
- Elevation comes from hairlines and background steps only, never shadows. Glow is
  reserved for vermilion signal elements.

Breakpoints: `sm 640` · `md 900` · `lg 1200`. Below `md` the layout is a single
column and the mobile 3D mode takes over (§7).

---

## 5. Components (bespoke)

- **Section label**: `§03 ⌖ HOW WE WORK` in Plex Mono, followed by a hairline rule
  that draws itself (SVG `stroke-dashoffset`) when revealed.
- **Primary action**: a vermilion rectangle with a mono label and an arrow. On hover
  a scan line wipes across and the arrow moves 4px. It is magnetic within 60px on
  fine pointers.
- **Secondary action**: text between corner brackets `⌜ See our work ⌟`. The brackets
  expand on hover.
- **Stat**: a large Fraunces numeral over a mono label, with a dimension line under
  it. It counts up once on reveal (no count-up under reduced motion).
- **Ruled list**: replaces card grids. Rows are separated by hairlines and have an
  index number, title, body and chips. Hovering a row slides in a vermilion index
  marker.
- **Chip**: mono, uppercase, hairline border, 2px radius.
- **FAQ**: ruled accordion. The `+` rotates to `×`. It uses real `button` and
  `aria-expanded`, and the text is verbatim with the site's FAQPage copy.
- **Lead box**: an "intake sheet". Fields sit on hairlines like a form printed on
  drafting paper. The field labels are mono.

---

## 6. Motion

**Engine.** GSAP + ScrollTrigger is the only DOM motion engine. Lenis provides the
inertia scroll and is ticked from `gsap.ticker`. 3D animation runs in r3f `useFrame`
with critically damped springs (`damp`). Framer Motion is not used.

| token | value | use |
|---|---|---|
| `--ease-out` | `cubic-bezier(.16,1,.3,1)` (expo.out) | reveals |
| `--ease-io` | `power3.inOut` | route transition |
| `dur-micro` | 180ms | hovers |
| `dur-reveal` | 700ms | text/line reveals |
| `dur-hero` | 1200ms | hero compile |
| transition | 450ms out + 650ms in | route rebuild |

Reveals: headings split into lines and rise out of a mask. Hairlines draw left to
right. Numbers count up. Images are revealed by a scan wipe.

**Reduced motion** (`prefers-reduced-motion: reduce`):
- Lenis is off (native scroll). There is no scroll scrubbing, parallax or auto-rotation.
- 3D objects render fully compiled and static. The camera is fixed per page.
- Route transition becomes a 200ms opacity fade. The loader is skipped.
- The typewriter shows its first phrase only. The marquee stops. Count-ups show the
  final value.

---

## 7. 3D direction

One persistent `<Canvas>` sits behind the DOM at the app root. Route scenes are
`React.lazy` chunks mounted inside it, so only one WebGL context ever exists. Page
DOM stays semantic and on top. Every 3D scene is `aria-hidden` and has a DOM
equivalent.

**Lighting.** The environment is built procedurally, with no HDR download: a warm
bone key from the top left, a vermilion rim strip from the right, and a cyanotype
fill from below. Objects get a warm–cool split that is clearly not the generic
purple glow. Fog goes to `--bg`.

**Materials.** Anodised graphite metal (`#1B2127`, metalness .85, roughness .32).
Screens are emissive. Wireframes are 1px additive cyan. The scan edge is vermilion
at HDR intensity, so it blooms on the high tier.

**The compile shader** (`src/three/compile.ts`) patches `MeshStandardMaterial`
through `onBeforeCompile`. Fragments beyond the scan cut are discarded. A noisy
band at the cut gets vermilion emission. A matching line material shows the edges
only on the uncompiled side. Every scene multiplies its own progress by a global
`uBuild` uniform, which is what route transitions animate.

**Per page**

| route | scene | interaction |
|---|---|---|
| `/` | Phone rig: compiles on load, cycles the four live apps on its screen, explodes into Interface / Logic / Intelligence layers over the services, then reassembles for the work reel | scroll-scrubbed camera and phone poses, pointer tilt, magnetic buttons |
| `/services/` | Morphing point cloud (7 service forms) inside an orbit of 7 service modules, plus a 5-station assembly line for the process | drag to spin the orbit, click a module to morph, scroll the line |
| `/work/` | Depth corridor of case-study plates with a hover-distortion shader | fly through on scroll, hover to distort, click into the case |
| `/work/:id/` | The phone returns, showing that product's real screens. Products without screens get an abstract plate, never invented UI | scroll steps through the screens |
| `/ai-app-development/` | Network of 12 capability nodes in a neural field | cursor attracts and lights nodes, and the scripted chat pulses the network |
| `/devops-cloud-engineering/` | Stacked 3D reference architecture with packets flowing and a CI/CD ring | hover or tap a layer to light it and read it |
| `/about/` | Deliberately quiet: a depth-of-field bokeh field whose focal plane follows your reading position | scroll only |
| `/contact/` | Physics keycaps (cannon-es) for Book / Email / WhatsApp / LinkedIn | drag and throw. Click opens the channel. On phones, tilting changes gravity |
| industries ×4 | One template with a per-industry artefact: ledger bars, store grid, route network, org tree | pointer parallax |
| secondary | Hire: three pods · MVP: core/supporting/later rings · React Native: one source to two devices · Calculator: a weeks tower that grows with your selections · Guide: a fanned 8-page booklet · Blog: an archive field · 404: a failed build | per page |

**Quality tiers** (`src/lib/quality.ts`). These are chosen at start and then adjusted
at runtime by a frame-time monitor.

| tier | when | what |
|---|---|---|
| `high` | fine pointer, WebGL2, ≥4 cores, no software renderer | DPR ≤ 1.75, bloom, full particle counts |
| `medium` | touch devices, mid GPUs | DPR ≤ 1.5, no post-processing, ~50% particles |
| `low` | software renderer, ≤2GB memory, Save-Data, or a sustained frame drop | DPR 1, static camera, ~20% particles |
| `off` | no WebGL | an SVG line-drawing poster of the scene. Never a blank or broken canvas |

**Mobile is designed, not degraded.** Below 900px:
- The hero phone is driven by **device tilt** (DeviceOrientation). On iOS a
  "Tilt to explore" chip asks for permission. Touch-drag is the fallback.
- On `/contact/`, tilting the phone **changes gravity** for the physics keycaps.
- Continuous scroll-scrub is replaced by per-section **pose snaps**, which are
  cheaper and never fight momentum scrolling.
- The canvas dims behind long text, and opaque sections pause rendering.

---

## 8. Signature details

1. **Cold-build loader.** It streams real module names (`routes`, `services`,
   `case studies`) with timings, fills a progress rule, then scans the page into
   view. It runs on first visit only, lasts at most 1.5s, and can be skipped with a
   click or Esc. It is skipped entirely under reduced motion.
2. **Build HUD**, bottom left: `▸ /work · §02 case studies · 38%`.
3. **Film grain.** A noise tile generated at runtime, animated in steps, at 5%
   opacity with `overlay` blend. It sits above everything and ignores pointer events.
4. **Self-drawing hairlines.** Section rules and dimension lines draw in on reveal.
5. **Custom cursor.** A 1px crosshair with a lagging ring. The ring grows and labels
   itself (`VIEW`, `DRAG`, `OPEN`) over elements with `data-cursor`. It is hidden on
   coarse pointers and never replaces focus styles.

---

## 9. Accessibility

- A skip link, a landmark per region, one `h1` per page and a logical heading order.
- Focus: a 2px vermilion outline with a 3px offset on every interactive element,
  always visible for keyboard users (`:focus-visible`).
- The mobile menu is a modal dialog with a focus trap, Esc to close and focus
  returned to the trigger.
- All 3D is `aria-hidden="true"`. Every 3D interaction has a DOM equivalent: the
  services list, the AI ideas list, the architecture layer list, the case links and
  the contact links.
- Text contrast meets WCAG AA in both themes (see §2). Images have alt text.
- The theme toggle and the motion permission chip are real buttons with labels.
