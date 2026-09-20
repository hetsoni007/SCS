/* =====================================================================
   scs-lead-mailer v2 — single intake for every lead on the site.

   Order of operations is deliberate:
     1. validate + abuse checks   (cheap, no side effects)
     2. DURABLE WRITE first       (a lead is never lost because mail failed)
     3. owner email, with retry   (the part that must land in 60s)
     4. update the row's delivery status
     5. optional auto-ack to the visitor (flag, default OFF)

   The model call is best-effort and time-boxed. A slow or failing model
   must never delay or block the owner email.
   ===================================================================== */

import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { scoreLead } from './scoring.mjs';
import { normalise, validate, verifyTurnstile } from './validate.mjs';
import { buildSubject, buildOwnerBody, buildAutoAck, CALENDLY } from './compose.mjs';
import { sendWithRetry as retry } from './mail.mjs';
import { putLead, setDeliveryStatus, countRecentByIp } from './store.mjs';

const ses = new SESClient({ region: process.env.AWS_REGION });

const OWNER = process.env.OWNER_EMAIL;
const FROM = process.env.FROM_EMAIL;
const TEST_MODE = process.env.LEAD_TEST_MODE === 'true';
const TEST_TO = process.env.LEAD_TEST_EMAIL || OWNER;
const AUTO_ACK = process.env.AUTO_ACK_ENABLED === 'true';
const TURNSTILE_SECRET = process.env.TURNSTILE_SECRET;
const FALLBACK_WEBHOOK = process.env.FALLBACK_WEBHOOK_URL;
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;
const RATE_LIMIT_PER_HOUR = Number(process.env.RATE_LIMIT_PER_HOUR || 5);

const MODEL = 'claude-opus-5';
const MODEL_BUDGET_MS = 6000;

// API Gateway owns CORS; emitting our own headers makes HTTP API return 500.
const CORS = {};

const log = (...a) => console.log('[lead]', ...a);

/* ---------------------------------------------------------------- utils */

function withTimeout(promise, ms, label) {
  return Promise.race([
    promise,
    new Promise((_, rej) => setTimeout(() => rej(new Error(label + ' timed out after ' + ms + 'ms')), ms)),
  ]);
}


function reply(statusCode, obj) {
  return {
    statusCode,
    headers: { 'content-type': 'application/json', ...CORS },
    body: JSON.stringify(obj),
  };
}

/* ----------------------------------------------------------------- mail */

async function sendMail({ to, subject, text, replyTo }) {
  return ses.send(new SendEmailCommand({
    Source: FROM,
    Destination: { ToAddresses: [to] },
    ReplyToAddresses: replyTo ? [replyTo] : undefined,
    Message: { Subject: { Data: subject }, Body: { Text: { Data: text } } },
  }));
}


