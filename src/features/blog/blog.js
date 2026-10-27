// Blog + legal pages imported from the old WordPress site.
// Polish keeps the old URLs (/{slug}/, /blog/, /category/…) so existing rankings carry over.
// Translations live in data/blog-i18n/{pl-slug}.txt and data/pages-i18n/{pl-slug}.txt,
// one object per language; they get their own URLs under /{lang}/blog/… and /{lang}/{slug}/.
import fs from 'node:fs';
import path from 'node:path';
import { pageUrl, asset, BASE, LANG_CODES } from '../../core/i18n.js';
import { esc, readJson, formatDate, fitTitle, fitDesc } from '../../core/util.js';
import { icon } from '../../core/icons.js';
import { layout, breadcrumbs, breadcrumbLd, contactButtons } from '../../core/layout.js';
import { imageSize } from '../../core/imagesize.js';
import { markdownToHtml } from './markdown.js';

const PUBLIC_ASSETS = new URL('../../../public/assets/', import.meta.url).pathname;

export const BLOG_LANG = 'pl';
const firstText = (html) => (html.match(/<p>([\s\S]*?)<\/p>/)?.[1] || '').replace(/<[^>]+>/g, '');
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const SECTION_KEYS = ['candidates', 'employers'];
/** Section URL slugs; Polish ones are the old WordPress category slugs. */
const SECTION_SLUGS = {
  pl: { candidates: 'dla-kandydatow', employers: 'dla-firm' },
  uk: { candidates: 'dlya-kandydativ', employers: 'dlya-kompaniy' },
  ru: { candidates: 'dlya-kandidatov', employers: 'dlya-kompaniy' },
  en: { candidates: 'for-candidates', employers: 'for-employers' },
  es: { candidates: 'para-candidatos', employers: 'para-empresas' },
  pt: { candidates: 'para-candidatos', employers: 'para-empresas' },
  ro: { candidates: 'pentru-candidati', employers: 'pentru-angajatori' },
};

// ---------- URLs ----------
export const blogPath = (lang = BLOG_LANG) => (lang === BLOG_LANG ? `${BASE}/blog/` : `${BASE}/${lang}/blog/`);
export const sectionPath = (sec, lang = BLOG_LANG) => (lang === BLOG_LANG
  ? `${BASE}/category/${SECTION_SLUGS.pl[sec]}/`
  : `${BASE}/${lang}/blog/${SECTION_SLUGS[lang][sec]}/`);
/** `p` is a localized post: { lang, slug }. */
export const postPath = (p) => (p.lang === BLOG_LANG ? `${BASE}/${p.slug}/` : `${BASE}/${p.lang}/blog/${p.slug}/`);
export const legalPath = (p) => (p.lang === BLOG_LANG ? `${BASE}/${p.slug}/` : `${BASE}/${p.lang}/${p.slug}/`);

// ---------- loading ----------
function loadDir(dir, required, prepare = (r) => r) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter((f) => f.endsWith('.json')).map((f) => {
    const rec = prepare(readJson(path.join(dir, f)), f);
    const errors = required.filter((k) => !rec[k]).map((k) => `"${k}" is required`);
    if (!SLUG_RE.test(rec.slug || '')) errors.push('slug must be lowercase ascii');
    if (rec.slug !== path.basename(f, '.json')) errors.push('slug must match the file name');
    if (errors.length) throw new Error(`${dir}/${f}: ${errors.join('; ')}`);
    return rec;
  });
}

const IMG_RE = /<img\b[^>]*>/g;

/**
 * Translation file format (plain text, no escaping needed for HTML):
 *   === uk
 *   slug: robota-v-polshchi-vzymku
 *   title: …
 *   description: …
 *   ---
 *   <p>HTML body, images as [img0] …</p>
 *   === ru
 *   …
 */
export function parseTranslations(text, file) {
  const out = {};
  for (const block of text.split(/^=== /m).slice(1)) {
    const nl = block.indexOf('\n');
    const lang = block.slice(0, nl).trim();
    const rest = block.slice(nl + 1);
    const sep = rest.search(/^---\s*$/m);
    if (sep < 0) throw new Error(`${file} [${lang}]: missing --- before the body`);
    const rec = { html: rest.slice(sep).replace(/^---\s*\n/, '').trim() };
    for (const line of rest.slice(0, sep).split('\n')) {
      const m = line.match(/^(\w+):\s*(.*)$/);
      if (m) rec[m[1]] = m[2].trim();
      else if (line.trim()) throw new Error(`${file} [${lang}]: bad header line "${line}"`);
    }
    if (out[lang]) throw new Error(`${file}: duplicate language ${lang}`);
    out[lang] = rec;
  }
  return out;
}

