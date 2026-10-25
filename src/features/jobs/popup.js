// Lead popup: after a minute on a job page, or after browsing the job list, offer a short application form.
import { esc } from '../../core/util.js';
import { icon } from '../../core/icons.js';
import { waLink } from '../../core/layout.js';
import { formShell, input } from '../../core/form.js';

/** job: the job being read (detail page) or null (lists). Rendered as a native <dialog>; app.js decides when to open it. */
/** auto: open by itself after a delay (job pages, job lists); false = only via [data-apply] buttons. */
export function leadPopup(ctx, job = null, { auto = true } = {}) {
  const { lang, t, settings } = ctx;
  const title = job ? job.text[lang].title : '';
  const messengers = ['WhatsApp', 'Viber', 'Telegram', t('f_phone_call')]
    .map((m, i) => `<label class="pill"><input type="radio" name="messenger" value="${esc(m)}"${i === 0 ? ' checked' : ''}><span>${esc(m)}</span></label>`).join('');
  const fields = `<input type="hidden" name="job" value="${esc(title)}">
  ${input(t, { name: 'name', label: t('f_name'), required: true, autocomplete: 'name' })}
  ${input(t, { name: 'phone', label: t('f_phone'), type: 'tel', required: true, autocomplete: 'tel', attrs: 'inputmode="tel" placeholder="+48 …" pattern="[+0-9 \\(\\)\\-]{7,20}"' })}
  <fieldset class="field"><legend>${esc(t('f_messenger'))}</legend><div class="pills">${messengers}</div></fieldset>`;
  const waText = job ? t('wa_msg', { title, city: job.city === '*' ? t('loc_various') : job.city }) : undefined;
  return `<dialog class="lead-pop" id="lead-pop" aria-labelledby="lead-pop-t" data-mode="${job ? 'job' : 'list'}" data-delay="60" data-auto="${auto ? 1 : 0}" data-t-job="${esc(t('pop_t'))}" data-d-job="${esc(t('pop_d'))}">
  <button class="lead-pop-x" type="button" data-close aria-label="${esc(t('pop_close'))}">×</button>
  <h2 id="lead-pop-t">${esc(t(job ? 'pop_t' : 'pop_t_list'))}</h2>
  <p class="lead-pop-d">${esc(t(job ? 'pop_d' : 'pop_d_list'))}${job ? ` <strong>${esc(title)}</strong>` : ''}</p>
  ${formShell(ctx, { type: 'candidate', fieldsHtml: fields, submitLabel: t('f_submit') })}
  <p class="lead-pop-or">${esc(t('pop_or'))}</p>
  <a class="btn btn-pill btn-wa btn-block lead-pop-wa" href="${waLink(settings, waText)}" rel="noopener" target="_blank">${icon('chat')}<span>${esc(t('cta_whatsapp'))}</span></a>
</dialog>`;
}
