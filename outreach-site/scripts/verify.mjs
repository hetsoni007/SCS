// Browser checks for the outreach site. Run the production-like server first:
//
//   python3 scripts/serve.py 5231 &
//   BASE=http://127.0.0.1:5231 node scripts/verify.mjs
//
// Needs Playwright (npm i -g playwright, or set PLAYWRIGHT_PATH). axe-core is
// optional (set AXE_PATH to axe.min.js to include the accessibility scan).
// Everything runs on localhost, where every form is a dry run: nothing is sent.
import { createRequire } from 'node:module';
import fs from 'node:fs';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright');
const BASE = process.env.BASE || 'http://127.0.0.1:5231';
const AXE = process.env.AXE_PATH ? fs.readFileSync(process.env.AXE_PATH, 'utf8') : null;
const PAGES = ['/', '/articles/', '/articles/the-audit/', '/articles/what-failed/', '/articles/signal-based-targeting/',
  '/articles/audit-first-method/', '/articles/the-quest-email/', '/tools/', '/tools/outreach-crm/',
  '/tools/prospect-scorer/', '/no-such-page/'];

const results = [];
function check(name, ok, detail = '') { results.push({ name, ok: !!ok, detail: String(detail ?? '') }); }

function watch(page) {
  const log = { errors: [], leads: [], pending: [] };
  page.on('console', (m) => {
    if (m.type() === 'error' || m.type() === 'warning') log.errors.push(m.text());
    if (m.type() === 'info' && m.text().includes('[outreach] dry run')) {
      // Resolve right away: the handle dies as soon as the page navigates.
      log.pending.push(m.args()[1].jsonValue().then((v) => log.leads.push(v), () => {}));
    }
  });
  page.on('pageerror', (e) => log.errors.push('pageerror: ' + e.message));
  return log;
}
async function leadPayloads(log) {
  await Promise.all(log.pending);
  return log.leads.slice();
}

const browser = await chromium.launch();

