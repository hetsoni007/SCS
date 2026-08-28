/* =====================================================================
   ANALYTICS — Google Analytics 4 (gtag) + behaviour tracking
   ---------------------------------------------------------------------
   1) Create a free GA4 property at https://analytics.google.com
   2) Copy your Measurement ID (looks like G-XXXXXXXXXX)
   3) Paste it below into GA_ID, then redeploy. That's it.
   Until a real ID is set, this file safely does nothing.
   ===================================================================== */
(function () {
  'use strict';
  var GA_ID = "G-0J9H7CBX0Q"; // GA4 Measurement ID

  var configured = GA_ID && GA_ID.indexOf('XXXX') === -1;

  // gtag bootstrap
  window.dataLayer = window.dataLayer || [];
  function gtag(){ dataLayer.push(arguments); }
  window.gtag = window.gtag || gtag;

  if (configured) {
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
    document.head.appendChild(s);
    gtag('js', new Date());
    gtag('config', GA_ID, { anonymize_ip: true });
  }

  // safe event helper (no-op until GA configured)
  function track(name, params) {
    try { if (configured && window.gtag) window.gtag('event', name, params || {}); } catch (e) {}
  }
  window.scsTrack = track;

  /* ---------- click tracking (event delegation) ---------- */
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a');
    if (a && a.href) {
      var href = a.getAttribute('href') || '';
      if (/calendly\.com/i.test(href)) {
        track('book_call_click', { location: location.pathname, link_text: (a.textContent || '').trim().slice(0, 60) });
      } else if (/wa\.me|api\.whatsapp\.com|whatsapp:\/\//i.test(href)) {
        track('whatsapp_click', { location: location.pathname });
      } else if (href.indexOf('mailto:') === 0) {
        track('email_click', { location: location.pathname });
      } else if (/^https?:\/\//i.test(href) && a.host !== location.host) {
        track('outbound_click', { url: href });
      }
    }
    // CTAs / buttons
    var btn = e.target.closest && e.target.closest('.btn, .nav-cta, .submit, button');
    if (btn) {
      var label = (btn.textContent || btn.getAttribute('aria-label') || '').trim().slice(0, 60);
      if (label) track('cta_click', { label: label, location: location.pathname });
    }
    // builder interactions
    var typeBtn = e.target.closest && e.target.closest('[data-type]');
    if (typeBtn) track('builder_select_type', { type: typeBtn.getAttribute('data-type') });
    var codeTab = e.target.closest && e.target.closest('.tabbtn[data-tab="code"]');
    if (codeTab) track('builder_view_code', {});
    if (e.target.closest && e.target.closest('#copyBtn')) track('builder_copy_code', {});
    if (e.target.closest && e.target.closest('#dlBtn')) track('builder_download_code', {});
  }, true);

  /* ---------- form submits (lead gen) ---------- */
  document.addEventListener('submit', function (e) {
    var f = e.target;
    if (!f || !f.id) return;
    if (f.id === 'contactForm') track('generate_lead', { form: 'contact_brief' });
    if (f.id === 'unlockForm') track('generate_lead', { form: 'builder_unlock' });
    if (f.id === 'calcLeadForm') track('generate_lead', { form: 'app_cost_calculator' });
    if (f.id === 'cloudCalcForm') track('generate_lead', { form: 'cloud_cost_calculator' });
    if (f.id === 'devopsAssessForm') track('generate_lead', { form: 'devops_maturity_assessment' });
    if (f.id === 'wpForm') track('generate_lead', { form: 'wordpress_india' });
  }, true);

  /* ---------- scroll depth ---------- */
  var marks = [25, 50, 75, 90], fired = {};
  function onScroll() {
    var h = document.documentElement.scrollHeight - innerHeight;
    if (h <= 0) return;
    var pct = (scrollY / h) * 100;
    marks.forEach(function (m) {
      if (pct >= m && !fired[m]) { fired[m] = 1; track('scroll_depth', { percent: m, location: location.pathname }); }
    });
  }
  addEventListener('scroll', onScroll, { passive: true });
})();
