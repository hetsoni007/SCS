# 01 — Canonical Facts Table (GATE 0)

Every contradictory claim on the site, with exact location and a recommended single value.
**Nothing here is changed yet.** Confirm or correct the "Recommended" column and I'll propagate it everywhere in one pass.

> **Rule I applied throughout:** I only recommend values the existing evidence already supports. Where I can't tell what's true, I ask instead of guessing — including where that leaves a blank.

---

## ⚠️ First, a distinction that matters

Two different kinds of number appear on this site, and they must **not** be unified into one:

- **Promises** — "we ship MVPs in X weeks". Forward-looking. These are contradictory and need one canonical value.
- **History** — "this project took 26 weeks". Facts about delivered work on `/work/` and the industry pages.

The history numbers (16, 24, 25, 26, 32 weeks) are **correct as they stand and must be left alone.** Rewriting them to match a marketing promise would be falsifying your own track record. Only the promises below get unified.

---

## A. MVP timeline — the worst offender 🔴

The site currently gives **four different answers** to "how long does an MVP take?", including inside `schema.org` markup that Google reads.

| Location | Exact claim |
|---|---|
| `index.html:78` | Hero headline: "Build iOS & Android apps in **8 weeks.**" |
| `index.html:28` | **LocalBusiness schema**: "Build iOS and Android apps in **8 weeks** with fixed pricing." |
| `index.html:192` | "A focused MVP on both stores in **6–10 weeks**" |
| `react-native-app-development/index.html:64` | "Fixed pricing, no upfront fees, **8-week timeline**" |
| `react-native-app-development/index.html:134` | FAQ: "Most MVPs land in **6–12 weeks**" |
| `mvp-development/index.html` | **10–16 weeks** — in 8 places, including `<title>`, meta description and FAQ |
| `services/index.html:82, :87` | "shipped in roughly **10–16 weeks**" |
| `app-cost-calculator/index.html:136` | Computed output, defaults to "**~8 weeks**" |

**Recommended: MVP = 10–16 weeks.**

Reasoning: it's the only figure the portfolio supports. Your own `/work/` page records real deliveries at 16–32 weeks, and your RN page already tells visitors *"the four products in our portfolio took 16–32 weeks each to reach full market release."* An 8-week promise sitting above that evidence is the claim most likely to be challenged on a sales call — and it's the one that sets up a disappointed client.

⚠️ **This means changing your hero headline**, which is a conversion decision, not just a copy fix. Three ways to go:

1. **"in 10–16 weeks"** — honest, consistent, less punchy.
2. **Drop the number from the hero** → "Build iOS & Android apps in **one codebase.**" (already one of your rotating words) and let the calculator give the real range. Keeps the hero tight, moves the number to where it can be accurate.
3. Keep "8 weeks" **only if** you can genuinely deliver a store-live MVP in 8 weeks and want to stand behind it — in which case `/mvp-development/` and `/services/` change instead.

My pick: **option 2.** It removes the contradiction without weakening the hero, and the number lands on the calculator where it's computed from actual scope.

**The calculator needs a floor.** It computes from per-feature weeks and can currently output a number below the canonical minimum. Once you set the range, I'll clamp its output so it can never contradict the rest of the site.

---

## B. Full product timeline ✅

| Location | Claim |
|---|---|
| `react-native-app-development/index.html:134` | "16–32 weeks each to reach full market release" |
| `mvp-development/index.html:112` | "24–32 weeks" |

**Recommended: 16–32 weeks.** These are close and both evidence-backed; 16–32 is the wider, truthful envelope and matches the `/work/` record. Minor wording alignment only.

---

## C. AI feature timeline ✅ — not a conflict

`ai-app-development/index.html:211` — "around **6 weeks** from idea to a working AI feature."

**Recommended: keep as-is.** This is a *feature added to an existing app*, not a whole product. Different scope, different number, correctly so. I'd only add the words "into an existing app" to make that unambiguous.

---

## D. Years of experience 🔴

| Location | Claim |
|---|---|
| `index.html:193, :207`, `about:26`, `services:116`, `hire:43, :126`, `react-native-app-development:64` | **5+ years** (7 places, consistent) |
| `devops-cloud-engineering/index.html:170` | "AWS Certified · Azure Solutions Architect Expert · TOGAF 9 · **15+ yrs** · fintech · healthcare · enterprise" |

**Recommended: 5+ years** as the studio/founder standard.

