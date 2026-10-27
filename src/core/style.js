// The site stylesheet, inlined into every page's <head>: no render-blocking CSS request (PageSpeed).
// The CSS is small (~37 KB, ~8 KB gzipped); fonts and images stay external and cacheable.
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { asset } from './i18n.js';

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

let cached;
/** { css, hash }: minified CSS with asset URLs made absolute (they were relative to /assets/), and its CSP hash. */
export function inlineStyle() {
  if (!cached) {
    const src = readFileSync(new URL('../../public/assets/style.css', import.meta.url), 'utf8');
    const css = minifyCss(src).replace(/url\("(?!data:|https?:|\/)([^"]+)"\)/g, (m, p) => `url("${asset(p)}")`);
    cached = { css, hash: `sha256-${createHash('sha256').update(css).digest('base64')}` };
  }
  return cached;
}

export const styleTag = () => `<style>${inlineStyle().css}</style>`;
