---
title: I sent {{sent}} cold emails and got zero replies. Here's the system I rebuilt.
seo_title: I sent {{sent}} cold emails and got zero replies
description: I audited {{threads}} of my own cold outreach threads. Zero positive replies, {{rejections}} rejections, {{wrong_audience}} sent to the wrong people. What broke, and the system I rebuilt.
kicker: The audit
dek: Most people fix cold outreach by rewriting the email. I counted instead, every thread, one by one. The email was not the main problem.
summary: The full teardown. {{threads}} threads, what actually happened in each, the five causes in order of damage, and the system that replaced it.
date: 2026-09-27
order: 1
toc: true
---

Zero replies makes a clean headline. It also flatters me.

People did reply. {{rejections}} of them wrote back to say no: a real person, typing it out. {{auto_replies}} more "replies" came from out-of-office bots. What never came back, across {{threads}} threads, was a single positive reply to a cold email.

I know the exact numbers because I stopped guessing. I went through my Gmail, pulled every outreach thread I'd starred, all {{threads}} of them, and read each one top to bottom. Not a sample, and not the ones I happened to remember. Every thread, sorted by what actually happened in it rather than what I'd hoped was happening.

:::stats
:::

## Count before you rewrite

When outreach isn't working, the obvious move is to rewrite the email. New subject line. Shorter body. A sharper first line. It feels productive, because the email is the part you control.

It's the wrong first move. It assumes the email is the problem, and you can't know that until you've counted.

Look at the count again. {{wrong_audience}} of those emails went to people who were never going to hire me, however good the copy was. No subject line fixes that. {{auto_replies}} of the replies were robots, which means the reply rate I'd been watching was wrong. And some of the {{rejections}} people who said no heard from me again anyway. None of that is a copy problem.

Counting honestly comes down to three rules:

- An auto-reply is not a reply.
- A "no" is not a "maybe later".
- Silence is not "still in play". It's silence.

Get those wrong and every number you look at afterwards is fiction. Get them right and the real problems line up in order. Mine did. There were five, and the email itself wasn't one of them.

## What actually went wrong

In order of how much damage each one did.

### 1. I was writing to the wrong people

This was the biggest cause, and it wasn't close.

Too much of my prospecting ran on "hiring" posts. Say a company posts that it's hiring a React Native developer. That reads like a buying signal: there's app work, and there's a gap. So I'd write to whoever posted it.

The problem is who posts those. Often it's a recruiter, whose job is to fill a seat with a person, not hand a project to a studio. Some of the roles were already filled by the time my email landed. Some of the people I wrote to said "no agencies" in their bio, in plain text, and I hadn't looked.

That's where the {{wrong_audience}} come from. Every one of those emails was dead before I wrote the first word. I was messaging job posters and recruiters while the people who actually decide, the founders and CTOs, were a click away. I never checked who was actually behind the post.

The fix is almost embarrassing. Before writing, open the profile and ask one question: can this person say yes to the work? Founder, CTO, head of product: yes. Recruiter: no. Job post showing "No longer accepting applications": the gap is closed. Bio says "no agencies": believe it.

### 2. I counted auto-replies as engagement

{{auto_replies}} of the replies in my threads were automatic. Out-of-office notices. "We've received your message." Ticket-system acknowledgements.

For too long, they sat in my tracking as replies. It's an easy mistake, because an auto-reply arrives exactly like a real one: a new message in the thread, from their domain, sitting in your inbox. It feels like movement.

It isn't. A bot confirming delivery is not a person reading your email. Counting it does real damage, too, because it inflates the one number that's supposed to tell you whether anything is working. My reply rate looked healthier than it was, so I had less reason to question the targeting. That was the actual problem.

They're easy to separate once you decide to. Most say so in the subject line: "Automatic reply", "Out of office". Many also carry an `Auto-Submitted` header, which you can see in Gmail under "Show original". Filter them out before you calculate anything.

### 3. Generic follow-ups killed warm threads

This is the expensive one, because it wastes the rarest thing in outbound: a thread where someone already cares.

A technical founder had told me something specific on one of my threads. My next message was a generic "just following up".

He replied: "you didn't read our direction."

He was right. Whether I'd skimmed his message or read it and failed to show it doesn't matter. From his side, it's the same thing. He'd handed me exactly what a good follow-up needs, and I sent something I could have sent to anyone.

A warm thread means someone has already given you their attention. A generic follow-up spends that attention and gives nothing back.

### 4. I kept writing to people who had said no

{{rejections}} people told me no, in words. Some of them still got a third message from me. Some got a fourth.

I hadn't decided to push past a no. My tracking was scattered across too many places, and none of them said "closed". So a thread that had ended looked exactly like one that was waiting.

From the other side, it looks worse than pushy. It looks like you don't read your own inbox. Anyone who has received a follow-up to their own "not interested" knows how that lands, and they remember your name for the wrong reason.

### 5. My deliverability was quietly decaying

The last cause is the least visible. My sends went out {{send_gap}} apart, from a mailbox with no warm-up. Hard bounces and spam flags piled up over time.

None of that sends you a notification. It compounds. Each bounce and each spam flag makes the next email a little more likely to land in spam, so fewer people see it, and every other number gets worse without telling you why.

