---
title: Audit first, then write
seo_title: The audit-first cold email method, step by step
description: Five steps you can run today: visit the site, run PageSpeed Insights, screenshot one finding, write one or two specific issues, send within hours.
kicker: The audit-first method
dek: Before you write a word, look at the thing they just made. Five steps you can run today, and a template for sounding like a person instead of a mail merge.
summary: Five steps you can follow today, the tools for each, and a template for writing a finding that doesn't read like a canned insert.
date: 2026-09-27
order: 4
---

The audit-first method has one rule: before you write anything, look at the thing they just made. For me that's usually their website. For you it might be their app or their signup flow.

## 1. Visit the domain

Open the site the way their customers do, and start on your phone. You're looking for two things: what they're proud of (the launch, the redesign, the new feature) and what's visibly off. Don't catalogue everything. You need one thing.

## 2. Run a PageSpeed check

Go to [PageSpeed Insights](https://pagespeed.web.dev/), paste the URL and wait. It takes about {{psi_time}}.

Start with the mobile results. You'll see two kinds of data:

- **Real-user data** at the top, if the site gets enough traffic. New sites often don't, so don't be surprised if this part is empty.
- **Lab data** below it: one test run, with a performance score and a list of diagnostics.

Skip the score; it's the least useful thing on the page. Go to the diagnostics and look for one finding that's specific, visible and easy to explain to someone non-technical:

- **The biggest element is slow to appear.** PageSpeed names the Largest Contentful Paint element, which is often the hero image.
- **Images far bigger than they're shown.** A full-resolution photo shipped to a phone screen.
- **Layout shift.** Content jumping around while the page loads, with the elements responsible listed.
- **Render-blocking requests.** Scripts or stylesheets holding the whole page up.

Pick the one with the clearest consequence for their business.

## 3. Screenshot the finding

Crop to the one finding. No full-page captures, no twelve red rows.

- **Mac:** Cmd + Shift + 4, then drag.
- **Windows:** Win + Shift + S.
- **Chrome or Edge:** open DevTools, press Cmd/Ctrl + Shift + P, type "screenshot" and pick *Capture area screenshot* or *Capture node screenshot*.

The screenshot is your evidence. On LinkedIn it can go straight into the message. On a first cold email, think twice before attaching anything: an attachment from an unknown sender gives spam filters one more reason to bin you. Describe the finding in words, and keep the screenshot ready for when they reply "what do you mean?"

## 4. Write one or two issues, never a list

This is where most "personalized" emails fall apart, with a sentence that could be pasted into anyone's email:

> I noticed a few performance issues on your website that might be affecting your conversions.

That's a canned insert. It names nothing, proves nothing, and every agency sends it.

The shape to aim for has four parts, in this order:

:::steps
1. **What you looked at.** The page, and why you were there.
2. **What you saw.** One element, one number at most.
3. **Why it matters to them.** In their terms, not yours.
4. **A question you actually want answered.**
:::

Here's a version for a made-up site:

> Saw the new site went live last week. On mobile, the hero photo is the last thing to show up: PageSpeed flags it as the largest element, at around four seconds. On a page whose whole job is the sign-up button underneath it, that's a long wait. Is the full-size image being sent to phones, or is something else holding it up?

Four rules keep it from reading like an insert:

- **Use their words.** If their launch post said "rebuilt from scratch", say "rebuilt from scratch".
- **Name the thing.** "The hero photo on mobile", not "some images".
- **One number, maximum.** Two start to read like a report.
- **End on a real question.** If you don't care about the answer, they'll notice.

Then run the test: could this paragraph be pasted into an email to a different company? If yes, it's still an insert. Rewrite it until it can't be.

Two issues is the ceiling. A third finding doesn't make you look thorough. It turns the email into a report, and nobody replies to a report.

## 5. Send within hours, not days

The audit has a shelf life. The signal is freshest right now (more on that in [the 0–{{window_days}} day window](/articles/signal-based-targeting/)), and sites change. Wait a week and they may have fixed the thing you're pointing at, which makes your email wrong on arrival.

So audit when you're ready to send. Don't batch audits on Monday for a Friday send.

## Why it works

The audit isn't a trick to get a reply. It's roughly the first step I'd take with a paying client. The prospect gets a small, real piece of the work before you've made a single claim about yourself, and that is the pitch.

:::more label="Next"
Check a prospect is worth the time first with the [prospect scorer](/tools/prospect-scorer/). For the email around the finding, read [the Quest email](/articles/the-quest-email/).
:::
