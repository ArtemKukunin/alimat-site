// Google reviews block (Kraków office): data/reviews.json, edited in the CMS.
// Reviews are shown in the page language; a translated review keeps its original behind "Show original".
import { LANG_CODES, LANGS } from '../../core/i18n.js';
import { esc } from '../../core/util.js';
import { icon } from '../../core/icons.js';

export function loadReviews(raw) {
  if (!(raw.rating > 0 && raw.rating <= 5) || !(raw.count > 0) || !/^https:\/\//.test(raw.url)) {
    throw new Error('reviews.json: rating (0–5], count > 0 and https url are required');
  }
  raw.reviews.forEach((r, i) => {
    const where = `reviews.json: review #${i + 1}`;
    if (!r.name || !r.text) throw new Error(`${where}: name and text are required`);
    if (!Number.isInteger(r.stars) || r.stars < 1 || r.stars > 5) throw new Error(`${where}: stars must be 1–5`);
    if (!LANG_CODES.includes(r.lang)) throw new Error(`${where}: unknown lang "${r.lang}"`);
    const missing = LANG_CODES.filter((l) => l !== r.lang && !r.tr?.[l]);
    if (missing.length) throw new Error(`${where}: missing translations ${missing.join(', ')}`);
  });
  return raw;
}

const stars = (n, label) => `<span class="stars" role="img" aria-label="${esc(label)}">${
  Array.from({ length: 5 }, (_, i) => icon('star', `ic star${i < n ? '' : ' off'}`)).join('')}</span>`;

const languageName = (lang, code) => new Intl.DisplayNames([LANGS[lang].locale], { type: 'language' }).of(code);

function reviewCard(ctx, r) {
  const { lang, t } = ctx;
  const translated = r.lang !== lang;
  return `<li class="review">
    ${stars(r.stars, t('rev_stars', { n: r.stars }))}
    <blockquote lang="${translated ? lang : r.lang}"><p>${esc(translated ? r.tr[lang] : r.text)}</p></blockquote>
    ${translated ? `<details class="review-orig"><summary>${esc(t('rev_orig', { lang: languageName(lang, r.lang) }))}</summary><p lang="${r.lang}">${esc(r.text)}</p></details>` : ''}
    <p class="review-by"><strong>${esc(r.name)}</strong><span>Google${translated ? ` · ${esc(t('rev_tr'))}` : ''}</span></p>
  </li>`;
}

export function reviewsBlock(ctx) {
  const { lang, t, reviews } = ctx;
  if (!reviews?.reviews.length) return '';
  const rating = new Intl.NumberFormat(LANGS[lang].locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(reviews.rating);
  return `<section class="band reviews" aria-labelledby="rev-t"><div class="wrap block">
  <h2 class="center-title" id="rev-t">${esc(t('rev_t'))}</h2>
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
