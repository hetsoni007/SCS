/* =====================================================================
   EMAIL COMPOSITION — pure string building, no I/O, no SDK.
   Split out from the handler so it can be unit-tested and so the exact
   text Het will receive can be rendered offline before anything is sent.
   ===================================================================== */

export const CALENDLY = 'https://calendly.com/het-soni-soniconsultancyservices/introductory';

export function buildSubject(lead, scored) {
  const bits = [
    lead.name || lead.email,
    lead.company || null,
  ].filter(Boolean).join(', ');
  const tail = [lead.project_type || 'unspecified', lead.budget_band || 'no budget given'].join(' — ');
  return `[${scored.tier}] New inquiry — ${bits} — ${tail}`;
}

export function buildOwnerBody(lead, scored, ai, meta) {
  const L = [];
  L.push(`${scored.tier}  ·  score ${scored.score}  ·  track: ${scored.track}`);
  L.push('');
  if (ai && ai.summary) {
    L.push(...ai.summary.map((s) => '  ' + s));
    L.push('');
    if (ai.fit_note) { L.push('Fit: ' + ai.fit_note); L.push(''); }
  } else if (ai && ai.error) {
    L.push(`(AI summary unavailable: ${ai.error})`);
    L.push('');
  }
  L.push('WHY THIS SCORE');
  scored.reasons.forEach((r) => L.push('  · ' + r));
  L.push('');
  L.push('LEAD');
  const field = (label, v) => { if (v) L.push(`  ${label.padEnd(14)} ${v}`); };
  field('Name', lead.name);
  field('Title', lead.title);
  field('Company', lead.company);
  field('Email', lead.email);
  field('Project type', lead.project_type);
  field('Stage', lead.stage);
  field('Budget', lead.budget_band);
  field('Timeline', lead.timeline);
  field('Wants', lead.want);
  field('Consent', lead.consent ? 'yes' : 'NOT GIVEN');
  if (lead.message) { L.push(''); L.push('MESSAGE'); L.push(lead.message.split('\n').map((x) => '  ' + x).join('\n')); }
  L.push('');
  L.push('CONTEXT');
  field('Form', lead.kind);
  field('Source page', lead.source_page);
  field('Referrer', lead.referrer);
  field('UTM source', lead.utm_source);
  field('UTM medium', lead.utm_medium);
  field('UTM campaign', lead.utm_campaign);
  field('Country', meta.country);
  field('Device', meta.ua);
  field('IP', meta.ip);
  if (lead.chat_transcript) {
    L.push('');
    L.push('CHAT TRANSCRIPT');
    L.push(lead.chat_transcript.split('\n').map((x) => '  ' + x).join('\n'));
  }
  if (ai && ai.draft_reply) {
    L.push('');
    L.push('─'.repeat(58));
    L.push('DRAFTED REPLY — not sent. Copy, edit, send.');
    L.push('─'.repeat(58));
    L.push(ai.draft_reply);
  }
  L.push('');
  L.push(`Reply directly to this email to reach ${lead.email}.`);
  return L.join('\n');
}

export function buildAutoAck(lead, scored) {
  return [
    `Hi${lead.name ? ' ' + lead.name.split(' ')[0] : ''},`,
    '',
    "Thanks for getting in touch. I read every brief that comes in personally, so this went straight to me rather than a queue.",
    '',
    "Here's what happens next: I'll come back to you within one business day with either a straight answer or the two or three questions I need to scope it properly.",
    ...(scored.tier === 'HOT' ? ['', 'If it is easier to just talk, grab any slot that suits you: ' + CALENDLY] : []),
    '',
    '— Het',
    'Founder & Lead Engineer, Soni Consultancy Services',
  ].join('\n');
}
