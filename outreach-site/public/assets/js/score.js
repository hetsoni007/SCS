/* =====================================================================
   Prospect score: shared by /tools/prospect-scorer and the CRM.
   score = signal + company size + timing, clamped to 1..10.
   Weights come from data/stats.json (inlined into the page by build.py),
   so the scorer and the articles can never disagree about the window.
   ===================================================================== */
(function (root) {
  'use strict';

  var NOUN = { pain: 'stated pain', launch: 'launch', rebuild: 'rebuild', hiring: 'hiring post', title: 'job title' };

  function find(list, id) {
    for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
    return null;
  }

  function timingBand(days, timing) {
    for (var i = 0; i < timing.length; i++) {
      if (timing[i].max_days === null || days <= timing[i].max_days) return timing[i];
    }
    return timing[timing.length - 1];
  }

  function toDays(v) {
    var n = parseInt(v, 10);
    if (isNaN(n) || n < 0) return 0;
    return Math.min(n, 9999);
  }

  function verdict(total) {
    if (total >= 8) return { id: 'now', label: 'Audit it today' };
    if (total >= 5) return { id: 'week', label: 'Worth writing, not urgent' };
    return { id: 'skip', label: 'Find a better signal first' };
  }

  function reason(r, windowDays) {
    var noun = NOUN[r.signal.id] || 'signal';
    if (r.noTrigger) {
      return 'No stated intent. A title tells you who could buy, not who’s thinking about it. Find a signal first.';
    }
    if (r.days > windowDays) {
      return 'Day ' + r.days + ' is past the ~' + windowDays + '-day window, so the ' + noun +
        ' is background noise now. Find a newer reason to write.';
    }
    if (r.signal.id === 'hiring') {
      return 'Hiring posts are the wrong-audience trap. Check a founder or CTO is behind it, not a recruiter, before you write.';
    }
    if (r.size.points <= 0) {
      return 'A real signal, but at this size your email reaches a team, not the person who decides. Find who owns it first.';
    }
    if (r.total >= 8) {
      return 'Fresh ' + noun + ' at a size where the person posting probably decides. Audit the site and send today.';
    }
    return 'A real ' + noun + ' on day ' + r.days + '. Send this week, with one specific finding.';
  }

  function score(input, weights, windowDays) {
    var signal = find(weights.signals, input.signal) || weights.signals[0];
    var size = find(weights.sizes, input.size) || weights.sizes[0];
    var noTrigger = !!signal.no_trigger;
    var days = noTrigger ? null : toDays(input.days);
    var timing = noTrigger ? { points: 0, label: 'no trigger date' } : timingBand(days, weights.timing);
    var raw = signal.points + size.points + timing.points;
    var total = Math.max(1, Math.min(10, raw));
    var r = { signal: signal, size: size, timing: timing, days: days, noTrigger: noTrigger, raw: raw, total: total };
    r.verdict = verdict(total);
    r.reason = reason(r, windowDays);
    return r;
  }

  root.OTScore = { score: score, verdict: verdict, timingBand: timingBand, noun: NOUN };
})(window);
