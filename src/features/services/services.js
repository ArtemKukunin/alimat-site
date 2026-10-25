// Employer service pages (menu "Oferta dla firm"): data/services.json.
import { existsSync } from 'node:fs';
import { pageUrl, LANG_CODES, BASE, asset } from '../../core/i18n.js';
import { esc } from '../../core/util.js';
import { icon } from '../../core/icons.js';
import { layout, breadcrumbs, breadcrumbLd, telLink } from '../../core/layout.js';
import { inquirySection } from '../employers/employers.js';

const FIELDS = ['slug', 'name', 'title', 'desc', 'lead', 'sections', 'end_t', 'end_d', 'form_t'];
const TYPES = ['cards', 'steps', 'list', 'text'];
const shape = (sec) => `${sec.type}:${sec.title ? 1 : 0}:${(sec.intro || []).length}:${(sec.items || []).map((x) => (Array.isArray(x) ? 2 : 1)).join('')}:${sec.outro ? 1 : 0}`;

export function loadServices(raw) {
  const ids = new Set();
  for (const s of raw.services) {
    if (ids.has(s.id)) throw new Error(`services.json: duplicate id "${s.id}"`);
    ids.add(s.id);
    const ref = s.pl.sections.map(shape).join('|');
    const imgs = s.images || {};
    for (const [k, name] of Object.entries({ ...imgs.sections, ...(imgs.end ? { end: imgs.end } : {}) })) {
      if (k !== 'end' && !s.pl.sections[k]) throw new Error(`services.json: "${s.id}" image for missing section ${k}`);
      if (!existsSync(new URL(`../../../public/assets/img/services/${name}.webp`, import.meta.url))) throw new Error(`services.json: "${s.id}" image ${name}.webp not found`);
    }
    for (const l of LANG_CODES) {
      const tx = s[l];
      const missing = FIELDS.filter((f) => !tx?.[f] || (Array.isArray(tx[f]) && !tx[f].length));
      if (missing.length) throw new Error(`services.json: "${s.id}" ${l} missing ${missing.join(', ')}`);
      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(tx.slug)) throw new Error(`services.json: bad slug "${tx.slug}"`);
      if (tx.sections.some((x) => !TYPES.includes(x.type))) throw new Error(`services.json: "${s.id}" ${l} unknown section type`);
      if (tx.sections.map(shape).join('|') !== ref) throw new Error(`services.json: "${s.id}" ${l} sections differ from Polish`);
      if (!!tx.lead_t !== !!s.pl.lead_t) throw new Error(`services.json: "${s.id}" ${l} lead_t differs from Polish`);
    }
  }
  return raw.services;
}

const paras = (list, cls = '') => (list || []).map((p) => `<p${cls ? ` class="${cls}"` : ''}>${esc(p)}</p>`).join('');
const item = (x) => (Array.isArray(x) ? `<strong>${esc(x[0])}</strong> — ${esc(x[1])}` : esc(x));

function section(sec, i, svc) {
  const h = sec.title ? `<h2 class="center-title">${esc(sec.title)}</h2>` : '';
  const hn = sec.title ? 'h3' : 'h2';
  const band = i % 2 ? ' class="band"' : '';
  let inner = '';
  if (sec.type === 'cards') {
    inner = `<ul class="perks cards-4">${sec.items.map(([t, d], k) => `<li>${icon(svc.card_icons[k] || svc.icon, 'ic ic-lg')}<${hn}>${esc(t)}</${hn}><p>${esc(d)}</p></li>`).join('')}</ul>`;
  } else if (sec.type === 'steps') {
    inner = `<ol class="steps">${sec.items.map((x, k) => `<li><span class="step-n">${k + 1}</span>${Array.isArray(x) ? `<${hn}>${esc(x[0])}</${hn}><p>${esc(x[1])}</p>` : `<p>${esc(x)}</p>`}</li>`).join('')}</ol>`;
  } else if (sec.type === 'list') {
    inner = `${paras(sec.intro, 'lead-c')}<ul class="ticks ticks-2">${sec.items.map((x) => `<li>${item(x)}</li>`).join('')}</ul>${sec.outro ? `<p class="lead-c svc-outro">${esc(sec.outro)}</p>` : ''}`;
  } else {
    inner = paras(sec.intro, 'lead-c');
  }
  const img = svc.images?.sections?.[i];
  if (!img) return `<section${band}><div class="wrap block svc-sec svc-${sec.type}">${h}${inner}</div></section>`;
  return `<section${band}><div class="wrap block svc-sec svc-${sec.type} svc-split">
    <div class="svc-text">${h}${inner}</div>${photo(img, sec.title || '')}
  </div></section>`;
}

/** Photo from the original page, shown beside a section (public/assets/img/services/<name>.webp). */
const photo = (name, alt) => `<div class="svc-img"><img src="${asset(`img/services/${name}.webp`)}" alt="${esc(alt)}" width="800" height="800" loading="lazy" decoding="async"></div>`;

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
  const contact = esc(t('svc_contact'))
    .replace('{email}', `<a href="mailto:${esc(settings.email)}">${esc(settings.email)}</a>`)
    .replace('{phone}', `<a href="${telLink(settings.phone)}">${esc(settings.phone)}</a>`);
  const body = `<section class="page-hero"><div class="wrap">
  ${breadcrumbs(crumbs)}
  <h1>${esc(tx.name)}</h1>
  <span class="dots" aria-hidden="true"><i></i><i></i></span>
  ${tx.lead_t ? `<h2 class="hero-sub">${esc(tx.lead_t)}</h2>` : ''}
  <p class="lead">${esc(tx.lead)}</p>
  <div class="hero-cta"><a class="btn btn-pill btn-blue" href="#inquiry">${esc(t('emp_form_t'))} ${icon('arrow')}</a></div>
</div></section>
${tx.sections.map((sec, i) => section(sec, i, svc)).join('\n')}
${svc.images?.end
    ? `<section class="wrap block svc-end svc-split svc-split-rev">${photo(svc.images.end, tx.end_t)}<div class="svc-text">
  <h2>${esc(tx.end_t)}</h2>
  <p>${esc(tx.end_d)}</p>
  <p>${contact}</p>
</div></section>`
    : `<section class="wrap block-sm center svc-end">
  <h2>${esc(tx.end_t)}</h2>
  <p class="lead-c">${esc(tx.end_d)}</p>
  <p class="lead-c">${contact}</p>
</section>`}
${inquirySection(ctx, tx.form_t)}
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
