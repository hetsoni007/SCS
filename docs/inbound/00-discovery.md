# 00 — Discovery (Phase 0, read-only)

Date: 2026-09-21 · Status: **awaiting GATE 0 approval** · No code or copy changed.

---

## 1. Stack summary

| | |
|---|---|
| Framework | **None.** Hand-written static HTML, one file per route (`folder/index.html`). |
| Build step | **None.** The repo root *is* the deploy artifact. |
| Rendering | Static. No SSR, no hydration, no router. |
| CSS / JS | `liquid.css` + `liquid.js` shared by every page; GSAP + ScrollTrigger + Lenis self-hosted in `assets/js/` (no CDNs, deliberate policy). |
| Hosting | S3 (private) + CloudFront + OAC. CloudFront Function `scs-url-rewrite` does clean-URL rewrites and legacy 301s. |
| Deploy | `aws s3 sync . s3://<bucket> --delete` + CloudFront invalidation. Manual, from this repo. |
| Backend | API Gateway HTTP API → Lambda `scs-lead-mailer` (Node 20) → SES. Source: `.deploy/lambda/index.mjs` (gitignored). |
| Database | Supabase `leads` table, written best-effort from the Lambda. |
| Env handling | Lambda environment variables set in AWS. **There is no `.env` file and no process that reads one.** |
| Analytics | `analytics.js` (GA4 `G-0J9H7CBX0Q`), Meta Pixel, LinkedIn Insight, all inline per page. |
| Chat | **Tawk.to live chat, already on all 59 pages** (added earlier today, commit `4089807`). |

### Scale (measured, not estimated)
- **23** non-blog pages + **34** blog posts + `404.html`
- **58** URLs in `sitemap.xml`
- **287** links to the single Calendly URL across the site

---

## 2. Conflicts between the brief and the repo

These are the things I need you to decide before I build anything. I've flagged them rather than quietly adapting, because each one changes the shape of the work.

### 2.1 The brief assumes a Node/Next app. This is a static site with no server. ⚠️ **Biggest one**

The brief specifies `POST /api/lead`, `POST /api/chat`, "server route", "SSR output", `prompts/concierge.md`, `kb/studio.md`. There is no server process and no build step here — nothing in this repo can host a route.

**This is not a blocker, but it changes the plan:**

| Brief says | Here it becomes |
|---|---|
| `POST /api/lead` | New route on the existing API Gateway → extend `scs-lead-mailer` (or a new sibling Lambda) |
| `POST /api/chat` | **New Lambda + new API Gateway route** (real new infra; holds `ANTHROPIC_API_KEY` server-side) |
| `.env.example` | Lambda environment variables + a documented list in the repo |
| "must not hurt SSR output" | N/A — no SSR. Concern becomes: don't hurt the static HTML or CWV. |
| `prompts/`, `kb/`, `docs/` | Fine as repo files — but see §5 risk about the deploy sync. |

Everything you asked for is achievable. It's Lambda work, not Next.js work.

### 2.2 There is already a chat widget on every page

Tawk.to went live on all 59 pages **today**. Phase 2 would add a second, competing chat bubble. You need to pick one:

- **(a) Replace Tawk.to with the Opus concierge** — one bubble, AI-first, escalates to you by email. Loses Tawk's human-takeover inbox and mobile app.
- **(b) Keep Tawk.to, skip the concierge** — cheapest, but no qualification, no scoring, no lead capture into your pipeline.
- **(c) Keep both, separated** — e.g. concierge on commercial pages, Tawk on the rest. Two vendors, two inboxes, more to maintain.

My recommendation: **(a)**. The concierge is the thing that does the qualifying work Tawk cannot, and two bubbles on one page reads as unfinished.

### 2.3 The WhatsApp button described in the brief no longer exists

Your audit says *"The WhatsApp button appears on only some pages."* As of today it appears on **zero** pages — it was removed sitewide and replaced by Tawk.to, at your request, earlier in this session.

What's left of `wa.me` today: **share-this-article buttons** in 30 blog post share rows (those share the post to WhatsApp, they don't contact you) and **one** genuine contact link on the WordPress page.

Phase 3 asks for "WhatsApp button on every page", which reverses today's decision. Tell me which you want — WhatsApp *and* chat, or chat only.

### 2.4 Smaller corrections to the brief's facts

| Brief says | Actual |
|---|---|
| "about 29 posts" | **34** blog posts |
| geo pages `/usa`, UK, Dubai | Real pages are `/react-native-app-development-{usa,uk,dubai}/`; bare `/usa` etc. are **301 redirects** |
| "Forms exist on contact, calculator, scoping guide and WordPress" | **Six** lead forms (adds cloud-cost-calculator + devops-maturity-assessment), plus a newsletter form on all 34 blog posts |

---

## 3. Every form and CTA

### 3.1 Lead forms (6) — all POST to the same Lambda

| Page | Form id | `kind` | Fields collected |
|---|---|---|---|
| `/contact/` | `contactForm` | `contact` | first, last, email, company, service, message |
| `/app-cost-calculator/` | `calcLeadForm` | `calculator` | name, email (+ computed estimate) |
| `/app-scoping-guide/` | `scopingGuideForm` | *(see note)* | name, email, company, **stage** |
| `/cloud-cost-calculator/` | `cloudCalcForm` | *(see note)* | name, email, monthly spend |
| `/devops-maturity-assessment/` | `devopsAssessForm` | `assessment` | name, email |
| `/wordpress-website-development-india/` | `wpForm` | `wordpress-india` | name, phone, email, business, type, message |

*Note: only four distinct `kind:` literals are present in the HTML; two forms build their payload differently and need a line-level read before I wire them into a shared component.*

