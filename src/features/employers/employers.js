import { pageUrl } from '../../core/i18n.js';
import { esc } from '../../core/util.js';
import { icon } from '../../core/icons.js';
import { layout, breadcrumbs, breadcrumbLd } from '../../core/layout.js';
import { formShell, input, textarea } from '../../core/form.js';

const SERVICES = [['svc1', 'user'], ['svc2', 'shield'], ['svc3', 'doc'], ['svc4', 'chat']];

export function renderEmployers(ctx) {
  const { lang, t } = ctx;
  const crumbs = [{ name: t('breadcrumb_home'), href: pageUrl(lang, 'home') }, { name: t('emp_h1'), href: pageUrl(lang, 'employers') }];
  const fields = `<div class="grid-2">
    ${input(t, { name: 'company', label: t('f_company'), required: true, autocomplete: 'organization' })}
    ${input(t, { name: 'name', label: t('f_name'), required: true, autocomplete: 'name' })}
    ${input(t, { name: 'email', label: t('f_email'), type: 'email', required: true, autocomplete: 'email' })}
    ${input(t, { name: 'phone', label: t('f_phone'), type: 'tel', required: true, autocomplete: 'tel', attrs: 'inputmode="tel" pattern="[+0-9 ()-]{7,20}"' })}
  </div>
  ${textarea(t, { name: 'message', label: t('f_need'), required: true })}`;
  const body = `<section class="page-hero"><div class="wrap">
  ${breadcrumbs(crumbs)}
  <h1>${esc(t('emp_h1'))}</h1>
  <p class="lead">${esc(t('emp_lead'))}</p>
  <div class="hero-cta"><a class="btn btn-primary btn-lg" href="#inquiry">${esc(t('emp_form_t'))}</a></div>
</div></section>
<section class="wrap block">
  <ul class="perks services">${SERVICES.map(([k, ic]) => `<li>${icon(ic, 'ic ic-lg')}<h2>${esc(t(`${k}_t`))}</h2><p>${esc(t(`${k}_d`))}</p></li>`).join('')}</ul>
</section>
<section class="band" id="inquiry"><div class="wrap block form-narrow">
  <h2>${esc(t('emp_form_t'))}</h2>
  ${formShell(ctx, { type: 'employer', fieldsHtml: fields, submitLabel: t('emp_submit') })}
</div></section>`;
  return layout(ctx, {
    page: 'employers', title: t('emp_title'), description: t('emp_desc'), body,
    jsonld: [breadcrumbLd(ctx.settings, crumbs)],
  });
}
