import { pageUrl } from '../../core/i18n.js';
import { esc } from '../../core/util.js';
import { layout, breadcrumbs, breadcrumbLd, contactButtons } from '../../core/layout.js';
import { formShell, input, textarea } from '../../core/form.js';
import { activeJobs, locationLabel, catText } from '../jobs/jobs.js';
import { CATEGORIES } from '../jobs/model.js';

export function renderApply(ctx) {
  const { lang, t, jobs } = ctx;
  const crumbs = [{ name: t('breadcrumb_home'), href: pageUrl(lang, 'home') }, { name: t('apply_h1'), href: pageUrl(lang, 'apply') }];
  const jobOptions = activeJobs(jobs)
    .map((j) => `<option value="${esc(j.id)}">${esc(j.text[lang].title)} — ${esc(locationLabel(j, t))}</option>`).join('');
  const messengers = ['WhatsApp', 'Viber', 'Telegram', t('f_phone_call')]
    .map((m, i) => `<label class="pill"><input type="radio" name="messenger" value="${esc(m)}"${i === 0 ? ' checked' : ''}><span>${esc(m)}</span></label>`).join('');
  const sectors = CATEGORIES
    .map((c) => `<label class="pill"><input type="checkbox" name="sectors" value="${esc(catText(ctx, c).name)}"><span>${esc(catText(ctx, c).name)}</span></label>`).join('');
  const fields = `
  ${input(t, { name: 'name', label: t('f_name'), required: true, autocomplete: 'name' })}
  ${input(t, { name: 'phone', label: t('f_phone'), type: 'tel', required: true, autocomplete: 'tel', attrs: 'inputmode="tel" placeholder="+48 …" pattern="[+0-9 \\(\\)\\-]{7,20}"' })}
  <fieldset class="field"><legend>${esc(t('f_messenger'))}</legend><div class="pills">${messengers}</div></fieldset>
  <label class="field"><span>${esc(t('f_job'))}</span>
    <select name="job" id="apply-job"><option value="">${esc(t('f_job_any'))}</option>${jobOptions}</select></label>
  <fieldset class="field"><legend>${esc(t('f_sectors'))} <small>${esc(t('f_optional'))}</small></legend><div class="pills">${sectors}</div></fieldset>
  <label class="field" id="cv"><span>${esc(t('f_cv'))} <small>${esc(t('f_optional'))}</small></span>
    <input type="file" name="cv" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" data-max="5242880"><small class="hint">${esc(t('f_cv_hint'))}</small></label>
  <details class="more-fields"><summary>${esc(t('f_more'))}</summary>
    ${input(t, { name: 'country', label: t('f_country'), autocomplete: 'country-name' })}
    ${input(t, { name: 'email', label: t('f_email'), type: 'email', autocomplete: 'email' })}
    ${textarea(t, { name: 'message', label: t('f_message') })}
  </details>`;
  const body = `<section class="page-hero"><div class="wrap">
  ${breadcrumbs(crumbs)}
  <h1>${esc(t('apply_h1'))}</h1>
  <p class="lead">${esc(t('apply_lead'))}</p>
</div></section>
<div class="wrap form-layout">
  ${formShell(ctx, { type: 'candidate', fieldsHtml: fields, submitLabel: t('f_submit') })}
  <aside class="help-box"><h2>${esc(t('f_fast'))}</h2>${contactButtons(ctx)}<p class="small">${esc(t('contact_lead'))}</p></aside>
</div>`;
  return layout(ctx, {
    page: 'apply', title: t('apply_title'), description: t('apply_desc'), body, hideMobileBar: true,
    jsonld: [breadcrumbLd(ctx.settings, crumbs)],
  });
}
