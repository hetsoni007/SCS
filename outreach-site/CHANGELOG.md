# Changelog

## 2026-09-27: first build (branch `claude/charming-meitner-vwmb0x`, not deployed)

### Content (Part 1)
- **Flagship, `/articles/the-audit/`** (2,139 words): the 201-thread count, why counting beats
  rewriting, the five root causes in order of damage, signal-based targeting and the 0–90 day
  window, the five-step audit-first method, the Quest email against the real generic one, the
  two-touch cap, and a soft pointer to the tools. Seven numbered sections with an in-page contents.
- **Four deep dives**, each expanding one numbered section of the flagship and linking back to it:
  - `/articles/what-failed/` (668 words): a self-diagnostic with a tickable "Check yourself" line
    after each root cause.
  - `/articles/signal-based-targeting/` (739 words): phrase families, a LinkedIn search how-to
    checked against LinkedIn Help (straight quotes, uppercase OR, Posts → Latest → Past week), why
    intent beats titles, and a to-scale day 0–150 timeline with day 3 and day 120 marked.
  - `/articles/audit-first-method/` (771 words): the five steps with tools (PageSpeed Insights,
    Mac/Windows/DevTools screenshots) and a four-part template for writing a finding that doesn't
    read like a canned insert.
  - `/articles/the-quest-email/` (659 words): the generic email (verbatim) next to the Quest
    email's structure, annotated line by line in blue pencil.
- Every number lives in `data/stats.json` and is referenced by token. The build fails if an audit
  figure is typed into content directly.
- Nothing invented. No real company names, no testimonials, no logos, and no metrics beyond the
  brief. Quest is only ever "a company I'll call Quest". Illustrative examples are labelled as
  made-up, and the timeline's fade is labelled as a judgement, not data.

### Site (Part 2)
- Pages: `/`, `/articles/` (an index, added so the path never 404s), the five articles, `/tools/`,
  `/tools/outreach-crm/`, `/tools/prospect-scorer/`, and a branded 404.
