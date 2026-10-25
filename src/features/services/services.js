// Employer service pages (menu "Oferta dla firm"): data/services.json.
import { pageUrl, LANG_CODES, BASE } from '../../core/i18n.js';
import { esc } from '../../core/util.js';
import { icon } from '../../core/icons.js';
import { layout, breadcrumbs, breadcrumbLd } from '../../core/layout.js';
import { inquirySection } from '../employers/employers.js';

const FIELDS = ['slug', 'name', 'title', 'desc', 'lead', 'points', 'list_t', 'list', 'end_t', 'end_d'];

export function loadServices(raw) {
  const ids = new Set();
  for (const s of raw.services) {
    if (ids.has(s.id)) throw new Error(`services.json: duplicate id "${s.id}"`);
    ids.add(s.id);
    for (const l of LANG_CODES) {
      const tx = s[l];
      const missing = FIELDS.filter((f) => !tx?.[f] || (Array.isArray(tx[f]) && !tx[f].length));
      if (missing.length) throw new Error(`services.json: "${s.id}" ${l} missing ${missing.join(', ')}`);
      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(tx.slug)) throw new Error(`services.json: bad slug "${tx.slug}"`);
      if (tx.points.length !== s.pl.points.length || tx.list.length !== s.pl.list.length) throw new Error(`services.json: "${s.id}" ${l} item counts differ from Polish`);
    }
  }
  return raw.services;
}

export const serviceSlugs = (svc) => Object.fromEntries(LANG_CODES.map((l) => [l, svc[l].slug]));
export const serviceUrl = (lang, svc) => pageUrl(lang, 'employers', svc[lang].slug);

export function renderService(ctx, svc) {
  const { lang, t, settings, services } = ctx;
  const tx = svc[lang];
  const url = serviceUrl(lang, svc);
  const crumbs = [
    { name: t('breadcrumb_home'), href: pageUrl(lang, 'home') },
    { name: t('nav_employers'), href: pageUrl(lang, 'employers') },
    { name: tx.name, href: url },
  ];
  const others = services.filter((s) => s.id !== svc.id);
  const body = `<section class="page-hero"><div class="wrap">
  ${breadcrumbs(crumbs)}
  <h1>${esc(tx.name)}</h1>
  <span class="dots" aria-hidden="true"><i></i><i></i></span>
  <p class="lead">${esc(tx.lead)}</p>
  <div class="hero-cta"><a class="btn btn-pill btn-blue" href="#inquiry">${esc(t('emp_form_t'))} ${icon('arrow')}</a></div>
</div></section>
<section class="wrap block">
  <ul class="perks services">${tx.points.map(([h, p]) => `<li>${icon(svc.icon, 'ic ic-lg')}<h2>${esc(h)}</h2><p>${esc(p)}</p></li>`).join('')}</ul>
</section>
<section class="band"><div class="wrap block">
  <h2 class="center-title">${esc(tx.list_t)}</h2>
  <ul class="ticks ticks-2">${tx.list.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>
</div></section>
<section class="wrap block-sm center">
  <h2>${esc(tx.end_t)}</h2>
  <p class="lead-c">${esc(tx.end_d)}</p>
</section>
${inquirySection(ctx)}
<section class="wrap block-sm">
  <h2 class="center-title">${esc(t('svc_other'))}</h2>
  <ul class="svc-links">${others.map((s) => `<li><a href="${serviceUrl(lang, s)}">${icon(s.icon)}<span>${esc(s[lang].name)}</span>${icon('arrow')}</a></li>`).join('')}</ul>
</section>`;
  const serviceLd = {
    '@context': 'https://schema.org', '@type': 'Service', name: tx.name, description: tx.desc,
    serviceType: tx.name, areaServed: { '@type': 'Country', name: 'Poland' }, inLanguage: lang,
    url: settings.siteUrl + url, provider: { '@id': `${settings.siteUrl}${BASE}/#org` },
  };
  return layout(ctx, {
    page: 'employers', title: tx.title, description: tx.desc, body, sub: serviceSlugs(svc),
    jsonld: [breadcrumbLd(settings, crumbs), serviceLd],
  });
}
