# CLAUDE.md — Soni Consultancy Services website

Project handoff/context file. Everything below is fact, not aspiration. Resume from "PENDING WORK".

## What this is
Static marketing site for **Soni Consultancy Services** (React Native / MERN / AI app-development studio; founder **Het Soni**).
- Live: **https://soniconsultancyservices.com** (apex + www)
- Plain HTML/CSS/JS. **No build step.** The repo root is the deploy artifact. Clean URLs via `folder/index.html`.
- Repo: github.com/hetsoni007/SCS, branch `main`, direct commits (no PRs).

## Repo layout
```
index.html                 homepage
liquid.css / liquid.js     design system + animations (shared by every page)
analytics.js               GA4 + custom events (loaded on every page)
404.html                   branded 404 (no nav/footer; has quick-links row)
services/ work/ about/ contact/ hire/ privacy/        core pages
ai-app-development/        AI services page
app-cost-calculator/       interactive lead-gen estimator (email-gated)
react-native-app-development/                          flagship intent page
fintech-app-development/ retail-app-development/
ride-hailing-app-development/ hr-payroll-app-development/   industry pages
blog/                      index + 6 articles (each its own folder)
assets/portfolio/          case-study screens (webp + napa jpg)
assets/js/                 self-hosted gsap.min.js, ScrollTrigger.min.js, lenis.min.js
assets/fonts/              self-hosted Inter (inter-latin.woff2, inter-latin-ext.woff2)
assets/og.png              OG image 1200×630
sitemap.xml robots.txt llms.txt favicon.svg
google3c3389cc0cde5740.html   GSC verification file (do not delete)
.deploy/                   gitignored — infra IDs, Lambda source, sitemap script
```

## Design system (liquid.css / liquid.js)
- Dual theme on `html[data-theme="dark"|"light"]`. Dark = default. Inline FOUC script in every `<head>` reads `localStorage['scs-theme']`. Toggle = `#themeBtn`.
- Gold accent `#C9A24B` (`--gold`, `--gold-light`, `--gold-dim`, `--gold-grad`). All colors are CSS vars.
- Animations: Lenis smooth scroll + GSAP/ScrollTrigger (self-hosted, NO CDNs). Helpers: `[data-reveal]`, `[data-reveal-group]`, `[data-count]`, `[data-type]`, `[data-tilt]`, `[data-magnetic]`, `[data-parallax]`.
- Hover micro-interactions (subtle): card lift+gold glow (`.proc/.region/.blog-card/.metric-pill`), image zoom (`.zoom`, `.shot`, `.blog-thumb`), animated underline on footer column links only (`.foot-top div>h4~a`).
- Responsive: breakpoints 980px and 620px. Inline fixed-column grids carry utility classes `.g3/.g4/.g5/.gauto` that collapse them (defined at the end of liquid.css). Verified zero horizontal overflow at 375px and 768px on every page.
- Floating WhatsApp button `.wa-fab` on every page → wa.me/918160682185.
- Nav (every page): `Services · Work · Blog · AI Apps · About · Contact` + Book a Call (Calendly). Burger + `.mobile` menu under 980px.
- Footer (every page except 404): brand + social icons row, then columns Explore / Industries / Company / Start (5-col grid `.foot-top`).

### Gotchas (learned the hard way — do not repeat)
- **Do NOT use `[style*="..."]` attribute selectors**: GSAP rewrites style attributes and the browser reserializes `repeat(4,1fr)` → `repeat(4, 1fr)`, silently breaking the match. Use classes.
- The footer-underline rule must stay scoped to `.foot-top div>h4~a`; a broader selector (`a:not(.brand)`) squashed the social icons to ovals via `width:fit-content`.
- `sips` on this Mac cannot write WebP. Use Pillow (`python3 -m pip ... --user pillow`); images via pymupdf (`fitz`) + PIL.
- zsh: unquoted `*` glob-expands; use `/usr/bin/curl` if `curl` not found when sandbox off.
- **CSP img-src needs `data:`** (grain texture is a JS-built data: SVG via ScrollTrigger) **and `https://www.linkedin.com`** (Insight tag li_sync cookie-sync pixel). Meta Pixel needs `https://connect.facebook.net` (script-src) + `https://www.facebook.com` (img-src & connect-src). GoodFirms widget (home page) needs `https://assets.goodfirms.co` in script-src + img-src + connect-src **and `https://*.goodfirms.co` in frame-src** (the widget injects an iframe to widget.goodfirms.co) — added 2026-06-18. NOTE: as of 2026-06-18 widget.goodfirms.co serves `X-Frame-Options: SAMEORIGIN` (Cloudflare-gated), so the badge won't embed until the domain is whitelisted/the widget activated in the GoodFirms dashboard — that's a GoodFirms-side header, not fixable here. Found only by loading live pages in headless Chrome and grepping stderr for "violates" — always do that after CSP edits.
- The Edit tool often hits "file modified since read" on this repo — Python read-modify-write via Bash is the reliable path for sitewide changes.

