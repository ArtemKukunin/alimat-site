import { pageUrl, asset, BASE } from '../../core/i18n.js';
import { esc, formatSalary, formatDate } from '../../core/util.js';
import { icon, TAG_ICONS } from '../../core/icons.js';
import { layout, breadcrumbs, breadcrumbLd, contactButtons, waLink } from '../../core/layout.js';
import { CATEGORIES } from './model.js';

export const locationLabel = (job, t) =>
  job.country === 'PL' ? job.city : `${job.city}, ${t(`country_${job.country}`)}`;

const tagList = (job, t) => (job.tags.length
  ? `<ul class="tags">${job.tags.map((tag) => `<li>${icon(TAG_ICONS[tag])}${esc(t(`tag_${tag}`))}</li>`).join('')}</ul>`
  : '');

/** Job card used on the home page and the jobs list. */
export function jobCard(ctx, job) {
  const { lang, t } = ctx;
  const tx = job.text[lang];
  const href = pageUrl(lang, 'jobs', job.id);
  return `<article class="job-card" data-city="${esc(job.city)}" data-cat="${job.category}">
  <p class="job-cat">${esc(t(`cat_${job.category}`))}</p>
  <h3 class="job-title"><a href="${href}">${esc(tx.title)}</a></h3>
  <p class="job-loc">${icon('pin')}${esc(locationLabel(job, t))}</p>
  <p class="job-pay">${esc(formatSalary(job.salary, lang, t))}</p>
  ${tagList(job, t)}
  <a class="job-more" href="${href}" aria-hidden="true" tabindex="-1">${esc(t('job_view'))} ${icon('arrow')}</a>
</article>`;
}

export const activeJobs = (jobs) => jobs.filter((j) => j.active);

/** Unique sorted values for filter selects (only from active jobs → no empty "(0)" options). */
export function filterOptions(jobs, lang) {
  const active = activeJobs(jobs);
  const cities = [...new Set(active.map((j) => j.city))].sort((a, b) => a.localeCompare(b, lang));
  const cats = CATEGORIES.filter((c) => active.some((j) => j.category === c));
  return { cities, cats };
}

export function filterSelects(ctx, { cities, cats }, idPrefix) {
  const { t } = ctx;
  return `<label class="field"><span>${esc(t('search_city'))}</span>
    <select name="city" id="${idPrefix}-city"><option value="">${esc(t('search_any_city'))}</option>${cities.map((c) => `<option value="${esc(c)}">${esc(c)}</option>`).join('')}</select></label>
  <label class="field"><span>${esc(t('search_category'))}</span>
    <select name="cat" id="${idPrefix}-cat"><option value="">${esc(t('search_any'))}</option>${cats.map((c) => `<option value="${c}">${esc(t(`cat_${c}`))}</option>`).join('')}</select></label>`;
}

export function renderJobsList(ctx) {
  const { lang, t, jobs } = ctx;
  const list = activeJobs(jobs);
  const crumbs = [{ name: t('breadcrumb_home'), href: pageUrl(lang, 'home') }, { name: t('jobs_h1'), href: pageUrl(lang, 'jobs') }];
  const itemList = {
    '@context': 'https://schema.org', '@type': 'ItemList',
    itemListElement: list.map((j, i) => ({ '@type': 'ListItem', position: i + 1, url: ctx.settings.siteUrl + pageUrl(lang, 'jobs', j.id), name: j.text[lang].title })),
  };
  const body = `<section class="page-hero"><div class="wrap">
  ${breadcrumbs(crumbs)}
  <h1>${esc(t('jobs_h1'))}</h1>
  <p class="lead">${esc(t('jobs_lead'))}</p>
</div></section>
<section class="wrap jobs-page">
  <form class="filters" id="job-filters" action="${pageUrl(lang, 'jobs')}" method="get" role="search">
    ${filterSelects(ctx, filterOptions(jobs, lang), 'f')}
    <button class="btn btn-ghost" type="reset">${esc(t('filter_reset'))}</button>
  </form>
  <p class="jobs-count" id="jobs-count" aria-live="polite" data-template="${esc(t('jobs_count'))}">${esc(t('jobs_count', { n: list.length }))}</p>
  <div class="job-grid" id="job-grid">${list.map((j) => jobCard(ctx, j)).join('')}</div>
  <div class="empty" id="jobs-empty" hidden>
    <p>${esc(t('jobs_empty'))}</p>
    <a class="btn btn-primary" href="${pageUrl(lang, 'apply')}">${esc(t('cta_apply_long'))}</a>
  </div>
</section>`;
  return layout(ctx, {
    page: 'jobs', title: t('jobs_title'), description: t('jobs_desc'), body,
    jsonld: [breadcrumbLd(ctx.settings, crumbs), itemList],
  });
}

