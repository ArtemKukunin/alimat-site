// Google reviews block (Kraków office): data/reviews.json, edited in the CMS.
// Each review is a screenshot from Google Maps (verifiable via the author's Google link),
// with our translation underneath when the page language differs from the original.
import { existsSync } from 'node:fs';
import { LANG_CODES, LANGS, asset, pageUrl } from '../../core/i18n.js';
import { esc } from '../../core/util.js';
import { icon } from '../../core/icons.js';
import { layout, breadcrumbs, breadcrumbLd } from '../../core/layout.js';

export function loadReviews(raw) {
  if (!(raw.rating > 0 && raw.rating <= 5) || !(raw.count > 0) || !/^https:\/\//.test(raw.url)) {
    throw new Error('reviews.json: rating (0–5], count > 0 and https url are required');
  }
  raw.reviews.forEach((r, i) => {
    const where = `reviews.json: review #${i + 1}`;
    if (!r.name || !r.text) throw new Error(`${where}: name and text are required`);
    if (!/^https:\/\//.test(r.link)) throw new Error(`${where}: link must be an https URL`);
    if (!existsSync(new URL(`../../../public/assets/${r.image}`, import.meta.url))) throw new Error(`${where}: image ${r.image} not found`);
    if (!(r.width > 0 && r.height > 0)) throw new Error(`${where}: width and height are required`);
    if (!Number.isInteger(r.stars) || r.stars < 1 || r.stars > 5) throw new Error(`${where}: stars must be 1–5`);
    if (!LANG_CODES.includes(r.lang)) throw new Error(`${where}: unknown lang "${r.lang}"`);
    const missing = LANG_CODES.filter((l) => l !== r.lang && !r.tr?.[l]);
    if (missing.length) throw new Error(`${where}: missing translations ${missing.join(', ')}`);
  });
  return raw;
}

const stars = (n, label) => `<span class="stars" role="img" aria-label="${esc(label)}">${
  Array.from({ length: 5 }, (_, i) => icon('star', `ic star${i < n ? '' : ' off'}`)).join('')}</span>`;

/** Optional 360 px copy next to the screenshot (reviews/name-360.webp) for phones. */
const small = (img) => {
  const f = img.replace(/\.webp$/, '-360.webp');
  return f !== img && existsSync(new URL(`../../../public/assets/${f}`, import.meta.url)) ? f : '';
};

function reviewCard(ctx, r) {
  const { lang, t } = ctx;
  const translated = r.lang !== lang;
  return `<li class="review">
    <a class="review-shot" href="${esc(r.link)}" target="_blank" rel="noopener">
      <img src="${asset(r.image)}"${small(r.image) ? ` srcset="${asset(small(r.image))} 360w, ${asset(r.image)} ${r.width}w" sizes="(min-width: 1100px) 360px, (min-width: 768px) 45vw, 92vw"` : ''} alt="${esc(t('rev_alt', { name: r.name, text: r.text }))}" lang="${r.lang}" width="${r.width}" height="${r.height}" loading="lazy" decoding="async">
    </a>
    ${translated ? `<p class="review-tr"><span>${esc(t('rev_tr'))}:</span> ${esc(r.tr[lang])}</p>` : ''}
    <a class="link-arrow review-check" href="${esc(r.link)}" target="_blank" rel="noopener">${esc(t('rev_check'))} ${icon('arrow')}</a>
  </li>`;
}

/** title: false on the reviews page itself (its h1 already names the section). */
export function reviewsBlock(ctx, { title = true } = {}) {
  const { lang, t, reviews } = ctx;
  if (!reviews?.reviews.length) return '';
  const rating = new Intl.NumberFormat(LANGS[lang].locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(reviews.rating);
  return `<section class="band reviews"${title ? ' aria-labelledby="rev-t"' : ''}><div class="wrap block">
  ${title ? `<h2 class="center-title" id="rev-t">${esc(t('rev_t'))}</h2>` : ''}
  <div class="review-sum">
    <strong class="review-score">${rating}</strong>
    ${stars(Math.round(reviews.rating), t('rev_stars', { n: rating }))}
    <span>${esc(t('rev_count', { n: reviews.count }))}</span>
  </div>
  <p class="center lead-c">${esc(t('rev_d'))}</p>
  <ul class="review-grid">${reviews.reviews.map((r) => reviewCard(ctx, r)).join('')}</ul>
  <p class="center"><a class="btn btn-pill btn-outline-orange" href="${esc(reviews.url)}" rel="noopener" target="_blank">${esc(t('rev_all'))} ${icon('arrow')}</a></p>
</div></section>`;
}

/** Dedicated page (menu "Opinie"). */
export function renderReviews(ctx) {
  const { lang, t, settings } = ctx;
  const crumbs = [{ name: t('breadcrumb_home'), href: pageUrl(lang, 'home') }, { name: t('nav_reviews'), href: pageUrl(lang, 'reviews') }];
  const body = `<section class="page-hero"><div class="wrap">
  ${breadcrumbs(crumbs)}
  <h1>${esc(t('rev_t'))}</h1>
  <span class="dots" aria-hidden="true"><i></i><i></i></span>
  <p class="lead">${esc(t('rev_lead'))}</p>
  <div class="hero-cta"><a class="btn btn-pill btn-blue" href="${pageUrl(lang, 'jobs')}">${esc(t('all_jobs'))} ${icon('arrow')}</a><a class="btn btn-pill btn-outline-orange" href="${pageUrl(lang, 'apply')}">${esc(t('cta_apply_long'))}</a></div>
</div></section>
${reviewsBlock(ctx, { title: false })}`;
  return layout(ctx, {
    page: 'reviews', title: t('rev_title'), description: t('rev_desc'), body,
    jsonld: [breadcrumbLd(settings, crumbs)],
  });
}