- Editorial design: white page with one accent (an editor's "blue pencil"), used for links, focus
  states and the teardown annotations. Newsreader for H1/H2, Schibsted Grotesk for body text,
  IBM Plex Mono for numbers and the email-header-style byline ("FROM · DATE · READ"). Reading
  column about 70 characters wide. Light and dark themes (system default plus a toggle that
  remembers). Fonts are self-hosted (latin subset, about 250 KB total), with no CDN.
- SEO and sharing: unique title (60 characters or fewer) and description (160 or fewer),
  canonical, Open Graph and Twitter tags, and JSON-LD (BlogPosting, WebApplication, WebSite,
  BreadcrumbList, Person) on every page. Also a sitemap, robots.txt (keeps `/downloads/` out of
  search) and llms.txt. Each page has its own 1200×630 share image, and articles have
  "Share on LinkedIn" and "Copy link".
- The studio connection: every footer has one line, "Built by Het Soni, founder of Soni
  Consultancy Services", linking to the studio with UTM tags. The main site's `utm.js` then
  attributes any resulting inquiry. The only active CTA is on `/tools/outreach-crm/`, and the
  build enforces that it appears exactly once.

### Tools
- **Two-touch CRM** (`/tools/outreach-crm/`):
  - The cap is structural. A record has exactly two touch slots, and after touch 2 the only
    actions are reply, no, close, or log an auto-reply. There is no third-touch button, hidden or
    disabled.
  - Imports and stored data pass through the same sanitizer, so a `touch3` column or a `t3`
    field is ignored.
  - Touch 2 must carry new information: "just following up" is refused.
  - A "no" is final.
  - Contacted prospects can't be deleted, and the same person can't be added twice, so
    delete-and-re-add can't reset the cap.
  - Auto-replies are logged but never counted, and the honest-count panel shows the reply rate
    with auto-replies excluded.
  - It opens on labelled sample data, works on session data with no login, and saving or
    exporting (CSV/JSON) asks for an email once.
  - One-step undo, a recruiter warning, signal-window and score chips per prospect, and CSV
    export guarded against spreadsheet formula injection.
- **Prospect scorer** (`/tools/prospect-scorer/`): signal type, company size and days since the
  trigger give a 1–10 score, a verdict and a one-line reason, with the breakdown and a mini
  window timeline. No gate. Inputs live in the URL, so "Copy link to this score" shares an exact
  result. The weights are printed on the page and shared with the CRM.

### Lead capture
- The three layers from the brief, plus the CRM export unlock, all post to the existing
  `scs-lead-mailer` endpoint the main site uses. It was wired, not stubbed. Forms send only from
  the production hostname and run dry everywhere else. A backend hiccup never blocks a download.
- Downloads, generated from the same content by `build.py --assets`:
  - `cold-outreach-playbook.pdf`: 22 pages, all five pieces, cover, contents, page numbers.
  - `outreach-sequence-structure.pdf`: 2 pages, the sequence, the rules and a column-by-column
    template guide.
  - `two-touch-crm-template.csv`: the same 16 columns the CRM exports, so it round-trips.

### Repo safety
- `outreach-site/*` added to the main site's `aws s3 sync` excludes in CLAUDE.md. `DEPLOY.md`'s
  older sync command, which excluded almost nothing, now matches it.
- `__pycache__/` ignored.

### Checks
- `node scripts/verify.mjs` passed 288/288. That covers every page at 1366, 768, 390 and 375px
  in light and dark, under the production CSP with zero violations, and axe-clean. It also covers
  the CRM cap through the UI, CSV and JSON import, the scorer maths and share links, and every
  capture flow.
- `python3 build.py --check` is clean and the build is idempotent. Internal links and anchors are
  verified on every build.

## Not done / needs your input

1. **Going live (yours):** certificate, bucket, CloudFront, clean-URL function, headers policy and
   the `outreach` CNAME at Hostinger. The steps and the exact CSP are in `README.md`. Nothing was
   created or deployed.
2. **How outreach leads look in your inbox:** the Lambda scores every kind the same, so a
   playbook download arrives as `[COLD] New inquiry — you@… — unspecified — no budget given`. A
   small change to `backend/lead/compose.mjs` (an `[OUTREACH]` subject per kind) would fix it.
   Not done, because backend deploys were out of scope.
3. **Auto-reply wording:** if `AUTO_ACK_ENABLED` is ever turned on, `outreach_*` signups would
   get the "I read every brief personally" reply. The newsletter kind is already excluded.
4. **Newsletter list:** signups use kind `newsletter`, the same kind as the main site's list. They
   are told apart by `want` = "Outreach teardowns newsletter" and the outreach `source_page`.
   There's no ESP yet (CLAUDE.md pending #8), so nothing sends the teardown emails. Say if you
   want a separate kind.
5. **The real Quest email:** it wasn't in the brief, so the Quest piece shows its exact structure
   on a clearly labelled made-up company. Send the real one (redacted) if you want it verbatim.
6. **Headline vs. body:** the headline says "zero replies" (your wording, kept). The body says
   zero *positive* replies and 35+ rejections, and the opening lines deal with that head-on.
7. **The buckets don't add to 201:** 1 + 18 + 35 + 50 + 70 = 174. The site never claims they do.
   Each bar is "out of 201" and "+" means "at least". If threads overlap or there's an "other"
   bucket, tell me and the chart can show it.
8. **Numbers not used:** your personal site cites +22% reply rate, 35 SQLs in 60 days and a >50%
   volume drop. They were left out because the brief limited the metrics.
9. **Judgement calls to confirm:**
   - The scorer weights (derived from the articles).
   - The site name "Outreach Teardowns" (one line in `site.json`).
   - Publish dates, all 2026-09-27 (change them on launch day).
   - No analytics added (GA4 would need CSP changes).
10. **het.soniconsultancyservices.com** doesn't resolve yet, so it isn't linked. Author links go to
    LinkedIn.
