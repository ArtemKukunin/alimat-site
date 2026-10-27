// Google (GTM / GA4 / Ads) + Meta Pixel with a consent banner (Consent Mode v2).
// IDs live in data/settings.json → analytics (admin panel: Ustawienia → Analityka i marketing).
// Nothing is loaded and no banner is shown while all IDs are empty.
import { versionedAsset } from '../../core/i18n.js';
import { esc, sitePath } from '../../core/util.js';
import { BASE } from '../../core/i18n.js';

const RULES = {
  gtmId: [/^GTM-[A-Z0-9]{4,12}$/, 'GTM-XXXXXXX'],
  ga4Id: [/^G-[A-Z0-9]{6,14}$/, 'G-XXXXXXXXXX'],
  googleAdsId: [/^AW-\d{6,14}$/, 'AW-1234567890'],
  metaPixelId: [/^\d{10,20}$/, 'digits only'],
  googleSiteVerification: [/^[\w-]{10,100}$/, 'the content value of the meta tag'],
  facebookDomainVerification: [/^[a-z0-9]{10,60}$/, 'the content value of the meta tag'],
};

/** Validates settings.analytics; returns a normalized object (empty strings for unused IDs). */
export function loadAnalytics(settings) {
  const a = settings.analytics || {};
  const out = {};
  for (const [k, [re, hint]] of Object.entries(RULES)) {
    const v = String(a[k] || '').trim();
    if (v && !re.test(v)) throw new Error(`settings.analytics.${k}: "${v}" is not valid (expected ${hint})`);
    out[k] = v;
  }
  out.cspExtra = String(a.cspExtra || '').split(/\s+/).filter(Boolean);
  for (const o of out.cspExtra) if (!/^https:\/\/(\*\.)?[a-z0-9.-]+\.[a-z]{2,}$/.test(o)) throw new Error(`settings.analytics.cspExtra: "${o}" must be an origin like https://example.com`);
  out.enabled = Boolean(out.gtmId || out.ga4Id || out.googleAdsId || out.metaPixelId);
  return out;
}

/** <head> tags: verification metas and the consent/analytics loader (must run before other scripts). */
export function analyticsHead(an) {
  const metas = [
    an.googleSiteVerification && `<meta name="google-site-verification" content="${esc(an.googleSiteVerification)}">`,
    an.facebookDomainVerification && `<meta name="facebook-domain-verification" content="${esc(an.facebookDomainVerification)}">`,
  ].filter(Boolean).join('\n');
  const loader = an.enabled
    ? `<script src="${versionedAsset('consent.js')}" data-gtm="${esc(an.gtmId)}" data-ga4="${esc(an.ga4Id)}" data-ads="${esc(an.googleAdsId)}" data-pixel="${esc(an.metaPixelId)}"></script>`
    : '';
  return [metas, loader].filter(Boolean).join('\n');
}

/** Cookie banner (hidden until app.js finds no saved choice). */
export function consentBanner(ctx) {
  const { t, settings, analytics: an } = ctx;
  if (!an.enabled) return '';
  const cookiesUrl = ctx.cookiesUrl || sitePath(settings.cookiesUrl, BASE);
  const opt = (name, checked, disabled) => `<label class="cc-opt"><input type="checkbox" name="${name}"${checked ? ' checked' : ''}${disabled ? ' disabled' : ''}><span><strong>${esc(t(`cc_${name}`))}</strong> ${esc(t(`cc_${name}_d`))}</span></label>`;
  return `<div class="cc" id="cc" role="dialog" aria-modal="false" aria-labelledby="cc-t" hidden>
  <p class="cc-t" id="cc-t">${esc(t('cc_title'))}</p>
  <p class="cc-d">${esc(t('cc_text'))} <a href="${esc(cookiesUrl)}">${esc(t('cc_more'))}</a></p>
  <form class="cc-opts" hidden>${opt('necessary', true, true)}${opt('analytics', false)}${opt('marketing', false)}</form>
  <div class="cc-btns">
    <button class="btn btn-pill btn-outline-blue" type="button" data-cc="reject">${esc(t('cc_reject'))}</button>
    <button class="btn btn-pill btn-outline-blue" type="button" data-cc="settings">${esc(t('cc_settings'))}</button>
    <button class="btn btn-pill btn-outline-blue" type="button" data-cc="save" hidden>${esc(t('cc_save'))}</button>
    <button class="btn btn-pill btn-blue" type="button" data-cc="accept">${esc(t('cc_accept'))}</button>
  </div>
</div>`;
}

/** Footer link to reopen the banner. */
export const consentLink = (ctx) => (ctx.analytics.enabled ? ` · <button class="link-btn" type="button" data-cc="open">${esc(ctx.t('cc_open'))}</button>` : '');

/** Extra CSP sources for the enabled vendors (GTM may load any Google/Meta/LinkedIn tag, plus settings.cspExtra). */
export function cspSources(an) {
  const none = { script: [], connect: [], img: [], frame: [], style: [], font: [] };
  if (!an.enabled) return none;
  const google = !!(an.gtmId || an.ga4Id || an.googleAdsId);
  const meta = !!(an.metaPixelId || an.gtmId);
  const linkedin = !!an.gtmId;
  const g = google ? {
    script: ['https://www.googletagmanager.com', 'https://*.googletagmanager.com', 'https://www.google-analytics.com', 'https://googleads.g.doubleclick.net', 'https://www.googleadservices.com', 'https://www.google.com', 'https://tagmanager.google.com'],
    connect: ['https://*.google-analytics.com', 'https://*.analytics.google.com', 'https://*.googletagmanager.com', 'https://www.google.com', 'https://*.doubleclick.net', 'https://www.googleadservices.com', 'https://pagead2.googlesyndication.com'],
    img: ['https://*.google-analytics.com', 'https://*.googletagmanager.com', 'https://www.google.com', 'https://www.google.pl', 'https://*.doubleclick.net', 'https://www.googleadservices.com', 'https://ssl.gstatic.com', 'https://www.gstatic.com'],
    frame: ['https://www.googletagmanager.com', 'https://td.doubleclick.net', 'https://*.doubleclick.net'],
    style: ['https://tagmanager.google.com', 'https://fonts.googleapis.com'],
    font: ['https://fonts.gstatic.com'],
  } : none;
  const m = meta ? { script: ['https://connect.facebook.net'], connect: ['https://www.facebook.com', 'https://connect.facebook.net'], img: ['https://www.facebook.com'], frame: ['https://www.facebook.com'] } : {};
  const l = linkedin ? { script: ['https://snap.licdn.com'], connect: ['https://px.ads.linkedin.com'], img: ['https://px.ads.linkedin.com'] } : {};
  const out = {};
  for (const k of Object.keys(none)) out[k] = [...new Set([...(g[k] || []), ...(m[k] || []), ...(l[k] || []), ...(k === 'style' || k === 'font' ? [] : an.cspExtra)])];
  // GTM custom HTML tags inject inline scripts.
  if (an.gtmId) out.script.unshift("'unsafe-inline'");
  return out;
}
