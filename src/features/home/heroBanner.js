// Home hero banner: one featured job per category, switching every 5 s, each with a 4-photo mosaic
// whose photos fly in one by one. Without JS only the first slide shows (others are hidden by CSS),
// so the page stays complete and readable. Timing, pause on hover/focus and reduced motion: app.js heroBanner().
import { pageUrl, asset } from '../../core/i18n.js';
import { esc, formatSalary } from '../../core/util.js';
import { icon } from '../../core/icons.js';
import { waLink } from '../../core/layout.js';
import { activeJobs, catText, catUrl, locationLabel } from '../jobs/jobs.js';

/**
 * Banner slides in display order: a photo set in public/assets/img/hero/<photos>-1..4.webp and either a
 * specific job id (shown while that job is active) or a category (its newest active job).
 */
export const HERO = [
  { photos: 'deboning', job: 'specjalista-trybowania-wolowiny-2' },
  { photos: 'beef', job: 'pracownik-linii-ubojowej-wolowina' },
  { photos: 'production', cat: 'production' },
  { photos: 'poultry', job: 'pracownik-produkcji-w-zakladzie-drobiowym-2' },
  { photos: 'greenhouse', cat: 'agriculture' },
  { photos: 'logistics', cat: 'logistics' },
  { photos: 'kitchen', cat: 'kitchen' },
];
const SLOTS = ['a', 'b', 'c', 'd']; // a, c: portrait 520×600; b, d: landscape 520×300
const SIZE = { a: [520, 600], b: [520, 300], c: [520, 600], d: [520, 300] };

const newestFirst = (a, b) => String(b.datePosted).localeCompare(String(a.datePosted));

export function heroSlides(jobs) {
  const active = activeJobs(jobs).sort(newestFirst);
  return HERO.map((h) => ({ cat: h.photos, job: h.job ? active.find((j) => j.id === h.job) : active.find((j) => j.category === h.cat) }))
    .filter((s) => s.job);
}

export const heroImage = (cat, n) => asset(`img/hero/${cat}-${n}.webp`);

function mosaic(ctx, { cat, job }, i) {
  const name = job.text[ctx.lang].title;
  return `<div class="hb-set${i === 0 ? ' is-on' : ''}" data-i="${i}">${SLOTS.map((s, k) => {
    const src = heroImage(cat, k + 1);
    const [w, h] = SIZE[s];
    // First slide loads normally (first photo is the LCP candidate); the rest get their src from app.js.
    const load = i === 0 ? `src="${src}"${k === 0 ? ' fetchpriority="high"' : ''}` : `data-src="${src}"`;
    return `<figure class="hb-ph hb-${s}"><img ${load} alt="${k === 0 ? esc(name) : ''}" width="${w}" height="${h}" decoding="async"></figure>`;
  }).join('')}</div>`;
}

function card(ctx, { job }, i) {
  const { lang, t, settings } = ctx;
  const tx = job.text[lang];
  const href = pageUrl(lang, 'jobs', job.id);
  const cat = catText(ctx, job.category);
  const city = job.city === '*' ? t('loc_various') : job.city;
  return `<article class="hb-slide${i === 0 ? ' is-on' : ''}" data-i="${i}" aria-roledescription="slide">
    <a class="hb-cat" href="${catUrl(ctx, job.category)}">${esc(cat.name)}</a>
    <h2 class="hb-title"><a href="${href}">${esc(tx.title)}</a></h2>
    <p class="hb-meta"><span>${icon('pin')}${esc(locationLabel(job, t))}</span><strong>${esc(formatSalary(job.salary, lang, t))}</strong></p>
    <p class="hb-sum">${esc(tx.summary)}</p>
    <div class="hero-cta">
      <button class="btn btn-pill btn-orange" type="button" data-apply="${esc(tx.title)}" data-wa="${esc(waLink(settings, t('wa_msg', { title: tx.title, city })))}">${esc(t('cta_apply'))}</button>
      <a class="btn btn-pill btn-outline-blue" href="${href}">${esc(t('job_view'))} ${icon('arrow')}</a>
    </div>
  </article>`;
}

export function heroBanner(ctx) {
  const { lang, t, jobs } = ctx;
  const slides = heroSlides(jobs);
  return `<div class="wrap hero-grid hb" data-hb aria-roledescription="carousel" aria-label="${esc(t('hb_label'))}">
    <div class="hero-text">
      <p class="kicker">${esc(t('hero_kicker'))}</p>
      <h1>${esc(t('hero_h1'))}</h1>
      <span class="dots" aria-hidden="true"><i></i><i></i></span>
      <div class="hb-slides">${slides.map((s, i) => card(ctx, s, i)).join('')}</div>
      ${slides.length > 1 ? `<div class="hb-nav">${slides.map((s, i) => `<button type="button" class="hb-dot${i === 0 ? ' is-on' : ''}" data-go="${i}" aria-label="${esc(s.job.text[lang].title)}"><span></span></button>`).join('')}
        <a class="link-arrow" href="${pageUrl(lang, 'jobs')}">${esc(t('all_jobs'))} ${icon('arrow')}</a></div>` : ''}
    </div>
    <div class="hb-media">${slides.map((s, i) => mosaic(ctx, s, i)).join('')}</div>
  </div>`;
}
