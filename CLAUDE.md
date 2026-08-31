# CLAUDE.md — Soni Consultancy Services website

Project handoff/context file. Everything below is fact, not aspiration. Resume from "PENDING WORK".

## What this is
Static marketing site for **Soni Consultancy Services** (React Native / MERN / AI app-development studio; founder **Het Soni**). Since 2026-08-19 also offers **WordPress/WooCommerce website development targeting the Indian market** (`/wordpress-website-development-india/`) — a genuinely separate, smaller service line; don't let it dilute the core RN/MERN/AI positioning elsewhere (not in primary nav, only in footer + linked from /services/).
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
15. (2026-08-19) New service line: `/wordpress-website-development-india/` — WordPress & WooCommerce website dev targeting India. User explicitly confirmed: no real WordPress portfolio yet (page is capability/process-only, no case studies), no on-page pricing (funnels to the lead form / free call). Has its own embedded lead-gen form (`#wpForm`) posting to the same Lambda pipeline as `/contact/` (`kind:"wordpress-india"` for inbox filtering — Lambda accepts any `kind` string, no backend change needed; phone number is folded into the `message` field since the Lambda has no dedicated phone field). Added `wpForm` to `analytics.js`'s lead-tracking list. Linked from footer "Explore" column (sitewide, all 44 pages via python script) and as service card 06 on `/services/` — deliberately NOT added to primary nav (keeps core RN/MERN/AI positioning intact). Sitemap regenerated (45 URLs), llms.txt updated.
16. (2026-08-29) 4 interactive WordPress-cluster blog posts (blog 23→27, sitemap 49 URLs), supporting the India WordPress service line, keywords validated via live web search first: `wordpress-website-cost-india` (INR cost calculator; market ranges ₹30K–80K basic / ₹1–2L WooCommerce sourced from 2026 India pricing research, clearly labeled market-range-not-our-quote — does NOT violate the no-invented-pricing rule since no SCS pricing is stated), `wordpress-vs-custom-website` (5-question decision quiz → WordPress/custom/hybrid), `woocommerce-payment-gateway-india` (Razorpay vs PayU vs Cashfree live fee comparator; facts researched: Cashfree 1.95%, PayU ₹4,999/yr AMC + WP.org plugin withdrawn June 2026), `wordpress-seo-speed-checklist` (10-point self-scorer, mirrors security-checklist pattern). All reuse the .dtool interactive pattern + FAQPage schema + share rows; cards added to blog index (data-cat="web"); cross-linked as a 4-card "Free guides & tools" strip on the WordPress service page; llms.txt cluster section added.
17. (2026-08-30) Interactive portfolio pass on `/work/`: added `.sim` component (real cropped screens from client-provided Figma case-study PDFs, tap/click/swipe device simulator with dot nav) to what were then Attled/POPProbe/Station; added 2 new real case studies from provided PDFs — Badho (real store links + metrics) and Carelynk (no store links — presented as a delivered platform like the Enterprise section, with a `.flow-tabs` interactive diagram of its real documented Nurse-App/Hospital-Dashboard IA instead of screenshots). Deepened Mita's copy with real research findings, framed honestly as research not results.
18. (2026-08-30) **NDA pseudonymization pass — all portfolio product names withheld.** User request: real names create NDA risk even for the 5 apps live on public app stores (searchable regardless of what we call them here), so ALL entries were renamed to generic industry-style labels and every App Store/Play Store link was **removed** (a live link would de-anonymize the label instantly) and replaced with a non-linking "✓ Live on the App Store & Google Play" badge. Mapping (old → new id/label): Attled→`#hr-payroll` "HR & Payroll Platform", Claris→`#creator-marketplace` "Creator–Venue Marketplace", POPProbe→`#retail-ops` "Retail Operations Platform", Station→`#ride-hailing` "Ride-Hailing Platform", Badho→`#b2b-wholesale` "B2B Wholesale Platform", Carelynk→`#healthcare-staffing` "Healthcare Staffing Platform", Mita→`#fan-investing` "Fan Investment Platform", NAPA→`#web3-creator` "Web3 Creator Platform". Propagated across all 12 files that referenced these names (home, work, hr-payroll/retail/ride-hailing/fintech/ai-app-development industry pages, react-native-app-development + 3 geo clones, 2 blog posts, llms.txt) — anchors, hrefs, FAQ text, FAQPage schema, meta descriptions, alt text, all updated. **Asset hygiene:** Attled/Claris splash screens had the real wordmark baked into the screenshot pixels (cropped from source PDFs) and were dropped from the simulators entirely (Attled/POPProbe/Station sims now show 4 real screens each, not 5); NAPA's 2 images had the token ticker baked into multiple UI elements (harder to crop cleanly) so NAPA was converted from screenshot device-images to a `.brand-tile` gradient panel (same pattern as Badho/Carelynk, which never had screenshots); Station's live-map screen had a "STN" abbreviation + a real-sounding hospital name in the header — re-cropped to exclude both. Mita's and the retained Claris/POPProbe/Station screens had no visible branding so those crops/renames were straightforward. All old real-named asset files deleted from `assets/portfolio/`; new files use the generic slug as filename prefix (e.g. `hr-payroll-sim-punch.webp`) so the NDA-safe convention also holds at the URL/filename level, not just in visible text. **This is now the standing convention — any NEW client case study added to the portfolio must follow the same pattern**: generic industry-style label, no store link (replace with the non-linking "Live on..." badge if it truly is live), and screenshots checked for baked-in real names/logos before use.

