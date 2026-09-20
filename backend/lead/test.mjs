/* =====================================================================
   Phase 1 test suite — run with:  node backend/lead/test.mjs
   No AWS, no network, no email sent. Renders the real artefacts offline.
   ===================================================================== */

import assert from 'node:assert/strict';
import { scoreLead, isCompanyEmail } from './scoring.mjs';
import { normalise, validate, isDisposableEmail } from './validate.mjs';
import { buildSubject, buildOwnerBody, buildAutoAck } from './compose.mjs';
import { sendWithRetry } from './mail.mjs';
import { marshall, marshallItem, unmarshall, unmarshallItem } from './marshall.mjs';

let pass = 0, fail = 0;
const t = (name, fn) => {
  try { fn(); console.log('  ✓ ' + name); pass++; }
  catch (e) { console.log('  ✗ ' + name + '\n      ' + e.message); fail++; }
};
const ta = async (name, fn) => {
  try { await fn(); console.log('  ✓ ' + name); pass++; }
  catch (e) { console.log('  ✗ ' + name + '\n      ' + e.message); fail++; }
};

const META = { ip: '203.0.113.7', ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0)', country: 'GB' };

/* ------------------------------------------------------------ fixtures */

const HOT = normalise({
  name: 'Sarah Whitfield', title: 'CTO', company: 'Northlane Health',
  email: 'sarah@northlanehealth.co.uk', project_type: 'mobile app',
  stage: 'MVP ready', budget_band: '$60k+', timeline: 'ASAP',
  want: 'Patient-facing React Native app with our existing FHIR backend.',
  message: 'We have designs done and a backend team. We need a mobile team that can start in the next few weeks.',
  source_page: '/react-native-app-development/', referrer: 'https://www.google.com/',
  utm_source: 'google', utm_medium: 'organic', consent: true, kind: 'contact',
});

const COLD = normalise({
  name: 'Dev', email: 'devguy2031@gmail.com', project_type: 'not sure',
  stage: 'idea', budget_band: '<$10k', timeline: 'exploring',
  want: 'thinking about an app idea', source_page: '/blog/how-long-to-build-an-app/',
  consent: true, kind: 'contact',
});

const WP = normalise({
  name: 'Ravi Menon', title: 'Founder', company: 'Menon Textiles',
  email: 'ravi@menontextiles.in', project_type: 'wordpress',
  stage: 'scaling', budget_band: '$25-60k', timeline: 'ASAP',
  want: 'WooCommerce store for our wholesale catalogue', consent: true, kind: 'wordpress-india',
});

/* --------------------------------------------------------------- tests */

console.log('\nSCORING');
t('HOT: senior title + company email + budget + ASAP + MVP-ready', () => {
  const s = scoreLead(HOT);
  assert.equal(s.tier, 'HOT');
  assert.ok(s.score >= 9, 'score was ' + s.score);
  assert.equal(s.track, 'core');
});
t('COLD: free email, no budget, just exploring', () => {
  const s = scoreLead(COLD);
  assert.equal(s.tier, 'COLD');
  assert.ok(s.score < 5, 'score was ' + s.score);
});
t('WordPress lead is capped at WARM even with strong signals', () => {
  const s = scoreLead(WP);
  assert.equal(s.track, 'wordpress');
  assert.notEqual(s.tier, 'HOT');
  assert.ok(s.reasons.some((r) => /Capped at WARM/.test(r)));
});
t('every point is explained in reasons', () => {
  const s = scoreLead(HOT);
  assert.ok(s.reasons.length >= 5, 'only ' + s.reasons.length + ' reasons');
});
t('company vs free email domains', () => {
  assert.equal(isCompanyEmail('a@northlanehealth.co.uk'), true);
  assert.equal(isCompanyEmail('a@gmail.com'), false);
});
t('empty lead does not throw and scores COLD', () => {
  const s = scoreLead({});
  assert.equal(s.tier, 'COLD');
});

