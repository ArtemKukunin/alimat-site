// "For employers" page, built from the company presentation (Source-to-Operations™):
// about, numbers, group structure, three cooperation models, 3-step process, industries,
// references, then the quote request form. Texts: data/employers/<lang>.json.
import { pageUrl, asset } from '../../core/i18n.js';
import { esc } from '../../core/util.js';
import { icon } from '../../core/icons.js';
import { layout, breadcrumbs, breadcrumbLd } from '../../core/layout.js';
import { formShell, input, textarea } from '../../core/form.js';

/** esc() + **bold** (the only markup used in the texts). */
const rich = (s) => esc(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
const img = (name, alt, w, h, extra = 'loading="lazy" decoding="async"') => `<img src="${asset(`img/employers/${name}.webp`)}" alt="${esc(alt)}" width="${w}" height="${h}" ${extra}>`;
const head = (kicker, title, lead, id) => `<p class="emp-kicker">${esc(kicker)}</p>
  <h2 class="center-title"${id ? ` id="${id}"` : ''}>${esc(title)}</h2>${lead ? `\n  <p class="center lead-c">${esc(lead)}</p>` : ''}`;
const two = (n) => String(n).padStart(2, '0');

/** Quote request form, shared with the service pages. */
export function inquirySection(ctx, title, lead) {
  const { t } = ctx;
  const fields = `<div class="grid-2">
    ${input(t, { name: 'company', label: t('f_company'), required: true, autocomplete: 'organization' })}
    ${input(t, { name: 'name', label: t('f_name'), required: true, autocomplete: 'name' })}
    ${input(t, { name: 'email', label: t('f_email'), type: 'email', required: true, autocomplete: 'email' })}
    ${input(t, { name: 'phone', label: t('f_phone'), type: 'tel', required: true, autocomplete: 'tel', attrs: 'inputmode="tel" pattern="[+0-9 \\(\\)\\-]{7,20}"' })}
  </div>
  ${textarea(t, { name: 'message', label: t('f_need'), required: true })}`;
  return `<section class="band" id="inquiry"><div class="wrap block form-narrow">
  <h2>${esc(title || t('emp_form_t'))}</h2>
  ${title ? `<p>${esc(lead || t('contact_lead'))}</p>` : ''}
  ${formShell(ctx, { type: 'employer', fieldsHtml: fields, submitLabel: t('emp_submit') })}
</div></section>`;
}

/** Group companies: name, English tagline (part of the brand), icon. Descriptions are translated. */
const BRANDS = [
  ['Alimat Work', 'Global Recruitment', 'globe'],
  ['Alimat Partners', 'Outsourcing Solutions', 'shield'],
  ['Mente Business', 'Live in Poland legally', 'doc'],
  ['HostelHub', 'Living Solutions', 'home'],
  ['Alimat Professional', 'Innovative HR Solutions', 'user'],
];
const MODEL_SVC = ['temporary', 'outsourcing', 'permanent'];
const PARTNERS = [
  ['animex', 'Animex Foods'], ['konskowola', 'Końskowola Meat'], ['slaska', 'Śląska Prohibicja'], ['bibars', 'BiBars Groupe'],
  ['karol', 'Zakład Mięsny Karol'], ['reydrob', 'Reydrob'], ['zakrzewscy', 'Zakłady Mięsne Zakrzewscy'], ['bida', 'Karczma Bida'], ['r', 'Restauracja R'],
];
// Logo files are 110 px high; widths for the width/height attributes (no layout shift).
const LOGO_W = { animex: 170, konskowola: 170, slaska: 135, bibars: 205, karol: 160, reydrob: 245, zakrzewscy: 95, bida: 155, r: 100 };
const IND_SIZE = { logistics: [378, 283], construction: [442, 331] };

function hero(ctx, e, crumbs) {
  const models = e.models.map((m, i) => `<li><a href="#model-${i + 1}"><span>${two(i + 1)}</span>${esc(m.t)}</a></li>`).join('');
  return `<section class="page-hero emp-hero"><div class="wrap page-hero-grid">
  <div>
    ${breadcrumbs(crumbs)}
    <p class="kicker">${esc(e.kicker)}</p>
    <h1>${esc(e.h1)}</h1>
    <p class="lead">${esc(e.lead)}</p>
    <ul class="emp-chips">${models}</ul>
    <div class="hero-cta"><a class="btn btn-pill btn-orange" href="#inquiry">${esc(e.cta_talk)} ${icon('arrow')}</a><a class="btn btn-pill btn-outline-blue" href="#models">${esc(e.cta_models)}</a></div>
  </div>
  <div class="page-hero-img"><img src="${asset('img/employers/hero-800.webp')}" srcset="${asset('img/employers/hero-800.webp')} 800w, ${asset('img/employers/hero.webp')} 1200w" sizes="(min-width: 1024px) 520px, 100vw" alt="${esc(e.h1)}" width="800" height="533" fetchpriority="high"></div>
</div></section>`;
}

function about(e) {
  return `<section class="wrap block emp-split emp-about">
  <div>
    <p class="emp-kicker">${esc(e.about_k)}</p>
    <h2>${esc(e.about_t)}</h2>
    <span class="dots" aria-hidden="true"><i></i><i></i></span>
    <p>${rich(e.about_p1)}</p>
    <blockquote class="emp-quote">${esc(e.about_quote)}</blockquote>
    <p>${rich(e.about_p2)}</p>
    <p>${rich(e.about_p3)}</p>
  </div>
  <div class="emp-about-img">${img('about', e.about_t, 600, 750)}</div>
</section>`;
}

function numbers(ctx, e) {
  const { t, settings } = ctx;
  return `<section class="band"><div class="wrap block">
  ${head(e.nums_k, e.nums_t)}
  <div class="emp-nums-grid">
    <div class="emp-years"><strong>15</strong><span>${esc(e.years)}</span><p>${esc(e.years_d)}</p></div>
    <ul class="emp-nums">${settings.stats.map((v, i) => `<li><strong>${esc(v)}</strong><span>${esc(t(`stat${i + 1}`))}</span></li>`).join('')}</ul>
  </div>
</div></section>`;
}

function group(e) {
  return `<section class="wrap block">
  ${head(e.group_k, e.group_t, e.group_lead)}
  <ul class="emp-brands">
    <li class="emp-brand emp-brand-main"><img src="${asset('img/logo.webp')}" alt="Alimat Group" width="200" height="48" loading="lazy" decoding="async"><strong>Source-to-Operations™</strong><p>${esc(e.group_center)}</p></li>
    ${BRANDS.map(([name, tag, ic], i) => `<li class="emp-brand">${icon(ic, 'ic ic-lg')}<h3>${esc(name)}</h3><span class="emp-tag">${esc(tag)}</span><p>${esc(e.brands[i])}</p></li>`).join('')}
  </ul>
</section>`;
}

function model(ctx, e, m, i) {
  const { lang, services } = ctx;
  const svc = services.find((s) => s.id === MODEL_SVC[i]);
  const list = `${m.list_t ? `<h4>${esc(m.list_t)}</h4>` : ''}<ul class="ticks">${m.list.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>`;
  const split = m.split_t ? `<div class="emp-resp"><h4>${esc(m.split_t)}</h4>
      <div class="emp-resp-grid"><div class="emp-resp-client"><strong>${esc(m.client_t)}</strong><p>${esc(m.client_d)}</p></div>
      <div class="emp-resp-us"><strong>Alimat Group</strong><p>${esc(m.us_d)}</p></div></div></div>` : '';
  return `<article class="emp-model emp-split${i % 2 ? ' emp-split-rev' : ''}" id="model-${i + 1}">
    <div class="emp-model-img">${img(`model-${MODEL_SVC[i]}`, m.t, i === 1 ? 640 : 800, i === 1 ? 427 : 533)}<span class="emp-model-n" aria-hidden="true">${two(i + 1)}</span></div>
    <div class="emp-model-text">
      <p class="emp-kicker">${esc(e.models_k)} · ${two(i + 1)}</p>
      <h3>${esc(m.t)}</h3>
      <p class="emp-sub">${esc(m.sub)}</p>
      ${m.p.map((p) => `<p>${esc(p)}</p>`).join('')}
      ${list}
      ${split}
      <p class="emp-note">${esc(m.note)}</p>
      ${svc ? `<a class="link-arrow" href="${pageUrl(lang, 'employers', svc[lang].slug)}">${esc(e.model_more)} ${icon('arrow')}</a>` : ''}
    </div>
  </article>`;
}

function models(ctx, e) {
  const { lang, services } = ctx;
  const consulting = services.find((s) => s.id === 'consulting');
  return `<section class="wrap block" aria-labelledby="models">
  ${head(e.models_k, e.models_t, e.models_lead, 'models')}
  <ol class="emp-models">${e.models.map((m, i) => `<li><a href="#model-${i + 1}"><span class="emp-n">${two(i + 1)}</span><strong>${esc(m.t)}</strong><span>${esc(m.short)}</span></a></li>`).join('')}</ol>
  <div class="emp-model-list">${e.models.map((m, i) => model(ctx, e, m, i)).join('')}</div>
  ${consulting ? `<p class="center emp-consult"><a class="link-arrow" href="${pageUrl(lang, 'employers', consulting[lang].slug)}">${esc(e.consulting)} ${icon('arrow')}</a></p>` : ''}
</section>`;
}

function flow(e) {
  return `<section class="band"><div class="wrap block">
  ${head(e.flow_k, e.flow_t, e.flow_lead)}
  <ol class="emp-flow">${e.flow.map((s, i) => `<li>
    <span class="emp-step">${esc(e.step)} ${i + 1}</span>
    <span class="emp-flow-n" aria-hidden="true">${two(i + 1)}</span>
    <h3>${esc(s.t)}</h3>
    <p>${esc(s.d)}</p>
    <ol class="emp-sub-steps">${s.items.map(([tt, d]) => `<li><strong>${esc(tt)}</strong><span>${esc(d)}</span></li>`).join('')}</ol>
    ${s.foot ? `<p class="small">${esc(s.foot)}</p>` : ''}
  </li>`).join('')}</ol>
</div></section>`;
}

function industries(e) {
  return `<section class="wrap block">
  ${head(e.ind_k, e.ind_t, e.ind_lead)}
  <ul class="emp-inds">${Object.entries(e.inds).map(([id, [name, roles]]) => {
    const [w, h] = IND_SIZE[id] || [600, 450];
    return `<li class="emp-ind"><div class="emp-ind-img">${img(`ind-${id}`, name, w, h)}</div><div class="emp-ind-body"><h3>${esc(name)}</h3><ul class="emp-roles">${roles.map((r) => `<li>${esc(r)}</li>`).join('')}</ul></div></li>`;
  }).join('')}</ul>
</section>`;
}

function references(e) {
  return `<section class="band"><div class="wrap block">
  ${head(e.refs_k, e.refs_t)}
  <ul class="emp-refs">${Object.entries(e.refs).map(([id, [name, d]]) => `<li>
    <div class="emp-ref-doc">${img(`ref-${id}`, `${e.ref_alt}: ${name}`, 360, 489)}</div>
    <h3>${esc(name)}</h3><p>${esc(d)}</p></li>`).join('')}</ul>
  <h3 class="center emp-partners-t">${esc(e.partners_t)}</h3>
  <ul class="emp-logos">${PARTNERS.map(([id, name]) => `<li><img src="${asset(`img/employers/logos/${id}.webp`)}" alt="${esc(name)}" width="${LOGO_W[id]}" height="110" loading="lazy" decoding="async"></li>`).join('')}</ul>
</div></section>`;
}

export function renderEmployers(ctx) {
  const { lang, t, employers: e } = ctx;
  const crumbs = [{ name: t('breadcrumb_home'), href: pageUrl(lang, 'home') }, { name: t('nav_employers'), href: pageUrl(lang, 'employers') }];
  const body = `${hero(ctx, e, crumbs)}
${about(e)}
${numbers(ctx, e)}
${group(e)}
${models(ctx, e)}
${flow(e)}
${industries(e)}
${references(e)}
${inquirySection(ctx, e.cta_t, e.cta_d)}`;
  return layout(ctx, {
    page: 'employers', title: e.title, description: e.desc, body,
    jsonld: [breadcrumbLd(ctx.settings, crumbs)],
  });
}
