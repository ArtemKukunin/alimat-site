import { LANGS, LANG_CODES, pageUrl, alternates, asset, BASE } from './i18n.js';
import { esc, digits } from './util.js';
import { icon } from './icons.js';

export const waLink = (settings, text) =>
  `https://wa.me/${digits(settings.phone)}${text ? `?text=${encodeURIComponent(text)}` : ''}`;
export const telLink = (phone) => `tel:+${digits(phone)}`;

export function organizationLd(settings) {
  const a = settings.address;
  return {
    '@context': 'https://schema.org',
    '@type': 'EmploymentAgency',
    '@id': `${settings.siteUrl}/#org`,
    name: settings.brand,
    legalName: settings.company,
    url: `${settings.siteUrl}${BASE}/`,
    logo: settings.siteUrl + asset('img/logo.webp'),
    email: settings.email,
    telephone: settings.phone,
    address: { '@type': 'PostalAddress', streetAddress: a.street, postalCode: a.postal, addressLocality: a.city, addressCountry: a.country },
    sameAs: Object.values(settings.social),
  };
}

export function breadcrumbLd(settings, items) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({ '@type': 'ListItem', position: i + 1, name: it.name, item: settings.siteUrl + it.href })),
  };
}

/** Visible breadcrumbs; last item is the current page (no link). */
export function breadcrumbs(items) {
  return `<nav class="crumbs" aria-label="breadcrumb"><ol>${items
    .map((it, i) => (i === items.length - 1
      ? `<li aria-current="page">${esc(it.name)}</li>`
      : `<li><a href="${it.href}">${esc(it.name)}</a></li>`))
    .join('')}</ol></nav>`;
}

/** Messenger / call buttons used in several places. */
export function contactButtons(ctx, { waText, compact = false } = {}) {
  const { t, settings } = ctx;
  return `<div class="contact-btns${compact ? ' compact' : ''}">
    <a class="btn btn-wa" href="${waLink(settings, waText)}" rel="noopener" target="_blank">${icon('chat')}<span>WhatsApp</span></a>
    <a class="btn btn-ghost" href="${esc(settings.telegram)}" rel="noopener" target="_blank">${icon('chat')}<span>Telegram</span></a>
    <a class="btn btn-ghost" href="viber://chat?number=%2B${digits(settings.phone)}">${icon('chat')}<span>Viber</span></a>
    <a class="btn btn-ghost" href="${telLink(settings.phone)}">${icon('phone')}<span>${esc(t('cta_call'))}</span></a>
  </div>`;
}

function head(ctx, { title, description, path, page, sub, jsonld, noindex }) {
  const { lang, settings } = ctx;
  const url = settings.siteUrl + path;
  const alt = alternates(page, sub)
    .map((a) => `<link rel="alternate" hreflang="${a.lang}" href="${settings.siteUrl}${a.href}">`).join('\n');
  const ld = [organizationLd(settings), ...(jsonld || [])]
    .map((o) => `<script type="application/ld+json">${JSON.stringify(o).replace(/</g, '\\u003c')}</script>`).join('\n');
  return `<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
${process.env.SITE_NOINDEX ? '<meta name="robots" content="noindex, nofollow">' : noindex ? '<meta name="robots" content="noindex, follow">' : ''}
<link rel="canonical" href="${url}">
${alt}
<link rel="alternate" hreflang="x-default" href="${settings.siteUrl}${BASE}/">
<meta property="og:type" content="website">
<meta property="og:site_name" content="${esc(settings.brand)}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${url}">
<meta property="og:locale" content="${LANGS[lang].og}">
<meta property="og:image" content="${settings.siteUrl}${asset('og.png')}">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#0199DD">
<link rel="icon" href="${asset('favicon.svg')}" type="image/svg+xml">
<link rel="preload" href="${asset('fonts/titillium-web-400.woff')}" as="font" type="font/woff" crossorigin>
<link rel="preload" href="${asset('fonts/roboto-slab-900.woff')}" as="font" type="font/woff" crossorigin>
<link rel="stylesheet" href="${asset('style.css')}">
<script src="${asset('app.js')}" defer></script>
${ld}
</head>`;
}

