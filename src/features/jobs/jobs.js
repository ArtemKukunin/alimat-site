import { pageUrl, asset, BASE, LANG_CODES } from '../../core/i18n.js';
import { esc, formatSalary, fitTitle, fitDesc } from '../../core/util.js';
import { icon, TAG_ICONS } from '../../core/icons.js';
import { layout, breadcrumbs, breadcrumbLd, contactButtons, waLink } from '../../core/layout.js';
import { CATEGORIES } from './model.js';
import { leadPopup } from './popup.js';

/** "*" in job.city = several cities. */
export const locationLabel = (job, t) => {
  if (job.city === '*') return t('loc_various');
  return job.country === 'PL' ? job.city : `${job.city}, ${t(`country_${job.country}`)}`;
};

/** Category (job section) helpers — data/categories.json. */
export const catText = (ctx, cat) => ctx.categories[cat][ctx.lang];
export const catSlugs = (ctx, cat) => Object.fromEntries(LANG_CODES.map((l) => [l, ctx.categories[cat][l].slug]));
export const catUrl = (ctx, cat) => pageUrl(ctx.lang, 'jobs', catSlugs(ctx, cat));

export const tagList = (job, t) => (job.tags.length
  ? `<ul class="tags">${job.tags.map((tag) => `<li>${icon(TAG_ICONS[tag])}${esc(t(`tag_${tag}`))}</li>`).join('')}</ul>`
  : '');

/** Job card used on the home page and the lists. */
export function jobCard(ctx, job) {
  const { lang, t } = ctx;
  const tx = job.text[lang];
  const href = pageUrl(lang, 'jobs', job.id);
  return `<article class="job-card" data-city="${esc(job.city)}" data-cat="${job.category}">
  <p class="job-cat">${esc(catText(ctx, job.category).name)}</p>
  <h3 class="job-title"><a href="${href}">${esc(tx.title)}</a></h3>
  <p class="job-loc">${icon('pin')}${esc(locationLabel(job, t))}</p>
  <p class="job-pay">${esc(formatSalary(job.salary, lang, t))}</p>
  ${tagList(job, t)}
  <span class="job-more" aria-hidden="true">${esc(t('job_view'))} ${icon('arrow')}</span>
</article>`;
}

export const activeJobs = (jobs) => jobs.filter((j) => j.active);
const countIn = (jobs, cat) => activeJobs(jobs).filter((j) => j.category === cat).length;

/** Tiles linking to every job section; current one marked. */
export function sectionTiles(ctx, current) {
  const { t, jobs } = ctx;
  return `<ul class="sections">${CATEGORIES.map((c) => {
    const n = countIn(jobs, c);
    return `<li><a class="section-tile${c === current ? ' is-current' : ''}" href="${catUrl(ctx, c)}"${c === current ? ' aria-current="page"' : ''}>
      <span class="section-ic">${icon(ctx.categories[c].icon, 'ic ic-lg')}</span>
      <span class="section-name">${esc(catText(ctx, c).name)}</span>
      <span class="section-count">${esc(t('section_count', { n }))}</span>
    </a></li>`;
  }).join('')}</ul>`;
}

/** Unique sorted values for filter selects (only from active jobs → no empty "(0)" options). */
export function filterOptions(jobs, lang) {
  const active = activeJobs(jobs);
  const cities = [...new Set(active.map((j) => j.city).filter((c) => c !== '*'))].sort((a, b) => a.localeCompare(b, lang));
  const cats = CATEGORIES.filter((c) => active.some((j) => j.category === c));
  return { cities, cats };
}

export function filterSelects(ctx, { cities, cats }, idPrefix) {
  const { t } = ctx;
  return `<label class="field"><span>${esc(t('search_city'))}</span>
    <select name="city" id="${idPrefix}-city"><option value="">${esc(t('search_any_city'))}</option>${cities.map((c) => `<option value="${esc(c)}">${esc(c)}</option>`).join('')}</select></label>
  <label class="field"><span>${esc(t('search_category'))}</span>
    <select name="cat" id="${idPrefix}-cat"><option value="">${esc(t('search_any'))}</option>${cats.map((c) => `<option value="${c}">${esc(catText(ctx, c).name)}</option>`).join('')}</select></label>`;
}

