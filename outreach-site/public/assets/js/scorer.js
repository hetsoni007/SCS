/* =====================================================================
   /tools/prospect-scorer: no login, no gate.
   Inputs live in the URL (?signal=&size=&days=) so any result can be shared.
   ===================================================================== */
(function () {
  'use strict';
  var app = document.querySelector('[data-scorer]');
  if (!app || !window.OTScore || !window.OT) return;

  var cfg = window.OT.cfg || {};
  var W = cfg.scorer;
  var windowDays = cfg.windowDays || 90;
  if (!W) return;

  var form = app.querySelector('[data-scorer-form]');
  var num = app.querySelector('#sc-days');
  var range = app.querySelector('#sc-days-range');
  var daysBox = app.querySelector('.scorer-days');
  var daysNote = app.querySelector('[data-days-note]');
  var example = app.querySelector('[data-example]');
  var q = function (sel) { return app.querySelector(sel); };
  var touched = false;

  function checked(name) {
    var el = form.querySelector('input[name="' + name + '"]:checked');
    return el ? el.value : null;
  }
  function setRadio(name, value) {
    var el = form.querySelector('input[name="' + name + '"][value="' + String(value).replace(/"/g, '') + '"]');
    if (el) el.checked = true;
  }
  function setDays(v) {
    var n = Math.max(0, Math.min(999, parseInt(v, 10) || 0));
    num.value = n;
    range.value = Math.min(n, 365);
  }
  function pts(p) { return p > 0 ? '+' + p : (p === 0 ? '0' : '−' + Math.abs(p)); }

  function render() {
    var r = window.OTScore.score({ signal: checked('signal'), size: checked('size'), days: num.value }, W, windowDays);
    q('[data-score]').textContent = r.total;
    q('[data-verdict]').textContent = r.verdict.label;
    q('[data-reason]').textContent = r.reason;
    var segs = app.querySelectorAll('[data-meter] .meter-seg');
    for (var i = 0; i < segs.length; i++) {
      segs[i].classList.toggle('is-on', i < r.total);
      segs[i].classList.toggle('is-end', i === r.total - 1);
    }
    q('[data-part="signal"]').textContent = r.signal.label;
    q('[data-part="size"]').textContent = r.size.label;
    q('[data-part="timing"]').textContent = r.noTrigger ? 'No trigger date' : 'Day ' + r.days + ', ' + r.timing.label;
    q('[data-pts="signal"]').textContent = pts(r.signal.points);
    q('[data-pts="size"]').textContent = pts(r.size.points);
    q('[data-pts="timing"]').textContent = pts(r.timing.points);
    q('[data-pts="total"]').textContent = r.total + (r.raw !== r.total ? ' (' + r.raw + ')' : '');

    daysBox.classList.toggle('is-off', r.noTrigger);
    daysNote.hidden = !r.noTrigger;
    var mark = q('[data-mini-mark]');
    var cap = q('[data-mini-cap]');
    if (r.noTrigger) {
      mark.hidden = true;
      cap.textContent = 'No trigger date, so timing scores 0.';
    } else {
      mark.hidden = false;
      var span = windowDays * 2;
      mark.style.setProperty('--x', (Math.min(r.days, span) / span * 100).toFixed(2) + '%');
      cap.textContent = r.days <= windowDays
        ? 'Day ' + r.days + ' of the ' + windowDays + '-day window'
        : 'Day ' + r.days + ': ' + (r.days - windowDays) + ' days past the ' + windowDays + '-day window';
    }
    if (example) example.hidden = touched;
  }

  // Prefill from a shared link.
  try {
    var params = new URLSearchParams(location.search);
    if (params.get('signal')) setRadio('signal', params.get('signal'));
    if (params.get('size')) setRadio('size', params.get('size'));
    if (params.get('days') !== null) setDays(params.get('days'));
    touched = params.has('signal') || params.has('size') || params.has('days');
  } catch (e) { /* old browser: defaults stand */ }

  function onInput(e) {
    if (e.target === num) range.value = Math.min(parseInt(num.value, 10) || 0, 365);
    if (e.target === range) num.value = range.value;
    touched = true;
    render();
  }
  form.addEventListener('input', onInput);
  form.addEventListener('change', onInput);
  app.querySelectorAll('[data-days]').forEach(function (b) {
    b.addEventListener('click', function () {
      setDays(b.getAttribute('data-days'));
      touched = true;
      render();
    });
  });

  var copyBtn = q('[data-copy-link]');
  if (copyBtn) {
    copyBtn.addEventListener('click', function () {
      var p = new URLSearchParams();
      p.set('signal', checked('signal'));
      p.set('size', checked('size'));
      var s = window.OTScore.score({ signal: checked('signal'), size: checked('size'), days: num.value }, W, windowDays);
      if (!s.noTrigger) p.set('days', String(s.days));
      var base = cfg.pageUrl || (location.origin + location.pathname);
      var url = base + '?' + p.toString();
      window.OT.copyText(url).then(function (ok) {
        window.OT.toast(ok ? 'Link to this score copied.' : 'Couldn’t reach the clipboard. The link is ' + url);
      });
    });
  }

  render();
})();