function header(ctx, page, sub) {
  const { lang, t, settings } = ctx;
  const nav = ['jobs', 'candidates', 'employers', 'contact']
    .map((p) => `<li><a href="${pageUrl(lang, p)}"${p === page ? ' aria-current="page"' : ''}>${esc(t(`nav_${p}`))}</a></li>`)
    .join('');
  const langs = alternates(page, sub)
    .map((a) => `<li><a href="${a.href}" hreflang="${a.lang}" lang="${a.lang}"${a.lang === lang ? ' aria-current="true"' : ''} data-lang="${a.lang}">${esc(LANGS[a.lang].name)}</a></li>`)
    .join('');
  return `<a class="skip" href="#main">${esc(t('skip'))}</a>
<div class="topbar">
  <div class="wrap topbar-row">
    <a href="${telLink(settings.phone)}">${icon('phone')}${esc(settings.phone)}</a>
    <a href="mailto:${esc(settings.email)}">${icon('mail')}${esc(settings.email)}</a>
    <ul class="topbar-social">${Object.entries(settings.social).map(([n, h]) => `<li><a href="${esc(h)}" rel="noopener" target="_blank">${esc(n)}</a></li>`).join('')}</ul>
  </div>
</div>
<header class="site-header">
  <div class="wrap header-row">
    <a class="logo" href="${pageUrl(lang, 'home')}">
      <img src="${asset('img/logo.webp')}" alt="Alimat Group — International employment" width="183" height="44">
    </a>
    <nav class="main-nav" id="main-nav" aria-label="${esc(t('menu'))}"><ul>${nav}</ul></nav>
    <div class="header-actions">
      <a class="btn btn-pill btn-outline-orange header-cta" href="${pageUrl(lang, 'apply')}">${icon('doc')}<span>${esc(t('cta_apply'))}</span></a>
      <a class="btn btn-pill btn-outline-blue header-cta" href="${pageUrl(lang, 'employers')}#inquiry">${icon('menu')}<span>${esc(t('emp_form_t'))}</span></a>
      <details class="lang-switch">
        <summary aria-label="${esc(t('lang_label'))}">${icon('globe')}<span>${LANGS[lang].short}</span></summary>
        <ul>${langs}</ul>
      </details>
      <button class="menu-btn" type="button" aria-controls="main-nav" aria-expanded="false" aria-label="${esc(t('menu'))}">${icon('menu')}</button>
    </div>
  </div>
</header>`;
}

function footer(ctx) {
  const { lang, t, settings } = ctx;
  const a = settings.address;
  const social = Object.entries(settings.social)
    .map(([name, href]) => `<li><a href="${esc(href)}" rel="noopener" target="_blank">${esc(name)}</a></li>`).join('');
  return `<section class="help-band">
  <div class="wrap help-band-grid">
    <div>
      <h2>${esc(t('help_t'))}</h2>
      <p>${esc(t('help_d'))}</p>
    </div>
    <ul class="help-band-list">
      <li>${icon('phone')}<a href="${telLink(settings.phone)}">${esc(settings.phone)}</a> · WhatsApp · Viber</li>
      <li>${icon('mail')}<a href="mailto:${esc(settings.email)}">${esc(settings.email)}</a></li>
      <li>${icon('pin')}<a href="${esc(settings.mapUrl)}" rel="noopener" target="_blank">${esc(a.street)}, ${esc(a.postal)} ${esc(a.city)}</a></li>
    </ul>
    <div class="help-band-cta">
      <a class="btn btn-pill btn-orange" href="${pageUrl(lang, 'apply')}">${esc(t('cta_apply_long'))} ${icon('arrow')}</a>
      <a class="btn btn-pill btn-outline-light" href="${pageUrl(lang, 'contact')}">${esc(t('nav_contact'))}</a>
    </div>
  </div>
</section>
<footer class="site-footer">
  <div class="wrap footer-grid">
    <div>
      <a class="logo" href="${pageUrl(lang, 'home')}"><img src="${asset('img/logo.webp')}" alt="Alimat Group" width="183" height="44" loading="lazy"></a>
      <p>${esc(t('footer_tagline'))}</p>
    </div>
    <div>
      <h2 class="f-h">Alimat Group</h2>
      <ul class="f-list">
        ${['jobs', 'candidates', 'apply', 'employers', 'contact'].map((p) => `<li><a href="${pageUrl(lang, p)}">${esc(t(p === 'apply' ? 'cta_apply_long' : `nav_${p}`))}</a></li>`).join('')}
      </ul>
    </div>
    <div>
      <h2 class="f-h">${esc(t('nav_contact'))}</h2>
      <ul class="f-list">
        <li><a href="${telLink(settings.phone)}">${esc(settings.phone)}</a></li>
        <li><a href="mailto:${esc(settings.email)}">${esc(settings.email)}</a></li>
        <li><address>${esc(a.street)}<br>${esc(a.postal)} ${esc(a.city)}</address></li>
      </ul>
    </div>
    <div>
      <h2 class="f-h">${esc(t('c_social'))}</h2>
      <ul class="f-list">${social}</ul>
    </div>
  </div>
  <div class="wrap footer-bottom">
    <span>© ${new Date().getFullYear()} ${esc(settings.company)}. ${esc(t('footer_rights'))}</span>
    <a href="${esc(settings.privacyUrl)}">${esc(t('footer_privacy'))}</a>
  </div>
</footer>`;
}

function mobileBar(ctx) {
  const { lang, t, settings } = ctx;
  return `<div class="mobile-bar">
  <a class="btn btn-wa" href="${waLink(settings)}" rel="noopener" target="_blank">${icon('chat')}<span>WhatsApp</span></a>
  <a class="btn btn-primary" href="${pageUrl(lang, 'apply')}">${esc(t('cta_apply'))}</a>
</div>`;
}

/** Full HTML document. */
export function layout(ctx, opts) {
  const { lang } = ctx;
  const { page, sub, body, hideMobileBar } = opts;
  return `<!doctype html>
<html lang="${lang}">
${head(ctx, { ...opts, path: pageUrl(lang, page, sub) })}
<body class="page-${page}">
${header(ctx, page, sub)}
<main id="main">
${body}
</main>
${footer(ctx)}
${hideMobileBar ? '' : mobileBar(ctx)}
</body>
</html>
`;
}

export { LANG_CODES };
