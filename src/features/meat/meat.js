// "Meat industry" page for employers (beef, poultry, pork), built from the company presentation.
// Lives under the employers section: /pl/dla-firm/branza-miesna/ etc. Texts: data/meat/<lang>.json.
import { pageUrl, asset, BASE, LANG_CODES } from '../../core/i18n.js';
import { esc } from '../../core/util.js';
import { icon } from '../../core/icons.js';
import { layout, breadcrumbs, breadcrumbLd, telLink } from '../../core/layout.js';
import { inquirySection } from '../employers/employers.js';

const rich = (s) => esc(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
const two = (n) => String(n).padStart(2, '0');
const img = (name, alt, w, h) => `<img src="${asset(`img/meat/${name}.webp`)}" alt="${esc(alt)}" width="${w}" height="${h}" loading="lazy" decoding="async">`;

export const meatSlugs = (meat) => Object.fromEntries(LANG_CODES.map((l) => [l, meat[l].slug]));
export const meatUrl = (lang, m) => pageUrl(lang, 'employers', m.slug);

/** Numbered list block (poultry, pork) next to a portrait photo. */
function numbered(m, key, photo, items, rev) {
  return `<div class="emp-split meat-row${rev ? ' emp-split-rev' : ''}">
    <div class="meat-photo">${img(photo, m.sectors[key], 600, 750)}</div>
    <div>
      <p class="meat-tag meat-tag-${key}">${esc(m.sectors[key])}</p>
      <h3 class="meat-h">${esc(items.t)}</h3>
      <ol class="meat-list">${items.list.map(([tt, d], i) => `<li><span class="meat-n">${two(i + 1)}</span><div><h4>${esc(tt)}</h4><p>${esc(d)}</p></div></li>`).join('')}</ol>
      ${items.note ? `<p class="emp-note">${esc(items.note)}</p>` : ''}
    </div>
  </div>`;
}

export function renderMeat(ctx) {
  const { lang, t, settings, meat: m, employers: e } = ctx;
  const url = meatUrl(lang, m);
  const crumbs = [
    { name: t('breadcrumb_home'), href: pageUrl(lang, 'home') },
    { name: t('nav_employers'), href: pageUrl(lang, 'employers') },
    { name: m.menu, href: url },
  ];
  const [b1, b2, b3] = m.beef;
  const body = `<section class="page-hero"><div class="wrap page-hero-grid">
  <div>
    ${breadcrumbs(crumbs)}
    <p class="kicker">${esc(m.kicker)}</p>
    <h1>${esc(m.h1)}</h1>
    <p class="lead">${esc(m.lead)}</p>
    <ul class="emp-chips">${['beef', 'poultry', 'pork'].map((k, i) => `<li><a href="#${k}"><span>${two(i + 1)}</span>${esc(m.sectors[k])}</a></li>`).join('')}</ul>
    <div class="hero-cta"><a class="btn btn-pill btn-orange" href="#inquiry">${esc(m.cta_talk)} ${icon('arrow')}</a>${settings.phoneB2B ? `<a class="btn btn-pill btn-outline-blue" href="${telLink(settings.phoneB2B)}">${icon('phone')}<span>${esc(settings.phoneB2B)}</span></a>` : ''}</div>
  </div>
  <div class="page-hero-img"><img src="${asset('img/meat/team.webp')}" alt="${esc(m.h1)}" width="600" height="750" fetchpriority="high" class="meat-hero-img"></div>
</div></section>

<section class="wrap block-sm"><p class="meat-upemi">${icon('shield', 'ic ic-lg')}<span>${rich(m.upemi)}</span></p></section>

<section class="band"><div class="wrap block">
  <p class="emp-kicker">${esc(m.nums_k)}</p>
  <h2 class="center-title">${esc(m.nums_t)}</h2>
  <ul class="meat-nums">${m.nums.map(([v, l], i) => `<li class="${i < 2 ? 'meat-big' : ''}"><strong>${esc(v)}</strong><span>${esc(l)}</span></li>`).join('')}</ul>
</div></section>

<section class="wrap block">
  <ul class="meat-sectors">${['beef', 'poultry', 'pork'].map((k) => `<li><a href="#${k}"><span class="meat-sector-img">${img(k, m.sectors[k], 640, 480)}</span><strong class="meat-tag-${k}">${esc(m.sectors[k])}</strong></a></li>`).join('')}</ul>
</section>

<section class="wrap block meat-sector" id="beef">
  <div class="emp-split meat-row">
    <div class="meat-photo">${img('beef-slaughter', b1.t, 600, 750)}</div>
    <div>
      <p class="meat-tag meat-tag-beef">${esc(m.sectors.beef)}</p>
      <h2 class="meat-h">${esc(b1.t)}</h2>
      ${b1.d.map((p) => `<p>${esc(p)}</p>`).join('')}
    </div>
  </div>
  <div class="emp-split meat-row emp-split-rev">
    <div class="meat-photo">${img('beef-cutting', b2.t, 600, 750)}</div>
    <div>
      <p class="meat-tag meat-tag-beef">${esc(m.sectors.beef)}</p>
      <h3 class="meat-h">${esc(b2.t)}</h3>
      ${b2.d.map((p) => `<p>${esc(p)}</p>`).join('')}
      <ul class="meat-pills">${b2.tags.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>
    </div>
  </div>
  <div class="meat-wide">
    <div class="meat-wide-img">${img('packing', b3.t, 1400, 467)}</div>
    <div class="emp-split">
      <div><p class="meat-tag meat-tag-beef">${esc(m.sectors.beef)}</p><h3 class="meat-h">${esc(b3.t)}</h3><p class="meat-sub">${esc(b3.sub)}</p></div>
      <div>${b3.d.map((p) => `<p>${esc(p)}</p>`).join('')}</div>
    </div>
    <ul class="meat-steps">${b3.tags.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>
  </div>
</section>

<section class="band meat-sector" id="poultry"><div class="wrap block">
  ${numbered(m, 'poultry', 'poultry-line', { t: m.poultry_t, list: m.poultry })}
</div></section>

<section class="wrap block meat-sector" id="pork">
  ${numbered(m, 'pork', 'pork-line', { t: m.pork_t, list: m.pork, note: m.pork_note }, true)}
  <p class="center"><a class="link-arrow" href="${pageUrl(lang, 'employers')}#models">${esc(m.models_more)} ${icon('arrow')}</a></p>
</section>

<section class="band"><div class="wrap block">
  <p class="emp-kicker">${esc(m.mgmt_k)}</p>
  <h2 class="center-title">${esc(m.mgmt_t)}</h2>
  <ul class="meat-mgmt">${m.mgmt.map((x, i) => `<li>${icon(i ? 'star' : 'shield', 'ic ic-lg')}<p>${rich(x)}</p></li>`).join('')}</ul>
</div></section>

<section class="wrap block">
  <p class="emp-kicker">${esc(e.refs_k)}</p>
  <h2 class="center-title">${esc(e.refs_t)}</h2>
  <ul class="emp-refs">${Object.entries(e.refs).map(([id, [name, d]]) => `<li>
    <div class="emp-ref-doc"><img src="${asset(`img/employers/ref-${id}.webp`)}" alt="${esc(`${e.ref_alt}: ${name}`)}" width="360" height="489" loading="lazy" decoding="async"></div>
    <h3>${esc(name)}</h3><p>${esc(d)}</p></li>`).join('')}</ul>
</section>

${inquirySection(ctx, m.cta_t, m.cta_d)}`;
  const serviceLd = {
    '@context': 'https://schema.org', '@type': 'Service', name: m.menu, serviceType: m.kicker, description: m.desc,
    provider: { '@id': `${settings.siteUrl}${BASE}/#org` }, areaServed: 'PL', url: settings.siteUrl + url,
  };
  return layout(ctx, {
    page: 'employers', title: m.title, description: m.desc, body, sub: ctx.meatSlugs,
    jsonld: [breadcrumbLd(settings, crumbs), serviceLd],
  });
}
