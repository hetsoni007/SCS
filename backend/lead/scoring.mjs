/* =====================================================================
   LEAD SCORING — deterministic. No model involved.
   The model writes a *fit note* elsewhere; it never sets the score.
   Pure functions, no I/O, so this file is directly unit-testable.
   ===================================================================== */

export const BUDGET_BANDS = ['<$10k', '$10-25k', '$25-60k', '$60k+', 'not sure'];
export const TIMELINES = ['ASAP', '1-3 months', '3-6 months', 'exploring'];
export const STAGES = ['idea', 'prototype', 'MVP ready', 'scaling'];

// Project types that are core offer vs. a separate track.
const CORE_TYPES = ['mobile app', 'react native', 'ai', 'mvp', 'saas', 'web app', 'flutter'];
const SECONDARY_TYPES = ['devops', 'cloud', 'hire a developer', 'staff augmentation'];
const SEPARATE_TRACK = ['wordpress', 'woocommerce'];

const DECISION_MAKER_TITLES = [
  'founder', 'co-founder', 'cofounder', 'ceo', 'cto', 'coo', 'chief',
  'vp ', 'vice president', 'head of', 'director', 'owner', 'partner',
];

// Free/consumer mailbox providers — not disqualifying, just not a company domain.
const FREE_EMAIL_DOMAINS = new Set([
  'gmail.com', 'googlemail.com', 'yahoo.com', 'yahoo.co.uk', 'yahoo.co.in',
  'hotmail.com', 'outlook.com', 'live.com', 'msn.com', 'aol.com',
  'icloud.com', 'me.com', 'mac.com', 'proton.me', 'protonmail.com',
  'gmx.com', 'zoho.com', 'yandex.com', 'mail.com', 'rediffmail.com',
]);

function lc(v) { return String(v || '').trim().toLowerCase(); }

export function emailDomain(email) {
  const at = String(email || '').lastIndexOf('@');
  return at === -1 ? '' : lc(String(email).slice(at + 1));
}

export function isCompanyEmail(email) {
  const d = emailDomain(email);
  return Boolean(d) && !FREE_EMAIL_DOMAINS.has(d);
}

function matchesAny(haystack, needles) {
  const h = lc(haystack);
  return needles.some((n) => h.includes(n));
}

/**
 * Score a lead. Returns { score, tier, reasons, track }.
 * Deliberately transparent: every point added is explained in `reasons`,
 * because the whole purpose is that Het can trust the label at a glance.
 */
export function scoreLead(lead = {}) {
  let score = 0;
  const reasons = [];

  // ---- Budget (0-3) ----
  const budget = lc(lead.budget_band);
  if (budget === lc('$60k+')) { score += 3; reasons.push('Budget $60k+ (+3)'); }
  else if (budget === lc('$25-60k')) { score += 3; reasons.push('Budget $25-60k (+3)'); }
  else if (budget === lc('$10-25k')) { score += 2; reasons.push('Budget $10-25k (+2)'); }
  else if (budget === lc('not sure')) { score += 1; reasons.push('Budget not stated (+1)'); }
  else if (budget === lc('<$10k')) { reasons.push('Budget under $10k (+0)'); }
  else if (budget) { score += 1; reasons.push(`Budget "${lead.budget_band}" unrecognised (+1)`); }
  else { reasons.push('No budget given (+0)'); }

  // ---- Timeline (0-3) ----
  const timeline = lc(lead.timeline);
  if (timeline === 'asap') { score += 3; reasons.push('Timeline ASAP (+3)'); }
  else if (timeline === '1-3 months') { score += 2; reasons.push('Timeline 1-3 months (+2)'); }
  else if (timeline === '3-6 months') { score += 1; reasons.push('Timeline 3-6 months (+1)'); }
  else if (timeline === 'exploring') { reasons.push('Just exploring (+0)'); }
  else if (timeline) { score += 1; reasons.push(`Timeline "${lead.timeline}" unrecognised (+1)`); }
  else { reasons.push('No timeline given (+0)'); }

  // ---- Stage (0-3) ----
  const stage = lc(lead.stage);
  if (stage === 'mvp ready') { score += 3; reasons.push('Stage: MVP ready (+3)'); }
  else if (stage === 'scaling') { score += 3; reasons.push('Stage: scaling (+3)'); }
  else if (stage === 'prototype') { score += 2; reasons.push('Stage: prototype (+2)'); }
  else if (stage === 'idea') { score += 1; reasons.push('Stage: idea (+1)'); }
  else if (stage) { score += 1; reasons.push(`Stage "${lead.stage}" unrecognised (+1)`); }
  else { reasons.push('No stage given (+0)'); }

  // ---- Decision-maker signals (0-3) ----
  if (matchesAny(lead.title, DECISION_MAKER_TITLES)) {
    score += 2;
    reasons.push(`Decision-maker title: "${lead.title}" (+2)`);
  }
  if (isCompanyEmail(lead.email)) {
    score += 1;
    reasons.push(`Company email domain (${emailDomain(lead.email)}) (+1)`);
  } else if (lead.email) {
    reasons.push(`Free email domain (${emailDomain(lead.email)}) (+0)`);
  }

  // ---- Project fit (0-2) + track routing ----
  const type = lc(lead.project_type);
  let track = 'core';
  if (matchesAny(type, SEPARATE_TRACK)) {
    track = 'wordpress';
    reasons.push('WordPress track — separate pipeline (+0)');
  } else if (matchesAny(type, CORE_TYPES)) {
    score += 2;
    track = 'core';
    reasons.push(`Core offer fit: ${lead.project_type} (+2)`);
  } else if (matchesAny(type, SECONDARY_TYPES)) {
    score += 1;
    track = 'secondary';
    reasons.push(`Secondary offer fit: ${lead.project_type} (+1)`);
  } else if (type) {
    reasons.push(`Project type "${lead.project_type}" unmapped (+0)`);
  } else {
    reasons.push('No project type given (+0)');
  }

  // ---- Tier ----
  // Max realistic core score = 3+3+3+3+2 = 14.
  let tier;
  if (score >= 9) tier = 'HOT';
  else if (score >= 5) tier = 'WARM';
  else tier = 'COLD';

  // A WordPress lead is never labelled HOT in the core pipeline — it is a
  // different service line with a different economics profile, and mixing
  // them makes the HOT label useless as a "drop everything" signal.
  if (track === 'wordpress' && tier === 'HOT') {
    tier = 'WARM';
    reasons.push('Capped at WARM: WordPress is a separate track');
  }

  return { score, tier, reasons, track };
}