## Infrastructure & deploy
- AWS profile **`prod`**, region **ap-south-1**, account 043174661808. CLI lives at `$HOME/Library/Python/3.9/bin`.
- S3 (private) + CloudFront + OAC. CloudFront Function `scs-url-rewrite` (viewer-request): clean-URL rewrite + 301s for legacy `/usa /uk /uae /australia /canada` → `/`. Errors 403/404 → `/404.html`.
- **Exact bucket/distribution IDs + full runbook: `.deploy/RESOURCES.md`** (gitignored, local only).
- Deploy after any change:
```bash
export PATH="$HOME/Library/Python/3.9/bin:$PATH"; export AWS_PROFILE=prod
bash .deploy/generate-sitemap.sh        # regenerates sitemap.xml from canonicals (only if pages added/removed/edited)
aws s3 sync . s3://<BUCKET> --delete \
  --exclude ".git/*" --exclude "*.DS_Store" --exclude "README.md" \
  --exclude "DEPLOY.md" --exclude "CLAUDE.md" --exclude ".deploy/*" \
  --exclude ".claude/*" --exclude "generate-sitemap.py" --exclude "social-kit/*"
aws cloudfront create-invalidation --distribution-id <DIST_ID> --paths "/*"
```
- Always verify live afterwards with `curl` (cache-bust with `?cb=$RANDOM`).
- Lead/email backend: API Gateway HTTP API `https://9cjt6qwy71.execute-api.ap-south-1.amazonaws.com` → Lambda `scs-lead-mailer` (Node 20) → SES → het.soni@soniconsultancyservices.com. Used by the contact form and the cost calculator. **SES is in sandbox**: owner receives leads, visitor auto-reply is blocked until production access is requested (user task). Account gotcha: public Lambda Function URLs return 403 — use API Gateway; let API GW own CORS (Lambda must return no CORS headers).
- Git: commit to `main`, push to origin. **Secret-scan before every commit** (`grep -rE 'AKIA[0-9A-Z]{16}'` over tracked files). `.deploy/` and `.DS_Store` are gitignored.

## Analytics / SEO state
- GA4 `G-0J9H7CBX0Q` via analytics.js. Custom events: book_call_click, generate_lead, scroll_depth, outbound_click, whatsapp_click (delegated to any wa.me link), calculator events.
- LinkedIn Insight Tag partner id `10397217` on all 22 pages.
- Meta Pixel `4314120685517416` on all pages (added 2026-06-13). No Microsoft Clarity yet.
- Schema live: Organization (sameAs = LinkedIn/Instagram/Facebook/Medium) sitewide; Service + FAQPage + BreadcrumbList on intent/industry pages; FAQPage on /contact; BlogPosting+Person on articles; WebSite on home; WebApplication on calculator.
- GSC verified (DNS + HTML file + meta tag). robots.txt + sitemap.xml (21 URLs, auto-generated) + llms.txt live.
- Unique titles ≤60 / descriptions ≤160 / canonical on every page. Brotli on, TTFB ~90ms, security headers via custom CloudFront response-headers policy `scs-security-headers` (HSTS, nosniff, X-Frame, referrer-policy, CSP, Permissions-Policy).

## Social / contact facts (the ONLY real ones — never invent others)
- LinkedIn https://www.linkedin.com/in/hetsoni/ · Instagram https://www.instagram.com/soni.consultancyservices/ · Facebook https://www.facebook.com/soniconsultancyservices · Medium https://medium.com/@hetsoni9398
- WhatsApp/phone +91 8160682185 · Email het.soni@soniconsultancyservices.com
- Calendly https://calendly.com/het-soni-soniconsultancyservices/introductory