const itemListLd = (ctx, list) => ({
  '@context': 'https://schema.org', '@type': 'ItemList',
  itemListElement: list.map((j, i) => ({ '@type': 'ListItem', position: i + 1, url: ctx.settings.siteUrl + pageUrl(ctx.lang, 'jobs', j.id), name: j.text[ctx.lang].title })),
});

const emptyBox = (ctx, hidden) => `<div class="empty" id="jobs-empty"${hidden ? ' hidden' : ''}>
    <p>${esc(ctx.t('jobs_empty'))}</p>
    <a class="btn btn-pill btn-orange" href="${pageUrl(ctx.lang, 'apply')}">${esc(ctx.t('cta_apply_long'))}</a>
  </div>`;

/** "No job for you? Leave your CV" — for candidates without a matching offer. */
export const cvBanner = (ctx) => `<section class="wrap block-sm"><div class="cv-banner">
  ${icon('doc', 'ic ic-lg')}
  <div><h2>${esc(ctx.t('cv_t'))}</h2><p>${esc(ctx.t('cv_d'))}</p></div>
  <a class="btn btn-pill btn-orange" href="${pageUrl(ctx.lang, 'apply')}#cv">${esc(ctx.t('cv_btn'))}</a>
</div></section>`;

export function renderJobsList(ctx) {
  const { lang, t, jobs } = ctx;
  const list = activeJobs(jobs);
  const crumbs = [{ name: t('breadcrumb_home'), href: pageUrl(lang, 'home') }, { name: t('jobs_h1'), href: pageUrl(lang, 'jobs') }];
  const body = `<section class="page-hero"><div class="wrap">
  ${breadcrumbs(crumbs)}
  <h1>${esc(t('jobs_h1'))}</h1>
  <span class="dots" aria-hidden="true"><i></i><i></i></span>
  <p class="lead">${esc(t('jobs_lead'))}</p>
</div></section>
<section class="wrap block-sm">
  <h2>${esc(t('sections_title'))}</h2>
  ${sectionTiles(ctx)}
</section>
<section class="wrap jobs-page">
  <form class="filters" id="job-filters" action="${pageUrl(lang, 'jobs')}" method="get" role="search">
    ${filterSelects(ctx, filterOptions(jobs, lang), 'f')}
    <button class="btn btn-pill btn-outline-light" type="reset">${esc(t('filter_reset'))}</button>
  </form>
  <p class="jobs-count" id="jobs-count" aria-live="polite" data-template="${esc(t('jobs_count'))}">${esc(t('jobs_count', { n: list.length }))}</p>
  <div class="job-grid" id="job-grid">${list.map((j) => jobCard(ctx, j)).join('')}</div>
  ${emptyBox(ctx, true)}
</section>
${cvBanner(ctx)}
${leadPopup(ctx)}`;
  return layout(ctx, {
    page: 'jobs', title: t('jobs_title'), description: t('jobs_desc'), body,
    jsonld: [breadcrumbLd(ctx.settings, crumbs), itemListLd(ctx, list)],
  });
}

