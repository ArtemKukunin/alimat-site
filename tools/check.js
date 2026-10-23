// Quality gate: translations complete, build OK, links/SEO/JSON-LD valid. Exit code 1 on any error.
// Usage: node tools/check.js
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { build, loadData } from '../src/build.js';
import { LANG_CODES, DEFAULT_LANG, BASE } from '../src/core/i18n.js';
import { esc, fill, formatSalary, translator } from '../src/core/util.js';
import { validateJob } from '../src/features/jobs/model.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist');
const errors = [];
const warnings = [];
const err = (m) => errors.push(m);

// 1) Unit checks for helpers
assert.equal(esc('<a href="x">&\'</a>'), '&lt;a href=&quot;x&quot;&gt;&amp;&#39;&lt;/a&gt;');
assert.equal(fill('{a} {b}', { a: 1 }), '1 {b}');
{
  const ui = { pl: { unit_hour: 'zł/godz. netto', unit_month: 'zł/mies. netto' } };
  const t = translator(ui, 'pl');
  assert.equal(formatSalary({ min: 28, unit: 'hour' }, 'pl', t), '28 zł/godz. netto');
  assert.match(formatSalary({ min: 8400, max: 9600, unit: 'month' }, 'pl', t), /^8\s?400 – 9\s?600 zł\/mies\. netto$/);
  assert.throws(() => t('missing_key'));
  assert.ok(validateJob('Bad Slug', { pl: {} }).length > 0, 'invalid job must fail validation');
}

// 2) Translation completeness
const { ui } = loadData();
const placeholders = (s) => (String(s).match(/\{\w+\}/g) || []).sort().join(',');
const baseKeys = Object.keys(ui[DEFAULT_LANG]);
for (const lang of LANG_CODES) {
  for (const k of baseKeys) {
    if (!(k in ui[lang])) err(`ui/${lang}.json: missing "${k}"`);
    else if (!String(ui[lang][k]).trim()) err(`ui/${lang}.json: empty "${k}"`);
    else if (placeholders(ui[lang][k]) !== placeholders(ui[DEFAULT_LANG][k])) err(`ui/${lang}.json: "${k}" placeholders differ from Polish`);
  }
  for (const k of Object.keys(ui[lang])) if (!(k in ui[DEFAULT_LANG])) err(`ui/${lang}.json: unknown key "${k}"`);
}

// 3) Build (job validation happens inside)
try {
  const r = build();
  console.log(`build: ${r.pages} pages`);
} catch (e) {
  err(`build failed: ${e.message}`);
}