19. (2026-08-31) **Lead-tracking integration pass** — a pasted prompt asked for 5 fixes written for a Next.js/Supabase stack that doesn't match this repo (static HTML/JS, no build step); adapted the same 5 outcomes to the real stack instead of scaffolding non-functional React files:
    - **UTM & blog attribution** — new `assets/js/utm.js` (self-hosted, sitewide on all 51 pages). Captures real `utm_*` params into `sessionStorage`; on a blog post with no explicit UTM, infers `source=blog` / `campaign=<slug>`; while on a blog post, tags its Calendly + same-site CTA links with the stored UTM so Calendly's own dashboard also carries attribution. Exposes `window.scsUTM.get()`.
    - **Lead payload attribution** — the 6 lead-form pages (contact, app-cost-calculator, app-scoping-guide, cloud-cost-calculator, devops-maturity-assessment, wordpress-website-development-india) now do `Object.assign(payload, window.scsUTM.get())` right before their existing `fetch()` to the Lambda, so every lead carries `source`/`blog_post_title`/`utm_*` automatically.
    - **GA4 form/Calendly tracking** — already existed (`generate_lead` per-form event, `book_call_click` on any Calendly link, both in `analytics.js`, confirmed live). No new events added — `generate_lead` is GA4's own recommended event name for this exact use case, so it's the right thing to mark as a conversion, not `form_submission`. True Calendly **booking-completed** tracking (vs. click) is NOT implemented: the site opens Calendly in a new tab (`target="_blank"`), which has no postMessage channel back to our page, so completion can't be detected client-side without either (a) switching to Calendly's embedded popup widget — requires loading `assets.calendly.com/widget.js`, which breaks the site's no-CDN/self-hosted-JS policy and needs a CSP change, or (b) Calendly webhooks → a new Lambda endpoint (needs Calendly's paid plan + a webhook signing secret). Neither was built; flagged below for a decision.
    - **Supabase leads DB** — `scs-lead-mailer` Lambda (`.deploy/lambda/index.mjs`) extended with a `saveLead()` step run after the existing owner email, using plain `fetch` to Supabase's PostgREST endpoint (Node 20 has native `fetch`, no new dependency/bundle needed). Wrapped so a DB failure never blocks the email that already works. **Deployed live** (`aws lambda update-function-code`, verified via a real end-to-end POST: `{"ok":true,"owner":true,"visitor":true,"db":false}` — `db:false` is correct/expected, see below). Schema + step-by-step setup in `.deploy/SUPABASE-SETUP.md` (deliberately dropped the `UNIQUE` constraint on `email` from the schema someone might hand you elsewhere — a second inquiry from the same person should be a new row, not an overwrite). **Currently a safe no-op**: `SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY` aren't set on the Lambda yet — see PENDING WORK.
    - **GA4 conversion goals** — no code involved, this is GA4 Admin UI only. Mark `generate_lead` and `book_call_click` as key events/conversions (Admin → Events → toggle "Mark as conversion" — GA4 no longer needs the separate "New conversion event" flow the pasted prompt described).
    - Deployed + verified live (curl + a headless browser check: `window.scsUTM.get()`, link-tagging, and zero console/CSP errors on a blog post loaded with real UTM params).

