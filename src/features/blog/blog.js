// Blog + legal pages imported from the old WordPress site.
// Polish only, on the same URLs as before (/{slug}/, /blog/, /category/…) so existing rankings carry over.
import fs from 'node:fs';
import path from 'node:path';
import { pageUrl, asset, BASE } from '../../core/i18n.js';
import { esc, readJson, formatDate, fitTitle, fitDesc } from '../../core/util.js';

const firstText = (html) => (html.match(/<p>([\s\S]*?)<\/p>/)?.[1] || '').replace(/<[^>]+>/g, '');
import { icon } from '../../core/icons.js';
import { layout, breadcrumbs, breadcrumbLd, contactButtons } from '../../core/layout.js';

export const BLOG_LANG = 'pl';
const SECTIONS = {
  candidates: { slug: 'dla-kandydatow', name: 'Dla kandydatów', h1: 'Blog dla kandydatów: praca i życie w Polsce', desc: 'Poradniki dla osób szukających pracy w Polsce: dokumenty, zakwaterowanie, zarobki, prawa pracownika i życie codzienne.' },
  employers: { slug: 'dla-firm', name: 'Dla firm', h1: 'Blog dla firm: rekrutacja i zatrudnianie', desc: 'Artykuły dla pracodawców: rekrutacja, zatrudnianie cudzoziemców, rotacja pracowników i współpraca z agencją pracy.' },
};
const BLOG = {
  h1: 'Blog o pracy w Polsce', title: 'Blog o pracy w Polsce – poradniki dla kandydatów i firm | Alimat Group',
  desc: 'Poradniki Alimat Group o pracy w Polsce: legalne zatrudnienie, dokumenty, zakwaterowanie, zarobki oraz rekrutacja i zatrudnianie cudzoziemców.',
  all: 'Wszystkie', read: 'Czytaj dalej', related: 'Przeczytaj też', updated: 'Aktualizacja', published: 'Opublikowano',
  ctaT: 'Szukasz pracy w Polsce?', ctaD: 'Sprawdź aktualne oferty albo zostaw zgłoszenie — rekruter dobierze pracę dla Ciebie.',
};

export const blogPath = () => `${BASE}/blog/`;
export const postPath = (slug) => `${BASE}/${slug}/`;
export const sectionPath = (sec) => `${BASE}/category/${SECTIONS[sec].slug}/`;

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function loadDir(dir, required) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter((f) => f.endsWith('.json')).map((f) => {
    const rec = readJson(path.join(dir, f));
    const errors = required.filter((k) => !rec[k]).map((k) => `"${k}" is required`);
    if (!SLUG_RE.test(rec.slug || '')) errors.push('slug must be lowercase ascii');
    if (rec.slug !== path.basename(f, '.json')) errors.push('slug must match the file name');
    if (errors.length) throw new Error(`${dir}/${f}: ${errors.join('; ')}`);
    return rec;
  });
}

export function loadContent(dataDir) {
  const posts = loadDir(path.join(dataDir, 'blog'), ['slug', 'title', 'description', 'published', 'section', 'html'])
    .sort((a, b) => b.published.localeCompare(a.published));
  for (const p of posts) if (!SECTIONS[p.section]) throw new Error(`blog/${p.slug}: unknown section "${p.section}"`);
  const pages = loadDir(path.join(dataDir, 'pages'), ['slug', 'title', 'html']);
  return { posts, pages };
}

/** Rewrites links/images kept from WordPress ("wp:/old-path/", "asset:file") to the new site. */
export function makeLinkResolver(ctx, { posts, pages, jobs, legacyMap }) {
  const local = new Set([...posts.map((p) => p.slug), ...pages.map((p) => p.slug)]);
  const jobIds = new Set(jobs.map((j) => j.id));
  const pl = (p, s) => pageUrl(BLOG_LANG, p, s);
  const resolve = (oldPath) => {
    const [p, hash] = oldPath.split('#');
    const seg = p.split('/').filter(Boolean);
    let to;
    if (!seg.length) to = pl('home');
    else if (seg.length === 1 && local.has(seg[0])) to = postPath(seg[0]);
    else if (seg[0] === 'blog') to = blogPath();
    else if (seg[0] === 'category' && seg[1] === 'dla-firm') to = sectionPath('employers');
    else if (seg[0] === 'category' || seg[0] === 'tag') to = seg[1] === 'dla-kandydatow' ? sectionPath('candidates') : blogPath();
    else if (seg[0] === 'oferta' && jobIds.has(seg[1])) to = pl('jobs', seg[1]);
    else if (seg[0] === 'wp-content') to = `${BASE}${p}`;
    else to = legacyMap(`/${seg[0]}/`) || pl('home');
    return to + (hash ? `#${hash}` : '');
  };
  return (html) => html
    .replace(/href="wp:([^"]*)"/g, (_, p) => `href="${resolve(p)}"`)
    .replace(/asset:([\w./-]+)/g, (_, f) => asset(f));
}

