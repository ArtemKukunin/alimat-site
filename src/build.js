// Static site generator: data/*.json + templates → dist/ (plain HTML/CSS/JS).
// Usage: node src/build.js
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { LANGS, LANG_CODES, DEFAULT_LANG, pageUrl, alternates, asset, versionedAsset, BASE } from './core/i18n.js';
import { readJson, writeFile, translator, esc } from './core/util.js';
import { loadJobs } from './features/jobs/model.js';
import { renderHome } from './features/home/home.js';
import { renderJobsList, renderJobDetail, renderJobSection } from './features/jobs/jobs.js';
import { loadCategories } from './features/jobs/categories.js';
import { renderCandidates } from './features/candidates/candidates.js';
import { renderApply } from './features/apply/apply.js';
import { renderEmployers } from './features/employers/employers.js';
import { renderContact } from './features/contact/contact.js';
import { loadContent, buildBlog, postsIn, blogPath, legalUrl } from './features/blog/blog.js';
import { loadReviews } from './features/reviews/reviews.js';
import { loadServices, renderService, serviceSlugs } from './features/services/services.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.resolve(ROOT, process.env.OUT_DIR || 'dist');
const DATA = path.join(ROOT, 'data');

export function loadData() {
  const settings = readJson(path.join(DATA, 'settings.json'));
  if (process.env.SITE_URL) settings.siteUrl = process.env.SITE_URL.replace(/\/+$/, '');
  const ui = Object.fromEntries(LANG_CODES.map((l) => [l, readJson(path.join(DATA, 'ui', `${l}.json`))]));
  const jobs = loadJobs(path.join(DATA, 'jobs'));
  const categories = loadCategories(path.join(DATA, 'categories.json'), jobs);
  const { posts, pages } = loadContent(DATA);
  const legacy = readJson(path.join(DATA, 'legacy.json'));
  const services = loadServices(readJson(path.join(DATA, 'services.json')));
  const reviews = loadReviews(readJson(path.join(DATA, 'reviews.json')));
  return { settings, ui, jobs, categories, posts, pages, legacy, services, reviews };
}

/** Small CSS minifier: drops comments and whitespace outside quoted strings. */
export function minifyCss(css) {
  let out = '';
  for (let i = 0; i < css.length; i++) {
    const c = css[i];
    if (c === '"' || c === "'") { const j = css.indexOf(c, i + 1); out += css.slice(i, j + 1); i = j; continue; }
    if (c === '/' && css[i + 1] === '*') { i = css.indexOf('*/', i + 2) + 1; continue; }
    if (/\s/.test(c)) {
      while (/\s/.test(css[i + 1] || '')) i++;
      const prev = out[out.length - 1]; const next = css[i + 1];
      if (prev && next && !/[{};:,>]/.test(prev) && !/[{};:,>)]/.test(next)) out += ' ';
      continue;
    }
    if (c === ';' && css[i + 1] === '}') continue;
    out += c;
  }
  return out;
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
<link rel="stylesheet" href="${versionedAsset('style.css')}">
<script src="${versionedAsset('app.js')}" defer></script>
</head>
<body class="page-root" data-autolang>
<main class="lang-choice">
  <img src="${asset('img/logo.webp')}" alt="Alimat Group" width="220" height="53">
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
<link rel="stylesheet" href="${versionedAsset('style.css')}"></head>
<body class="page-root"><main class="lang-choice"><img src="${asset('img/logo.webp')}" alt="Alimat Group" width="220" height="53"><h1>404</h1><ul class="nf-list">${items}</ul></main></body></html>
`;
}

function sitemap(settings, entries) {
  const lm = (d) => (d ? `\n    <lastmod>${d}</lastmod>` : '');
  const urls = entries.map((e) => {
    if (e.path && !(e.alts?.length > 1)) return `  <url>\n    <loc>${settings.siteUrl}${e.path}</loc>${lm(e.lastmod)}\n  </url>`;
    if (e.path) {
      return `  <url>
    <loc>${settings.siteUrl}${e.path}</loc>${lm(e.lastmod)}
${e.alts.map((a) => `    <xhtml:link rel="alternate" hreflang="${a.lang}" href="${settings.siteUrl}${a.href}"/>`).join('\n')}
  </url>`;
    }
    const alts = alternates(e.page, e.sub);
    return alts.map(({ href }) => `  <url>
    <loc>${settings.siteUrl}${href}</loc>${lm(e.lastmod)}
${alts.map((a) => `    <xhtml:link rel="alternate" hreflang="${a.lang}" href="${settings.siteUrl}${a.href}"/>`).join('\n')}
    <xhtml:link rel="alternate" hreflang="x-default" href="${settings.siteUrl}${BASE}/"/>
  </url>`).join('\n');
  }).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls}
</urlset>
`;
}

