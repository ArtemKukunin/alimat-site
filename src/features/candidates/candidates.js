import { pageUrl } from '../../core/i18n.js';
import { esc } from '../../core/util.js';
import { layout, breadcrumbs, breadcrumbLd, contactButtons } from '../../core/layout.js';
import { perksGrid, steps } from '../home/home.js';

export const FAQ_COUNT = 8;

export function renderCandidates(ctx) {
  const { lang, t } = ctx;
  const crumbs = [{ name: t('breadcrumb_home'), href: pageUrl(lang, 'home') }, { name: t('cand_h1'), href: pageUrl(lang, 'candidates') }];
  const faq = Array.from({ length: FAQ_COUNT }, (_, i) => ({ q: t(`faq_q${i + 1}`), a: t(`faq_a${i + 1}`) }));
  const faqLd = {
    '@context': 'https://schema.org', '@type': 'FAQPage',
    mainEntity: faq.map(({ q, a }) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })),
  };
  const body = `<section class="page-hero"><div class="wrap">
  ${breadcrumbs(crumbs)}
  <h1>${esc(t('cand_h1'))}</h1>
  <p class="lead">${esc(t('cand_lead'))}</p>
  <div class="hero-cta">
    <a class="btn btn-primary btn-lg" href="${pageUrl(lang, 'jobs')}">${esc(t('all_jobs'))}</a>
    <a class="btn btn-outline btn-lg" href="${pageUrl(lang, 'apply')}">${esc(t('cta_apply_long'))}</a>
  </div>
</div></section>
<section class="wrap block"><h2>${esc(t('perks_title'))}</h2>${perksGrid(t)}</section>
<section class="band"><div class="wrap block"><h2>${esc(t('steps_title'))}</h2>${steps(t)}</div></section>
<section class="wrap block faq" id="faq">
  <h2>${esc(t('faq_title'))}</h2>
  ${faq.map(({ q, a }) => `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('')}
</section>
<section class="wrap block"><div class="help-box wide"><h2>${esc(t('help_t'))}</h2><p>${esc(t('help_d'))}</p>${contactButtons(ctx)}</div></section>`;
  return layout(ctx, {
    page: 'candidates', title: t('cand_title'), description: t('cand_desc'), body,
    jsonld: [breadcrumbLd(ctx.settings, crumbs), faqLd],
  });
}