const card = (p) => `<article class="post-card">
  <a class="post-img" href="${postPath(p.slug)}" tabindex="-1" aria-hidden="true">${p.image ? `<img src="${asset(p.image.src640)}" alt="" width="640" height="${Math.round(640 * p.image.h / p.image.w)}" loading="lazy" decoding="async">` : ''}</a>
  <div class="post-body">
    <p class="post-meta"><span class="post-sec">${esc(SECTIONS[p.section].name)}</span> · <time datetime="${p.published}">${esc(formatDate(p.published, BLOG_LANG))}</time></p>
    <h2 class="post-title"><a href="${postPath(p.slug)}">${esc(p.title)}</a></h2>
    <p>${esc(p.description)}</p>
  </div>
</article>`;

const blogLd = (ctx, list, url, name) => ({
  '@context': 'https://schema.org', '@type': 'Blog', name, url: ctx.settings.siteUrl + url, inLanguage: BLOG_LANG,
  publisher: { '@id': `${ctx.settings.siteUrl}${BASE}/#org` },
  blogPost: list.slice(0, 20).map((p) => ({ '@type': 'BlogPosting', headline: p.title, url: ctx.settings.siteUrl + postPath(p.slug), datePublished: p.published })),
});

/** Blog index (section = null) or one of the two old WordPress categories. */
export function renderBlogIndex(ctx, posts, section = null) {
  const { t } = ctx;
  const list = section ? posts.filter((p) => p.section === section) : posts;
  const s = section && SECTIONS[section];
  const url = section ? sectionPath(section) : blogPath();
  const crumbs = [
    { name: t('breadcrumb_home'), href: pageUrl(BLOG_LANG, 'home') },
    { name: 'Blog', href: blogPath() },
    ...(s ? [{ name: s.name, href: url }] : []),
  ];
  const tabs = [[null, BLOG.all, blogPath()], ...Object.keys(SECTIONS).map((k) => [k, SECTIONS[k].name, sectionPath(k)])]
    .map(([k, name, href]) => `<li><a class="btn btn-pill ${k === section ? 'btn-blue' : 'btn-outline-blue'}" href="${href}"${k === section ? ' aria-current="page"' : ''}>${esc(name)}</a></li>`).join('');
  const body = `<section class="page-hero"><div class="wrap">
  ${breadcrumbs(crumbs)}
  <h1>${esc(s ? s.h1 : BLOG.h1)}</h1>
  <span class="dots" aria-hidden="true"><i></i><i></i></span>
  <p class="lead">${esc(s ? s.desc : BLOG.desc)}</p>
  <ul class="blog-tabs">${tabs}</ul>
</div></section>
<section class="wrap block-sm">
  <div class="post-grid">${list.map(card).join('')}</div>
</section>`;
  return layout(ctx, {
    page: 'blog', path: url,
    title: fitTitle(s ? `${s.h1} | Alimat Group` : BLOG.title, s ? s.h1 : BLOG.h1), description: fitDesc(s ? s.desc : BLOG.desc), body,
    jsonld: [breadcrumbLd(ctx.settings, crumbs), blogLd(ctx, list, url, s ? s.h1 : BLOG.h1)],
  });
}

