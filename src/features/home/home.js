import { pageUrl, asset } from '../../core/i18n.js';
import { esc } from '../../core/util.js';
import { icon } from '../../core/icons.js';
import { layout, contactButtons } from '../../core/layout.js';
import { jobCard, activeJobs, filterOptions, filterSelects } from '../jobs/jobs.js';

export const PERKS = [
  ['legal', 'shield'], ['docs', 'doc'], ['housing', 'home'],
  ['transport', 'bus'], ['pay', 'pay'], ['coord', 'user'],
];

export const perksGrid = (t) => `<ul class="perks">${PERKS.map(([k, ic]) => `<li>${icon(ic, 'ic ic-lg')}<h3>${esc(t(`perk_${k}_t`))}</h3><p>${esc(t(`perk_${k}_d`))}</p></li>`).join('')}</ul>`;

/** Alternating photo + text rows with a large faint index, as on the original site. */
const perkRows = (t) => PERKS.map(([k], i) => `<article class="why-row${i % 2 ? ' why-row-rev' : ''}">
  <div class="why-img"><img src="${asset(`img/home-${i + 1}.webp`)}" alt="" width="800" height="533" loading="lazy" decoding="async"></div>
  <div class="why-text"><span class="why-n" aria-hidden="true">0.${i + 1}</span><h3>${esc(t(`perk_${k}_t`))}</h3><p>${esc(t(`perk_${k}_d`))}</p></div>
</article>`).join('');

export const steps = (t) => `<ol class="steps">${[1, 2, 3, 4].map((n) => `<li><span class="step-n">${n}</span><h3>${esc(t(`step${n}_t`))}</h3><p>${esc(t(`step${n}_d`))}</p></li>`).join('')}</ol>`;

const dots = '<span class="dots" aria-hidden="true"><i></i><i></i></span>';

export function renderHome(ctx) {
  const { lang, t, settings, jobs } = ctx;
  const latest = activeJobs(jobs).slice(0, 6);
  const body = `<section class="hero">
  <div class="wrap hero-grid">
    <div class="hero-text">
      <p class="kicker">${esc(t('hero_kicker'))}</p>
      <h1>${esc(t('hero_h1'))}</h1>
      ${dots}
      <p class="lead">${esc(t('hero_lead'))}</p>
      <div class="hero-cta">
        <a class="btn btn-pill btn-blue" href="${pageUrl(lang, 'jobs')}">${esc(t('all_jobs'))} ${icon('arrow')}</a>
        <a class="btn btn-pill btn-outline-blue" href="${pageUrl(lang, 'apply')}">${esc(t('cta_apply_long'))}</a>
      </div>
    </div>
    <picture class="hero-img">
      <source media="(max-width: 767px)" srcset="${asset('img/hero-mobile.webp')}">
      <img src="${asset('img/hero-desktop.webp')}" alt="" width="818" height="684" fetchpriority="high">
    </picture>
  </div>
  <div class="wrap">
    <form class="search-band" action="${pageUrl(lang, 'jobs')}" method="get" role="search">
      <h2>${esc(t('search_band'))}</h2>
      ${filterSelects(ctx, filterOptions(jobs, lang), 'h')}
      <button class="btn btn-pill btn-blue" type="submit">${esc(t('search_btn'))}</button>
      <a class="btn btn-pill btn-outline-light" href="${pageUrl(lang, 'jobs')}">${esc(t('all_jobs'))}</a>
    </form>
  </div>
</section>

<section class="wrap block">
  <div class="block-head"><h2>${esc(t('latest_jobs'))}</h2><a class="link-arrow" href="${pageUrl(lang, 'jobs')}">${esc(t('all_jobs'))} ${icon('arrow')}</a></div>
  <div class="job-grid">${latest.map((j) => jobCard(ctx, j)).join('')}</div>
</section>

<section class="wrap block">
  <h2 class="center-title">${esc(t('perks_title'))}</h2>
  <div class="why">${perkRows(t)}</div>
</section>

<section class="wrap block duo">
  <a class="duo-card duo-orange" href="${pageUrl(lang, 'candidates')}">${icon('user', 'ic ic-xl')}<h2>${esc(t('cand_h1'))}</h2><p>${esc(t('card_cand_d'))}</p><span class="btn btn-pill btn-outline-light">${esc(t('all_jobs'))} ${icon('arrow')}</span></a>
  <a class="duo-card duo-blue" href="${pageUrl(lang, 'employers')}">${icon('shield', 'ic ic-xl')}<h2>${esc(t('nav_employers'))}</h2><p>${esc(t('emp_teaser_d'))}</p><span class="btn btn-pill btn-outline-light">${esc(t('emp_teaser_cta'))} ${icon('arrow')}</span></a>
</section>

<section class="wrap block">
  <ul class="stats">${settings.stats.map((v, i) => `<li>${icon(['shield', 'doc', 'user', 'home'][i], 'ic ic-lg')}<strong>${esc(v)}</strong><span>${esc(t(`stat${i + 1}`))}</span></li>`).join('')}</ul>
</section>

<section class="band"><div class="wrap block">
  <h2 class="center-title">${esc(t('steps_title'))}</h2>
  ${steps(t)}
  <div class="center"><a class="btn btn-pill btn-orange" href="${pageUrl(lang, 'apply')}">${esc(t('cta_apply_long'))} ${icon('arrow')}</a></div>
</div></section>

<section class="wrap block split">
  <div class="referral">${icon('gift', 'ic ic-lg')}<div><h2>${esc(t('referral_t', { bonus: settings.referralBonus }))}</h2><p>${esc(t('referral_d', { bonus: settings.referralBonus, half: settings.referralBonus / 2 }))}</p></div></div>
  <div class="help-box"><h2>${esc(t('f_fast'))}</h2>${contactButtons(ctx)}</div>
</section>`;
  return layout(ctx, { page: 'home', title: t('home_title'), description: t('home_desc'), body });
}