console.log('\nVALIDATION & ABUSE');
t('honeypot triggers silent reject', () => {
  const v = validate(normalise({ email: 'a@b.com' }), { website: 'http://spam.ru' });
  assert.equal(v.reject, true);
});
t('disposable email rejected', () => {
  assert.equal(isDisposableEmail('x@mailinator.com'), true);
  const v = validate(normalise({ email: 'x@mailinator.com', name: 'x', message: 'hi' }), {});
  assert.equal(v.ok, false);
});
t('malformed email rejected', () => {
  assert.equal(validate(normalise({ email: 'not-an-email', name: 'x', message: 'hi' }), {}).ok, false);
});
t('header injection stripped from name', () => {
  const n = normalise({ email: 'a@b.com', name: 'Bob\r\nBcc: victim@example.com' });
  assert.ok(!n.name.includes('\r') && !n.name.includes('\n'), 'CRLF survived: ' + JSON.stringify(n.name));
});
t('unknown keys are dropped, not rendered', () => {
  const n = normalise({ email: 'a@b.com', evil: '<script>x</script>' });
  assert.equal(n.evil, undefined);
});
t('oversized field is clamped', () => {
  const n = normalise({ email: 'a@b.com', message: 'x'.repeat(99999) });
  assert.equal(n.message.length, 5000);
});
t('newsletter signup needs only an email', () => {
  assert.equal(validate(normalise({ email: 'a@b.com', kind: 'newsletter' }), {}).ok, true);
});
t('bare probe with no name/message is rejected', () => {
  assert.equal(validate(normalise({ email: 'a@b.com' }), {}).ok, false);
});


console.log('\nBACKWARD COMPATIBILITY (forms already live on the site)');
t('legacy contact-form payload still scores', () => {
  const legacy = normalise({ kind:'contact', name:'Jane Doe', email:'jane@acme.io',
    company:'Acme', service:'AI Integration', message:'We want AI in our app.' });
  assert.equal(legacy.project_type, 'AI Integration', 'service did not map to project_type');
  const sc = scoreLead(legacy);
  assert.ok(sc.reasons.some(r=>/Core offer fit/.test(r)), 'AI service not recognised as core fit');
});
t('legacy wordpress payload routes to the wordpress track', () => {
  const legacy = normalise({ kind:'wordpress-india', name:'Ravi', email:'ravi@x.in',
    service:'WooCommerce Online Store', phone:'+91 98765 43210' });
  assert.equal(scoreLead(legacy).track, 'wordpress');
  assert.equal(legacy.phone, '+91 98765 43210', 'phone was dropped');
});


console.log('\nDYNAMODB MARSHALLING');
t('round-trips the shape of a real lead row', () => {
  const row = { name:'Sarah', score:14, consent:true, company:'',
                score_reasons:['a','b'], delivery_status:'pending' };
  const back = unmarshallItem(marshallItem(row));
  assert.equal(back.name,'Sarah');
  assert.equal(back.score,14);
  assert.equal(back.consent,true);
  assert.deepEqual(back.score_reasons,['a','b']);
});
t('empty string stores as NULL, not an invalid empty S', () => {
  assert.deepEqual(marshall(''), { NULL:true });
});
t('empty array stores as NULL (DynamoDB rejects empty L in some paths)', () => {
  assert.deepEqual(marshall([]), { NULL:true });
});
t('numbers and booleans use the right attribute types', () => {
  assert.deepEqual(marshall(14), { N:'14' });
  assert.deepEqual(marshall(false), { BOOL:false });
});
t('NaN degrades to NULL rather than producing an invalid N', () => {
  assert.deepEqual(marshall(NaN), { NULL:true });
});

console.log('\nDELIVERY RETRY');
await ta('succeeds first try', async () => {
  let calls = 0;
  const r = await sendWithRetry(async () => { calls++; }, {}, 3);
  assert.equal(r.ok, true); assert.equal(calls, 1);
});
await ta('retries then succeeds', async () => {
  let calls = 0;
  const r = await sendWithRetry(async () => { calls++; if (calls < 3) throw new Error('throttled'); }, {}, 3);
  assert.equal(r.ok, true); assert.equal(r.attempts, 3);
});
await ta('gives up after 3 and reports the error', async () => {
  let calls = 0;
  const r = await sendWithRetry(async () => { calls++; throw new Error('MessageRejected'); }, {}, 3);
  assert.equal(r.ok, false); assert.equal(calls, 3);
  assert.match(r.error, /MessageRejected/);
});

