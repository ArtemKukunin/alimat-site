import { pageUrl } from '../../core/i18n.js';
import { esc } from '../../core/util.js';
import { icon } from '../../core/icons.js';
import { layout, contactButtons } from '../../core/layout.js';
import { jobCard, activeJobs, filterOptions, filterSelects } from '../jobs/jobs.js';

export const PERKS = [
  ['legal', 'shield'], ['docs', 'doc'], ['housing', 'home'],
  ['transport', 'bus'], ['pay', 'pay'], ['coord', 'user'],
];

export const perksGrid = (t) => `<ul class="perks">${PERKS.map(([k, ic]) => `<li>${icon(ic, 'ic ic-lg')}<h3>${esc(t(`perk_${k}_t`))}</h3><p>${esc(t(`perk_${k}_d`))}</p></li>`).join('')}</ul>`;

export const steps = (t) => `<ol class="steps">${[1, 2, 3, 4].map((n) => `<li><span class="step-n">${n}</span><h3>${esc(t(`step${n}_t`))}</h3><p>${esc(t(`step${n}_d`))}</p></li>`).join('')}</ol>`;

export function renderHome(ctx) {
  const { lang, t, settings, jobs } = ctx;
  const latest = activeJobs(jobs).slice(0, 6);
  const body = `<section class="hero">
  <div class="wrap hero-grid">
    <div>
      <p class="kicker">${esc(t('hero_kicker'))}</p>
      <h1>${esc(t('hero_h1'))}</h1>
      <p class="lead">${esc(t('hero_lead'))}</p>
      <div class="hero-cta">
        <a class="btn btn-primary btn-lg" href="${pageUrl(lang, 'jobs')}">${esc(t('all_jobs'))}</a>
        <a class="btn btn-outline btn-lg" href="${pageUrl(lang, 'apply')}">${esc(t('cta_apply_long'))}</a>
      </div>
    </div>
    <form class="search-card" action="${pageUrl(lang, 'jobs')}" method="get" role="search">
      <h2>${esc(t('search_title'))}</h2>
      ${filterSelects(ctx, filterOptions(jobs, lang), 'h')}
      <button class="btn btn-primary btn-block" type="submit">${esc(t('search_btn'))}</button>
      <p class="small">${esc(t('jobs_lead'))}</p>
    </form>
  </div>
</section>

<section class="wrap block">
  <div class="block-head"><h2>${esc(t('latest_jobs'))}</h2><a class="link-arrow" href="${pageUrl(lang, 'jobs')}">${esc(t('all_jobs'))} ${icon('arrow')}</a></div>
  <div class="job-grid">${latest.map((j) => jobCard(ctx, j)).join('')}</div>
</section>

<section class="band"><div class="wrap block">
  <h2>${esc(t('perks_title'))}</h2>
  ${perksGrid(t)}
</div></section>

<section class="wrap block">
  <h2>${esc(t('steps_title'))}</h2>
  ${steps(t)}
  <div class="center"><a class="btn btn-primary btn-lg" href="${pageUrl(lang, 'apply')}">${esc(t('cta_apply_long'))}</a></div>
</section>

<section class="wrap block split">
  <div class="referral">${icon('gift', 'ic ic-lg')}<div><h2>${esc(t('referral_t', { bonus: settings.referralBonus }))}</h2><p>${esc(t('referral_d', { bonus: settings.referralBonus, half: settings.referralBonus / 2 }))}</p></div></div>
  <div class="help-box"><h2>${esc(t('help_t'))}</h2><p>${esc(t('help_d'))}</p>${contactButtons(ctx)}</div>
</section>

<section class="wrap block">
  <div class="emp-teaser">
    <div><h2>${esc(t('emp_teaser_t'))}</h2><p>${esc(t('emp_teaser_d'))}</p></div>
    <a class="btn btn-light" href="${pageUrl(lang, 'employers')}">${esc(t('emp_teaser_cta'))} ${icon('arrow')}</a>
  </div>
</section>`;
  return layout(ctx, { page: 'home', title: t('home_title'), description: t('home_desc'), body });
}