/** 301s from the old WordPress URLs so existing Google rankings and links keep working. */
function redirects(jobs, legacy, services) {
  const pl = (p, s) => pageUrl('pl', p, s);
  const map = [
    ['/dla-kandydatow/*', pl('candidates')],
    ['/oferty-pracy/*', pl('jobs')],
    ['/przeslij-cv/*', pl('apply')],
    // Old service pages under the employers menu (same Polish slugs)
    ...services.map((s) => [`/oferta-dla-firm/${s.pl.slug}/*`, pl('employers', s.pl.slug)]),
    ['/oferta-dla-firm/*', pl('employers')],
    ['/zapytanie-ofertowe/*', `${pl('employers')}#inquiry`],
    ['/kontakt/*', pl('contact')],
    ['/o-nas/*', pl('contact')],
    ...jobs.map((j) => [`/oferta/${j.id}/*`, pl('jobs', j.id)]),
    // Duplicate ads on the old site, merged into one page each
    ...Object.entries(legacy.jobAliases || {}).filter(([from]) => !jobs.some((j) => j.id === from)).map(([from, to]) => [`/oferta/${from}/*`, pl('jobs', to)]),
    ['/oferta/*', pl('jobs')],
    ...Object.entries(legacy.removedPages).map(([slug, page]) => [`/${slug}/*`, pl(page)]),
    ...legacy.tags.map((tag) => [`/tag/${tag}/*`, `${BASE}/blog/`]),
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
  return `/*\n${common}\n  X-Frame-Options: DENY\n  Content-Security-Policy: ${csp}
/assets/*
  Cache-Control: public, max-age=604800
/admin/*
${common}
  X-Robots-Tag: noindex
`;
}

export function build() {
  const { settings, ui, jobs, categories, posts, pages, legacy, services, reviews } = loadData();
  const redirectMap = redirects(jobs, legacy, services);
  // Old WordPress paths inside imported articles → new URLs (same table as the redirects).
  const legacyMap = (oldPath) => redirectMap.find(([from]) => from.replace(/\*$/, '') === oldPath)?.[1];
  const reserved = new Set([...LANG_CODES, 'assets', 'admin', 'blog', 'category', 'tag', 'oferta', 'wp-content']);
  for (const s of [...posts, ...pages].map((p) => p.slug)) if (reserved.has(s)) throw new Error(`Slug "${s}" is reserved`);
  fs.rmSync(DIST, { recursive: true, force: true });
  fs.cpSync(path.join(ROOT, 'public'), DIST, { recursive: true });
  const cssFile = path.join(DIST, 'assets', 'style.css');
  fs.writeFileSync(cssFile, minifyCss(fs.readFileSync(cssFile, 'utf8')));

  const indexable = [];
  let count = 0;
  const slugOf = (u) => u.replace(/^\/+|\/+$/g, '');
  const makeCtx = (lang) => ({
    lang, t: translator(ui, lang), settings, jobs, categories, services, reviews,
    blogUrl: blogPath(postsIn(posts, lang).length ? lang : 'pl'),
    privacyUrl: legalUrl(pages, slugOf(settings.privacyUrl), lang),
    cookiesUrl: legalUrl(pages, slugOf(settings.cookiesUrl), lang),
  });
  for (const lang of LANG_CODES) {
    const ctx = makeCtx(lang);
    for (const [page, render] of Object.entries(STATIC_PAGES)) {
      writeFile(outFile(pageUrl(lang, page)), render(ctx));
      count++;
    }
    for (const job of jobs) {
      writeFile(outFile(pageUrl(lang, 'jobs', job.id)), renderJobDetail(ctx, job));
      count++;
    }
    for (const cat of Object.keys(categories)) {
      writeFile(outFile(pageUrl(lang, 'jobs', categories[cat][lang].slug)), renderJobSection(ctx, cat));
      count++;
    }
    for (const svc of services) {
      writeFile(outFile(pageUrl(lang, 'employers', svc[lang].slug)), renderService(ctx, svc));
      count++;
    }
  }
  // Blog + legal pages: Polish on the old WordPress URLs, translations under /{lang}/.
  const blog = buildBlog({ posts, pages, jobs, legacyMap, makeCtx });
  for (const { path: p, html } of blog.out) {
    if (fs.existsSync(outFile(p))) throw new Error(`Blog/legal page ${p} would overwrite another page`);
    writeFile(outFile(p), html);
  }
  count += blog.out.length;
  for (const page of Object.keys(STATIC_PAGES)) indexable.push({ page });
  for (const job of jobs.filter((j) => j.active)) indexable.push({ page: 'jobs', sub: job.id, lastmod: job.datePosted });
  indexable.push(...blog.sitemap);
  for (const svc of services) indexable.push({ page: 'employers', sub: serviceSlugs(svc) });
  // Sections are listed only while they have active jobs (empty ones are noindex).
  for (const cat of Object.keys(categories)) {
    if (jobs.some((j) => j.active && j.category === cat)) {
      indexable.push({ page: 'jobs', sub: Object.fromEntries(LANG_CODES.map((l) => [l, categories[cat][l].slug])) });
    }
  }

  writeFile(path.join(DIST, 'index.html'), rootPage(settings, ui));
  writeFile(path.join(DIST, '404.html'), notFoundPage(ui));
  writeFile(path.join(DIST, 'sitemap.xml'), sitemap(settings, indexable));
  writeFile(path.join(DIST, 'robots.txt'), process.env.SITE_NOINDEX
    ? 'User-agent: *\nDisallow: /\n'
    : `User-agent: *\nAllow: /\nDisallow: /admin/\n\nSitemap: ${settings.siteUrl}${BASE}/sitemap.xml\n`);
  writeFile(path.join(DIST, '_redirects'), netlifyRedirects(redirectMap));
  for (const [from, to] of redirectMap) {
    const file = path.join(DIST, from.replace(/\/\*$/, ''), 'index.html');
    if (fs.existsSync(file)) throw new Error(`Redirect ${from} would overwrite a real page`);
    writeFile(file, redirectStub(to, settings.siteUrl));
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