**The 15+ yrs line needs your answer, not my recommendation.** It sits in a credentials strip with three named certifications. Either:
- **(a)** it describes a real person on your DevOps side who genuinely holds AWS/Azure/TOGAF certs and has 15+ years → then keep it, but attribute it ("our DevOps lead: …"), because as written it reads as a claim about the studio and collides with 5+ everywhere else; or
- **(b)** there's no such person → it comes down. Your own hard rule is *never invent credentials*, and certifications are the kind of claim an enterprise buyer will ask you to evidence.

**Which is it?**

---

## E. Countries 🟠 — not a contradiction, but reads like one

| Location | Claim |
|---|---|
| `about:96`, `contact:107` | "**Six countries.** One standard." |
| `about:65` | "…live on the App Store and Google Play, across **six** [countries]" |
| `about:117` + `about:26` (FAQ + schema) | "4+ apps live across 8 store listings, serving users in **30+ countries**" |

These are **two different claims**: *six* = where your clients are; *30+* = where the end users of shipped apps are. Both can be true. The problem is they sit inches apart with no distinguishing noun, so it reads as sloppiness.

**Recommended:** keep both, always with the noun attached — "**clients in six countries**", "**users in 30+ countries**". Never the bare number.

**Confirm both numbers are real** — six client countries, and 30+ user countries (from store/analytics data you can actually point to).

---

## F. Apps shipped 🔴 — the site contradicts itself *and* undersells

| Location | Claim |
|---|---|
| `index.html:89` | "**4+ products** shipped" |
| `react-native-app-development/index.html:64` | "We've shipped **4 production apps** to both stores" |
| `about:117`, `about:26` | "**4+ apps** live across **8 store listings**" |
| `/work/` (measured) | **8** case-study anchors; **2** explicitly labelled design concepts → **6** non-concept; **7** occurrences of the "Live on the App Store & Google Play" badge |

So the site claims **4** while displaying **6–7**. Unusually, the error is in the *conservative* direction — you're underselling.

**I'm not going to pick this number for you.** "4 apps × 2 stores = 8 listings" is internally coherent, so "4" may be deliberate and precise (e.g. only 4 are on *both* stores). But `/work/` shows more.

**Please confirm:**
1. How many distinct products are **live on public app stores** right now? ___
2. How many **total store listings** does that represent? ___
3. How many delivered products total, **including** ones not publicly listed (e.g. the healthcare platform)? ___

Then every page uses those three numbers and nothing else. Note the NDA convention still applies — we state counts, never names or links.

---

## G. Pricing 🔴 — blocker for Phase 2

| Location | Claim |
|---|---|
| `react-native-app-development/index.html:41` (FAQ schema) | "A focused MVP typically starts in the **low five figures (USD)**" |
| `app-cost-calculator/` | Computes a range from `RATE_LO`/`RATE_HI` |
| `CLAUDE.md` | Records those rates as **"rough placeholders"** |
| Everywhere else | No pricing. No `/pricing` page. |

**This blocks the chat concierge.** Your brief says the concierge may quote "only the approved ranges." Right now there are no approved ranges — just a placeholder-driven calculator and one vague FAQ line.

**Recommended:** until you give me real numbers, the concierge is hard-coded to **refuse to quote** and offer the calculator plus a scoping call instead. That's safe and on-brand ("we'll give you a fixed price after we understand the scope") — but it does blunt one of the concierge's best moves, so it's worth resolving.

**Needed from you:** MVP band, full-product band, hourly/dedicated-developer rate, WordPress band. In USD, with whatever caveats you want attached.

---

## H. Unverified — I need context before recommending

| Location | Claim | Question |
|---|---|---|
| `hire/index.html:76` | "**4 weeks**" | I couldn't determine from surrounding markup whether this is a minimum engagement, a notice period, or a ramp time. What does it mean? |

---

## Summary — what I need from you at GATE 0

| # | Decision | My recommendation |
|---|---|---|
| 1 | MVP timeline | **10–16 weeks**, and drop the number from the hero (option 2) |
| 2 | Full product timeline | **16–32 weeks** |
| 3 | AI feature timeline | Keep ~6 weeks, add "into an existing app" |
| 4 | Years of experience | **5+ years**; tell me if "15+ yrs" is a real person |
| 5 | Countries | Keep both, always with the noun |
| 6 | Apps shipped | **Your three numbers** — I won't invent them |
| 7 | Pricing | **Your bands** — or concierge refuses to quote |
| 8 | `hire` "4 weeks" | What does it mean? |

Plus the three structural decisions in `00-discovery.md` §2: **Tawk.to vs concierge**, **WhatsApp back or not**, and confirmation that **Lambda-not-Next.js** is understood and fine.
