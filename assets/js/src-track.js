/* src-track.js — remembers where a visitor came from (TikTok, YouTube, Google…) and
   passes it on to the CivicLearn checkout, so each Stripe sale records its source.
   Nothing here blocks the page; if storage is unavailable, links work exactly as before. */
(function () {
  var KEY = 'cl_attr', DAYS = 30;
  function clean(v) { return String(v || '').replace(/[^\w.\-\/ ]/g, '').slice(0, 80); }
  function load() { try { var a = JSON.parse(localStorage.getItem(KEY) || 'null'); return a && (Date.now() - a.t) < DAYS * 864e5 ? a : null; } catch (e) { return null; } }
  function save(a) { try { localStorage.setItem(KEY, JSON.stringify(a)); } catch (e) {} }

  var q = new URLSearchParams(location.search), attr = load();
  var refHost = ''; try { refHost = document.referrer ? new URL(document.referrer).hostname : ''; } catch (e) {}
  if (refHost === location.hostname) refHost = '';

  if (q.get('utm_source')) {
    // a tagged link (TikTok bio, YouTube description, newsletter…) always wins
    attr = { s: clean(q.get('utm_source')), m: clean(q.get('utm_medium')), c: clean(q.get('utm_campaign')), r: clean(refHost), l: clean(location.pathname), t: Date.now() };
    save(attr);
  } else if (!attr && refHost) {
    // first visit from another site (Google, YouTube, a forum…) without tags
    attr = { s: '', m: 'referral', c: '', r: clean(refHost), l: clean(location.pathname), t: Date.now() };
    save(attr);
  }
  if (!attr) return;

  function tag(a) {
    if (!a || !a.href || a.href.indexOf('civiclearn.com/') < 0 || a.href.indexOf('/checkout') < 0) return;
    try {
      var u = new URL(a.href);
      if (u.searchParams.get('utm_source') || u.searchParams.get('cl_ref')) return;
      if (attr.s) u.searchParams.set('utm_source', attr.s);
      if (attr.m) u.searchParams.set('utm_medium', attr.m);
      if (attr.c) u.searchParams.set('utm_campaign', attr.c);
      if (attr.r) u.searchParams.set('cl_ref', attr.r);
      if (attr.l) u.searchParams.set('cl_land', attr.l);
      a.href = u.toString();
    } catch (e) {}
  }
  function tagAll() { var l = document.querySelectorAll('a[href*="civiclearn.com/"]'); for (var i = 0; i < l.length; i++) tag(l[i]); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', tagAll); else tagAll();
  // links added later by scripts get tagged at the moment they are clicked
  document.addEventListener('click', function (e) { var a = e.target && e.target.closest ? e.target.closest('a') : null; if (a) tag(a); }, true);
})();
