/* =====================================================================
   /tools/outreach-crm: the two-touch CRM.

   The cap is structural, not a warning:
   - a prospect record has exactly two touch slots, t1 and t2;
   - actionsFor() is the complete list of things you can do to a prospect,
     and after t2 it contains only: replied, said no, close, auto-reply;
   - clean() is the only way a record enters the list (add, import, storage),
     and it reads t1 and t2 and nothing else, so no import can add a third;
   - contacted prospects can't be deleted, and the same person can't be
     added twice, so delete-and-re-add can't reset the cap.

   Data lives in sessionStorage until the visitor saves (localStorage) or
   exports, and both of those sit behind the email gate in site.js.
   Everything rendered from data uses textContent (imports are untrusted).
   ===================================================================== */
(function () {
  'use strict';
  var app = document.querySelector('[data-crm]');
  if (!app || !window.OT) return;

  var OT = window.OT;
  var cfg = OT.cfg || {};
  var W = cfg.scorer || null;
  var WINDOW = cfg.windowDays || 90;
  var KEY_SESSION = 'ot-crm-session';
  var KEY_SAVED = 'ot-crm-saved';
  var COLS = cfg.crmColumns || ['name', 'company', 'role', 'contact', 'signal_type', 'company_size', 'signal_quote',
    'signal_date', 'touch1_date', 'touch1_note', 'touch2_date', 'touch2_new_information', 'outcome', 'outcome_date',
    'auto_replies', 'added'];
  var SIGNALS = W ? W.signals.map(function (s) { return s.id; }) : ['pain', 'launch', 'rebuild', 'hiring', 'title'];
  var SIZES = W ? W.sizes.map(function (z) { return z.id; }) : ['1-10', '11-50', '51-200', '201-1000', '1000+'];
  var OUTCOMES = ['replied', 'said_no', 'closed_no_reply'];
  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  var state = { prospects: [], mode: 'session', filter: 'all', open: null };

  /* -------------------------------------------------------------- icons */
  var PATHS = {
    check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
    x: '<path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/>',
    clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
    dash: '<path d="M6 12h12"/>',
    dot: '<circle cx="12" cy="12" r="3.5"/>',
    auto: '<rect x="5" y="7" width="14" height="11" rx="2"/><path d="M9 4v3M15 4v3M9 12h.01M15 12h.01"/>'
  };
  function icon(name) {
    var s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    s.setAttribute('viewBox', '0 0 24 24');
    s.setAttribute('class', 'i');
    s.setAttribute('aria-hidden', 'true');
    s.setAttribute('focusable', 'false');
    s.setAttribute('fill', 'none');
    s.setAttribute('stroke', 'currentColor');
    s.setAttribute('stroke-width', '2');
    s.setAttribute('stroke-linecap', 'round');
    s.setAttribute('stroke-linejoin', 'round');
    s.innerHTML = PATHS[name] || '';   // static markup only, never data
    return s;
  }
  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined && text !== null) n.textContent = text;
    return n;
  }

  /* -------------------------------------------------------------- dates */
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function iso(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function today() { return iso(new Date()); }
  function daysAgo(n) { var d = new Date(); d.setDate(d.getDate() - n); return iso(d); }
  function parseDate(s) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(s || '').trim());
    if (!m) return null;
    var d = new Date(+m[1], +m[2] - 1, +m[3]);
    return (d.getMonth() === +m[2] - 1) ? d : null;
  }
  function isDate(s) { return !!parseDate(s); }
  function daysSince(s) {
    var d = parseDate(s);
    if (!d) return null;
    return Math.round((parseDate(today()) - d) / 86400000);
  }
  function fmt(s) {
    var d = parseDate(s);
    return d ? d.getDate() + ' ' + MONTHS[d.getMonth()] : '';
  }

  /* ---------------------------------------------------------- the model */
  function uid() { return 'p' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8); }
  function str(v, n) { return String(v === undefined || v === null ? '' : v).replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, n); }
  function norm(s) { return String(s || '').toLowerCase().replace(/^mailto:/, '').replace(/^https?:\/\/(www\.)?/, '').replace(/\/+$/, '').trim(); }

  function touch(t) {
    if (!t || typeof t !== 'object' || !isDate(t.date)) return null;
    return { date: String(t.date).trim(), note: str(t.note, 1000) };
  }

  // The only door into the list. Reads t1 and t2, never anything else.
  function clean(p) {
    p = p || {};
    var r = {
      id: str(p.id, 40) || uid(),
      name: str(p.name, 120),
      company: str(p.company, 160),
      role: str(p.role, 120),
      contact: str(p.contact, 300),
      signal_type: SIGNALS.indexOf(p.signal_type) !== -1 ? p.signal_type : 'launch',
      size: SIZES.indexOf(p.size) !== -1 ? p.size : '11-50',
      signal_quote: str(p.signal_quote, 300),
      trigger_date: isDate(p.trigger_date) ? String(p.trigger_date).trim() : '',
      added: isDate(p.added) ? String(p.added).trim() : today(),
      t1: touch(p.t1),
      t2: null,
      outcome: null,
      auto_replies: Math.max(0, Math.min(99, parseInt(p.auto_replies, 10) || 0)),
      sample: p.sample === true
    };
    // Structure, not trust: touch 2 only on top of touch 1 (and not dated before it),
    // an outcome only after a touch, "closed with no reply" only after both.
    if (r.t1) {
      var t2 = touch(p.t2);
      if (t2 && t2.date >= r.t1.date) r.t2 = t2;
    }
    var o = p.outcome && typeof p.outcome === 'object' ? p.outcome : null;
    if (r.t1 && o && OUTCOMES.indexOf(o.type) !== -1 && (o.type !== 'closed_no_reply' || r.t2)) {
      r.outcome = { type: o.type, date: isDate(o.date) ? String(o.date).trim() : (r.t2 || r.t1).date };
    }
    if (!r.t1) r.auto_replies = 0;
    return r;
  }

  function stage(p) {
    if (p.outcome) return p.outcome.type;
    if (p.t2) return 'waiting2';
    if (p.t1) return 'waiting1';
    return 'todo';
  }

  // Everything you can do to a prospect. There is no third touch in this list,
  // and no other function adds a touch.
  function actionsFor(p) {
    switch (stage(p)) {
      case 'todo': return ['touch1', 'remove'];
      case 'waiting1': return ['touch2', 'replied', 'said_no', 'auto'];
      case 'waiting2': return ['replied', 'said_no', 'closed_no_reply', 'auto'];
      default: return [];
    }
  }
  function allowed(p, action) { return actionsFor(p).indexOf(action) !== -1; }

  var GENERIC = /\b(just\s+)?(following|checking)\s+(up|in)\b|\bbump(ing|ed)?\b|\bcircling\s+back\b|\btouching\s+base\b|\bany\s+(updates?|thoughts)\b|\bfloat(ing)?\s+this\b|\bgentle\s+reminder\b/i;

  function touch2Problem(note, t1note) {
    if (note.length < 15) return 'Touch 2 is the last one. Say what’s new since touch 1: a finding, a change on their site, or a response to what they said.';
    var rest = note.replace(new RegExp(GENERIC.source, 'gi'), ' ').replace(/[^a-z0-9]+/gi, ' ').trim();
    if (GENERIC.test(note) && rest.length < 25) {
      return 'That reads like “just following up”. Touch 2 is the last one you get, so give it something new: a finding, a change on their site, or a response to what they said.';
    }
    if (t1note && norm(note) === norm(t1note)) return 'That’s the same as touch 1. Touch 2 has to add something new.';
    return null;
  }

  function logTouch(p, which, note, date) {
    if (!allowed(p, which)) return 'That step isn’t available for this prospect.';
    note = str(note, 1000);
    date = isDate(date) ? date : today();
    if (which === 'touch1') {
      if (note.length < 10) return 'Write down the specific thing you pointed out. Touch 2 has to build on it.';
      p.t1 = { date: date, note: note };
      return null;
    }
    var problem = touch2Problem(note, p.t1 && p.t1.note);
    if (problem) return problem;
    if (date < p.t1.date) return 'Touch 2 can’t be dated before touch 1 (' + fmt(p.t1.date) + ').';
    p.t2 = { date: date, note: note };
    return null;
  }

  function setOutcome(p, type) {
    if (!allowed(p, type)) return 'That step isn’t available for this prospect.';
    p.outcome = { type: type, date: today() };
    return null;
  }

  function findDuplicate(p, list) {
    var c = norm(p.contact);
    var nc = norm(p.name) + '|' + norm(p.company);
    return (list || state.prospects).filter(function (x) {
      return x !== p && ((c && norm(x.contact) === c) || (norm(x.name) + '|' + norm(x.company)) === nc);
    })[0] || null;
  }

  var STAGE = {
    todo: { label: 'To contact', pill: 'todo', icon: 'dot' },
    waiting1: { label: 'Touch 1 sent', pill: 'wait', icon: 'clock' },
    waiting2: { label: 'Touch 2 sent, the last one', pill: 'wait', icon: 'clock' },
    replied: { label: 'Replied', pill: 'yes', icon: 'check' },
    said_no: { label: 'Said no, closed for good', pill: 'no', icon: 'x' },
    closed_no_reply: { label: 'Closed, no reply', pill: 'closed', icon: 'dash' }
  };
  var ACTION_LABEL = {
    touch1: 'Log touch 1',
    touch2: 'Log touch 2 (the last one)',
    replied: 'They replied',
    said_no: 'They said no',
    closed_no_reply: 'Close, no reply',
    auto: 'Auto-reply came in',
    remove: 'Remove'
  };

  /* ------------------------------------------------------------ samples */
  function samples() {
    var list = [
      { name: 'Sam (sample)', company: 'Example Analytics', role: 'Founder', contact: 'sam@example.com',
        signal_type: 'launch', size: '11-50', signal_quote: 'website is live', trigger_date: daysAgo(2) },
      { name: 'Priya (sample)', company: 'Example Health', role: 'CTO', contact: 'priya@example.com',
        signal_type: 'pain', size: '11-50', signal_quote: 'our site is so slow', trigger_date: daysAgo(9),
        t1: { date: daysAgo(6), note: 'Hero image is the largest element on mobile, about 4s. Asked if the full-size image is going to phones.' },
        auto_replies: 1 },
      { name: 'Leo (sample)', company: 'Example Commerce', role: 'Head of Product', contact: 'leo@example.org',
        signal_type: 'rebuild', size: '51-200', signal_quote: 'redesigning our site', trigger_date: daysAgo(41),
        t1: { date: daysAgo(30), note: 'Checkout is two pages on mobile. Asked if the redesign merges them.' },
        t2: { date: daysAgo(12), note: 'Redesign shipped. Step 2 of checkout now jumps while it loads. Sent the before and after.' } },
      { name: 'Ana (sample)', company: 'Example Labs', role: 'Founder', contact: 'ana@example.net',
        signal_type: 'launch', size: '1-10', signal_quote: 'we just launched', trigger_date: daysAgo(25),
        t1: { date: daysAgo(23), note: 'Three questions about their PWA-first launch. No pitch.' },
        outcome: { type: 'replied', date: daysAgo(22) } },
      { name: 'Tom (sample)', company: 'Example Agency', role: 'CEO', contact: 'tom@example.com',
        signal_type: 'hiring', size: '11-50', signal_quote: 'hiring a React Native developer', trigger_date: daysAgo(33),
        t1: { date: daysAgo(30), note: 'Offered to cover the React Native role as a studio.' },
        outcome: { type: 'said_no', date: daysAgo(29) } },
      { name: 'Ravi (sample)', company: 'Example Studio', role: 'CTO', contact: 'ravi@example.org',
        signal_type: 'launch', size: '11-50', signal_quote: 'our new site is up', trigger_date: daysAgo(70),
        t1: { date: daysAgo(66), note: 'Web fonts block the first render on mobile. Asked how they load them.' },
        t2: { date: daysAgo(50), note: 'New blog launched since; its images ship at 3x their display size. Sent one screenshot.' },
        outcome: { type: 'closed_no_reply', date: daysAgo(35) } }
    ];
    return list.map(function (s) {
      s.sample = true;
      s.added = daysAgo(45);
      return clean(s);
    });
  }
  function hasSamples() { return state.prospects.some(function (p) { return p.sample; }); }
  function clearSamples(quiet) {
    var before = state.prospects.length;
    state.prospects = state.prospects.filter(function (p) { return !p.sample; });
    if (!quiet && before !== state.prospects.length) OT.toast('Sample prospects cleared. The list is yours now.');
  }

  /* ------------------------------------------------------------ storage */
  function readStored(raw) {
    if (!raw) return null;
    try {
      var j = JSON.parse(raw);
      var list = Array.isArray(j) ? j : j && j.prospects;
      return Array.isArray(list) ? list.map(clean) : null;
    } catch (e) { return null; }
  }
  function load() {
    var saved = readStored(OT.store.get(KEY_SAVED));
    if (saved) { state.mode = 'saved'; state.prospects = saved; return; }
    var sess = readStored(OT.session.get(KEY_SESSION));
    state.prospects = sess || samples();
  }
  function persist() {
    var data = JSON.stringify({ format: 'two-touch-crm', version: 1, prospects: state.prospects });
    OT.session.set(KEY_SESSION, data);
    if (state.mode === 'saved' && !OT.store.set(KEY_SAVED, data)) {
      OT.toast('This browser blocked saving. Export a copy instead.');
    }
  }

  var undoSnap = null;
  function snapshot() { undoSnap = JSON.stringify(state.prospects); }
  function undo() {
    if (!undoSnap) return;
    state.prospects = JSON.parse(undoSnap).map(clean);
    undoSnap = null;
    commit();
    OT.toast('Undone.');
  }
  function commit() { persist(); render(); }

  /* -------------------------------------------------------------- views */
  var listEl = app.querySelector('[data-crm-list]');
  var emptyEl = app.querySelector('[data-crm-empty]');
  var bannerEl = app.querySelector('[data-crm-banner]');
  var countEl = app.querySelector('[data-crm-count]');
  var saveBtn = app.querySelector('[data-crm-save]');

  var FILTER = {
    all: function () { return true; },
    todo: function (s) { return s === 'todo'; },
    waiting: function (s) { return s === 'waiting1' || s === 'waiting2'; },
    replied: function (s) { return s === 'replied'; },
    closed: function (s) { return s === 'said_no' || s === 'closed_no_reply'; }
  };
  var ORDER = { waiting2: 0, waiting1: 1, todo: 2, replied: 3, said_no: 4, closed_no_reply: 5 };

  function lastActivity(p) {
    return (p.outcome && p.outcome.date) || (p.t2 && p.t2.date) || (p.t1 && p.t1.date) || p.trigger_date || p.added;
  }
  function sorted(list) {
    return list.slice().sort(function (a, b) {
      var sa = stage(a), sb = stage(b);
      if (ORDER[sa] !== ORDER[sb]) return ORDER[sa] - ORDER[sb];
      var da = lastActivity(a), db = lastActivity(b);
      // Waiting: oldest first (needs a decision soonest). Everything else: newest first.
      if (sa === 'waiting1' || sa === 'waiting2') return da < db ? -1 : da > db ? 1 : 0;
      return da < db ? 1 : da > db ? -1 : 0;
    });
  }

  function counts() {
    var c = { todo: 0, waiting: 0, replied: 0, said_no: 0, closed_no_reply: 0, contacted: 0, auto: 0 };
    state.prospects.forEach(function (p) {
      var s = stage(p);
      if (s === 'todo') c.todo++; else c.contacted++;
      if (s === 'waiting1' || s === 'waiting2') c.waiting++;
      if (s === 'replied' || s === 'said_no' || s === 'closed_no_reply') c[s]++;
      c.auto += p.auto_replies;
    });
    return c;
  }

  function renderCount() {
    var c = counts();
    var rate = c.contacted ? Math.round(c.replied / c.contacted * 100) + '%' : '–';
    var items = [
      ['To contact', c.todo, 'dot'],
      ['Contacted', c.contacted, null, 'touch 1 sent'],
      ['Waiting', c.waiting, 'clock'],
      ['Replied', c.replied, 'check'],
      ['Said no', c.said_no, 'x'],
      ['Closed, no reply', c.closed_no_reply, 'dash'],
      ['Reply rate', rate, null, 'auto-replies excluded'],
      ['Auto-replies', c.auto, 'auto', 'not counted as replies']
    ];
    countEl.textContent = '';
    items.forEach(function (it) {
      var d = el('div');
      var dt = el('dt');
      if (it[2]) dt.appendChild(icon(it[2]));
      dt.appendChild(document.createTextNode(it[0]));
      var dd = el('dd', null, String(it[1]));
      if (it[3]) dd.appendChild(el('small', null, it[3]));
      d.appendChild(dt);
      d.appendChild(dd);
      countEl.appendChild(d);
    });
  }

  function renderBanner() {
    bannerEl.textContent = '';
    var p = el('p');
    var btn = null;
    if (hasSamples()) {
      p.textContent = 'These are sample prospects, so you can see how the cap works. They disappear when you add your own.';
      btn = el('button', 'btn btn--quiet', 'Clear samples');
      btn.type = 'button';
      btn.addEventListener('click', function () { snapshot(); clearSamples(); commit(); });
    } else if (state.mode === 'saved') {
      p.textContent = 'Saved in this browser. Clearing your browser data deletes it, so export a copy now and then.';
    } else {
      p.textContent = 'Session only: this list lives in this tab and disappears when you close it.';
      btn = el('button', 'btn btn--quiet', 'Save to this browser');
      btn.type = 'button';
      btn.addEventListener('click', requestSave);
    }
    bannerEl.appendChild(p);
    if (btn) bannerEl.appendChild(btn);
  }

  function tagsFor(p) {
    var wrap = el('div', 'pcard-tags');
    var sig = W ? W.signals.filter(function (s) { return s.id === p.signal_type; })[0] : null;
    var sigText = (sig ? sig.label : p.signal_type) + (p.signal_quote ? ': “' + p.signal_quote + '”' : '');
    wrap.appendChild(el('span', 'tag', sigText));
    var noTrigger = sig && sig.no_trigger;
    var d = daysSince(p.trigger_date);
    if (!noTrigger && d !== null && d >= 0) {
      var late = d > WINDOW;
      wrap.appendChild(el('span', 'tag' + (late ? ' tag--late' : ''),
        late ? 'Day ' + d + ', past the ' + WINDOW + '-day window' : 'Day ' + d + ' of ' + WINDOW));
    }
    if (W && window.OTScore && (noTrigger || (d !== null && d >= 0))) {
      var r = window.OTScore.score({ signal: p.signal_type, size: p.size, days: d || 0 }, W, WINDOW);
      var t = el('span', 'tag');
      t.appendChild(document.createTextNode('Score '));
      t.appendChild(el('strong', null, r.total + '/10'));
      t.title = r.reason;
      wrap.appendChild(t);
    }
    return wrap;
  }

  function slot(n, t, p) {
    var box = el('div', 'tslot' + (t ? ' is-done' : ''));
    var h = el('div', 'tslot-h');
    h.appendChild(el('span', null, 'Touch ' + n + (n === 2 ? ' · last' : '')));
    if (t) h.appendChild(el('span', null, fmt(t.date)));
    box.appendChild(h);
    if (t) {
      box.appendChild(el('p', null, t.note || '(no note)'));
    } else {
      var closed = !!p.outcome;
      box.appendChild(el('p', 'tslot-empty', closed ? 'Not sent' : (n === 1 ? 'Not sent yet' : (p.t1 ? 'Only with something new' : 'After touch 1'))));
    }
    return box;
  }

  function touchForm(p, which) {
    var f = el('form', 'tform');
    f.noValidate = true;
    f.setAttribute('data-touch-form', which);
    f.appendChild(el('p', 'tform-hint', which === 'touch1'
      ? 'What specific thing did you point out? One or two issues, never a list.'
      : 'This is the last touch. What’s new since touch 1? A new finding, a change on their site, or a response to what they said.'));
    var lab = el('label', null, which === 'touch1' ? 'What you sent' : 'What’s new');
    var ta = el('textarea');
    ta.name = 'note';
    ta.required = true;
    ta.id = 'note-' + p.id;
    ta.placeholder = which === 'touch1' ? 'e.g. Hero image is the largest element on mobile, about 4s' : 'e.g. They shipped the redesign; checkout step 2 now jumps while loading';
    lab.appendChild(ta);
    f.appendChild(lab);
    var row = el('div', 'tform-row');
    var dl = el('label', null, 'Sent on');
    var di = el('input');
    di.type = 'date';
    di.name = 'date';
    di.value = today();
    di.max = today();
    dl.appendChild(di);
    row.appendChild(dl);
    var ok = el('button', 'btn', which === 'touch1' ? 'Log touch 1' : 'Log touch 2');
    ok.type = 'submit';
    var cancel = el('button', 'btn btn--quiet', 'Cancel');
    cancel.type = 'button';
    cancel.setAttribute('data-act', 'cancel');
    cancel.setAttribute('data-id', p.id);
    row.appendChild(ok);
    row.appendChild(cancel);
    f.appendChild(row);
    var msg = el('p', 'form-msg');
    msg.setAttribute('role', 'status');
    f.appendChild(msg);
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var before = JSON.stringify(state.prospects);
      var err = logTouch(p, which, ta.value, di.value);
      if (err) {
        msg.textContent = err;
        msg.classList.add('is-error');
        ta.setAttribute('aria-invalid', 'true');
        ta.focus();
        return;
      }
      undoSnap = before;
      state.open = null;
      commit();
      focusCard(p.id);
      OT.toast((which === 'touch1' ? 'Touch 1' : 'Touch 2, the last one,') + ' logged for ' + p.name + '.', { action: 'Undo', onAction: undo, ms: 7000 });
    });
    return f;
  }

  function card(p) {
    var s = stage(p);
    var meta = STAGE[s];
    var li = el('li', 'pcard' + (p.outcome ? ' is-closed' : ''));
    li.setAttribute('data-card', p.id);
    li.tabIndex = -1;
    var nameId = 'pn-' + p.id;
    li.setAttribute('aria-labelledby', nameId);

    var top = el('div', 'pcard-top');
    var who = el('div');
    var nm = el('p', 'pcard-name', p.name || '(no name)');
    nm.id = nameId;
    who.appendChild(nm);
    var sub = el('p', 'pcard-sub');
    sub.textContent = [p.company, p.role].filter(Boolean).join(' · ');
    if (p.contact) {
      sub.appendChild(document.createTextNode(sub.textContent ? ' · ' : ''));
      if (/^https?:\/\//i.test(p.contact)) {
        var a = el('a', null, p.contact.replace(/^https?:\/\/(www\.)?/i, ''));
        a.href = p.contact;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        sub.appendChild(a);
      } else {
        sub.appendChild(document.createTextNode(p.contact));
      }
    }
    who.appendChild(sub);
    top.appendChild(who);
    var pill = el('span', 'pill pill--' + meta.pill);
    pill.appendChild(icon(meta.icon));
    pill.appendChild(document.createTextNode(meta.label));
    top.appendChild(pill);
    li.appendChild(top);

    li.appendChild(tagsFor(p));

    var touches = el('div', 'pcard-touches');
    touches.appendChild(slot(1, p.t1, p));
    touches.appendChild(slot(2, p.t2, p));
    li.appendChild(touches);

    if (p.outcome) {
      var o = el('p', 'pcard-outcome');
      var words = { replied: 'Replied', said_no: 'Said no', closed_no_reply: 'Closed with no reply' }[p.outcome.type];
      o.appendChild(el('strong', null, words + ' ' + fmt(p.outcome.date) + '.'));
      if (p.outcome.type === 'said_no') o.appendChild(document.createTextNode(' Closed for good. They can’t be added again.'));
      if (p.outcome.type === 'replied') o.appendChild(document.createTextNode(' It’s a conversation now, so it lives in your inbox.'));
      li.appendChild(o);
    }
    if (p.auto_replies) {
      li.appendChild(el('p', 'pcard-auto', p.auto_replies + ' auto-repl' + (p.auto_replies === 1 ? 'y' : 'ies') +
        ' logged. Not counted as a reply.'));
    }

    if (state.open && state.open.id === p.id && allowed(p, state.open.kind)) {
      li.appendChild(touchForm(p, state.open.kind));
    }

    var acts = actionsFor(p);
    if (acts.length) {
      var bar = el('div', 'pcard-actions');
      acts.forEach(function (a) {
        if (state.open && state.open.id === p.id && state.open.kind === a) return;
        var primary = a === 'touch1' || a === 'touch2';
        var b = el('button', 'btn' + (primary ? '' : ' btn--quiet'), ACTION_LABEL[a]);
        b.type = 'button';
        b.setAttribute('data-act', a);
        b.setAttribute('data-id', p.id);
        b.setAttribute('aria-label', ACTION_LABEL[a] + ': ' + (p.name || 'prospect'));
        bar.appendChild(b);
      });
      li.appendChild(bar);
    }
    if (s === 'waiting2') {
      li.appendChild(el('p', 'pcard-cap', 'Both touches used. What’s left: a reply, a no, or closing the thread.'));
    }
    return li;
  }

  function renderList() {
    listEl.textContent = '';
    var visible = sorted(state.prospects.filter(function (p) { return FILTER[state.filter](stage(p)); }));
    visible.forEach(function (p) { listEl.appendChild(card(p)); });
    emptyEl.hidden = visible.length > 0;
    if (!visible.length) {
      emptyEl.textContent = state.prospects.length
        ? 'Nothing here with this filter.'
        : 'No prospects yet. Add one, or import a CSV or JSON export.';
    }
  }

  function syncToolbar() {
    app.querySelectorAll('[data-filter]').forEach(function (b) {
      var on = b.getAttribute('data-filter') === state.filter;
      b.classList.toggle('is-on', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    if (saveBtn) {
      var saved = state.mode === 'saved';
      saveBtn.textContent = saved ? 'Saved in this browser' : 'Save to this browser';
      saveBtn.disabled = saved;
    }
  }

  function render() {
    renderBanner();
    renderCount();
    renderList();
    syncToolbar();
  }

  function focusCard(id) {
    var c = listEl.querySelector('[data-card="' + id + '"]');
    if (c) c.focus({ preventScroll: false });
  }

  /* ------------------------------------------------------------ actions */
  function byId(id) { return state.prospects.filter(function (p) { return p.id === id; })[0] || null; }

  listEl.addEventListener('click', function (e) {
    var b = e.target.closest('[data-act]');
    if (!b) return;
    var p = byId(b.getAttribute('data-id'));
    var act = b.getAttribute('data-act');
    if (!p) return;
    if (act === 'cancel') { state.open = null; render(); focusCard(p.id); return; }
    if (act === 'touch1' || act === 'touch2') {
      if (!allowed(p, act)) return;
      state.open = { id: p.id, kind: act };
      render();
      var ta = document.getElementById('note-' + p.id);
      if (ta) ta.focus();
      return;
    }
    var before = JSON.stringify(state.prospects);
    var err = null;
    var msg = '';
    if (act === 'auto') {
      if (!allowed(p, 'auto')) return;
      p.auto_replies += 1;
      msg = 'Auto-reply logged for ' + p.name + '. It doesn’t count as a reply, so the thread is still waiting on a person.';
    } else if (act === 'remove') {
      if (!allowed(p, 'remove')) return;
      state.prospects = state.prospects.filter(function (x) { return x !== p; });
      msg = 'Removed ' + p.name + '.';
    } else {
      err = setOutcome(p, act);
      msg = { replied: p.name + ' replied. It’s a conversation now.',
              said_no: p.name + ' said no. The thread is closed for good.',
              closed_no_reply: p.name + '’s thread is closed. No third touch.' }[act];
    }
    if (err) { OT.toast(err); return; }
    undoSnap = before;
    state.open = null;
    commit();
    focusCard(p.id);
    OT.toast(msg, { action: 'Undo', onAction: undo, ms: 7000 });
  });

  app.querySelectorAll('[data-filter]').forEach(function (b) {
    b.addEventListener('click', function () {
      state.filter = b.getAttribute('data-filter');
      render();
    });
  });

  /* ----------------------------------------------------------- add form */
  var addForm = app.querySelector('[data-crm-add]');
  var addToggle = app.querySelector('[data-crm-add-toggle]');
  var roleWarn = app.querySelector('[data-role-warn]');
  var RECRUITER = /recruit|talent|sourc(er|ing)|\bhr\b|human resources|people partner|hiring manager/i;

  function setAddOpen(open) {
    addForm.hidden = !open;
    addToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (open) addForm.querySelector('input[name="name"]').focus();
  }
  addToggle.addEventListener('click', function () { setAddOpen(addForm.hidden); });
  app.querySelector('[data-crm-add-cancel]').addEventListener('click', function () { setAddOpen(false); addToggle.focus(); });
  addForm.querySelector('[data-role-input]').addEventListener('input', function (e) {
    roleWarn.hidden = !RECRUITER.test(e.target.value);
  });
  addForm.addEventListener('submit', function (e) {
    e.preventDefault();
    var f = addForm.elements;
    var msg = addForm.querySelector('.form-msg');
    var p = clean({
      name: f.name.value, company: f.company.value, role: f.role.value, contact: f.contact.value,
      signal_type: f.signal_type.value, size: f.size.value, signal_quote: f.signal_quote.value,
      trigger_date: f.trigger_date.value, added: today()
    });
    msg.classList.add('is-error');
    if (!p.name || !p.company) { msg.textContent = 'Add at least a name and a company.'; (p.name ? f.company : f.name).focus(); return; }
    var dupe = findDuplicate(p);
    if (dupe) {
      msg.textContent = 'Already on your list (' + STAGE[stage(dupe)].label.toLowerCase() + '). The cap is per person, so adding them again doesn’t reset it.';
      return;
    }
    msg.textContent = '';
    msg.classList.remove('is-error');
    var hadSamples = hasSamples();
    if (hadSamples) clearSamples(true);
    state.prospects.unshift(p);
    state.filter = 'all';
    addForm.reset();
    roleWarn.hidden = true;
    setAddOpen(false);
    commit();
    focusCard(p.id);
    OT.toast('Added ' + p.name + (hadSamples ? '. Sample prospects cleared.' : '.') + ' Log touch 1 when you send it.');
  });

  /* ----------------------------------------------- save, export, import */
  function doSave() {
    state.mode = 'saved';
    commit();
    OT.toast('Saved in this browser. It stays until you clear your browser data.');
  }
  function requestSave() {
    if (state.mode === 'saved') return;
    OT.openGate('crm', doSave);
  }
  if (saveBtn) saveBtn.addEventListener('click', requestSave);

  function csvCell(v) {
    var s = v === undefined || v === null ? '' : String(v);
    if (/^[=+\-@\t\r]/.test(s)) s = '\'' + s;           // keep spreadsheets from running it as a formula
    if (/[",\n\r]/.test(s)) s = '"' + s.replace(/"/g, '""') + '"';
    return s;
  }
  function toRow(p) {
    return {
      name: p.name, company: p.company, role: p.role, contact: p.contact, signal_type: p.signal_type,
      company_size: p.size, signal_quote: p.signal_quote, signal_date: p.trigger_date,
      touch1_date: p.t1 ? p.t1.date : '', touch1_note: p.t1 ? p.t1.note : '',
      touch2_date: p.t2 ? p.t2.date : '', touch2_new_information: p.t2 ? p.t2.note : '',
      outcome: p.outcome ? p.outcome.type : '', outcome_date: p.outcome ? p.outcome.date : '',
      auto_replies: p.auto_replies, added: p.added
    };
  }
  function fromRow(r) {
    return {
      name: r.name, company: r.company, role: r.role, contact: r.contact, signal_type: r.signal_type,
      size: r.company_size, signal_quote: r.signal_quote, trigger_date: r.signal_date,
      t1: r.touch1_date ? { date: r.touch1_date, note: r.touch1_note } : null,
      t2: r.touch2_date ? { date: r.touch2_date, note: r.touch2_new_information } : null,
      outcome: r.outcome ? { type: r.outcome, date: r.outcome_date } : null,
      auto_replies: r.auto_replies, added: r.added
    };
  }
  function toCSV(list) {
    var lines = [COLS.join(',')];
    list.forEach(function (p) {
      var row = toRow(p);
      lines.push(COLS.map(function (c) { return csvCell(row[c]); }).join(','));
    });
    return lines.join('\r\n') + '\r\n';
  }
  function saveFile(name, content, type) {
    var blob = new Blob([content], { type: type });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
  }
  function doExport(kind) {
    var list = state.prospects.filter(function (p) { return !p.sample; });
    if (!list.length) { OT.toast('Nothing to export yet. Sample prospects aren’t exported.'); return; }
    var name = 'two-touch-crm-' + today() + '.' + kind;
    if (kind === 'csv') {
      saveFile(name, '﻿' + toCSV(list), 'text/csv;charset=utf-8');
    } else {
      saveFile(name, JSON.stringify({ format: 'two-touch-crm', version: 1, exported: new Date().toISOString(),
        prospects: list }, null, 2), 'application/json');
    }
    OT.toast('Exported ' + list.length + ' prospect' + (list.length === 1 ? '' : 's') + ' to ' + name + '.');
  }
  app.querySelectorAll('[data-crm-export]').forEach(function (b) {
    b.addEventListener('click', function () {
      var kind = b.getAttribute('data-crm-export');
      OT.openGate('crm', function () { doExport(kind); });
    });
  });

  function parseCSV(text) {
    text = text.replace(/^﻿/, '');
    var rows = [], row = [], cell = '', q = false;
    for (var i = 0; i < text.length; i++) {
      var ch = text[i];
      if (q) {
        if (ch === '"') {
          if (text[i + 1] === '"') { cell += '"'; i++; } else { q = false; }
        } else { cell += ch; }
      } else if (ch === '"') {
        q = true;
      } else if (ch === ',') {
        row.push(cell); cell = '';
      } else if (ch === '\n' || ch === '\r') {
        if (ch === '\r' && text[i + 1] === '\n') i++;
        row.push(cell); rows.push(row); row = []; cell = '';
      } else {
        cell += ch;
      }
    }
    if (cell !== '' || row.length) { row.push(cell); rows.push(row); }
    return rows.filter(function (r) { return r.some(function (c) { return c.trim() !== ''; }); });
  }
  function unguard(v) { return /^'[=+\-@]/.test(v) ? v.slice(1) : v; }

  function importText(text, filename) {
    var records = [];
    var ignored = [];
    if (/\.json$/i.test(filename) || /^\s*[\[{]/.test(text)) {
      var j = JSON.parse(text);
      records = Array.isArray(j) ? j : (j && Array.isArray(j.prospects) ? j.prospects : []);
    } else {
      var rows = parseCSV(text);
      if (!rows.length) throw new Error('empty');
      var header = rows[0].map(function (h) { return h.trim().toLowerCase(); });
      header.forEach(function (h) { if (h && COLS.indexOf(h) === -1) ignored.push(h); });
      records = rows.slice(1).map(function (r) {
        var o = {};
        header.forEach(function (h, k) { o[h] = unguard(r[k] || ''); });
        return fromRow(o);
      });
    }
    var added = 0;
    var skipped = 0;
    var incoming = [];
    records.forEach(function (raw) {
      if (/^example\b/i.test(String((raw && raw.name) || ''))) { skipped++; return; }
      var p = clean(raw);
      p.id = uid();
      p.sample = false;
      if (!p.name && !p.company) { skipped++; return; }
      if (findDuplicate(p, state.prospects.concat(incoming))) { skipped++; return; }
      incoming.push(p);
      added++;
    });
    return { incoming: incoming, added: added, skipped: skipped, ignored: ignored };
  }

  var importInput = app.querySelector('[data-crm-import]');
  importInput.addEventListener('change', function () {
    var file = importInput.files && importInput.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function () {
      var res;
      try { res = importText(String(reader.result || ''), file.name); } catch (err) {
        OT.toast('Couldn’t read ' + file.name + '. Import a CSV or JSON file exported from this CRM, or the template.');
        importInput.value = '';
        return;
      }
      importInput.value = '';
      if (!res.added) {
        OT.toast('Nothing new in ' + file.name + (res.skipped ? ': ' + res.skipped + ' skipped (already on your list, empty, or the template’s example row).' : '.'));
        return;
      }
      snapshot();
      if (hasSamples()) clearSamples(true);
      state.prospects = res.incoming.concat(state.prospects);
      state.filter = 'all';
      commit();
      var third = res.ignored.filter(function (h) { return /touch\s*_?\s*3|third/.test(h); });
      var note = third.length
        ? ' Ignored "' + third[0] + '": this CRM has two touch slots, on purpose.'
        : (res.ignored.length ? ' Ignored columns: ' + res.ignored.slice(0, 3).join(', ') + '.' : '');
      OT.toast('Imported ' + res.added + ' prospect' + (res.added === 1 ? '' : 's') +
        (res.skipped ? ', skipped ' + res.skipped : '') + '.' + note, { action: 'Undo', onAction: undo, ms: 9000 });
    };
    reader.readAsText(file);
  });

  // Exposed for the automated checks in the repo (and curious visitors). Read-only views
  // plus the same public actions the buttons use, so the cap can be tested from outside.
  window.OTCRM = {
    actionsFor: function (id) { var p = byId(id); return p ? actionsFor(p).slice() : null; },
    list: function () { return JSON.parse(JSON.stringify(state.prospects)); },
    importText: function (text, name) {
      var r = importText(text, name || 'import.csv');
      state.prospects = r.incoming.concat(state.prospects);
      commit();
      return { added: r.added, skipped: r.skipped, ignored: r.ignored };
    }
  };

  load();
  render();
})();
