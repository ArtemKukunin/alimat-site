// Static site generator: data/*.json + templates → dist/ (plain HTML/CSS/JS).
// Usage: node src/build.js
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { LANGS, LANG_CODES, DEFAULT_LANG, pageUrl, alternates, asset, BASE } from './core/i18n.js';
import { readJson, writeFile, translator, esc } from './core/util.js';
import { loadJobs } from './features/jobs/model.js';
import { renderHome } from './features/home/home.js';
import { renderJobsList, renderJobDetail } from './features/jobs/jobs.js';
import { renderCandidates } from './features/candidates/candidates.js';
import { renderApply } from './features/apply/apply.js';
import { renderEmployers } from './features/employers/employers.js';
import { renderContact } from './features/contact/contact.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.resolve(ROOT, process.env.OUT_DIR || 'dist');
const DATA = path.join(ROOT, 'data');

export function loadData() {
  const settings = readJson(path.join(DATA, 'settings.json'));
  if (process.env.SITE_URL) settings.siteUrl = process.env.SITE_URL.replace(/\/+$/, '');
  const ui = Object.fromEntries(LANG_CODES.map((l) => [l, readJson(path.join(DATA, 'ui', `${l}.json`))]));
  const jobs = loadJobs(path.join(DATA, 'jobs'));
  return { settings, ui, jobs };
}

/** File location inside dist for a page URL (drops the sub-path base and preview suffix). */
const outFile = (url) => path.join(DIST, url.slice(BASE.length).replace(/index\.html$/, ''), 'index.html');

const STATIC_PAGES = {
  home: renderHome, jobs: renderJobsList, candidates: renderCandidates,
  apply: renderApply, employers: renderEmployers, contact: renderContact,
};

function rootPage(settings, ui) {
  const links = LANG_CODES.map((l) => `<li><a href="${pageUrl(l, 'home')}" hreflang="${l}" lang="${l}" data-lang="${l}">${esc(LANGS[l].name)}</a></li>`).join('');
  const alt = LANG_CODES.map((l) => `<link rel="alternate" hreflang="${l}" href="${settings.siteUrl}${pageUrl(l, 'home')}">`).join('\n');
  const t = translator(ui, DEFAULT_LANG);
  return `<!doctype html>
<html lang="${DEFAULT_LANG}">
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(t('home_title'))}</title>
${process.env.SITE_NOINDEX ? '<meta name="robots" content="noindex, nofollow">' : ''}
<meta name="description" content="${esc(t('home_desc'))}">
<link rel="canonical" href="${settings.siteUrl}${BASE}/">
${alt}
<link rel="alternate" hreflang="x-default" href="${settings.siteUrl}${BASE}/">
<link rel="icon" href="${asset('favicon.svg')}" type="image/svg+xml">
<link rel="stylesheet" href="${asset('style.css')}">
<script src="${asset('app.js')}" defer></script>
</head>
<body class="page-root" data-autolang>
<main class="lang-choice">
  <img src="${asset('logo.svg')}" alt="Alimat Group" width="64" height="64">
  <h1>Alimat Group</h1>
  <p>${LANG_CODES.map((l) => esc(ui[l].choose_lang)).join(' · ')}</p>
  <ul>${links}</ul>
</main>
</body>
</html>
`;
}

function notFoundPage(ui) {
  const items = LANG_CODES.map((l) => `<li lang="${l}"><strong>${esc(ui[l].nf_title)}</strong> — <a href="${pageUrl(l, 'jobs')}">${esc(ui[l].nf_cta)}</a></li>`).join('');
  return `<!doctype html>
<html lang="${DEFAULT_LANG}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>404 — Alimat Group</title><meta name="robots" content="noindex">
<link rel="stylesheet" href="${asset('style.css')}"></head>
<body class="page-root"><main class="lang-choice"><img src="${asset('logo.svg')}" alt="Alimat Group" width="64" height="64"><h1>404</h1><ul class="nf-list">${items}</ul></main></body></html>
`;
}

function sitemap(settings, entries) {
  const urls = entries.map(({ page, sub }) => alternates(page, sub).map(({ href }) => `  <url>
    <loc>${settings.siteUrl}${href}</loc>
${alternates(page, sub).map((a) => `    <xhtml:link rel="alternate" hreflang="${a.lang}" href="${settings.siteUrl}${a.href}"/>`).join('\n')}
    <xhtml:link rel="alternate" hreflang="x-default" href="${settings.siteUrl}${BASE}/"/>
  </url>`).join('\n')).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls}
