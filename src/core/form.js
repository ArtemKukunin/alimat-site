import { esc, digits, sitePath } from './util.js';
import { BASE } from './i18n.js';

/**
 * Form shell shared by apply / employers / contact.
 * Without a configured endpoint, app.js falls back to sending the data via WhatsApp.
 */
export function formShell(ctx, { type, fieldsHtml, submitLabel }) {
  const { lang, t, settings } = ctx;
  const consent = esc(t('f_consent')).replace('{privacy}', `<a href="${esc(sitePath(settings.privacyUrl, BASE))}" target="_blank" rel="noopener">${esc(t('f_privacy_link'))}</a>`);
  return `<form class="form" data-form="${type}" action="${esc(settings.formEndpoint)}" method="post" enctype="multipart/form-data" novalidate
  data-wa="${digits(settings.phone)}" data-msg-ok="${esc(t('f_ok'))}" data-msg-err="${esc(t('f_err'))}" data-msg-invalid="${esc(t('f_invalid'))}" data-msg-file="${esc(t('f_file_big'))}" data-msg-sending="${esc(t('f_sending'))}" data-msg-wa="${esc(t('f_wa_fallback'))}" data-msg-wa-cv="${esc(t('f_wa_cv'))}" data-cv-line="${esc(t('f_cv_wa'))}">
  <input type="hidden" name="form_type" value="${type}">
  <input type="hidden" name="lang" value="${lang}">
  <input type="hidden" name="page" value="">
  <div class="hp" aria-hidden="true"><label>Website <input type="text" name="website" tabindex="-1" autocomplete="off"></label></div>
  ${fieldsHtml}
  <label class="check"><input type="checkbox" name="consent" value="yes" required><span>${consent}</span></label>
  <button class="btn btn-primary btn-lg btn-block" type="submit">${esc(submitLabel)}</button>
  <p class="form-status" role="status" aria-live="polite"></p>
</form>`;
}

export function input(t, { name, label, type = 'text', required = false, autocomplete = '', attrs = '' }) {
  return `<label class="field"><span>${esc(label)}${required ? ' <i aria-hidden="true">*</i>' : ` <small>${esc(t('f_optional'))}</small>`}</span>
  <input type="${type}" name="${name}"${required ? ' required' : ''}${autocomplete ? ` autocomplete="${autocomplete}"` : ''} ${attrs}></label>`;
}

export function textarea(t, { name, label, required = false }) {
  return `<label class="field"><span>${esc(label)}${required ? ' <i aria-hidden="true">*</i>' : ` <small>${esc(t('f_optional'))}</small>`}</span>
  <textarea name="${name}" rows="4"${required ? ' required' : ''}></textarea></label>`;
}
