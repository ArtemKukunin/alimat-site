import fs from 'node:fs';
import path from 'node:path';
import { LANGS } from './i18n.js';

const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
/** Escape text for HTML text and attribute contexts. */
export const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ESC[c]);

/** Fill {placeholders}. Values are NOT escaped — escape the result. */
export const fill = (str, vars = {}) =>
  String(str).replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m));

export function readJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (e) {
    throw new Error(`Cannot read JSON ${file}: ${e.message}`);
  }
}

export function writeFile(file, content) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content);
}

/** Translator for a language; throws on a missing key so gaps never ship silently. */
export function translator(ui, lang) {
  return (key, vars) => {
    const s = ui[lang]?.[key];
    if (s === undefined) throw new Error(`Missing UI string "${key}" for ${lang}`);
    return vars ? fill(s, vars) : s;
  };
}

/** "28", "8 400 – 9 600" + unit label, localized number format. */
export function formatSalary(salary, lang, t) {
  if (!salary) return '';
  const nf = new Intl.NumberFormat(LANGS[lang].locale, { maximumFractionDigits: 2 });
  const { min, max, unit } = salary;
  const amount = max && max !== min ? `${nf.format(min)} – ${nf.format(max)}` : nf.format(min);
  // salary.net === false → the ad does not say net/gross, so the unit label drops "net".
  const key = `unit_${unit === 'hour' ? 'hour' : 'month'}${salary.net === false ? '_any' : ''}`;
  return `${amount} ${t(key)}`;
}

export function formatDate(iso, lang) {
  return new Intl.DateTimeFormat(LANGS[lang].locale, { day: 'numeric', month: 'long', year: 'numeric' })
    .format(new Date(`${iso}T12:00:00Z`));
}

/** Digits only, for tel:/wa.me links. */
export const digits = (phone) => String(phone).replace(/\D/g, '');
