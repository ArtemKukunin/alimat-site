// Home page job slider: every active job as a slide with summary, "Apply" (opens the quick form) and "Details".
// Hover (or the "Full description" button on touch screens) slides the full description up over the card.
// Works without JS as a horizontally scrollable list (CSS scroll-snap); app.js adds arrows, dots and autoplay.
import { pageUrl } from '../../core/i18n.js';
import { esc, formatSalary } from '../../core/util.js';
import { icon } from '../../core/icons.js';
import { waLink } from '../../core/layout.js';
import { activeJobs, catText, locationLabel, tagList } from './jobs.js';
import { leadPopup } from './popup.js';

/** Sections shown in the slide-up panel (same as on the job page). */
const DETAIL = [['duties', 'sec_duties'], ['requirements', 'sec_requirements'], ['offer', 'sec_offer'], ['conditions', 'sec_conditions']];

const newestFirst = (a, b) => String(b.datePosted).localeCompare(String(a.datePosted));

function slide(ctx, job, i, total) {
  const { lang, t, settings } = ctx;
  const tx = job.text[lang];
  const href = pageUrl(lang, 'jobs', job.id);
  const city = job.city === '*' ? t('loc_various') : job.city;
  return `<li class="js-slide" role="group" aria-roledescription="slide" aria-label="${i + 1} / ${total}">
    <p class="job-cat">${esc(catText(ctx, job.category).name)}</p>
    <h3 class="job-title"><a href="${href}">${esc(tx.title)}</a></h3>
    <p class="job-loc">${icon('pin')}${esc(locationLabel(job, t))}</p>
    <p class="job-pay">${esc(formatSalary(job.salary, lang, t))}</p>
    ${tagList({ ...job, tags: job.tags.slice(0, 3) }, t)}
    <p class="js-sum">${esc(tx.summary)}</p>
    <button class="js-more" type="button" aria-expanded="false" aria-controls="jsd-${job.id}">${esc(t('job_full'))} ${icon('chevron')}</button>
    <div class="js-detail" id="jsd-${job.id}">
      <p class="js-detail-t">${esc(tx.title)}</p>
      <p>${esc(tx.summary)}</p>
      ${DETAIL.map(([f, key]) => (tx[f]?.length ? `<h4>${esc(t(key))}</h4><ul>${tx[f].map((x) => `<li>${esc(x)}</li>`).join('')}</ul>` : '')).join('')}
    </div>
    <div class="js-actions">
      <button class="btn btn-pill btn-orange" type="button" data-apply="${esc(tx.title)}" data-wa="${esc(waLink(settings, t('wa_msg', { title: tx.title, city })))}">${esc(t('cta_apply'))}</button>
      <a class="btn btn-pill btn-outline-blue" href="${href}">${esc(t('job_view'))} ${icon('arrow')}</a>
    </div>
  </li>`;
}

/** popup: include the quick-apply dialog (false when the page already has one); allLink: "all jobs" link. */
export function jobSlider(ctx, { popup = true, allLink = true } = {}) {
  const { lang, t, jobs } = ctx;
  const list = activeJobs(jobs).sort(newestFirst);
  if (!list.length) return '';
  return `<section class="wrap block-sm job-slider" aria-roledescription="carousel" aria-labelledby="js-t">
  <div class="block-head">
    <h2 id="js-t">${esc(t('latest_jobs'))}</h2>
    <div class="js-nav">
      ${allLink ? `<a class="link-arrow" href="${pageUrl(lang, 'jobs')}">${esc(t('all_jobs'))} ${icon('arrow')}</a>` : ''}
      <button class="js-btn" type="button" data-dir="-1" aria-label="${esc(t('slider_prev'))}">${icon('arrow')}</button>
      <button class="js-btn" type="button" data-dir="1" aria-label="${esc(t('slider_next'))}">${icon('arrow')}</button>
    </div>
  </div>
  <ul class="js-track" tabindex="0">${list.map((j, i) => slide(ctx, j, i, list.length)).join('')}</ul>
  <div class="js-dots" aria-hidden="true"></div>
</section>
${popup ? leadPopup(ctx, null, { auto: false }) : ''}`;
}
