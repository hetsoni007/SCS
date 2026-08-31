/* =====================================================================
   UTM & LEAD-SOURCE ATTRIBUTION
   ---------------------------------------------------------------------
   Self-hosted, no CDN. Runs on every page (loaded next to analytics.js).

   What it does:
   1) If the URL carries real utm_source/medium/campaign, save them for
      the rest of this browser tab's session (sessionStorage).
   2) If there's no explicit UTM and the visitor is on a blog post, infer
      source=blog / campaign=<post slug> so blog-driven leads still get
      attributed without requiring every internal link to be hand-tagged.
   3) While on a blog post, tag its outbound CTA links (Calendly + any
      same-site page) with those UTM params, so Calendly's own dashboard
      and any downstream conversion also carry the attribution.
   4) Expose window.scsUTM.get() so lead-form submit handlers can attach
      { source, blog_post_title, utm_source, utm_medium, utm_campaign }
      to the payload they send to the lead API.
   ===================================================================== */
(function () {
  'use strict';
  var KEY = 'scs_attr';

  function read() {
    try { return JSON.parse(sessionStorage.getItem(KEY) || '{}'); } catch (e) { return {}; }
  }
  function write(o) {
    try { sessionStorage.setItem(KEY, JSON.stringify(o)); } catch (e) {}
  }
  function cleanTitle() {
    return (document.title || '').split(/[|—]/)[0].trim();
  }
  function slug(s) {
    return String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80);
  }

  var isBlogPost = /^\/blog\/[^/]+\/?$/.test(location.pathname);
  var attr = read();
  var qs;
  try { qs = new URLSearchParams(location.search); } catch (e) { qs = null; }
  var incomingSource = qs && qs.get('utm_source');

  if (incomingSource) {
    attr = {
      utm_source: incomingSource,
      utm_medium: (qs.get('utm_medium') || ''),
      utm_campaign: (qs.get('utm_campaign') || ''),
      source: incomingSource,
      blog_post_title: isBlogPost ? cleanTitle() : (attr.blog_post_title || null)
    };
    write(attr);
  } else if (!attr.source && isBlogPost) {
    attr = {
      utm_source: 'blog',
      utm_medium: 'organic',
      utm_campaign: slug(location.pathname),
      source: 'blog',
      blog_post_title: cleanTitle()
    };
    write(attr);
  }

  // Tag this blog post's CTA links (Calendly + same-site pages) so
  // attribution travels with the click, not just in sessionStorage.
  if (isBlogPost && attr.utm_source) {
    try {
      var origin = location.origin;
      document.querySelectorAll('a[href]').forEach(function (a) {
        var href = a.getAttribute('href') || '';
        if (!href || href.charAt(0) === '#' || href.indexOf('mailto:') === 0 || href.indexOf('tel:') === 0) return;
        var sameSite = href.charAt(0) === '/' || href.indexOf(origin) === 0;
        var calendly = /calendly\.com/i.test(href);
        if (!sameSite && !calendly) return;
        if (href.indexOf('utm_source=') !== -1) return; // already tagged
        try {
          var u = new URL(href, location.href);
          u.searchParams.set('utm_source', attr.utm_source);
          u.searchParams.set('utm_medium', attr.utm_medium || '');
          u.searchParams.set('utm_campaign', attr.utm_campaign || '');
          a.setAttribute('href', calendly ? u.toString() : (u.pathname + u.search + u.hash));
        } catch (e) {}
      });
    } catch (e) {}
  }

  window.scsUTM = {
    get: function () {
      var a = read();
      return {
        source: a.source || null,
        blog_post_title: a.blog_post_title || null,
        utm_source: a.utm_source || null,
        utm_medium: a.utm_medium || null,
        utm_campaign: a.utm_campaign || null
      };
    }
  };
})();