console.log('\nSUBJECT LINE');
t('matches the required format', () => {
  assert.equal(buildSubject(HOT, scoreLead(HOT)),
    '[HOT] New inquiry — Sarah Whitfield, Northlane Health — mobile app — $60k+');
});
t('degrades gracefully with no name/company', () => {
  const s = buildSubject(normalise({ email: 'x@y.com' }), scoreLead({}));
  assert.match(s, /^\[COLD\] New inquiry — x@y\.com/);
});

console.log(`\n${pass} passed, ${fail} failed`);

/* ------------------------------------------------- rendered artefacts */

const AI_STUB = {
  summary: [
    'CTO at a UK health company wants a patient-facing React Native app on an existing FHIR backend.',
    'Designs done, backend team in place, budget $60k+, wants to start within weeks — unusually ready.',
    'Reply today. Ask about FHIR scope and compliance posture before quoting.',
  ],
  fit_note: 'Strong core fit — React Native on an existing backend is exactly the studio\'s shape of work.',
  draft_reply: `Hi Sarah,

Thanks for the detail — having designs done and a backend team already in place puts you further ahead than most briefs that reach me.

Two things I'd want to understand before putting a number on it: how much of the FHIR surface the app actually touches, and what your compliance requirements look like for patient data on device.

If you have 30 minutes this week I'll walk you through how we'd scope it, and you'll get a fixed price within 48 hours of that call.

— Het`,
};

console.log('\n\n' + '═'.repeat(70));
console.log('ARTEFACT 1 — HOT lead, owner email exactly as Het would receive it');
console.log('═'.repeat(70));
console.log('To:       het.soni@soniconsultancyservices.com');
console.log('Reply-To: ' + HOT.email + '   ← hitting reply reaches the lead');
console.log('Subject:  ' + buildSubject(HOT, scoreLead(HOT)));
console.log('─'.repeat(70));
console.log(buildOwnerBody(HOT, scoreLead(HOT), AI_STUB, META));

console.log('\n\n' + '═'.repeat(70));
console.log('ARTEFACT 2 — COLD lead, and the model call FAILED (degraded path)');
console.log('═'.repeat(70));
console.log('Subject:  ' + buildSubject(COLD, scoreLead(COLD)));
console.log('─'.repeat(70));
console.log(buildOwnerBody(COLD, scoreLead(COLD), { error: 'model timed out after 6000ms' }, { ip: '198.51.100.4', ua: 'Chrome/140 macOS', country: 'IN' }));

console.log('\n\n' + '═'.repeat(70));
console.log('ARTEFACT 3 — auto-acknowledgement (AUTO_ACK_ENABLED=false, NOT sent)');
console.log('═'.repeat(70));
console.log(buildAutoAck(HOT, scoreLead(HOT)));

console.log('\n\n' + '═'.repeat(70));
console.log('ARTEFACT 4 — the durable row written BEFORE any email is attempted');
console.log('═'.repeat(70));
const s = scoreLead(HOT);
console.log(JSON.stringify({
  name: HOT.name, email: HOT.email, company: HOT.company, title: HOT.title,
  project_type: HOT.project_type, stage: HOT.stage, budget_band: HOT.budget_band,
  timeline: HOT.timeline, score: s.score, tier: s.tier, track: s.track,
  score_reasons: s.reasons, consent: HOT.consent, source: HOT.kind,
  source_page: HOT.source_page, referrer: HOT.referrer, utm_source: HOT.utm_source,
  ip: META.ip, country: META.country, delivery_status: 'pending',
}, null, 2));

process.exit(fail ? 1 : 0);