</urlset>
`;
}

/** 301s from the old WordPress URLs so existing Google rankings and links keep working. */
function redirects(jobs) {
  const pl = (p, s) => pageUrl('pl', p, s);
  const map = [
    ['/dla-kandydatow/*', pl('candidates')],
    ['/oferty-pracy/*', pl('jobs')],
    ['/przeslij-cv/*', pl('apply')],
    ['/oferta-dla-firm/*', pl('employers')],
    ['/zapytanie-ofertowe/*', `${pl('employers')}#inquiry`],
    ['/kontakt/*', pl('contact')],
    ['/o-nas/*', pl('contact')],
    ...jobs.map((j) => [`/oferta/${j.id}/*`, pl('jobs', j.id)]),
    ['/oferta/*', pl('jobs')],
  ];
  return map;
}

const netlifyRedirects = (map) => `${map.map(([from, to]) => `${from}  ${to}  301`).join('\n')}\n`;

/** Hosts without server redirects (GitHub Pages): an HTML stub per old URL. */
const redirectStub = (to, siteUrl) => `<!doctype html><html><head><meta charset="utf-8"><meta name="robots" content="noindex">
<link rel="canonical" href="${siteUrl}${to}"><meta http-equiv="refresh" content="0; url=${to}">
<title>Redirect</title></head><body><a href="${to}">${to}</a></body></html>
`;

function securityHeaders(settings) {
  let formOrigin = '';
  try { formOrigin = settings.formEndpoint ? new URL(settings.formEndpoint).origin : ''; } catch { throw new Error('settings.formEndpoint must be a full https:// URL or empty'); }
  const csp = [
    "default-src 'self'", "script-src 'self'", "style-src 'self'", "img-src 'self' data:",
    `connect-src 'self'${formOrigin ? ` ${formOrigin}` : ''}`, `form-action 'self'${formOrigin ? ` ${formOrigin}` : ''}`,
    "base-uri 'self'", "frame-ancestors 'none'", "object-src 'none'",
  ].join('; ');
  const common = `  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=()`;
  const sitePaths = ['/', ...LANG_CODES.map((l) => `/${l}/*`)];
  return `${sitePaths.map((p) => `${p}\n${common}\n  X-Frame-Options: DENY\n  Content-Security-Policy: ${csp}`).join('\n')}
/assets/*
  Cache-Control: public, max-age=604800
/admin/*
${common}
  X-Robots-Tag: noindex
`;
}

export function build() {
  const { settings, ui, jobs } = loadData();
  fs.rmSync(DIST, { recursive: true, force: true });
  fs.cpSync(path.join(ROOT, 'public'), DIST, { recursive: true });

  const indexable = [];
  let count = 0;
  for (const lang of LANG_CODES) {
    const ctx = { lang, t: translator(ui, lang), settings, jobs };
    for (const [page, render] of Object.entries(STATIC_PAGES)) {
      writeFile(outFile(pageUrl(lang, page)), render(ctx));
      count++;
    }
    for (const job of jobs) {
      writeFile(outFile(pageUrl(lang, 'jobs', job.id)), renderJobDetail(ctx, job));
      count++;
    }
  }
  for (const page of Object.keys(STATIC_PAGES)) indexable.push({ page });
  for (const job of jobs.filter((j) => j.active)) indexable.push({ page: 'jobs', sub: job.id });

  writeFile(path.join(DIST, 'index.html'), rootPage(settings, ui));
  writeFile(path.join(DIST, '404.html'), notFoundPage(ui));
  writeFile(path.join(DIST, 'sitemap.xml'), sitemap(settings, indexable));
  writeFile(path.join(DIST, 'robots.txt'), process.env.SITE_NOINDEX
    ? 'User-agent: *\nDisallow: /\n'
    : `User-agent: *\nAllow: /\nDisallow: /admin/\n\nSitemap: ${settings.siteUrl}${BASE}/sitemap.xml\n`);
  const redirectMap = redirects(jobs);
  writeFile(path.join(DIST, '_redirects'), netlifyRedirects(redirectMap));
  for (const [from, to] of redirectMap) {
    writeFile(path.join(DIST, from.replace(/\/\*$/, ''), 'index.html'), redirectStub(to, settings.siteUrl));
  }
  writeFile(path.join(DIST, '_headers'), securityHeaders(settings));
  return { pages: count, jobs: jobs.length, langs: LANG_CODES.length };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    const r = build();
    console.log(`Built ${r.pages} pages (${r.langs} languages, ${r.jobs} jobs) → dist/`);
  } catch (e) {
    console.error(`Build failed:\n${e.message}`);
    process.exit(1);
  }
}