The dull fixes are the real ones. Verify addresses before you send. Space sends by minutes, not seconds. Warm a new mailbox up gradually. Make sure your domain has SPF, DKIM and DMARC set up.

It's last on the list because the first four would have sunk me even with perfect deliverability. But it made all four of them worse.

## The fix, part one: find people who've said it out loud

Targeting by title gives you everyone who could buy. "CTO, 11 to 50 people, SaaS" is a list of thousands, and almost none of them are thinking about your problem this month.

So I stopped searching for titles and started searching for what people say when they're in the middle of it. Phrases like:

- "redesigning our site"
- "website is live"
- "our site is so slow"

Each of those is someone telling the whole internet that they're thinking about exactly the thing I work on, right now. That isn't a lead list. It's a queue of people with an open question.

It also quietly fixes cause number one. Recruiters post about roles. People don't post "our site is so slow" on behalf of a company they don't work for, so a stated signal tends to come from someone on the inside. You still check the profile, but the odds start in your favor.

### The 0–{{window_days}} day window

Timing matters as much as the phrase. A company that has just launched is paying close attention. They're watching the site, reading feedback, fixing what breaks. That attention fades. At around {{window_days}} days the launch stops being news, even internally, and site performance becomes background noise.

:::timeline
:::

So reaching out on day 3 and reaching out on day 120 are two different emails, even with identical copy. On day 3, a note about their mobile load time lands in the middle of a conversation they're already having. On day 120, the same note is a stranger pointing at something they stopped thinking about months ago.

:::more
[Signal-based targeting](/articles/signal-based-targeting/): more phrases, how to run the search on LinkedIn, and the window in detail.
:::

## The fix, part two: audit first, then write

Once I have a signal, I don't write anything until I've looked at the thing they actually made. The process:

:::steps
1. **Visit the domain.** Their site, on a phone, the way their customers see it.
2. **Run a PageSpeed check.** It takes about {{psi_time}}.
3. **Screenshot the finding.** One finding, cropped tight.
4. **Personalize with one or two specific issues.** Never a laundry list.
5. **Send within hours, not days.**
:::

Each step earns its place. The visit means you know what they launched before you comment on it. PageSpeed gives you something concrete and checkable instead of "I noticed a few issues". The screenshot makes it their site, not your opinion. One or two issues, because a list of twelve reads like an automated report, and one reads like a person looked. Hours, not days, because the signal is fresh and sites change. Wait a week and they may have fixed the thing you're about to point out.

The audit is also a small proof of competence. It's roughly the first step I'd take with a paying client. So the prospect gets a real piece of the work before I've claimed anything about myself.

:::more
[The audit-first method](/articles/audit-first-method/): the tools, what to look for, and how to phrase a finding so it doesn't read like a mail-merge field.
:::

## The one email that worked

Out of {{threads}} threads, {{engaged.word}} turned into a real conversation: a company I'll call Quest.

The email that did it had no pitch in it and no call ask. It asked three specific technical questions about a decision that was visible on their site. The kind of questions you only ask if you actually looked, and actually want to know.

They answered in detail. Then they offered the call themselves.

Compare that with a real email of mine that got zero replies:

> Hope you're doing well! I help founders build apps fast and affordably — would love to grab 15 minutes if you're open to it.

Read it as the person receiving it. "Hope you're doing well" is filler that announces "cold email" before anything else. "I help founders build apps fast and affordably" is a claim with no proof, and every studio on earth makes it. "Grab 15 minutes" asks for their time before giving them a single reason to spend it.

The Quest email turned all of that around. It made no claims, so there was nothing to doubt. It asked questions only someone competent would think to ask, so the competence was shown, not asserted. And it didn't ask for their time at all, which is exactly why they offered it.

The lesson: a specific, genuine technical observation is the pitch. It proves you know what you're doing before you've said a word about yourself.

:::more
[The Quest email](/articles/the-quest-email/): line by line, next to the one that failed.
:::

## The two-touch cap

The last fix is structural, and it's the one I trust most.

I built a CRM where a prospect cannot receive a third touch. Not "shouldn't". Cannot. There's no button for it. After the second touch, the only things you can do with a thread are record a reply, record a no, or close it.

This is deliberately not a willpower rule. Rules you have to remember fail exactly when the pipeline looks thin and you're tempted to squeeze one more message out of an old thread. A button that doesn't exist can't be pressed on a bad day.

It fixed two things at once.

First, the scattered tracking. Every prospect lives in one place. Every touch is logged. A "no" closes the thread for good. Nobody gets a follow-up to their own rejection, because there's no follow-up left to send.

Second, it changed what I write. When touch two is the last one, "just following up" wastes the only follow-up you get. So touch two has to earn its place with something new: a finding I didn't have before, a change on their site, an answer to something they said. If I have nothing new, I don't send it. The thread closes, and that's fine.

## Where to start

If your outreach isn't working, don't open the email template first. Open your sent folder and count your last 50 threads. Honestly: auto-replies aren't replies, a no is a no, silence is silence. Then look at who you were writing to.

My bet is the email isn't your biggest problem either.

The tools I built for this are on the [tools page](/tools/). There's an in-browser version of the two-touch CRM. No login, and it really won't let you log a third touch. There's also a prospect scorer: give it the signal, the company size and the days since the trigger, and it tells you whether a prospect is worth an audit today. Both are free.