20. (2026-09-01) **Internal inbound dashboard — Phase 1 (dashboard + lead scorer).** User pasted a "Master Prompt" asking for a full React/Node system (blog auto-generator/auto-publisher, LinkedIn tracker, lead scorer, call coach, 5-page dashboard) wired to GA4/GSC/Calendly/LinkedIn APIs and a WordPress/Webflow CMS — none of which exist on this repo (static HTML, no build step, no CMS, no API credentials for those services in this session, can't run OAuth non-interactively). Per user's explicit scoping choice: adapted to the real stack, ran a blog-keyword audit before drafting anything (see below — most Tier-1 keywords already have a live post), and built Phase 1 only (dashboard + lead scorer; LinkedIn weekly form and blog content are next, not yet done).
    - **New page**: `/internal/dashboard/` — private, NOT part of the public site (noindex, no nav/footer link, excluded from sitemap, `Disallow: /internal/` in robots.txt, and gated by **HTTP Basic Auth** enforced in the `scs-url-rewrite` CloudFront Function before the request ever reaches S3 — credential given to Het in chat when built, not stored in this file; `.deploy/DASHBOARD-SETUP.md` has the operational detail. Rotate by asking Claude to regenerate + republish the function).
    - Reads/writes the existing Supabase project (`cfivbhuoxlitfoubmxwv`): the `leads` table (extended with `segment`/`company_size`/`budget_expressed`/`timeline`/`tech_openness`/`objection`/`score_breakdown` columns for scoring) and a new `linkedin_weekly` table (one row per week, JSONB columns for template A/B/C and segment breakdowns — the weekly-manual-entry design the master prompt itself specified for LinkedIn data). **RLS enabled** on both tables with an `anon` SELECT/INSERT/UPDATE policy (no DELETE) — the dashboard authenticates with the Supabase anon key client-side, protected in front by the Basic Auth gate above; full detail + the SQL migration is in `.deploy/DASHBOARD-SETUP.md`.
    - **Lead scorer**: implements the master prompt's System 3 formula (stage/size/budget/timeline/tech/objection point values) client-side. The prompt's own point values sum to 38, not 10, while it calls the output a "1–10" score — normalized `raw/38 → 1–10` as Claude's adaptation (flagged inline in the page's own comments). Prediction-by-segment-and-score only shows the four numbers the user actually gave (early-stage 8+/5-7 → 70%/40%, mid-stage 8+/5-7 → 40%/20%); every other segment/score combination shows "no data yet" rather than an invented rate, per the never-invent-metrics hard rule.
    - **Recommendations panel**: rule-based only (best segment/worst objection/winning template by real close-rate, computed from Het's own entered data), with an explicit minimum sample size (≥3 leads, ≥5 template sends) before it'll name a winner — shows "not enough data" below that, never a guess.
    - **CSP updated**: added `https://cfivbhuoxlitfoubmxwv.supabase.co` to `connect-src` on the `scs-security-headers` response-headers policy (the dashboard is the first thing on this site to call Supabase from the browser — everything before this was server-side, Lambda → Supabase).
    - **Not built** (blocked on credentials this session doesn't have, or on the user's own action): GA4/GSC automated pulls (blog traffic/keyword-rank sections of the master prompt), LinkedIn API (the prompt's own design already falls back to manual weekly entry, which is what got built), auto-publish-to-CMS (there is no CMS — publishing still means committing an HTML file + the documented deploy).
    - **Blog-keyword audit** (done, no drafts written yet): checked all 27 existing blog posts against the master prompt's 30-keyword list — at least 6 of the 8 "Tier 1" keywords already have a directly-overlapping live post (`react-native-app-development-cost`, `how-long-to-build-an-app`, `ai-app-development-cost-2026`, `react-native-vs-flutter-2026`, `hire-react-native-developers`, `app-maintenance-cost`). Full net-new-keyword gap analysis + drafting is still pending — see PENDING WORK.
    - **Activation still needs Het**: run the SQL in `.deploy/DASHBOARD-SETUP.md`, then hand back the Supabase **anon** key (not service_role) so it can be pasted into the page's `SUPABASE_ANON_KEY` constant and redeployed. Until then the page loads correctly (verified live, zero console/CSP errors) but shows a "not configured" banner instead of data.

## PENDING WORK (resume here)
Blocked on user input:
1. ~~Meta Pixel ID~~ **DONE 2026-06-13** — pixel `4314120685517416` live on all pages, CSP updated. Remaining (user task): build retargeting/custom audiences in Meta Events Manager.
2. ~~4–8 real client testimonials~~ **DONE 2026-06-26** — 3 real testimonials (GoodFirms + 2 LinkedIn) live on home + work. More can be added to the same `.tcard` grids if supplied.
3. **Real pricing/engagement ranges** → build /pricing page (multi-currency) and recalibrate calculator RATE_LO/RATE_HI (currently rough placeholders).
4. Microsoft Clarity → user creates project, then add snippet.
5. ~~Supabase leads DB~~ **DONE 2026-08-31** — project created (`cfivbhuoxlitfoubmxwv`, Sydney region), `leads` table created, `SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY` (using Supabase's newer "secret key" format, `sb_secret_...`) set as `scs-lead-mailer` env vars, verified end-to-end (`{"db":true}`, row confirmed via a direct read against the leads table). Every lead now lands in Supabase in addition to the owner email.
6. **Calendly booking-completed tracking — needs a decision, not just credentials.** Two real options, both with a real cost, see item 19 above: (a) embed Calendly's popup widget instead of opening a new tab (adds a CDN script + CSP change), or (b) Calendly webhooks → a new Lambda endpoint (needs a paid Calendly plan). Until one is chosen, `book_call_click` (a real click on a Calendly link, already live) is the closest available signal and is what's being marked as the GA4 conversion for calls.
11. **Activate the inbound dashboard (item 20)** — run the SQL in `.deploy/DASHBOARD-SETUP.md`, then give Claude the Supabase **anon** key so it can be wired into `/internal/dashboard/`.
12. **GA4/GSC read access, if you want the dashboard's blog-traffic/keyword-rank sections built** — needs a GA4 + Search Console service account (JSON key) you create and hand over; not attempted without it. Blog *lead* conversion (submissions attributed `source=blog`) already shows on the dashboard from existing Supabase data — only raw traffic/keyword-rank pulls are missing.

Not blocked (can do anytime):
7. ~~Deepen remaining blog posts to pillar length~~ **DONE 2026-06-14** — all 4 (ai-agent-development-services, build-vs-buy-ai-cto-framework, mvp-to-product-market-fit, nextjs-saas-architecture) are 1000-1250 words with FAQPage schema. Blog is now 22 posts total.
8. Email nurture sequence once an ESP is chosen (Brevo suggested; Zoho CRM was REMOVED from scope by user — do not re-add).
9. SEO/AI-SEO: still open — the off-site authority track (see User-side tasks below) is the main lever left; on-site technical SEO is in good shape (schema, llms.txt, FAQ coverage, sitemap all current as of 2026-08-19).
10. **In GA4 Admin, mark `generate_lead` and `book_call_click` as conversions** (see item 19) — 5 minutes, unblocks the funnel view.
13. **Blog gap-analysis → drafts, from the master prompt's 30-keyword list (item 20).** Tier-1 dedupe done (6 of 8 already covered by existing posts); still need the full net-new list across all 30 + then actual drafts, 2-3/week, per the user's "audit first" choice. Use labeled external market-range costs (the pattern already used for the WordPress cost cluster), never invented SCS pricing.
14. **LinkedIn weekly-tracking form** — the dashboard's entry form + `linkedin_weekly` table already exist (item 20) and are ready to use as soon as the SQL is run; no further building needed, just data entry.

User-side tasks (remind, can't do for them):
- Create Clutch / DesignRush / GoodFirms / Google Business Profile listings + request client reviews (single biggest lever for both Google rankings and AI-answer-engine citation — paste-ready kit in `.deploy/MARKETING-KIT.md`).
- Resubmit sitemap in GSC + request indexing on newer pages (geo pages, hire/devops/calculator pages).
- Bing Webmaster Tools verification (also feeds Bing/Copilot AI answers).
- Request SES production access (enables visitor auto-replies from calculator/contact).
- **Rotate the AWS access key that was pasted into chat** (exposed; still active).

## Hard rules
- NEVER invent metrics, store links, tech stacks, testimonials, social URLs, or pricing. If information is missing: stop and ask.
- Concepts (Web3 Creator, Fan Investment) must stay labeled "Product & UI/UX design concept" — no fake results.
- **Portfolio case studies never show the real client/product name** (NDA pseudonymization pass, 2026-08-30 — see COMPLETED #18). Any new case study gets a generic industry-style label + id (e.g. "Healthcare Staffing Platform" / `#healthcare-staffing`), never the real name — even if the app is live and publicly searchable on the App Store. No App Store/Play Store links on ANY portfolio entry (a link de-anonymizes the label); if genuinely live, use the non-linking "✓ Live on the App Store & Google Play" badge (`.chip.on`) instead. Before using any client-provided screenshot, check it for a baked-in real wordmark/logo/token-ticker in the pixels — crop it out, pick a different screen, or fall back to a `.brand-tile` gradient panel (no screenshot) if the branding can't be cleanly removed. Asset filenames must use the generic slug too, not the real name.
- Don't redesign visual styling while doing SEO/content tasks.
- Match existing code style: compact inline-style HTML, CSS vars, no frameworks, no build step.
- After every change: deploy (sync+invalidate), verify live with curl, secret-scan, commit to main, push.