export function renderPost(ctx, post, posts, resolveLinks) {
  const { t, settings } = ctx;
  const url = postPath(post.slug);
  const sec = SECTIONS[post.section];
  const crumbs = [
    { name: t('breadcrumb_home'), href: pageUrl(BLOG_LANG, 'home') },
    { name: 'Blog', href: blogPath() },
    { name: sec.name, href: sectionPath(post.section) },
    { name: post.title, href: url },
  ];
  const related = posts.filter((p) => p.slug !== post.slug && p.section === post.section).slice(0, 3);
  const img = post.image;
  const imgSrcset = img ? `${asset(img.src640)} 640w, ${asset(img.src)} ${img.w}w` : '';
  const ld = {
    '@context': 'https://schema.org', '@type': 'BlogPosting',
    headline: post.title, description: post.description, inLanguage: BLOG_LANG,
    datePublished: post.published, dateModified: post.modified || post.published,
    mainEntityOfPage: settings.siteUrl + url,
    author: { '@type': 'Organization', name: settings.brand, url: `${settings.siteUrl}${BASE}/` },
    publisher: { '@id': `${settings.siteUrl}${BASE}/#org` },
    ...(img && { image: { '@type': 'ImageObject', url: settings.siteUrl + asset(img.src), width: img.w, height: img.h } }),
    ...(post.keywords?.length && { keywords: post.keywords.join(', ') }),
  };
  const body = `<article>
<header class="page-hero post-hero"><div class="wrap wrap-narrow">
  ${breadcrumbs(crumbs)}
  <p class="post-meta"><a class="post-sec" href="${sectionPath(post.section)}">${esc(sec.name)}</a> · ${esc(BLOG.published)}: <time datetime="${post.published}">${esc(formatDate(post.published, BLOG_LANG))}</time>${post.modified && post.modified !== post.published ? ` · ${esc(BLOG.updated)}: <time datetime="${post.modified}">${esc(formatDate(post.modified, BLOG_LANG))}</time>` : ''}</p>
  <h1>${esc(post.title)}</h1>
  <span class="dots" aria-hidden="true"><i></i><i></i></span>
  <p class="lead">${esc(post.description)}</p>
</div></header>
<div class="wrap wrap-narrow post-content">
  ${img ? `<img class="post-cover" src="${asset(img.src)}" srcset="${imgSrcset}" sizes="(max-width: 800px) 100vw, 760px" width="${img.w}" height="${img.h}" alt="${esc(post.title)}" fetchpriority="high">` : ''}
  <div class="prose">${resolveLinks(post.html)}</div>
  <aside class="post-cta">
    <h2>${esc(BLOG.ctaT)}</h2>
    <p>${esc(BLOG.ctaD)}</p>
    <div class="hero-cta">
      <a class="btn btn-pill btn-blue" href="${pageUrl(BLOG_LANG, 'jobs')}">${esc(t('all_jobs'))} ${icon('arrow')}</a>
      <a class="btn btn-pill btn-orange" href="${pageUrl(BLOG_LANG, 'apply')}">${esc(t('cta_apply_long'))}</a>
    </div>
    ${contactButtons(ctx, { compact: true })}
  </aside>
</div>
</article>
${related.length ? `<section class="wrap block-sm"><h2>${esc(BLOG.related)}</h2><div class="post-grid">${related.map(card).join('')}</div></section>` : ''}`;
  return layout(ctx, {
    page: 'blog', path: url,
    title: fitTitle(post.metaTitle, post.seoTitle, `${post.title} | Alimat Group`, post.title),
    description: fitDesc(post.description, firstText(post.html)), body,
    og: { type: 'article', published: post.published, modified: post.modified, image: img && { url: asset(img.src), width: img.w, height: img.h }, preloadImage: img && { src: asset(img.src), srcset: imgSrcset, sizes: '(max-width: 800px) 100vw, 760px' } },
    jsonld: [breadcrumbLd(settings, crumbs), ld],
  });
}

export function renderLegalPage(ctx, page, resolveLinks) {
  const { t } = ctx;
  const url = postPath(page.slug);
  const crumbs = [{ name: t('breadcrumb_home'), href: pageUrl(BLOG_LANG, 'home') }, { name: page.title, href: url }];
  const body = `<section class="page-hero"><div class="wrap wrap-narrow">
  ${breadcrumbs(crumbs)}
  <h1>${esc(page.title)}</h1>
</div></section>
<div class="wrap wrap-narrow block-sm"><div class="prose">${resolveLinks(page.html)}</div></div>`;
  return layout(ctx, {
    page: 'legal', path: url, title: fitTitle(`${page.title} | Alimat Group`, page.title),
    description: fitDesc(page.description, firstText(page.html)), body,
    jsonld: [breadcrumbLd(ctx.settings, crumbs)],
  });
}

export const blogSitemapEntries = (posts, pages) => [
  { path: blogPath(), lastmod: posts[0]?.modified },
  ...Object.keys(SECTIONS).map((s) => ({ path: sectionPath(s), lastmod: posts.find((p) => p.section === s)?.modified })),
  ...posts.map((p) => ({ path: postPath(p.slug), lastmod: p.modified || p.published })),
  ...pages.map((p) => ({ path: postPath(p.slug), lastmod: p.modified })),
];