/** One job section (e.g. "Praca na produkcji"): own URL in every language, indexed only when it has jobs. */
export function renderJobSection(ctx, cat) {
  const { lang, t, jobs } = ctx;
  const c = catText(ctx, cat);
  const list = activeJobs(jobs).filter((j) => j.category === cat);
  const crumbs = [
    { name: t('breadcrumb_home'), href: pageUrl(lang, 'home') },
    { name: t('jobs_h1'), href: pageUrl(lang, 'jobs') },
    { name: c.name, href: catUrl(ctx, cat) },
  ];
  const body = `<section class="page-hero"><div class="wrap">
  ${breadcrumbs(crumbs)}
  <div class="section-hero">
    <span class="section-hero-ic">${icon(ctx.categories[cat].icon, 'ic ic-xl')}</span>
    <div>
      <h1>${esc(c.h1)}</h1>
      <span class="dots" aria-hidden="true"><i></i><i></i></span>
      <p class="lead">${esc(c.intro)}</p>
      <p class="small">${esc(t('jobs_lead'))}</p>
    </div>
  </div>
</div></section>
<section class="wrap jobs-page">
  <p class="jobs-count">${esc(t('jobs_count', { n: list.length }))}</p>
  ${list.length ? `<div class="job-grid">${list.map((j) => jobCard(ctx, j)).join('')}</div>` : emptyBox(ctx, false)}
</section>
${list.length ? cvBanner(ctx) : ''}
<section class="wrap block-sm">
  <h2>${esc(t('other_sections'))}</h2>
  ${sectionTiles(ctx, cat)}
</section>
${list.length ? leadPopup(ctx) : ''}`;
  return layout(ctx, {
    page: 'jobs', sub: catSlugs(ctx, cat),
    title: fitTitle(`${c.h1} | Alimat Group`, c.h1), description: fitDesc(c.desc), body,
    noindex: list.length === 0,
    jsonld: [breadcrumbLd(ctx.settings, crumbs), ...(list.length ? [itemListLd(ctx, list)] : [])],
  });
}

function section(title, items) {
  if (!items.length) return '';
  return `<section class="job-sec"><h2>${esc(title)}</h2><ul class="ticks">${items.map((i) => `<li>${esc(i)}</li>`).join('')}</ul></section>`;
}

/** schema.org JobPosting for Google for Jobs. */
export function jobPostingLd(ctx, job) {
  const { lang, settings } = ctx;
  const tx = job.text[lang];
  const parts = [`<p>${esc(tx.summary)}</p>`];
  for (const f of ['duties', 'requirements', 'offer', 'conditions']) {
    if (tx[f].length) parts.push(`<ul>${tx[f].map((i) => `<li>${esc(i)}</li>`).join('')}</ul>`);
  }
  const address = { '@type': 'PostalAddress', addressCountry: job.country };
  if (job.city !== '*') address.addressLocality = job.city;
  if (job.region) address.addressRegion = job.region;
  const ld = {
    '@context': 'https://schema.org/',
    '@type': 'JobPosting',
    title: tx.title,
    description: parts.join(''),
    datePosted: job.datePosted,
    employmentType: 'FULL_TIME',
    hiringOrganization: { '@type': 'Organization', name: settings.brand, sameAs: `${settings.siteUrl}${BASE}/`, logo: settings.siteUrl + asset('img/logo.webp') },
    jobLocation: { '@type': 'Place', address },
    baseSalary: {
      '@type': 'MonetaryAmount', currency: 'PLN',
      value: { '@type': 'QuantitativeValue', minValue: job.salary.min, maxValue: job.salary.max || job.salary.min, unitText: job.salary.unit === 'hour' ? 'HOUR' : 'MONTH' },
    },
    identifier: { '@type': 'PropertyValue', name: settings.brand, value: job.id },
    url: settings.siteUrl + pageUrl(lang, 'jobs', job.id),
  };
  // Active offers without an end date stay valid 30 days past each build (the site is rebuilt on every change).
  const until = job.validThrough || new Date(Date.now() + 30 * 864e5).toISOString().slice(0, 10);
  ld.validThrough = `${until}T23:59:59+01:00`;
  ld.directApply = true;
  ld.industry = catText(ctx, job.category).name;
  if (job.tags.length) ld.jobBenefits = job.tags.map((tag) => ctx.t(`tag_${tag}`)).join(', ');
  return ld;
}