**Not one of these six captures budget or timeline.** `/app-scoping-guide/` is the only one that captures stage. This is exactly the gap your brief identifies — leads arrive unqualified and unrankable.

### 3.2 Newsletter form (34 pages)
`#newsletterForm` in `liquid.js`, `kind:'newsletter'`, email only. Added today. Posts to the same Lambda.

### 3.3 CTAs
- **287** Calendly links, all pointing at the *same* URL with no source/UTM differentiation. Calendly's own dashboard therefore cannot tell you which page produced a booking. (`assets/js/utm.js` tags these client-side with the stored UTM, which helps, but every page still shares one event surface.)
- **61** `mailto:het.soni@…` links.
- Tool cross-link strips on 6 service pages (added today).
- Per-page CTA inventory is Phase 3's deliverable (`03-page-plan.md`), not repeated here.

---

## 4. Current email behaviour — and a live defect

`.deploy/lambda/index.mjs` on every submission:
1. Validates email format → 400 if malformed.
2. Sends **owner email** to `het.soni@…` (plain text, `Subject: New <kind> lead: <email>`).
3. Best-effort **Supabase insert** (never blocks the email).
4. Sends **visitor auto-reply** ("Thanks — we'll be in touch").
5. Returns `200` with `{ok, owner, visitor, db}`.

### 🔴 Defect: visitor auto-replies are failing silently for every real lead

Verified live just now:

```
SES ProductionAccess : false        ← still in sandbox
Verified identities  : het.soni@soniconsultancyservices.com   (only one)
Quota                : 200/day, 1/sec
```

In SES sandbox you may only send **to verified addresses**. Only your own address is verified. So:

- Owner notification → ✅ works (goes to a verified address)
- Visitor auto-reply → ❌ **fails for every real lead**, the Lambda swallows the error into `result.visitorErr`, and still returns `200`

Every person who has filled in a form has received nothing, and nothing surfaced the failure. This is live right now.

It also inverts a brief assumption: you asked me to *build* an auto-acknowledgement behind `AUTO_ACK_ENABLED`, default off. It is already built and already attempting to send — it just can't deliver. The flag work is really *fixing* it, not adding it.

### What the Lambda does **not** have
No scoring · no model-written summary or drafted reply · no retry/backoff · no `delivery_failed` flag or fallback alert · no honeypot/CAPTCHA/rate-limit · no `Reply-To` (you cannot hit reply on a lead email today) · no budget/timeline/stage fields · a dead `kind === "builder"` branch referencing `/builder`, a page that doesn't exist.

---

## 5. Risks

| # | Risk | Severity | Note |
|---|---|---|---|
| 1 | **SES sandbox** blocks all visitor mail; 200/day cap | 🔴 High | Needs AWS production-access request (your action) |
| 2 | **SPF does not authorise SES.** Record is `v=spf1 include:_spf.google.com ~all` — no `amazonses.com` | 🔴 High | SES mail from your domain fails SPF alignment today |
| 3 | **Stray DMARC record published at the apex** (`v=DMARC1; p=reject; …aspf=s; adkim=s`) alongside SPF. DMARC only belongs at `_dmarc`. The real `_dmarc` record says `p=none`. | 🟠 Medium | Harmless today because it's ignored where it sits — but if that `p=reject` ever moves to `_dmarc`, **all** SES mail hard-fails |
| 4 | No SES DKIM for the domain | 🟠 Medium | Needed for deliverability + DMARC alignment |
| 5 | **GA4 has no hostname guard** — `analytics.js` fires on any host, so localhost/preview traffic hits the production property | 🟠 Medium | Confirms your report. Fix is a code guard + a GA4 Admin filter. I can't see your GA4 Admin, so I can't confirm the separate "duplicate property" half of it. |
| 6 | **`docs/` is not in the deploy excludes** | 🟠 Medium | These very files would publish to your public site on the next sync. Must add `--exclude "docs/*"` (and `prompts/`, `kb/`, `nurture/`) before deploying again |
| 7 | Chat concierge needs a new public Lambda + API GW route | 🟠 Medium | Must be rate-limited and spend-capped from day one, or it's an open wallet |
| 8 | No `Reply-To` on lead emails | 🟡 Low | Small fix, big daily-workflow win |
| 9 | Pricing ranges are unresolved | 🟠 Medium | `CLAUDE.md` records calculator `RATE_LO/RATE_HI` as "rough placeholders". **The concierge cannot be allowed to quote any price until you set real ones** — see facts table |

---

## 6. What I recommend for Phase 1 delivery (for your decision at GATE 1)

You asked which provider is most reliable for this stack, and why.

**Primary: stay on SES, but fix it properly.** It's already wired, it's in the same account and region as the Lambda, it costs effectively nothing at your volume, and it adds no vendor. It needs three things: production access (support request, ~24h), SES DKIM records, and an SPF update to include `amazonses.com`.

**Fallback: a second, independent channel** for the redundancy you asked for — so a lead never dies if SES is down or throttled. Cheapest robust option is a webhook to a channel you already read (e.g. Tawk/Slack/Telegram) plus the Supabase row, which already exists.

I'd rather fix the pipe you own than add a vendor to the critical path. But **all three SES fixes touch DNS, and I won't touch DNS without your explicit go-ahead** — I'll hand you exact records at GATE 1.

If you'd prefer a purpose-built provider anyway, **Postmark** is the better pick over Resend for pure transactional deliverability and per-message logs. Say the word and I'll price it.

---

## 7. What I have NOT done

No files changed outside `docs/inbound/`. No deploy. No DNS. No email sent. No copy touched. Nothing committed.