function section(title, items, ordered = false) {
  if (!items.length) return '';
  const tag = ordered ? 'ol' : 'ul';
  return `<section class="job-sec"><h2>${esc(title)}</h2><${tag} class="ticks">${items.map((i) => `<li>${esc(i)}</li>`).join('')}</${tag}></section>`;
}

/** schema.org JobPosting for Google for Jobs. */
export function jobPostingLd(ctx, job) {
  const { lang, settings } = ctx;
  const tx = job.text[lang];
  const parts = [`<p>${esc(tx.summary)}</p>`];
  for (const f of ['duties', 'requirements', 'offer', 'conditions']) {
    if (tx[f].length) parts.push(`<ul>${tx[f].map((i) => `<li>${esc(i)}</li>`).join('')}</ul>`);
  }
  const ld = {
    '@context': 'https://schema.org/',
    '@type': 'JobPosting',
    title: tx.title,
    description: parts.join(''),
    datePosted: job.datePosted,
    employmentType: 'FULL_TIME',
    hiringOrganization: { '@type': 'Organization', name: settings.brand, sameAs: `${settings.siteUrl}${BASE}/`, logo: settings.siteUrl + asset('logo.svg') },
    jobLocation: { '@type': 'Place', address: { '@type': 'PostalAddress', addressLocality: job.city, ...(job.region && { addressRegion: job.region }), addressCountry: job.country } },
    baseSalary: {
      '@type': 'MonetaryAmount', currency: 'PLN',
      value: { '@type': 'QuantitativeValue', minValue: job.salary.min, maxValue: job.salary.max || job.salary.min, unitText: job.salary.unit === 'hour' ? 'HOUR' : 'MONTH' },
    },
    identifier: { '@type': 'PropertyValue', name: settings.brand, value: job.id },
    url: settings.siteUrl + pageUrl(lang, 'jobs', job.id),
  };
  if (job.validThrough) ld.validThrough = `${job.validThrough}T23:59:59+01:00`;
  return ld;
}

export function renderJobDetail(ctx, job) {
  const { lang, t, settings, jobs } = ctx;
  const tx = job.text[lang];
  const loc = locationLabel(job, t);
  const salary = formatSalary(job.salary, lang, t);
  const waText = t('wa_msg', { title: tx.title, city: loc });
  const applyHref = `${pageUrl(lang, 'apply')}?job=${encodeURIComponent(job.id)}`;
  const crumbs = [
    { name: t('breadcrumb_home'), href: pageUrl(lang, 'home') },
    { name: t('jobs_h1'), href: pageUrl(lang, 'jobs') },
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
  <p class="job-cat">${esc(t(`cat_${job.category}`))}</p>
  <h1>${esc(tx.title)}</h1>
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
    <p class="posted">${esc(t('d_posted'))}: <time datetime="${job.datePosted}">${esc(formatDate(job.datePosted, lang))}</time></p>
  </article>
  <aside class="job-aside">
    <div class="apply-card">
      <dl class="facts">${facts.map(([ic, k, v]) => `<div>${icon(ic)}<dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>
      ${job.active ? `<a class="btn btn-primary btn-block" href="${applyHref}">${esc(t('apply_this'))}</a>
      <a class="btn btn-wa btn-block" href="${waLink(settings, waText)}" rel="noopener" target="_blank">${icon('chat')}<span>${esc(t('cta_whatsapp'))}</span></a>
      <p class="small">${esc(t('help_d'))}</p>
      ${contactButtons(ctx, { waText, compact: true })}` : `<a class="btn btn-primary btn-block" href="${pageUrl(lang, 'jobs')}">${esc(t('back_to_jobs'))}</a>`}
    </div>
  </aside>
</div>
${similar.length ? `<section class="wrap similar"><h2>${esc(t('similar'))}</h2><div class="job-grid">${similar.map((j) => jobCard(ctx, j)).join('')}</div></section>` : ''}`;
  return layout(ctx, {
    page: 'jobs', sub: job.id,
    title: t('job_meta_title', { title: tx.title, city: loc }),
    description: t('job_meta_desc', { title: tx.title, city: loc, salary }),
    body, noindex: !job.active,
    jsonld: [breadcrumbLd(settings, crumbs), ...(job.active ? [jobPostingLd(ctx, job)] : [])],
  });
}