export function renderJobDetail(ctx, job) {
  const { lang, t, settings, jobs } = ctx;
  const tx = job.text[lang];
  const c = catText(ctx, job.category);
  const loc = locationLabel(job, t);
  const salary = formatSalary(job.salary, lang, t);
  const waText = t('wa_msg', { title: tx.title, city: loc });
  const applyHref = `${pageUrl(lang, 'apply')}?job=${encodeURIComponent(job.id)}`;
  const crumbs = [
    { name: t('breadcrumb_home'), href: pageUrl(lang, 'home') },
    { name: t('jobs_h1'), href: pageUrl(lang, 'jobs') },
    { name: c.name, href: catUrl(ctx, job.category) },
    { name: tx.title, href: pageUrl(lang, 'jobs', job.id) },
  ];
  const facts = [
    ['pin', t('d_location'), loc],
    ['pay', t('d_salary'), salary],
    ...(job.contract ? [['doc', t('d_contract'), t(`ct_${job.contract}`)]] : []),
    ['clock', t('d_worktime'), t('full_time')],
  ];
  const similar = activeJobs(jobs).filter((j) => j.id !== job.id && j.category === job.category).slice(0, 3);
  const body = `<section class="page-hero job-hero"><div class="wrap">
  ${breadcrumbs(crumbs)}
  ${job.active ? '' : `<p class="notice" role="status">${esc(t('job_inactive'))}</p>`}
  <p class="job-cat"><a href="${catUrl(ctx, job.category)}">${esc(c.name)}</a></p>
  <h1>${esc(tx.title)}</h1>
  <span class="dots" aria-hidden="true"><i></i><i></i></span>
  <p class="lead">${esc(tx.summary)}</p>
  ${tagList(job, t)}
</div></section>
<div class="wrap job-layout">
  <article class="job-body">
    ${section(t('sec_duties'), tx.duties)}
    ${section(t('sec_requirements'), tx.requirements)}
    ${section(t('sec_offer'), tx.offer)}
    ${section(t('sec_conditions'), tx.conditions)}
    <section class="referral">${icon('gift', 'ic ic-lg')}<div><h2>${esc(t('referral_t', { bonus: settings.referralBonus }))}</h2><p>${esc(t('referral_d', { bonus: settings.referralBonus, half: settings.referralBonus / 2 }))}</p></div></section>
  </article>
  <aside class="job-aside">
    <div class="apply-card">
      <dl class="facts">${facts.map(([ic, k, v]) => `<div>${icon(ic)}<dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>
      ${job.active ? `<a class="btn btn-pill btn-orange btn-block" href="${applyHref}">${esc(t('apply_this'))}</a>
      <a class="btn btn-pill btn-wa btn-block" href="${waLink(settings, waText)}" rel="noopener" target="_blank">${icon('chat')}<span>${esc(t('cta_whatsapp'))}</span></a>
      <p class="small">${esc(t('help_d'))}</p>
      ${contactButtons(ctx, { waText, compact: true })}` : `<a class="btn btn-pill btn-blue btn-block" href="${catUrl(ctx, job.category)}">${esc(c.name)}</a>`}
    </div>
  </aside>
</div>
${similar.length ? `<section class="wrap similar"><h2>${esc(t('similar'))}</h2><div class="job-grid">${similar.map((j) => jobCard(ctx, j)).join('')}</div></section>` : ''}
${cvBanner(ctx)}
${job.active ? leadPopup(ctx, job) : ''}`;
  return layout(ctx, {
    page: 'jobs', sub: job.id,
    title: fitTitle(t('job_meta_title', { title: tx.title, city: loc }), `${tx.title} – ${loc}`, tx.title),
    description: fitDesc(t('job_meta_desc', { title: tx.title, city: loc, salary })),
    body, noindex: !job.active,
    jsonld: [breadcrumbLd(settings, crumbs), ...(job.active ? [jobPostingLd(ctx, job)] : [])],
  });
}
