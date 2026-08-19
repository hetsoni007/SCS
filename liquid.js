/* =====================================================================
   LIQUID JS — Lenis smooth scroll + GSAP scroll engine + interactions
   Requires (loaded before this file):
     gsap, ScrollTrigger, Lenis
   ===================================================================== */
(function () {
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasGSAP = typeof gsap !== 'undefined';
  var hasLenis = typeof Lenis !== 'undefined';

  /* ---------- Theme toggle (dark / light) ---------- */
  (function () {
    var root = document.documentElement;
    var btn = document.getElementById('themeBtn');
    var SUN = '<circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2M12 19.5v2M4.6 4.6l1.4 1.4M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4l1.4-1.4M18 6l1.4-1.4"/>';
    var MOON = '<path d="M21 12.6A8.5 8.5 0 1 1 11.4 3 6.6 6.6 0 0 0 21 12.6z"/>';
    function paint() {
      var icon = document.getElementById('themeIcon');
      if (icon) icon.innerHTML = root.getAttribute('data-theme') === 'light' ? MOON : SUN;
    }
    paint();
    if (btn) btn.addEventListener('click', function () {
      var next = root.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
      root.setAttribute('data-theme', next);
      try { localStorage.setItem('scs-theme', next); } catch (e) {}
      paint();
      if (window.scsTrack) window.scsTrack('toggle_theme', { theme: next });
    });
  })();

  /* ---------- Lenis smooth scroll synced to GSAP ---------- */
  var lenis = null;
  if (hasLenis && !reduce) {
    lenis = new Lenis({ lerp: 0.1, wheelMultiplier: 1, smoothWheel: true });
    if (hasGSAP) {
      lenis.on('scroll', function () { if (window.ScrollTrigger) ScrollTrigger.update(); });
      gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
      gsap.ticker.lagSmoothing(0);
    } else {
      requestAnimationFrame(function raf(t) { lenis.raf(t); requestAnimationFrame(raf); });
    }
    // in-page anchor links use lenis
    document.querySelectorAll('a[href^="#"]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        var id = a.getAttribute('href');
        if (id.length > 1) { var t = document.querySelector(id); if (t) { e.preventDefault(); lenis.scrollTo(t, { offset: -90 }); } }
      });
    });
  }

  /* ---------- Scroll progress bar ---------- */
  var prog = document.getElementById('prog');
  function onScroll() {
    if (prog) {
      var h = document.documentElement.scrollHeight - innerHeight;
      prog.style.width = (h > 0 ? (scrollY / h) * 100 : 0) + '%';
    }
    var nav = document.querySelector('.nav');
    if (nav) nav.classList.toggle('shrink', scrollY > 30);
  }
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  if (!hasGSAP || reduce) {
    // No-JS-anim fallback: reveal everything
    document.querySelectorAll('[data-reveal]').forEach(function (el) { el.style.opacity = 1; });
    initNonGsap();
    return;
  }

  gsap.registerPlugin(ScrollTrigger);
  document.documentElement.classList.add('gsap-ready');

  /* ---------- Reveal on scroll ---------- */
  gsap.utils.toArray('[data-reveal]').forEach(function (el) {
    var d = parseFloat(el.getAttribute('data-reveal-delay')) || 0;
    var y = el.hasAttribute('data-reveal-x') ? 0 : 42;
    var x = parseFloat(el.getAttribute('data-reveal-x')) || 0;
    gsap.fromTo(el, { opacity: 0, y: y, x: x, scale: 0.985 },
      { opacity: 1, y: 0, x: 0, scale: 1, duration: 1.1, delay: d, ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 88%' } });
  });

  /* ---------- Staggered groups ---------- */
  gsap.utils.toArray('[data-reveal-group]').forEach(function (group) {
    var kids = group.children;
    gsap.fromTo(kids, { opacity: 0, y: 42, scale: 0.985 },
      { opacity: 1, y: 0, scale: 1, duration: 1, ease: 'power3.out', stagger: 0.085,
        scrollTrigger: { trigger: group, start: 'top 84%' } });
  });

  /* ---------- Parallax background orbs ---------- */
  gsap.to('.orb-a', { yPercent: 26, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: 0.6 } });
  gsap.to('.orb-b', { yPercent: -22, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: 0.6 } });

  /* ---------- Elements with data-parallax ---------- */
  gsap.utils.toArray('[data-parallax]').forEach(function (el) {
    var amt = parseFloat(el.getAttribute('data-parallax')) || 60;
    gsap.fromTo(el, { y: amt }, { y: -amt, ease: 'none',
      scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true } });
  });

  /* ---------- Animated counters ---------- */
  gsap.utils.toArray('[data-count]').forEach(function (el) {
    var end = parseFloat(el.getAttribute('data-count'));
    var dec = parseInt(el.getAttribute('data-decimals') || '0', 10);
    var prefix = el.getAttribute('data-prefix') || '';
    var suffix = el.getAttribute('data-suffix') || '';
    var obj = { v: 0 };
    ScrollTrigger.create({
      trigger: el, start: 'top 88%', once: true,
      onEnter: function () {
        gsap.to(obj, { v: end, duration: 1.8, ease: 'power2.out',
          onUpdate: function () {
            el.textContent = prefix + obj.v.toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec }) + suffix;
          } });
      }
    });
  });

  /* ---------- Pinned / scrubbed scenes ([data-pin-scene]) ---------- */
  gsap.utils.toArray('[data-pin-scene]').forEach(function (scene) {
    var layers = scene.querySelectorAll('[data-scene-layer]');
    var tl = gsap.timeline({ scrollTrigger: { trigger: scene, start: 'top top', end: '+=' + (scene.getAttribute('data-pin-length') || 1200), scrub: 0.8, pin: true } });
    layers.forEach(function (layer, i) {
      tl.fromTo(layer, { opacity: 0, y: 60, scale: 0.96 }, { opacity: 1, y: 0, scale: 1, duration: 1 }, i * 0.6)
        .to(layer, { opacity: 0, y: -40, duration: 0.6 }, i * 0.6 + 1);
    });
  });

  initInteractions();
  initTyping();
  // settle layout after fonts/images
  window.addEventListener('load', function () { ScrollTrigger.refresh(); });

  /* ---------- shared interactions (magnetic, tilt, nav) ---------- */
  function initInteractions() {
    document.querySelectorAll('[data-magnetic]').forEach(function (el) {
      var s = parseFloat(el.getAttribute('data-magnetic')) || 0.3;
      el.addEventListener('mousemove', function (e) {
        var r = el.getBoundingClientRect();
        gsap.to(el, { x: (e.clientX - r.left - r.width / 2) * s, y: (e.clientY - r.top - r.height / 2) * s, duration: 0.5, ease: 'power3.out' });
      });
      el.addEventListener('mouseleave', function () { gsap.to(el, { x: 0, y: 0, duration: 0.6, ease: 'elastic.out(1,0.4)' }); });
    });
    document.querySelectorAll('[data-tilt]').forEach(function (el) {
      var max = parseFloat(el.getAttribute('data-tilt')) || 6;
      el.addEventListener('mousemove', function (e) {
        var r = el.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - 0.5, py = (e.clientY - r.top) / r.height - 0.5;
        gsap.to(el, { rotateY: px * max, rotateX: -py * max, transformPerspective: 900, transformOrigin: 'center', duration: 0.4 });
      });
      el.addEventListener('mouseleave', function () { gsap.to(el, { rotateY: 0, rotateX: 0, duration: 0.6 }); });
    });
  }

  /* ---------- Typewriter ([data-type] with data-words="a,b,c") ---------- */
  function initTyping() {
    document.querySelectorAll('[data-type]').forEach(function (el) {
      var words = (el.getAttribute('data-words') || '').split('|').filter(Boolean);
      if (!words.length) return;
      var cursor = document.createElement('span'); cursor.className = 'type-cursor';
      var txt = document.createElement('span'); el.textContent = ''; el.appendChild(txt); el.appendChild(cursor);
      var wi = 0, ci = 0, deleting = false;
      function tick() {
        var w = words[wi];
        txt.textContent = w.slice(0, ci);
        if (!deleting && ci < w.length) { ci++; setTimeout(tick, 70); }
        else if (!deleting && ci === w.length) { deleting = true; setTimeout(tick, 1500); }
        else if (deleting && ci > 0) { ci--; setTimeout(tick, 38); }
        else { deleting = false; wi = (wi + 1) % words.length; setTimeout(tick, 280); }
      }
      tick();
    });
  }

  function initNonGsap() {
    initTyping && initTyping();
  }
})();
