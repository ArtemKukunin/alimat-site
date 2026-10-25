import { pageUrl } from '../../core/i18n.js';
import { esc } from '../../core/util.js';
import { icon } from '../../core/icons.js';
import { layout, breadcrumbs, breadcrumbLd } from '../../core/layout.js';
import { formShell, input, textarea } from '../../core/form.js';


/** Short descriptions on the hub page (ui keys). */
const SVC_TEXT = { temporary: 'svc1_d', permanent: 'svc2_d', outsourcing: 'svc3_d', consulting: 'svc4_d' };

/** Quote request form, shared with the service pages. */
export function inquirySection(ctx, title) {
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
  ${title ? `<p>${esc(t('contact_lead'))}</p>` : ''}
  ${formShell(ctx, { type: 'employer', fieldsHtml: fields, submitLabel: t('emp_submit') })}
</div></section>`;
}

export function renderEmployers(ctx) {
  const { lang, t, services } = ctx;
  const crumbs = [{ name: t('breadcrumb_home'), href: pageUrl(lang, 'home') }, { name: t('emp_h1'), href: pageUrl(lang, 'employers') }];
  const body = `<section class="page-hero"><div class="wrap">
  ${breadcrumbs(crumbs)}
  <h1>${esc(t('emp_h1'))}</h1>
  <p class="lead">${esc(t('emp_lead'))}</p>
  <div class="hero-cta"><a class="btn btn-pill btn-blue" href="#inquiry">${esc(t('emp_form_t'))}</a></div>
</div></section>
<section class="wrap block">
  <ul class="perks services">${services.map((s) => `<li>${icon(s.icon, 'ic ic-lg')}<h2><a href="${pageUrl(lang, 'employers', s[lang].slug)}">${esc(s[lang].name)}</a></h2><p>${esc(t(SVC_TEXT[s.id]))}</p><a class="link-arrow" href="${pageUrl(lang, 'employers', s[lang].slug)}">${esc(t('svc_more'))} ${icon('arrow')}</a></li>`).join('')}</ul>
</section>
<section class="band"><div class="wrap block">
  <h2 class="center-title">${esc(t('emp_why_t'))}</h2>
  <ul class="ticks ticks-2">${Array.from({ length: 13 }, (_, i) => `<li>${esc(t(`emp_why${i + 1}`))}</li>`).join('')}</ul>
</div></section>
<section class="wrap block">
  <h2 class="center-title">${esc(t('emp_how_t'))}</h2>
  <ol class="steps">${[1, 2, 3, 4].map((n) => `<li><span class="step-n">${n}</span><h3>${esc(t(`emp_how${n}_t`))}</h3><p>${esc(t(`emp_how${n}_d`))}</p></li>`).join('')}</ol>
</section>
${inquirySection(ctx)}`;
  return layout(ctx, {
    page: 'employers', title: t('emp_title'), description: t('emp_desc'), body,
    jsonld: [breadcrumbLd(ctx.settings, crumbs)],
  });
}
