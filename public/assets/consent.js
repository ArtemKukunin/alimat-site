/*
 * Alimat Group — consent + analytics loader (Google Consent Mode v2, GTM / GA4 / Google Ads, Meta Pixel).
 * Loaded synchronously in <head>, before any tag, so every tag starts with consent "denied".
 * IDs come from data-* attributes (settings.analytics, edited in the admin panel). No inline scripts (CSP).
 */
(function () {
  'use strict';
  var me = document.currentScript;
  var cfg = { gtm: me.getAttribute('data-gtm'), ga4: me.getAttribute('data-ga4'), ads: me.getAttribute('data-ads'), pixel: me.getAttribute('data-pixel') };
  var KEY = 'alimat-consent';
  var MAX_AGE = 180 * 24 * 3600 * 1000; // ask again after ~6 months

  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  window.gtag = gtag;

  gtag('consent', 'default', {
    ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied', analytics_storage: 'denied',
    functionality_storage: 'granted', security_storage: 'granted', wait_for_update: 500,
  });
  gtag('set', 'ads_data_redaction', true);

  function read() {
    try {
      var c = JSON.parse(localStorage.getItem(KEY));
      return c && c.v === 1 && Date.now() - c.ts < MAX_AGE ? c : null;
    } catch (e) { return null; }
  }

  function loadScript(src) {
    var s = document.createElement('script');
    s.async = true;
    s.src = src;
    document.head.appendChild(s);
  }

  var pixelLoaded = false;
  function loadPixel() {
    if (pixelLoaded || !cfg.pixel) return;
    pixelLoaded = true;
    // Standard Meta Pixel bootstrap (queue until fbevents.js arrives).
    var n = window.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); };
    if (!window._fbq) window._fbq = n;
    n.push = n; n.loaded = true; n.version = '2.0'; n.queue = [];
    loadScript('https://connect.facebook.net/en_US/fbevents.js');
    window.fbq('init', cfg.pixel);
    window.fbq('track', 'PageView');
  }

  function apply(c) {
    var a = c.analytics ? 'granted' : 'denied';
    var m = c.marketing ? 'granted' : 'denied';
    gtag('consent', 'update', { analytics_storage: a, ad_storage: m, ad_user_data: m, ad_personalization: m });
    window.dataLayer.push({ event: 'consent_update', consent_analytics: a, consent_marketing: m });
    if (c.marketing) loadPixel();
    else if (window.fbq) window.fbq('consent', 'revoke');
  }

  var saved = read();
  if (saved) apply(saved);

  // Google tags start right away: with consent denied they send only cookieless pings (Consent Mode v2).
  if (cfg.gtm) {
    window.dataLayer.push({ 'gtm.start': Date.now(), event: 'gtm.js' });
    loadScript('https://www.googletagmanager.com/gtm.js?id=' + encodeURIComponent(cfg.gtm));
  } else if (cfg.ga4 || cfg.ads) {
    loadScript('https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(cfg.ga4 || cfg.ads));
    gtag('js', new Date());
    if (cfg.ga4) gtag('config', cfg.ga4);
    if (cfg.ads) gtag('config', cfg.ads);
  }

  /** Used by app.js: the cookie banner and conversion events. */
  window.alimatConsent = {
    cfg: cfg,
    get: read,
    set: function (c) {
      var rec = { v: 1, ts: Date.now(), analytics: !!c.analytics, marketing: !!c.marketing };
      try { localStorage.setItem(KEY, JSON.stringify(rec)); } catch (e) { /* private mode: applies to this page only */ }
      apply(rec);
    },
  };
})();