// 4) Output checks
function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true })
    .flatMap((d) => (d.isDirectory() ? walk(path.join(dir, d.name)) : [path.join(dir, d.name)]));
}
function resolves(href) {
  let clean = decodeURI(href.split(/[?#]/)[0]);
  if (BASE && clean.startsWith(BASE)) clean = clean.slice(BASE.length) || '/';
  const p = path.join(DIST, clean);
  return fs.existsSync(clean.endsWith('/') ? path.join(p, 'index.html') : p);
}

if (fs.existsSync(DIST)) {
  const pages = walk(DIST).filter((f) => f.endsWith('.html') && !f.includes(`${path.sep}admin${path.sep}`));
  const titles = new Map();
  const hreflangSets = new Map();
  for (const file of pages) {
    const rel = path.relative(DIST, file);
    const html = fs.readFileSync(file, 'utf8');
    const isLangPage = /^(pl|uk|ru|en|es|pt|ro)\//.test(rel);
    if (html.includes('http-equiv="refresh"')) continue; // redirect stub
    for (const m of html.matchAll(/\s(?:href|src|action)="(\/[^"]*)"/g)) {
      if (!m[1].startsWith('//') && !resolves(m[1])) err(`${rel}: broken link ${m[1]}`);
    }
    for (const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
      try { JSON.parse(m[1]); } catch { err(`${rel}: invalid JSON-LD`); }
    }
    const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
    const dup = ids.filter((id, i) => ids.indexOf(id) !== i);
    if (dup.length) err(`${rel}: duplicate id(s) ${[...new Set(dup)].join(', ')}`);
    // Content pages: translated (/xx/…) or single-language (blog, legal) — everything with a canonical except root/404.
    if (rel === 'index.html' || rel === '404.html' || !html.includes('<link rel="canonical"')) continue;
    const lang = html.match(/<html lang="([a-z]{2})">/)?.[1];
    if (!lang || (isLangPage && lang !== rel.slice(0, 2))) err(`${rel}: wrong <html lang>`);
    for (const m of html.matchAll(/<img\b[^>]*>/g)) if (!/\salt="/.test(m[0])) err(`${rel}: <img> without alt`);
    for (const m of html.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/g)) {
      if (/aria-hidden="true"/.test(m[1])) continue;
      const text = m[2].replace(/<svg[\s\S]*?<\/svg>/g, '').replace(/<[^>]+>/g, '').trim();
      if (!text && !/aria-label="[^"]+"/.test(m[1]) && !/<img[^>]*alt="[^"]+"/.test(m[2])) err(`${rel}: link without text ${m[1].slice(0, 60)}`);
    }
    const h1 = (html.match(/<h1[\s>]/g) || []).length;
    if (h1 !== 1) err(`${rel}: ${h1} <h1> (expected 1)`);
    const title = html.match(/<title>([^<]*)<\/title>/)?.[1];
    const desc = html.match(/<meta name="description" content="([^"]*)"/)?.[1];
    if (!title) err(`${rel}: no <title>`);
    if (!desc) err(`${rel}: no meta description`);
    if (title && title.length > 70) warnings.push(`${rel}: title ${title.length} chars`);
    if (desc && (desc.length > 165 || desc.length < 70)) warnings.push(`${rel}: description ${desc.length} chars`);
    if (title) titles.set(title, [...(titles.get(title) || []), rel]);
    if (!/<link rel="canonical" href="https:\/\/[^"]+">/.test(html)) err(`${rel}: no canonical`);
    const hreflangs = (html.match(/<link rel="alternate" hreflang=/g) || []).length;
    if (isLangPage && hreflangs !== LANG_CODES.length + 1) err(`${rel}: ${hreflangs} hreflang links (expected ${LANG_CODES.length + 1})`);
    if (hreflangs < 2) err(`${rel}: missing hreflang`);
    const canonical = html.match(/<link rel="canonical" href="https?:\/\/[^/"]+([^"]*)">/)?.[1];
    const altSet = [...html.matchAll(/<link rel="alternate" hreflang="([\w-]+)" href="https?:\/\/[^/"]+([^"]*)">/g)]
      .filter((m) => m[1] !== 'x-default').map((m) => `${m[1]} ${m[2]}`).sort().join('|');
    if (canonical) hreflangSets.set(canonical, { rel, altSet });
    if (/\{\w+\}/.test(html.replace(/<script[\s\S]*?<\/script>/g, '').replace(/data-template="[^"]*"/g, ''))) err(`${rel}: unfilled {placeholder}`);
  }
  // hreflang must be reciprocal: every listed alternate exists and lists the same set.
  for (const [url, { rel, altSet }] of hreflangSets) {
    const own = altSet.split('|');
    if (!own.some((x) => x.endsWith(` ${url}`))) err(`${rel}: hreflang does not include the page itself`);
    for (const x of own) {
      const other = hreflangSets.get(x.slice(x.indexOf(' ') + 1));
      if (!other) err(`${rel}: hreflang target ${x} not found`);
      else if (other.altSet !== altSet) err(`${rel}: hreflang not reciprocal with ${other.rel}`);
    }
  }
  for (const [title, files] of titles) if (files.length > 1) err(`duplicate <title> "${title}" in ${files.join(', ')}`);

  const sitemap = fs.readFileSync(path.join(DIST, 'sitemap.xml'), 'utf8');
  for (const m of sitemap.matchAll(/<loc>https?:\/\/[^/<]+(\/[^<]*)<\/loc>/g)) if (!resolves(m[1])) err(`sitemap: missing page ${m[1]}`);
  console.log(`checked ${pages.length} HTML files, ${(sitemap.match(/<loc>/g) || []).length} sitemap URLs`);
}

for (const w of warnings) console.warn(`warn: ${w}`);
if (errors.length) {
  console.error(`\n${errors.length} error(s):\n- ${errors.join('\n- ')}`);
  process.exit(1);
}
console.log('OK — all checks passed');