/* 1. Every page, four viewports: overflow, console/CSP errors, metadata, headings, axe */
for (const mode of [
  { w: 1366, h: 900, scheme: 'light' }, { w: 768, h: 1024, scheme: 'light' },
  { w: 390, h: 844, scheme: 'dark' }, { w: 375, h: 812, scheme: 'light' },
]) {
  const ctx = await browser.newContext({ viewport: { width: mode.w, height: mode.h }, colorScheme: mode.scheme });
  const page = await ctx.newPage();
  const log = watch(page);
  for (const p of PAGES) {
    log.errors.length = 0;
    const resp = await page.goto(BASE + p, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    const tag = `${mode.w}px ${mode.scheme} ${p}`;
    const info = await page.evaluate(() => ({
      overflow: document.documentElement.scrollWidth - window.innerWidth,
      h1: document.querySelectorAll('h1').length,
      ld: [...document.querySelectorAll('script[type="application/ld+json"]')].map((s) => { try { JSON.parse(s.textContent); return 'ok'; } catch (e) { return 'bad'; } }),
      title: document.title,
      desc: document.querySelector('meta[name="description"]')?.content || '',
      canonical: document.querySelector('link[rel="canonical"]')?.href || '',
      ogImage: document.querySelector('meta[property="og:image"]')?.content || '',
      ogTitle: document.querySelector('meta[property="og:title"]')?.content || '',
      fonts: [...document.fonts].filter((f) => f.status === 'loaded').map((f) => f.family),
      byline: [...document.querySelectorAll('.byline a')].map((a) => [a.textContent.trim(), a.href]),
      cta: document.querySelectorAll('.studio-cta').length,
      newsletterForms: document.querySelectorAll('form[data-capture="newsletter"]').length,
    }));
    check(`${tag}: no horizontal scroll`, info.overflow <= 0, `overflow ${info.overflow}px`);
    // The 404 page's own status shows up as a console error; that one is expected.
    const errs = log.errors.filter((e) => !(p === '/no-such-page/' && /status of 404/.test(e)));
    check(`${tag}: no console errors or CSP violations`, errs.length === 0, errs.join(' | '));
    if (mode.w === 1366) {
      const expect404 = p === '/no-such-page/';
      check(`${p}: HTTP ${expect404 ? 404 : 200}`, resp.status() === (expect404 ? 404 : 200), resp.status());
      check(`${p}: exactly one h1`, info.h1 === 1, info.h1);
      check(`${p}: JSON-LD parses`, info.ld.length > 0 && info.ld.every((x) => x === 'ok'), info.ld.join(','));
      check(`${p}: title <= 60 chars`, info.title.length <= 60, `${info.title.length}: ${info.title}`);
      check(`${p}: description 50-160 chars`, info.desc.length >= 50 && info.desc.length <= 160, info.desc.length);
      check(`${p}: og:title + og:image set`, info.ogTitle && /\/assets\/og\/[\w-]+\.png$/.test(info.ogImage), info.ogImage);
      if (!expect404) check(`${p}: canonical on the outreach subdomain`, info.canonical.startsWith('https://outreach.soniconsultancyservices.com/'), info.canonical);
      check(`${p}: all three families loaded`, ['Newsreader', 'Schibsted Grotesk', 'IBM Plex Mono'].every((f) => info.fonts.includes(f)), info.fonts.join(','));
      check(`${p}: footer byline links to the studio`, info.byline.length === 1 && info.byline[0][0] === 'Built by Het Soni, founder of Soni Consultancy Services' && info.byline[0][1].startsWith('https://soniconsultancyservices.com/'), JSON.stringify(info.byline));
      check(`${p}: studio CTA only on the CRM page`, info.cta === (p === '/tools/outreach-crm/' ? 1 : 0), info.cta);
      const isArticle = /^\/articles\/[a-z-]+\/$/.test(p);
      check(`${p}: newsletter in footer${isArticle ? ' and at the end of the article' : ''}`, info.newsletterForms === (isArticle ? 2 : 1), info.newsletterForms);
    }
    if (AXE && (mode.w === 1366 || mode.w === 390)) {
      await page.evaluate(AXE);
      const v = await page.evaluate(async () => (await window.axe.run(document, { resultTypes: ['violations'] })).violations
        .map((x) => `${x.id} (${x.impact}): ${x.nodes.slice(0, 2).map((n) => n.target.join(' ')).join(', ')}`));
      check(`${tag}: axe finds no violations`, v.length === 0, v.join(' | '));
    }
  }
  await ctx.close();
}

/* 2. The two-touch CRM */
{
  const ctx = await browser.newContext({ viewport: { width: 1366, height: 900 }, acceptDownloads: true });
  const page = await ctx.newPage();
  const log = watch(page);
  await page.goto(BASE + '/tools/outreach-crm/', { waitUntil: 'networkidle' });
  const card = (name) => page.locator('[data-card]', { hasText: name });
  const acts = (name) => card(name).locator('[data-act]').evaluateAll((b) => b.map((x) => x.getAttribute('data-act')).sort());
  const pill = (name) => card(name).locator('.pill').innerText();

  check('CRM opens with six sample prospects', (await page.locator('[data-card]').count()) === 6);
  const thirdTouchControls = await page.evaluate(() => [...document.querySelectorAll('button,a,input,select,[role="button"]')]
    .filter((b) => /touch\s*3|third touch|touch three/i.test((b.textContent || '') + ' ' + (b.getAttribute('aria-label') || '') + ' ' + (b.value || ''))).length);
  check('no control anywhere offers a third touch', thirdTouchControls === 0, thirdTouchControls);
  check('after touch 2 the only actions are reply / no / close / auto-reply', JSON.stringify(await acts('Leo (sample)')) === JSON.stringify(['auto', 'closed_no_reply', 'replied', 'said_no']), JSON.stringify(await acts('Leo (sample)')));
  check('closed threads have no actions at all', (await acts('Tom (sample)')).length === 0 && (await acts('Ravi (sample)')).length === 0);

  // Walk Sam through both touches.
  await card('Sam (sample)').locator('[data-act="touch1"]').click();
  await card('Sam (sample)').locator('textarea').fill('Hero image is the largest element on mobile, about four seconds.');
  await card('Sam (sample)').locator('button[type="submit"]').click();
  check('touch 1 logs and moves the prospect to "Touch 1 sent"', (await pill('Sam (sample)')).includes('Touch 1 sent'), await pill('Sam (sample)'));
  await card('Sam (sample)').locator('[data-act="touch2"]').click();
  await card('Sam (sample)').locator('textarea').fill('Just following up on my last email');
  await card('Sam (sample)').locator('button[type="submit"]').click();
  const genericMsg = await card('Sam (sample)').locator('.tform .form-msg').innerText();
  check('a generic "just following up" touch 2 is refused', /just following up/i.test(genericMsg), genericMsg);
  await card('Sam (sample)').locator('textarea').fill('New since then: the pricing page now loads a 2 MB video on phones.');
  await card('Sam (sample)').locator('button[type="submit"]').click();
  check('touch 2 with new information logs', (await pill('Sam (sample)')).includes('Touch 2 sent'), await pill('Sam (sample)'));
  check('once touch 2 is logged, no touch action remains', !(await acts('Sam (sample)')).some((a) => a.startsWith('touch')), JSON.stringify(await acts('Sam (sample)')));

  // Undo and redo an outcome.
  await card('Priya (sample)').locator('[data-act="said_no"]').click();
  check('"They said no" closes the thread', (await pill('Priya (sample)')).includes('Said no'));
  await page.locator('.toast button').click();
  check('Undo restores the previous state', (await pill('Priya (sample)')).includes('Touch 1 sent'), await pill('Priya (sample)'));
  const autoBefore = await card('Priya (sample)').locator('.pcard-auto').innerText();
  await card('Priya (sample)').locator('[data-act="auto"]').click();
  check('an auto-reply is logged but does not change the stage', (await pill('Priya (sample)')).includes('Touch 1 sent') && (await card('Priya (sample)').locator('.pcard-auto').innerText()) !== autoBefore);

  // Duplicate and delete rules.
  await page.locator('[data-crm-add-toggle]').click();
  await page.fill('#crm-add input[name="name"]', 'Sam (sample)');
  await page.fill('#crm-add input[name="company"]', 'Example Analytics');
  await page.locator('#crm-add button[type="submit"]').click();
  const dupMsg = await page.locator('#crm-add .form-msg').innerText();
  check('the same person cannot be added twice', /already on your list/i.test(dupMsg), dupMsg);
  await page.fill('#crm-add input[name="name"]', 'Test Person');
  await page.fill('#crm-add input[name="company"]', 'Test Co');
  await page.fill('#crm-add input[name="role"]', 'Senior Recruiter');
  check('a recruiter role shows the wrong-audience warning', await page.locator('[data-role-warn]').isVisible());
  await page.fill('#crm-add input[name="contact"]', 'test@example.com');
  await page.locator('#crm-add button[type="submit"]').click();
  check('adding your own prospect clears the samples', (await page.locator('[data-card]').count()) === 1);
  check('a prospect you have not contacted can be removed', JSON.stringify(await acts('Test Person')) === JSON.stringify(['remove', 'touch1']));
  await card('Test Person').locator('[data-act="touch1"]').click();
  await card('Test Person').locator('textarea').fill('Their checkout jumps while it loads on mobile.');
  await card('Test Person').locator('button[type="submit"]').click();
  check('a contacted prospect can no longer be removed', !(await acts('Test Person')).includes('remove'));
  await card('Test Person').locator('[data-act="said_no"]').click();
  await page.locator('[data-crm-add-toggle]').click();
  await page.fill('#crm-add input[name="name"]', 'Someone Else');
  await page.fill('#crm-add input[name="company"]', 'Other Co');
  await page.fill('#crm-add input[name="contact"]', 'TEST@example.com');
  await page.locator('#crm-add button[type="submit"]').click();
  check('someone who said no cannot be re-added under another name', /already on your list/i.test(await page.locator('#crm-add .form-msg').innerText()));
  await page.locator('[data-crm-add-cancel]').click();

  // Imports can't smuggle in a third touch or break the structure.
  const csv = await page.evaluate(() => window.OTCRM.importText(
    'name,company,touch1_date,touch1_note,touch2_date,touch2_new_information,touch3_date,touch3_note\n' +
    'Imp One,Imp Co,2026-09-01,first note,2026-09-05,second note with news,2026-09-09,third note\n', 'x.csv'));
  check('CSV import ignores touch3 columns', csv.ignored.includes('touch3_date') && csv.added === 1, JSON.stringify(csv));
  await page.evaluate(() => window.OTCRM.importText(JSON.stringify({ prospects: [
    { name: 'Json One', company: 'J Co', t1: { date: '2026-09-01', note: 'a' }, t2: { date: '2026-09-03', note: 'b' }, t3: { date: '2026-09-05', note: 'c' }, touches: [1, 2, 3] },
    { name: 'Bad One', company: 'B1', t2: { date: '2026-09-03', note: 'orphan' } },
    { name: 'Bad Two', company: 'B2', t1: { date: '2026-09-01', note: 'a' }, outcome: { type: 'closed_no_reply', date: '2026-09-02' } },
    { name: 'Bad Three', company: 'B3', t1: { date: '2026-09-05', note: 'a' }, t2: { date: '2026-09-01', note: 'dated before touch 1' } },
  ] }), 'y.json'));
  const list = await page.evaluate(() => window.OTCRM.list());
  const by = (n) => list.find((p) => p.name === n);
  check('no stored record has anything beyond two touch slots', list.every((p) => !('t3' in p) && !('touches' in p) && Object.keys(p).filter((k) => /^t\d$/.test(k)).join() === 't1,t2'), JSON.stringify(Object.keys(list[0])));
  check('JSON import drops a third touch', by('Json One') && by('Json One').t2 && !('t3' in by('Json One')));
  check('touch 2 without touch 1 is dropped on import', by('Bad One') && by('Bad One').t2 === null);
  check('"closed, no reply" without touch 2 is dropped on import', by('Bad Two') && by('Bad Two').outcome === null);
  check('touch 2 dated before touch 1 is dropped on import', by('Bad Three') && by('Bad Three').t2 === null);
  const jsonOneActs = await acts('Json One');
  check('imported prospects obey the same cap', !jsonOneActs.some((a) => a.startsWith('touch')), JSON.stringify(jsonOneActs));

  // Export is gated on an email, then produces a CSV with the documented columns.
  await page.locator('[data-crm-export="csv"]').click();
  check('Export opens the email gate first', await page.locator('#gate-crm').isVisible());
  await page.fill('#gate-crm-email', 'not-an-email');
  await page.locator('#gate-crm button[type="submit"]').click();
  check('the gate rejects an invalid email', /check the email/i.test(await page.locator('#gate-crm .form-msg').innerText()));
  await page.fill('#gate-crm-email', 'founder@example.com');
  const [download] = await Promise.all([page.waitForEvent('download'), page.locator('#gate-crm button[type="submit"]').click()]);
  const csvText = fs.readFileSync(await download.path(), 'utf8').replace(/^﻿/, '');
  const header = csvText.split(/\r?\n/)[0];
  check('export downloads a CSV once the email is in', download.suggestedFilename().endsWith('.csv'), download.suggestedFilename());
  check('the export has the documented 16 columns and no third touch', header.split(',').length === 16 && !/touch3/.test(header), header);
  check('the export contains your prospects', csvText.includes('Test Person') && !csvText.includes('(sample)'));
  const payloads = await leadPayloads(log);
  const crmLead = payloads.find((p) => p.kind === 'outreach_crm_export');
  check('the gate builds an outreach_crm_export lead for the existing endpoint (dry run on localhost)', crmLead && crmLead.email === 'founder@example.com' && crmLead.want && crmLead.website === '', JSON.stringify(crmLead));
  // Second export needs no email.
  const [d2] = await Promise.all([page.waitForEvent('download'), page.locator('[data-crm-export="json"]').click()]);
  check('after unlocking, JSON export goes straight through', d2.suggestedFilename().endsWith('.json'));

  // Save to this browser persists across reloads.
  await page.locator('[data-crm-save]').click();
  await page.reload({ waitUntil: 'networkidle' });
  check('saved list survives a reload', (await page.locator('[data-card]', { hasText: 'Test Person' }).count()) === 1);
  check('banner says the list is saved', /saved in this browser/i.test(await page.locator('[data-crm-banner]').innerText()));
  check('no console errors in the CRM run', log.errors.length === 0, log.errors.join(' | '));
  await ctx.close();
}

/* 3. The prospect scorer */
{
  const ctx = await browser.newContext({ viewport: { width: 1366, height: 900 } });
  await ctx.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: BASE });
  const page = await ctx.newPage();
  const log = watch(page);
  await page.goto(BASE + '/tools/prospect-scorer/', { waitUntil: 'networkidle' });
  const score = () => page.locator('[data-score]').innerText();
  const reason = () => page.locator('[data-reason]').innerText();
  check('scorer opens on a worked example (launch, 11-50, day 3 = 10)', (await score()) === '10' && /Audit it today/.test(await page.locator('[data-verdict]').innerText()));
  await page.locator('[data-days="120"]').click();
  check('day 120 drops the same prospect to 5 and says why', (await score()) === '5' && /past the ~90-day window/.test(await reason()), await reason());
  await page.locator('input[name="signal"][value="title"]').check({ force: true });
  check('a job title alone scores 3 and disables timing', (await score()) === '3' && (await page.locator('[data-days-note]').isVisible()), await score());
  await page.locator('input[name="signal"][value="hiring"]').check({ force: true });
  await page.locator('[data-days="3"]').click();
  check('hiring posts get the wrong-audience reason', /wrong-audience trap/.test(await reason()), await reason());
  await page.locator('input[name="signal"][value="launch"]').check({ force: true });
  await page.locator('input[name="size"][value="1000+"]').check({ force: true });
  check('a 1,000+ company scores 7 and says who to find', (await score()) === '7' && /reaches a team/.test(await reason()), await reason());
  await page.goto(BASE + '/tools/prospect-scorer/?signal=rebuild&size=51-200&days=45', { waitUntil: 'networkidle' });
  check('a shared link reproduces the score (rebuild, 51-200, day 45 = 6)', (await score()) === '6', await score());
  await page.locator('[data-copy-link]').click();
  const clip = await page.evaluate(() => navigator.clipboard.readText());
  check('Copy link gives a public, shareable URL', clip === 'https://outreach.soniconsultancyservices.com/tools/prospect-scorer/?signal=rebuild&size=51-200&days=45', clip);
  check('scorer asks for nothing (no email gate)', (await page.locator('dialog#gate-template, dialog#gate-crm').count()) === 0);
  check('no console errors in the scorer run', log.errors.length === 0, log.errors.join(' | '));
  await ctx.close();
}