/**
 * Attaches translations to each Polish record: rec.tr = { pl: rec, uk: {...}, … }.
 * Translated html refers to the Polish images as [img0], [img1]… so image markup lives in one place.
 */
function attachTranslations(recs, dir, kind) {
  for (const rec of recs) {
    rec.lang = BLOG_LANG;
    rec.id = rec.slug;
    rec.tr = { [BLOG_LANG]: rec };
    const file = path.join(dir, `${rec.slug}.txt`);
    if (!fs.existsSync(file)) continue;
    const all = parseTranslations(fs.readFileSync(file, 'utf8'), file);
    const imgs = rec.html.match(IMG_RE) || [];
    for (const [lang, t] of Object.entries(all)) {
      const where = `${kind}-i18n/${rec.slug}.txt [${lang}]`;
      if (!LANG_CODES.includes(lang) || lang === BLOG_LANG) throw new Error(`${where}: unknown language`);
      for (const k of ['slug', 'title', 'description', 'html']) if (!t[k]) throw new Error(`${where}: "${k}" is required`);
      if (!SLUG_RE.test(t.slug)) throw new Error(`${where}: slug must be lowercase ascii`);
      if (/<img\b|asset:/.test(t.html)) throw new Error(`${where}: use [imgN] placeholders, not image markup`);
      const count = (h, re) => (h.match(re) || []).length;
      for (const [re, what] of [[/href="/g, 'links'], [/\[img\d+\]|<img\b/g, 'images'], [/<h2\b/g, 'h2 headings']]) {
        const want = count(rec.html, re);
        if (count(t.html, re) !== want) throw new Error(`${where}: ${count(t.html, re)} ${what}, Polish has ${want}`);
      }
      const html = t.html.replace(/\[img(\d+)\]/g, (m, n) => {
        if (!imgs[n]) throw new Error(`${where}: ${m} does not exist in the Polish version`);
        return imgs[n];
      });
      rec.tr[lang] = { ...rec, seoTitle: undefined, metaTitle: undefined, keywords: [], ...t, html, lang, tr: rec.tr };
    }
  }
  return recs;
}

/**
 * Posts written in the admin panel have Markdown `body` and an uploaded `cover` ("/assets/uploads/…");
 * imported WordPress posts have `html` and a prepared `image`. Both end up as `html` + `image`.
 */
function prepareAdminPost(rec, file) {
  if (!rec.html && rec.body) rec.html = markdownToHtml(rec.body);
  if (!rec.image && rec.cover) {
    const rel = rec.cover.replace(/^\/?assets\//, '');
    const abs = path.join(PUBLIC_ASSETS, rel);
    if (!fs.existsSync(abs)) throw new Error(`blog/${file}: cover image ${rec.cover} not found`);
    const { w, h } = imageSize(abs);
    rec.image = { src: rel, src640: rel, w, h };
  }
  return rec;
}

export function loadContent(dataDir) {
  const posts = loadDir(path.join(dataDir, 'blog'), ['slug', 'title', 'description', 'published', 'section', 'html'], prepareAdminPost)
    .sort((a, b) => b.published.localeCompare(a.published));
  for (const p of posts) if (!SECTION_KEYS.includes(p.section)) throw new Error(`blog/${p.slug}: unknown section "${p.section}"`);
  const pages = loadDir(path.join(dataDir, 'pages'), ['slug', 'title', 'html']);
  attachTranslations(posts, path.join(dataDir, 'blog-i18n'), 'blog');
  attachTranslations(pages, path.join(dataDir, 'pages-i18n'), 'pages');
  for (const lang of LANG_CODES) {
    const seen = new Set();
    for (const r of [...posts, ...pages]) {
      const t = r.tr[lang];
      if (!t) continue;
      if (seen.has(t.slug)) throw new Error(`Duplicate ${lang} slug "${t.slug}"`);
      seen.add(t.slug);
    }
  }
  return { posts, pages };
}

/** Posts available in one language, newest first. */
export const postsIn = (posts, lang) => posts.filter((p) => p.tr[lang]).map((p) => p.tr[lang]);

/** URL of a legal page (by Polish slug) in the given language, falling back to Polish. */
export const legalUrl = (pages, plSlug, lang) => {
  const page = pages.find((p) => p.slug === plSlug);
  return page ? legalPath(page.tr[lang] || page) : `${BASE}/${plSlug}/`;
};

const STATIC = ['home', 'jobs', 'candidates', 'apply', 'employers', 'contact'];

/** Rewrites links/images kept from WordPress ("wp:/old-path/", "asset:file") to the new site, in the page's language. */
export function makeLinkResolver(lang, { posts, pages, jobs, legacyMap }) {
  const local = new Map([...posts, ...pages].map((r) => [r.slug, r]));
  const jobIds = new Set(jobs.map((j) => j.id));
  const plToLang = (target) => {
    if (lang === BLOG_LANG || !target) return target;
    const [p, hash] = target.split('#');
    const page = STATIC.find((k) => pageUrl(BLOG_LANG, k) === p);
    return page ? pageUrl(lang, page) + (hash ? `#${hash}` : '') : target;
  };
  const resolve = (oldPath) => {
    const [p, hash] = oldPath.split('#');
    const seg = p.split('/').filter(Boolean);
    let to;
    if (!seg.length) to = pageUrl(lang, 'home');
    else if (seg.length === 1 && local.has(seg[0])) {
      const r = local.get(seg[0]);
      const t = r.tr[lang] || r;
      to = r.section ? postPath(t) : legalPath(t);
    } else if (seg[0] === 'blog') to = blogPath(lang);
    else if (seg[0] === 'category' && seg[1] === 'dla-firm') to = sectionPath('employers', lang);
    else if (seg[0] === 'category' || seg[0] === 'tag') to = seg[1] === 'dla-kandydatow' ? sectionPath('candidates', lang) : blogPath(lang);
    else if (seg[0] === 'oferta' && jobIds.has(seg[1])) to = pageUrl(lang, 'jobs', seg[1]);
    else if (seg[0] === 'wp-content') to = `${BASE}${p}`;
    else to = plToLang(legacyMap(`/${seg[0]}/`)) || pageUrl(lang, 'home');
    return to + (hash ? `#${hash}` : '');
  };
  return (html) => html
    .replace(/href="wp:([^"]*)"/g, (_, p) => `href="${resolve(p)}"`)
    .replace(/asset:([\w./-]+)/g, (_, f) => asset(f));
}

// ---------- rendering ----------
const alternatesOf = (rec, pathFn) => Object.values(rec.tr).map((t) => ({ lang: t.lang, href: pathFn(t) }));

const card = (ctx, p) => `<article class="post-card">
  <a class="post-img" href="${postPath(p)}" tabindex="-1" aria-hidden="true">${p.image ? `<img src="${asset(p.image.src640)}" alt="" width="640" height="${Math.round(640 * p.image.h / p.image.w)}" loading="lazy" decoding="async">` : ''}</a>
  <div class="post-body">
    <p class="post-meta"><span class="post-sec">${esc(ctx.t(`blog_sec_${p.section}`))}</span> · <time datetime="${p.published}">${esc(formatDate(p.published, p.lang))}</time></p>
    <h2 class="post-title"><a href="${postPath(p)}">${esc(p.title)}</a></h2>
    <p>${esc(p.description)}</p>
  </div>
</article>`;

const blogLd = (ctx, list, url, name) => ({
  '@context': 'https://schema.org', '@type': 'Blog', name, url: ctx.settings.siteUrl + url, inLanguage: ctx.lang,
  publisher: { '@id': `${ctx.settings.siteUrl}${BASE}/#org` },
  blogPost: list.slice(0, 20).map((p) => ({ '@type': 'BlogPosting', headline: p.title, url: ctx.settings.siteUrl + postPath(p), datePublished: p.published })),
});

/** Blog index (section = null) or one section, in ctx.lang. */
export function renderBlogIndex(ctx, posts, section = null) {
  const { t, lang } = ctx;
  const all = postsIn(posts, lang);
  const list = section ? all.filter((p) => p.section === section) : all;
  const url = section ? sectionPath(section, lang) : blogPath(lang);
  const h1 = section ? t(`blog_sec_${section}_h1`) : t('blog_h1');
  const desc = section ? t(`blog_sec_${section}_desc`) : t('blog_desc');
  const crumbs = [
    { name: t('breadcrumb_home'), href: pageUrl(lang, 'home') },
    { name: t('nav_blog'), href: blogPath(lang) },
    ...(section ? [{ name: t(`blog_sec_${section}`), href: url }] : []),
  ];
  const tabs = [[null, t('blog_all'), blogPath(lang)], ...SECTION_KEYS.map((k) => [k, t(`blog_sec_${k}`), sectionPath(k, lang)])]
    .map(([k, name, href]) => `<li><a class="btn btn-pill ${k === section ? 'btn-blue' : 'btn-outline-blue'}" href="${href}"${k === section ? ' aria-current="page"' : ''}>${esc(name)}</a></li>`).join('');
  const body = `<section class="page-hero"><div class="wrap">
  ${breadcrumbs(crumbs)}
  <h1>${esc(h1)}</h1>
  <span class="dots" aria-hidden="true"><i></i><i></i></span>
  <p class="lead">${esc(desc)}</p>
  <ul class="blog-tabs">${tabs}</ul>
</div></section>
<section class="wrap block-sm">
  <div class="post-grid">${list.map((p) => card(ctx, p)).join('')}</div>
</section>`;
  const langsWithPosts = LANG_CODES.filter((l) => postsIn(posts, l).length);
  return layout(ctx, {
    page: 'blog', path: url,
    alts: langsWithPosts.map((l) => ({ lang: l, href: section ? sectionPath(section, l) : blogPath(l) })),
    title: fitTitle(section ? `${h1} | Alimat Group` : t('blog_title'), h1), description: fitDesc(desc), body,
    jsonld: [breadcrumbLd(ctx.settings, crumbs), blogLd(ctx, list, url, h1)],
  });
}

/** `post` is the localized record (post.tr[lang]). */
export function renderPost(ctx, post, posts, resolveLinks) {
  const { t, settings, lang } = ctx;
  const url = postPath(post);
  const crumbs = [
    { name: t('breadcrumb_home'), href: pageUrl(lang, 'home') },
    { name: t('nav_blog'), href: blogPath(lang) },
    { name: t(`blog_sec_${post.section}`), href: sectionPath(post.section, lang) },
    { name: post.title, href: url },
  ];
  const related = postsIn(posts, lang).filter((p) => p.id !== post.id && p.section === post.section).slice(0, 3);
  const img = post.image;
  const imgSrcset = img ? `${asset(img.src640)} 640w, ${asset(img.src)} ${img.w}w` : '';
  const ld = {
    '@context': 'https://schema.org', '@type': 'BlogPosting',
    headline: post.title, description: post.description, inLanguage: lang,
    datePublished: post.published, dateModified: post.modified || post.published,
    mainEntityOfPage: settings.siteUrl + url,
    author: { '@type': 'Organization', name: settings.brand, url: `${settings.siteUrl}${BASE}/` },
    publisher: { '@id': `${settings.siteUrl}${BASE}/#org` },
    ...(img && { image: { '@type': 'ImageObject', url: settings.siteUrl + asset(img.src), width: img.w, height: img.h } }),
    ...(lang === BLOG_LANG && post.keywords?.length && { keywords: post.keywords.join(', ') }),
  };
  const body = `<article>
<header class="page-hero post-hero"><div class="wrap wrap-narrow">
  ${breadcrumbs(crumbs)}
  <p class="post-meta"><a class="post-sec" href="${sectionPath(post.section, lang)}">${esc(t(`blog_sec_${post.section}`))}</a> · ${esc(t('blog_published'))}: <time datetime="${post.published}">${esc(formatDate(post.published, lang))}</time>${post.modified && post.modified !== post.published ? ` · ${esc(t('blog_updated'))}: <time datetime="${post.modified}">${esc(formatDate(post.modified, lang))}</time>` : ''}</p>
  <h1>${esc(post.title)}</h1>
  <span class="dots" aria-hidden="true"><i></i><i></i></span>
  <p class="lead">${esc(post.description)}</p>
</div></header>
<div class="wrap wrap-narrow post-content">
  ${img ? `<img class="post-cover" src="${asset(img.src)}" srcset="${imgSrcset}" sizes="(max-width: 800px) 100vw, 760px" width="${img.w}" height="${img.h}" alt="${esc(post.title)}" fetchpriority="high">` : ''}
  <div class="prose">${resolveLinks(post.html)}</div>
  <aside class="post-cta">
    <h2>${esc(t('blog_cta_t'))}</h2>
    <p>${esc(t('blog_cta_d'))}</p>
    <div class="hero-cta">
      <a class="btn btn-pill btn-blue" href="${pageUrl(lang, 'jobs')}">${esc(t('all_jobs'))} ${icon('arrow')}</a>
      <a class="btn btn-pill btn-orange" href="${pageUrl(lang, 'apply')}">${esc(t('cta_apply_long'))}</a>
    </div>
    ${contactButtons(ctx, { compact: true })}
  </aside>
</div>
</article>
${related.length ? `<section class="wrap block-sm"><h2>${esc(t('blog_related'))}</h2><div class="post-grid">${related.map((p) => card(ctx, p)).join('')}</div></section>` : ''}`;
  return layout(ctx, {
    page: 'blog', path: url, alts: alternatesOf(post, postPath),
    title: fitTitle(post.metaTitle, post.seoTitle, `${post.title} | Alimat Group`, post.title),
    description: fitDesc(post.description, firstText(post.html)), body,
    og: { type: 'article', published: post.published, modified: post.modified, image: img && { url: asset(img.src), width: img.w, height: img.h }, preloadImage: img && { src: asset(img.src), srcset: imgSrcset, sizes: '(max-width: 800px) 100vw, 760px' } },
    jsonld: [breadcrumbLd(settings, crumbs), ld],
  });
}

/** `page` is the localized record (page.tr[lang]). */
export function renderLegalPage(ctx, page, resolveLinks) {
  const { t, lang } = ctx;
  const url = legalPath(page);
  const crumbs = [{ name: t('breadcrumb_home'), href: pageUrl(lang, 'home') }, { name: page.title, href: url }];
  const original = page.tr[BLOG_LANG];
  const note = lang === BLOG_LANG ? '' : `<p class="notice">${esc(t('legal_binding'))} <a href="${legalPath(original)}" hreflang="pl" lang="pl">${esc(original.title)}</a></p>`;
  const body = `<section class="page-hero"><div class="wrap wrap-narrow">
  ${breadcrumbs(crumbs)}
  <h1>${esc(page.title)}</h1>
</div></section>
<div class="wrap wrap-narrow block-sm">${note}<div class="prose">${resolveLinks(page.html)}</div></div>`;
  return layout(ctx, {
    page: 'legal', path: url, alts: alternatesOf(page, legalPath),
    title: fitTitle(`${page.title} | Alimat Group`, page.title),
    description: fitDesc(page.description, firstText(page.html)), body,
    jsonld: [breadcrumbLd(ctx.settings, crumbs)],
  });
}

/** Builds every blog/legal page; returns [{ file, html }] plus sitemap entries. */
export function buildBlog({ posts, pages, jobs, legacyMap, makeCtx }) {
  const out = [];
  const sitemap = [];
  const altsOf = (rec, fn) => Object.values(rec.tr).map((t) => ({ lang: t.lang, href: fn(t) }));
  for (const lang of LANG_CODES) {
    const list = postsIn(posts, lang);
    const ctx = makeCtx(lang);
    const resolve = makeLinkResolver(lang, { posts, pages, jobs, legacyMap });
    if (list.length) {
      const langs = LANG_CODES.filter((l) => postsIn(posts, l).length);
      out.push({ path: blogPath(lang), html: renderBlogIndex(ctx, posts) });
      sitemap.push({ path: blogPath(lang), lastmod: list[0].modified, alts: langs.map((l) => ({ lang: l, href: blogPath(l) })) });
      for (const sec of SECTION_KEYS) {
        out.push({ path: sectionPath(sec, lang), html: renderBlogIndex(ctx, posts, sec) });
        sitemap.push({ path: sectionPath(sec, lang), lastmod: list.find((p) => p.section === sec)?.modified, alts: langs.map((l) => ({ lang: l, href: sectionPath(sec, l) })) });
      }
    }
    for (const p of list) {
      out.push({ path: postPath(p), html: renderPost(ctx, p, posts, resolve) });
      sitemap.push({ path: postPath(p), lastmod: p.modified || p.published, alts: altsOf(p, postPath) });
    }
    for (const page of pages.filter((pg) => pg.tr[lang]).map((pg) => pg.tr[lang])) {
      out.push({ path: legalPath(page), html: renderLegalPage(ctx, page, resolve) });
      sitemap.push({ path: legalPath(page), lastmod: page.modified, alts: altsOf(page, legalPath) });
    }
  }
  return { out, sitemap };
}
