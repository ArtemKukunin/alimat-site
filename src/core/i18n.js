// Languages, localized route slugs and URL helpers.
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
export const DEFAULT_LANG = 'pl';

export const LANGS = {
  pl: { name: 'Polski', short: 'PL', locale: 'pl-PL', og: 'pl_PL',
    routes: { jobs: 'oferty-pracy', candidates: 'dla-kandydatow', apply: 'aplikuj', employers: 'dla-firm', contact: 'kontakt', reviews: 'opinie' } },
  uk: { name: 'Українська', short: 'UA', locale: 'uk-UA', og: 'uk_UA',
    routes: { jobs: 'vakansii', candidates: 'kandydatam', apply: 'zayavka', employers: 'dlya-kompaniy', contact: 'kontakty', reviews: 'vidhuky' } },
  ru: { name: 'Русский', short: 'RU', locale: 'ru-RU', og: 'ru_RU',
    routes: { jobs: 'vakansii', candidates: 'kandidatam', apply: 'zayavka', employers: 'dlya-kompaniy', contact: 'kontakty', reviews: 'otzyvy' } },
  en: { name: 'English', short: 'EN', locale: 'en-GB', og: 'en_GB',
    routes: { jobs: 'jobs', candidates: 'candidates', apply: 'apply', employers: 'employers', contact: 'contact', reviews: 'reviews' } },
  es: { name: 'Español', short: 'ES', locale: 'es-ES', og: 'es_ES',
    routes: { jobs: 'ofertas-de-empleo', candidates: 'candidatos', apply: 'solicitar', employers: 'empresas', contact: 'contacto', reviews: 'opiniones' } },
  pt: { name: 'Português', short: 'PT', locale: 'pt-PT', og: 'pt_PT',
    routes: { jobs: 'vagas', candidates: 'candidatos', apply: 'candidatar', employers: 'empresas', contact: 'contacto', reviews: 'opinioes' } },
  ro: { name: 'Română', short: 'RO', locale: 'ro-RO', og: 'ro_RO',
    routes: { jobs: 'locuri-de-munca', candidates: 'candidati', apply: 'aplica', employers: 'angajatori', contact: 'contact', reviews: 'recenzii' } },
};

export const LANG_CODES = Object.keys(LANGS);

// SITE_PREVIEW=1 → links end in index.html (for hosts without directory indexes, e.g. a file preview).
const SUFFIX = process.env.SITE_PREVIEW ? 'index.html' : '';
// SITE_BASE=/repo-name → site served from a sub-path (e.g. GitHub Pages without a custom domain).
export const BASE = (process.env.SITE_BASE || '').replace(/\/+$/, '');
export const asset = (p) => `${BASE}/assets/${p}`;

/** Asset URL with a content hash (?v=…) so browsers and the CDN pick up new CSS/JS right after a deploy. */
const versions = new Map();
export function versionedAsset(p) {
  if (!versions.has(p)) {
    const file = new URL(`../../public/assets/${p}`, import.meta.url);
    versions.set(p, createHash('sha1').update(readFileSync(file)).digest('hex').slice(0, 10));
  }
  return `${asset(p)}?v=${versions.get(p)}`;
}

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
