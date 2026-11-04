// "About us": company story and values (old site's /o-nas/) combined with the current presentation data
// (numbers and group brands are shared with the employers page). Texts: data/about/<lang>.json.
import { pageUrl, asset } from '../../core/i18n.js';
import { esc } from '../../core/util.js';
import { icon } from '../../core/icons.js';
import { layout, breadcrumbs, breadcrumbLd, telLink } from '../../core/layout.js';
import { numbers, group } from '../employers/employers.js';

const rich = (s) => esc(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
const head = (kicker, title) => `<p class="emp-kicker">${esc(kicker)}</p>\n  <h2 class="center-title">${esc(title)}</h2>`;
const VALUE_ICONS = ['check', 'user', 'shield', 'star'];

export function renderAbout(ctx) {
  const { lang, t, settings, about: a, employers: e } = ctx;
  const crumbs = [{ name: t('breadcrumb_home'), href: pageUrl(lang, 'home') }, { name: t('nav_about'), href: pageUrl(lang, 'about') }];
  const body = `<section class="page-hero"><div class="wrap page-hero-grid">
  <div>
    ${breadcrumbs(crumbs)}
    <p class="kicker">${esc(a.kicker)}</p>
    <h1>${esc(a.h1)}</h1>
    <span class="dots" aria-hidden="true"><i></i><i></i></span>
    <p class="lead">${esc(a.lead)}</p>
    <div class="hero-cta"><a class="btn btn-pill btn-orange" href="${pageUrl(lang, 'jobs')}">${esc(t('all_jobs'))} ${icon('arrow')}</a><a class="btn btn-pill btn-outline-blue" href="${pageUrl(lang, 'employers')}">${esc(t('nav_employers'))}</a></div>
  </div>
  <div class="page-hero-img"><img src="${asset('img/about/hero.webp')}" alt="${esc(a.h1)}" width="864" height="576" fetchpriority="high"></div>
</div></section>

<section class="wrap block emp-split ab-intro">
  <div>
    <h2>${esc(a.intro_t)}</h2>
    ${a.intro_p.map((p) => `<p>${rich(p)}</p>`).join('')}
  </div>
  <figure class="ab-quote">
    <blockquote>„${esc(a.quote)}”</blockquote>
    <figcaption><strong>${esc(a.quote_by)}</strong><span>${esc(a.quote_role)}</span></figcaption>
  </figure>
</section>

${numbers(ctx, e)}

<section class="wrap block">
  ${head(a.story_k, a.story_t)}
  <ol class="ab-story">${a.story.map(([tt, d], i) => `<li><span class="ab-story-n" aria-hidden="true">${String(i + 1).padStart(2, '0')}</span><h3>${esc(tt)}</h3><p>${esc(d)}</p></li>`).join('')}</ol>
</section>

<section class="band"><div class="wrap block">
  ${head(a.values_k, a.values_t)}
  <ul class="ab-values">${a.values.map(([tt, d], i) => `<li>${icon(VALUE_ICONS[i], 'ic ic-lg')}<h3>${esc(tt)}</h3><p>${esc(d)}</p></li>`).join('')}</ul>
</div></section>

${group(e)}
<p class="wrap center ab-note">${esc(a.group_note)}</p>

<section class="wrap block emp-split ab-career">
  <div class="ab-career-img"><img src="${asset('img/about/career.webp')}" alt="${esc(a.career_t)}" width="800" height="533" loading="lazy" decoding="async"></div>
  <div>
    <p class="emp-kicker">${esc(a.career_k)}</p>
    <h2>${esc(a.career_t)}</h2>
    <p>${esc(a.career_p)}</p>
    <div class="hero-cta"><a class="btn btn-pill btn-orange" href="${pageUrl(lang, 'apply')}">${esc(a.career_cta)} ${icon('arrow')}</a><a class="btn btn-pill btn-outline-blue" href="${pageUrl(lang, 'contact')}">${esc(t('nav_contact'))}</a></div>
  </div>
</section>

<section class="wrap block-sm">
  <h2 class="center-title">${esc(a.join_t)}</h2>
  <div class="ab-join">
    <a class="ab-join-card ab-join-cand" href="${pageUrl(lang, 'jobs')}">${icon('user', 'ic ic-lg')}<strong>${esc(a.cand_t)}</strong><span>${esc(a.cand_d)}</span><em>${esc(t('all_jobs'))} ${icon('arrow')}</em></a>
    <a class="ab-join-card ab-join-firm" href="${pageUrl(lang, 'employers')}">${icon('shield', 'ic ic-lg')}<strong>${esc(a.firm_t)}</strong><span>${esc(a.firm_d)}</span><em>${esc(t('nav_employers'))} ${icon('arrow')}</em></a>
  </div>
  ${settings.phoneB2B ? `<p class="center ab-b2b">${esc(t('b2b_t'))}: <a href="${telLink(settings.phoneB2B)}">${esc(settings.phoneB2B)}</a></p>` : ''}
</section>`;
  return layout(ctx, {
    page: 'about', title: a.title, description: a.desc, body,
    jsonld: [breadcrumbLd(settings, crumbs)],
  });
}
