// Languages, localized route slugs and URL helpers.
export const DEFAULT_LANG = 'pl';

export const LANGS = {
  pl: { name: 'Polski', short: 'PL', locale: 'pl-PL', og: 'pl_PL',
    routes: { jobs: 'oferty-pracy', candidates: 'dla-kandydatow', apply: 'aplikuj', employers: 'dla-firm', contact: 'kontakt' } },
  uk: { name: 'Українська', short: 'UA', locale: 'uk-UA', og: 'uk_UA',
    routes: { jobs: 'vakansii', candidates: 'kandydatam', apply: 'zayavka', employers: 'dlya-kompaniy', contact: 'kontakty' } },
  ru: { name: 'Русский', short: 'RU', locale: 'ru-RU', og: 'ru_RU',
    routes: { jobs: 'vakansii', candidates: 'kandidatam', apply: 'zayavka', employers: 'dlya-kompaniy', contact: 'kontakty' } },
  en: { name: 'English', short: 'EN', locale: 'en-GB', og: 'en_GB',
    routes: { jobs: 'jobs', candidates: 'candidates', apply: 'apply', employers: 'employers', contact: 'contact' } },
  es: { name: 'Español', short: 'ES', locale: 'es-ES', og: 'es_ES',
    routes: { jobs: 'ofertas-de-empleo', candidates: 'candidatos', apply: 'solicitar', employers: 'empresas', contact: 'contacto' } },
  pt: { name: 'Português', short: 'PT', locale: 'pt-PT', og: 'pt_PT',
    routes: { jobs: 'vagas', candidates: 'candidatos', apply: 'candidatar', employers: 'empresas', contact: 'contacto' } },
  ro: { name: 'Română', short: 'RO', locale: 'ro-RO', og: 'ro_RO',
    routes: { jobs: 'locuri-de-munca', candidates: 'candidati', apply: 'aplica', employers: 'angajatori', contact: 'contact' } },
};

export const LANG_CODES = Object.keys(LANGS);

// SITE_PREVIEW=1 → links end in index.html (for hosts without directory indexes, e.g. a file preview).
const SUFFIX = process.env.SITE_PREVIEW ? 'index.html' : '';
// SITE_BASE=/repo-name → site served from a sub-path (e.g. GitHub Pages without a custom domain).
export const BASE = (process.env.SITE_BASE || '').replace(/\/+$/, '');
export const asset = (p) => `${BASE}/assets/${p}`;

/** Path of a page in a language. page = 'home' | route key; sub = optional child slug, or {lang: slug}. */
export function pageUrl(lang, page, sub) {
  let p = `${BASE}/${lang}/`;
  if (page !== 'home') {
    const route = LANGS[lang].routes[page];
    if (!route) throw new Error(`Unknown page "${page}" for ${lang}`);
    p += `${route}/`;
  }
  const s = sub && typeof sub === 'object' ? sub[lang] : sub;
  if (s) p += `${s}/`;
  return p + SUFFIX;
}

/** Same page in every language: [{lang, href}] */
export function alternates(page, sub) {
  return LANG_CODES.map((lang) => ({ lang, href: pageUrl(lang, page, sub) }));
}
