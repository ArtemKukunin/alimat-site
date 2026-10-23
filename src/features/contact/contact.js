import { pageUrl } from '../../core/i18n.js';
import { esc } from '../../core/util.js';
import { icon } from '../../core/icons.js';
import { layout, breadcrumbs, breadcrumbLd, contactButtons, telLink, officeList } from '../../core/layout.js';
import { formShell, input, textarea } from '../../core/form.js';

export function renderContact(ctx) {
  const { lang, t, settings } = ctx;
  const crumbs = [{ name: t('breadcrumb_home'), href: pageUrl(lang, 'home') }, { name: t('contact_h1'), href: pageUrl(lang, 'contact') }];
  const fields = `
  ${input(t, { name: 'name', label: t('f_name'), required: true, autocomplete: 'name' })}
  ${input(t, { name: 'phone', label: t('f_phone'), type: 'tel', required: true, autocomplete: 'tel', attrs: 'inputmode="tel" pattern="[+0-9 \\(\\)\\-]{7,20}"' })}
  ${input(t, { name: 'email', label: t('f_email'), type: 'email', autocomplete: 'email' })}
  ${textarea(t, { name: 'message', label: t('f_message'), required: true })}`;
  const body = `<section class="page-hero"><div class="wrap">
  ${breadcrumbs(crumbs)}
  <h1>${esc(t('contact_h1'))}</h1>
  <p class="lead">${esc(t('contact_lead'))}</p>
</div></section>
<div class="wrap contact-grid">
  <div class="contact-cards">
    <section class="c-card">
      <h2>${icon('phone')}${esc(t('cta_call'))}</h2>
      <p><a class="big-link" href="${telLink(settings.phone)}">${esc(settings.phone)}</a></p>
      <p class="small">WhatsApp · Viber</p>
      ${contactButtons(ctx)}
    </section>
    <section class="c-card">
      <h2>${icon('mail')}E-mail</h2>
      <p><a href="mailto:${esc(settings.email)}">${esc(settings.email)}</a></p>
    </section>
    <section class="c-card">
      <h2>${icon('pin')}${esc(t('c_address'))}</h2>
      ${officeList(ctx, 'offices offices-stack')}
    </section>
  </div>
  ${formShell(ctx, { type: 'contact', fieldsHtml: fields, submitLabel: t('f_send') })}
</div>`;
  return layout(ctx, {
    page: 'contact', title: t('contact_title'), description: t('contact_desc'), body,
    jsonld: [breadcrumbLd(settings, crumbs)],
  });
}
