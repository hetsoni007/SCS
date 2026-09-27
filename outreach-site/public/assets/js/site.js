/* =====================================================================
   Outreach Teardowns: shared behaviour (every page)
   - theme toggle
   - lead capture: newsletter (layer 1), playbook PDF (layer 2),
     CRM template + sequence (layer 3), CRM save/export unlock
   - copy-link buttons and a small toast
   Leads go to the same API Gateway -> scs-lead-mailer Lambda as the main
   site. Outside the live hostnames (localhost, file://, previews) every
   form is a dry run: the payload is logged to the console, never sent.
   ===================================================================== */
(function () {
  'use strict';

  var root = document.documentElement;
  var CFG = {};
  try { CFG = JSON.parse(document.getElementById('ot-config').textContent); } catch (e) { CFG = {}; }
  var EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

  function box(kind) {
    return {
      get: function (k) { try { return window[kind].getItem(k); } catch (e) { return null; } },
      set: function (k, v) { try { window[kind].setItem(k, v); return true; } catch (e) { return false; } },
      del: function (k) { try { window[kind].removeItem(k); } catch (e) { /* storage blocked */ } }
    };
  }
  var store = box('localStorage');
  var session = box('sessionStorage');

  /* ------------------------------------------------------------- theme */
  function effectiveTheme() {
    var t = root.getAttribute('data-theme');
    if (t === 'dark' || t === 'light') return t;
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  function syncToggle() {
    var next = effectiveTheme() === 'dark' ? 'light' : 'dark';
    document.querySelectorAll('[data-theme-toggle]').forEach(function (b) {
      b.setAttribute('aria-label', 'Use ' + next + ' theme');
    });
  }
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-theme-toggle]');
    if (!b) return;
    var next = effectiveTheme() === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    store.set('ot-theme', next);
    syncToggle();
  });
  syncToggle();

  /* ------------------------------------------------------------- toast */
  var toastEl = document.querySelector('.toast');
  var toastTimer = null;
  function toast(text, opts) {
    opts = opts || {};
    if (!toastEl) return;
    toastEl.textContent = '';
    var span = document.createElement('span');
    span.textContent = text;
    toastEl.appendChild(span);
    if (opts.action && opts.onAction) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = opts.action;
      btn.addEventListener('click', function () { hide(); opts.onAction(); });
      toastEl.appendChild(btn);
    }
    toastEl.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(hide, opts.ms || 4500);
    function hide() { toastEl.hidden = true; }
  }

  /* ------------------------------------------------------- attribution */
  (function captureAttribution() {
    var q;
    try { q = new URLSearchParams(location.search); } catch (e) { return; }
    var attr = {}, has = false;
    ['utm_source', 'utm_medium', 'utm_campaign'].forEach(function (k) {
      var v = q.get(k);
      if (v) { attr[k] = v.slice(0, 120); has = true; }
    });
    if (has) session.set('ot-attr', JSON.stringify(attr));
    if (!session.get('ot-landing-ref')) {
      var ref = document.referrer || '';
      var external = ref && ref.indexOf(location.host) === -1;
      session.set('ot-landing-ref', external ? ref.slice(0, 500) : '(direct or internal)');
    }
  })();
  function attribution() {
    try { return JSON.parse(session.get('ot-attr') || '{}'); } catch (e) { return {}; }
  }

  /* ------------------------------------------------------------- leads */
  function isLive() {
    if (CFG.dryRun) return false;
    var hosts = (CFG.leads && CFG.leads.liveHosts) || [];
    if (hosts.indexOf(location.hostname) !== -1) return true;
    // Staging on the CloudFront domain before DNS: add ?leads=live to test the real pipeline.
    return /[?&]leads=live\b/.test(location.search) && location.protocol === 'https:';
  }

  // Lambda error strings -> something a person can act on.
  function friendlyError(msg) {
    msg = String(msg || '');
    if (/disposable/i.test(msg)) return 'That looks like a throwaway address. Use your real email and it’s yours.';
    if (/valid address|required/i.test(msg)) return 'Check the email address. It needs an @ and a domain.';
    if (/too many/i.test(msg)) return 'Too many tries from this connection. Wait a few minutes and try again.';
    return msg.charAt(0).toUpperCase() + msg.slice(1);
  }

  var KIND = {
    newsletter: { kind: 'newsletter', want: 'Outreach teardowns newsletter' },
    playbook: { kind: 'outreach_playbook', want: 'The cold outreach playbook (PDF)' },
    template: { kind: 'outreach_crm_template', want: 'Two-touch CRM template + outreach sequence structure' },
    crm: { kind: 'outreach_crm_export', want: 'Unlocked save and export in the two-touch CRM' }
  };

  function buildPayload(capture, email, optin, honeypot) {
    var def = KIND[capture] || KIND.newsletter;
    var p = {
      kind: def.kind,
      email: email,
      want: def.want + (capture !== 'newsletter' && optin ? ' (also wants new teardowns)' : ''),
      consent: capture === 'newsletter' ? true : !!optin,
      source_page: (location.origin && location.origin !== 'null' ? location.origin : '') + location.pathname,
      referrer: session.get('ot-landing-ref') || document.referrer || '',
      website: honeypot || ''
    };
    var a = attribution();
    Object.keys(a).forEach(function (k) { p[k] = a[k]; });
    return p;
  }

  // Resolves to { status: 'sent' | 'dry-run' | 'rejected' | 'degraded', errors? }.
  // 'degraded' (network error, 5xx, rate limit) still counts as success for the
  // visitor: a backend hiccup must never cost them what they asked for.
  function submitLead(payload) {
    if (!isLive()) {
      if (window.console) console.info('[outreach] dry run, lead not sent:', payload);
      return Promise.resolve({ status: 'dry-run' });
    }
    return fetch(CFG.leads.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      keepalive: true
    }).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (j) {
        if (r.status === 400 && j && j.errors && j.errors.length) return { status: 'rejected', errors: j.errors };
        return { status: r.ok ? 'sent' : 'degraded', code: r.status };
      });
    }).catch(function () { return { status: 'degraded' }; });
  }

  /* ------------------------------------------------------ capture forms */
  function setMsg(form, text, isError) {
    var m = form.querySelector('.form-msg');
    if (!m) return;
    m.textContent = text || '';
    m.classList.toggle('is-error', !!isError);
  }

  function markSubscribed() {
    document.querySelectorAll('form[data-capture="newsletter"]').forEach(function (f) {
      Array.prototype.forEach.call(f.children, function (el) {
        if (!el.classList.contains('capture-title') && !el.classList.contains('form-done')) el.hidden = true;
      });
      var done = f.querySelector('.form-done');
      if (done) done.hidden = false;
    });
  }
  if (store.get('ot-subscribed') === '1') markSubscribed();

  var prefill = store.get('ot-email') || '';
  if (prefill) {
    document.querySelectorAll('form[data-capture] input[type="email"]').forEach(function (i) {
      if (!i.value) i.value = prefill;
    });
  }

  document.addEventListener('submit', function (e) {
    var form = e.target.closest('form[data-capture]');
    if (!form) return;
    e.preventDefault();
    var capture = form.getAttribute('data-capture');
    var input = form.querySelector('input[type="email"]');
    var optin = form.querySelector('input[name="optin"]');
    var hp = form.querySelector('input[name="website"]');
    var email = (input.value || '').trim();
    input.removeAttribute('aria-invalid');
    setMsg(form, '');
    if (!EMAIL_RE.test(email)) {
      input.setAttribute('aria-invalid', 'true');
      setMsg(form, 'Check the email address. It needs an @ and a domain.', true);
      input.focus();
      return;
    }
    var btn = form.querySelector('button[type="submit"]');
    var label = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'Sending…';
    submitLead(buildPayload(capture, email, optin && optin.checked, hp && hp.value)).then(function (res) {
      btn.disabled = false;
      btn.textContent = label;
      if (res.status === 'rejected') {
        input.setAttribute('aria-invalid', 'true');
        setMsg(form, friendlyError(res.errors[0]), true);
        return;
      }
      store.set('ot-email', email);
      if (capture === 'newsletter' || (optin && optin.checked)) {
        store.set('ot-subscribed', '1');
        markSubscribed();
      }
      if (capture !== 'newsletter') unlock(capture);
      if (res.status === 'dry-run') toast('Preview build: nothing was sent. On the live site this goes to Het’s inbox.');
      else if (capture === 'newsletter') toast('Subscribed. The next teardown will land in your inbox.');
    });
  });

  /* -------------------------------------------------------------- gates */
  var pending = {};

  function isUnlocked(id) { return store.get('ot-unlocked-' + id) === '1'; }

  function showDone(dlg) {
    var form = dlg.querySelector('.gate-form');
    var done = dlg.querySelector('.gate-done');
    if (form) form.hidden = true;
    if (done) done.hidden = false;
    var first = done && done.querySelector('a,button');
    if (first) first.focus();
  }

  function unlock(id) {
    store.set('ot-unlocked-' + id, '1');
    var dlg = document.getElementById('gate-' + id);
    var cb = pending[id];
    pending[id] = null;
    if (cb) {
      if (dlg && dlg.open) dlg.close();
      cb();
      return;
    }
    if (dlg) showDone(dlg);
  }

  function openGate(id, onUnlock) {
    if (onUnlock && isUnlocked(id)) { onUnlock(); return; }
    var dlg = document.getElementById('gate-' + id);
    if (!dlg) return;
    pending[id] = onUnlock || null;
    var form = dlg.querySelector('.gate-form');
    var done = dlg.querySelector('.gate-done');
    if (isUnlocked(id) && done) {
      showDone(dlg);
    } else {
      if (form) { form.hidden = false; setMsg(form, ''); }
      if (done) done.hidden = true;
    }
    if (typeof dlg.showModal === 'function') {
      if (!dlg.open) dlg.showModal();
    } else {
      dlg.setAttribute('open', '');
    }
    var focusTarget = dlg.querySelector(isUnlocked(id) ? '.gate-done a' : 'input[type="email"]');
    if (focusTarget) focusTarget.focus();
  }

  document.addEventListener('click', function (e) {
    var g = e.target.closest('[data-gate]');
    if (!g) return;
    e.preventDefault();
    openGate(g.getAttribute('data-gate'));
  });
  // Close on a backdrop click, like the Escape key already does.
  document.querySelectorAll('dialog.gate').forEach(function (dlg) {
    dlg.addEventListener('click', function (e) {
      if (e.target !== dlg) return;
      var r = dlg.getBoundingClientRect();
      var inside = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
      if (!inside) dlg.close();
    });
    dlg.addEventListener('close', function () {
      var id = dlg.id.replace('gate-', '');
      pending[id] = null;
    });
  });

  /* --------------------------------------------------------------- copy */
  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text).then(function () { return true; }, function () { return fallback(); });
    }
    return Promise.resolve(fallback());
    function fallback() {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.className = 'sr-only';
      document.body.appendChild(ta);
      ta.select();
      var ok = false;
      try { ok = document.execCommand('copy'); } catch (err) { ok = false; }
      ta.remove();
      return ok;
    }
  }
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-copy]');
    if (!b) return;
    copyText(b.getAttribute('data-copy')).then(function (ok) {
      toast(ok ? 'Link copied.' : 'Couldn’t reach the clipboard. The link is ' + b.getAttribute('data-copy'));
    });
  });

  window.OT = {
    cfg: CFG,
    store: store,
    session: session,
    toast: toast,
    copyText: copyText,
    openGate: openGate,
    isUnlocked: isUnlocked,
    isLive: isLive
  };
})();