/* 4. Newsletter and playbook gate */
{
  const ctx = await browser.newContext({ viewport: { width: 1366, height: 900 } });
  const page = await ctx.newPage();
  const log = watch(page);
  await page.goto(BASE + '/articles/what-failed/', { waitUntil: 'networkidle' });
  await page.fill('#nl-end-email', 'bad@');
  await page.locator('form[aria-labelledby="nl-end-h"] button[type="submit"]').click();
  check('newsletter rejects an invalid email', /check the email/i.test(await page.locator('form[aria-labelledby="nl-end-h"] .form-msg').innerText()));
  await page.fill('#nl-end-email', 'reader@example.com');
  await page.locator('form[aria-labelledby="nl-end-h"] button[type="submit"]').click();
  await page.waitForTimeout(200);
  check('subscribing flips every newsletter form on the page to "subscribed"', await page.locator('form[aria-labelledby="nl-foot-h"] .form-done').isVisible());
  let leads = await leadPayloads(log);
  const nl = leads.find((p) => p.kind === 'newsletter');
  check('newsletter lead matches the Lambda contract (kind newsletter, consent true)', nl && nl.consent === true && nl.email === 'reader@example.com' && /\/articles\/what-failed\/$/.test(nl.source_page), JSON.stringify(nl));
  await leadPayloads(log);
  await page.goto(BASE + '/', { waitUntil: 'networkidle' });
  check('subscription is remembered on other pages', await page.locator('form[aria-labelledby="nl-foot-h"] .form-done').isVisible());
  await page.locator('.playbook-card [data-gate="playbook"]').click();
  check('playbook button opens the gate', await page.locator('#gate-playbook').isVisible());
  await page.fill('#gate-playbook-email', 'reader@example.com');
  await page.locator('#gate-playbook-optin').check();
  await page.locator('#gate-playbook button[type="submit"]').click();
  const dl = page.locator('#gate-playbook .gate-done a[download]');
  check('after the email, the playbook download appears', await dl.isVisible());
  const href = await dl.getAttribute('href');
  const r = await page.request.get(BASE + href);
  check('the playbook PDF is served', r.status() === 200 && (r.headers()['content-type'] || '').includes('pdf'), `${href} ${r.status()}`);
  leads = await leadPayloads(log);
  const pb = leads.find((p) => p.kind === 'outreach_playbook');
  check('playbook lead carries the opt-in and what was downloaded', pb && pb.consent === true && /playbook/i.test(pb.want), JSON.stringify(pb));
  await page.keyboard.press('Escape');
  check('Escape closes the gate', !(await page.locator('#gate-playbook').isVisible()));
  await page.goto(BASE + '/tools/outreach-crm/', { waitUntil: 'networkidle' });
  await page.locator('.capture--asset [data-gate="template"]').click();
  await page.fill('#gate-template-email', 'reader@example.com');
  await page.locator('#gate-template button[type="submit"]').click();
  const links = await page.locator('#gate-template .gate-done a[download]').evaluateAll((a) => a.map((x) => x.getAttribute('href')));
  check('CRM template gate reveals the CSV and the sequence PDF', links.length === 2 && links.some((h) => h.endsWith('.csv')) && links.some((h) => h.endsWith('.pdf')), links.join(' '));
  for (const h of links) {
    const res = await page.request.get(BASE + h);
    check(`download ${h} is served`, res.status() === 200, res.status());
  }
  const tpl = await (await page.request.get(BASE + links.find((h) => h.endsWith('.csv')))).text();
  const crmCfg = await page.evaluate(() => JSON.parse(document.getElementById('ot-config').textContent).crmColumns.join(','));
  check('template CSV header matches the CRM export columns exactly', tpl.split(/\r?\n/)[0] === crmCfg, tpl.split(/\r?\n/)[0]);
  // Theme toggle persists.
  await page.keyboard.press('Escape');
  await page.locator('[data-theme-toggle]').click();
  const theme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
  await page.reload({ waitUntil: 'networkidle' });
  check('theme choice persists across pages', (await page.evaluate(() => document.documentElement.getAttribute('data-theme'))) === theme, theme);
  check('no console errors in the capture run', log.errors.length === 0, log.errors.join(' | '));
  await ctx.close();
}

await browser.close();
const failed = results.filter((r) => !r.ok);
for (const r of results) console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${r.name}${r.ok ? '' : '  -> ' + r.detail}`);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
process.exit(failed.length ? 1 : 0);