async function fireFallback(payload) {
  if (!FALLBACK_WEBHOOK) { log('fallback webhook not configured'); return false; }
  try {
    await fetch(FALLBACK_WEBHOOK, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return true;
  } catch (e) {
    log('fallback webhook failed:', String(e.message || e));
    return false;
  }
}

/* ---------------------------------------------------------------- model */

const SUMMARY_SYSTEM = `You help Het Soni triage inbound leads for Soni Consultancy Services, a senior-led, fixed-price engineering studio (React Native, MERN, Next.js, Flutter, AI integrations).

Given one lead, return STRICT JSON, no markdown fence:
{"summary": ["line 1","line 2","line 3"], "fit_note": "one sentence", "draft_reply": "..."}

Rules:
- summary: exactly 3 short lines. What they want, what stands out, what to do next.
- fit_note: one sentence on how well this fits the studio's core offer. Be blunt if it is a poor fit.
- draft_reply: an email Het could send. Direct, founder-to-founder, warm, jargon-light. No hype, no "I hope this finds you well". 120 words max. Sign off "— Het". If the brief is vague, ask the single most useful question instead of pitching.
- NEVER invent prices, timelines, client names or results. If asked for a price, say a fixed quote follows a short scoping call.
- Output JSON only.`;

async function enrich(lead, scored) {
  if (!ANTHROPIC_KEY) return { skipped: 'no api key' };
  const body = {
    model: MODEL,
    max_tokens: 700,
    system: [{ type: 'text', text: SUMMARY_SYSTEM, cache_control: { type: 'ephemeral' } }],
    messages: [{
      role: 'user',
      content: `Lead:
name: ${lead.name || '(none)'}
title: ${lead.title || '(none)'}
company: ${lead.company || '(none)'}
email: ${lead.email}
project type: ${lead.project_type || '(none)'}
stage: ${lead.stage || '(none)'}
budget: ${lead.budget_band || '(none)'}
timeline: ${lead.timeline || '(none)'}
what they want: ${lead.want || '(none)'}
message: ${lead.message || '(none)'}
source page: ${lead.source_page || '(none)'}
score: ${scored.score} (${scored.tier})
${lead.chat_transcript ? '\nchat transcript:\n' + lead.chat_transcript.slice(0, 4000) : ''}`,
    }],
  };

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': ANTHROPIC_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error('anthropic ' + res.status + ' ' + (await res.text().catch(() => '')));
  const data = await res.json();
  const text = (data.content || []).map((c) => c.text || '').join('').trim();
  const parsed = JSON.parse(text.replace(/^```(?:json)?|```$/g, '').trim());
  return { ...parsed, usage: data.usage };
}

/* -------------------------------------------------------------- compose */

/* -------------------------------------------------------------- handler */

export const handler = async (event) => {
  const http = (event.requestContext && event.requestContext.http) || {};
  const method = http.method || event.httpMethod;
  if (method === 'OPTIONS') return { statusCode: 204, headers: CORS, body: '' };
  if (method !== 'POST') return reply(405, { ok: false, error: 'method not allowed' });

  let raw;
  try {
    let s = event.body || '{}';
    if (event.isBase64Encoded) s = Buffer.from(s, 'base64').toString('utf8');
    raw = JSON.parse(s);
  } catch {
    return reply(400, { ok: false, error: 'bad json' });
  }

  const headers = event.headers || {};
  const meta = {
    ip: http.sourceIp || headers['x-forwarded-for'] || '',
    ua: headers['user-agent'] || '',
    country: headers['cloudfront-viewer-country'] || headers['x-country'] || '',
  };

  const lead = normalise(raw);
  const check = validate(lead, raw);

  // Bot: accept silently so it learns nothing, but do no work.
  if (check.reject) { log('rejected (honeypot) from', meta.ip); return reply(200, { ok: true }); }
  if (!check.ok) return reply(400, { ok: false, errors: check.errors });

  if (!(await verifyTurnstile(raw.turnstile_token, TURNSTILE_SECRET, meta.ip, log))) {
    return reply(400, { ok: false, errors: ['captcha verification failed'] });
  }

  if ((await countRecentByIp(meta.ip)) >= RATE_LIMIT_PER_HOUR) {
    log('rate limited', meta.ip);
    return reply(429, { ok: false, errors: ['too many submissions, please try again later'] });
  }

  const scored = scoreLead(lead);
  const result = { ok: true, tier: scored.tier, stored: false, owner: false, visitor: false };

  // ---- 2. durable write FIRST ----
  let leadId = null;
  try {
    const stored = await putLead({
      name: lead.name, email: lead.email, company: lead.company, title: lead.title,
      phone: lead.phone, message: lead.message || lead.want,
      project_type: lead.project_type, stage: lead.stage,
      budget_band: lead.budget_band, timeline: lead.timeline,
      score: scored.score, tier: scored.tier, track: scored.track,
      score_reasons: scored.reasons, consent: lead.consent,
      source: lead.kind, source_page: lead.source_page, referrer: lead.referrer,
      utm_source: lead.utm_source, utm_medium: lead.utm_medium, utm_campaign: lead.utm_campaign,
      ip: meta.ip, country: meta.country, user_agent: meta.ua,
      chat_transcript: lead.chat_transcript,
      delivery_status: 'pending',
    });
    leadId = stored.id;
    result.stored = true;
    result.lead_id = leadId;
  } catch (e) {
    // The lead is not lost: the email still goes out below, and the
    // failure is surfaced rather than swallowed.
    log('DURABLE WRITE FAILED:', String(e.message || e));
    result.storeErr = String(e.message || e);
  }

  // ---- 3. enrich (best effort, time-boxed) ----
  let ai = null;
  try {
    ai = await withTimeout(enrich(lead, scored), MODEL_BUDGET_MS, 'model');
  } catch (e) {
    ai = { error: String(e.message || e) };
    log('enrich skipped:', ai.error);
  }

  // ---- 4. owner email with retry ----
  const to = TEST_MODE ? TEST_TO : OWNER;
  const subject = (TEST_MODE ? '[TEST] ' : '') + buildSubject(lead, scored);
  const sent = await retry(sendMail, {
    to,
    subject,
    text: buildOwnerBody(lead, scored, ai, meta),
    replyTo: lead.email,
  }, 3, log);
  result.owner = sent.ok;
  result.attempts = sent.attempts;

  if (sent.ok) {
    await setDeliveryStatus(leadId, 'sent');
  } else {
    result.ownerErr = sent.error;
    await setDeliveryStatus(leadId, 'delivery_failed', sent.error);
    result.fallback = await fireFallback({
      alert: 'LEAD EMAIL DELIVERY FAILED',
      tier: scored.tier, email: lead.email, name: lead.name,
      company: lead.company, source_page: lead.source_page,
      error: sent.error, lead_id: leadId,
    });
  }

  // ---- 5. auto-ack, flagged OFF by default ----
  if (AUTO_ACK && lead.kind !== 'newsletter') {
    const ack = await retry(sendMail, {
      to: lead.email,
      subject: 'Got it — I read every brief personally',
      text: buildAutoAck(lead, scored),
    }, 2, log);
    result.visitor = ack.ok;
    if (!ack.ok) result.visitorErr = ack.error;
  }

  return reply(200, result);
};