## COMPLETED (chronological)
1. Full liquid-glass redesign, dark+light themes, all pages migrated; old shared.css/js deleted.
2. AWS S3+CloudFront deployment (private bucket, OAC, URL-rewrite function, custom domain + ACM).
3. Portfolio case studies on /work/: Attled, Claris, POPProbe, Station (real metrics from client docx files) + NAPA and Mita as labeled design concepts + Claris/Mita extra-screen galleries (`.shots`).
4. Contact/calculator lead pipeline (API GW → Lambda → SES).
5. SEO hardening: titles/descriptions/canonicals, schema, OG image, 301s, GSC verification, auto-sitemap script.
6. Performance/security: self-hosted fonts+JS (no CDNs), WebP images (~89% smaller), light-mode contrast fix (WCAG AA), security headers, image width/height attrs (CLS).
7. GA4 + custom events; later LinkedIn Insight Tag.
8. Blog added to top nav (right of Work); footer socials (4 icons); subtle hover animations.
9. Lead-gen Sprint 1: /app-cost-calculator/ (email-gated estimator), FAQPage/WebSite/Breadcrumb schema pack, CWV fixes, llms.txt, contact-form validation.
10. Lead-gen Sprint 2 (content half): /react-native-app-development/ + 4 industry pages (built ONLY from real case studies), footer Industries column, blog pillar expansion of ai-app-development-cost-2026 (~1,400 words, FAQ block).
11. Mobile/tablet responsive pass (utility grid classes; 0 overflow at 375/768), WhatsApp floating button, LinkedIn tag, footer-icon fix.
12. Blog pillar expansion of react-native-vs-flutter-2026 (~2.9k words, 12 sections, FAQPage schema, dateModified). CSP + Permissions-Policy headers live via custom response-headers policy `scs-security-headers` (replaced AWS managed policy; verified 0 violations in headless Chrome on home/calculator/blog).
13. (2026-06-14 to 06-27, see memory) All 4 remaining thin blog posts deepened to pillar length + FAQPage schema; 8 new blog posts written (blog 6→22, incl. an interactive/tool-style cluster — stack picker, security scorer, revenue explorer, decision tools); 3 geo landing pages (react-native-app-development-{uk,dubai,usa}); `/hire/`, `/devops-cloud-engineering/`, `/cloud-cost-calculator/`, `/devops-maturity-assessment/` pages added; real testimonials (3, non-fabricated) shipped as `.tcard` social-proof section on home + work (deliberately no Review/AggregateRating schema — see memory); trust-microcopy + founder card on home. Sitemap now 44 URLs.
14. (2026-08-19) AI-SEO / on-site pass: expanded `llms.txt` from ~11 links to the full 44-URL sitemap (organized by section); added FAQPage schema + visible `.faq` accordions to the 5 top-level pages that lacked it (`/services/`, `/work/`, `/about/`, `/ai-app-development/`, `/hire/`) — all FAQs grounded in existing on-page copy, nothing invented; added standalone `Person` schema for Het Soni on `/about/` (no `image` field — no real headshot exists yet).

## PENDING WORK (resume here)
Blocked on user input:
1. ~~Meta Pixel ID~~ **DONE 2026-06-13** — pixel `4314120685517416` live on all pages, CSP updated. Remaining (user task): build retargeting/custom audiences in Meta Events Manager.
2. ~~4–8 real client testimonials~~ **DONE 2026-06-26** — 3 real testimonials (GoodFirms + 2 LinkedIn) live on home + work. More can be added to the same `.tcard` grids if supplied.
3. **Real pricing/engagement ranges** → build /pricing page (multi-currency) and recalibrate calculator RATE_LO/RATE_HI (currently rough placeholders).
4. Microsoft Clarity → user creates project, then add snippet.

Not blocked (can do anytime):
5. ~~Deepen remaining blog posts to pillar length~~ **DONE 2026-06-14** — all 4 (ai-agent-development-services, build-vs-buy-ai-cto-framework, mvp-to-product-market-fit, nextjs-saas-architecture) are 1000-1250 words with FAQPage schema. Blog is now 22 posts total.
6. Email nurture sequence once an ESP is chosen (Brevo suggested; Zoho CRM was REMOVED from scope by user — do not re-add).
7. SEO/AI-SEO: still open — the off-site authority track (see User-side tasks below) is the main lever left; on-site technical SEO is in good shape (schema, llms.txt, FAQ coverage, sitemap all current as of 2026-08-19).

User-side tasks (remind, can't do for them):
- Create Clutch / DesignRush / GoodFirms / Google Business Profile listings + request client reviews (single biggest lever for both Google rankings and AI-answer-engine citation — paste-ready kit in `.deploy/MARKETING-KIT.md`).
- Resubmit sitemap in GSC + request indexing on newer pages (geo pages, hire/devops/calculator pages).
- Bing Webmaster Tools verification (also feeds Bing/Copilot AI answers).
- Request SES production access (enables visitor auto-replies from calculator/contact).
- **Rotate the AWS access key that was pasted into chat** (exposed; still active).

## Hard rules
- NEVER invent metrics, store links, tech stacks, testimonials, social URLs, or pricing. If information is missing: stop and ask.
- Concepts (NAPA, Mita) must stay labeled "Product & UI/UX design concept" — no fake results.
- Don't redesign visual styling while doing SEO/content tasks.
- Match existing code style: compact inline-style HTML, CSS vars, no frameworks, no build step.
- After every change: deploy (sync+invalidate), verify live with curl, secret-scan, commit to main, push.
