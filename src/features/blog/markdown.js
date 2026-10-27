// Minimal Markdown → HTML for blog posts written in the admin panel (Decap "markdown" widget).
// Supports what the editor produces: ## headings, paragraphs, - / 1. lists, > quotes, **bold**, *italic*,
// [links](url), ![images](url). Raw HTML is escaped, so editors cannot inject markup or scripts.
import { esc } from '../../core/util.js';

const SAFE_URL = /^(https?:\/\/|mailto:|tel:|\/|#)/i;

function inline(text) {
  let s = esc(text);
  s = s.replace(/!\[([^\]]*)\]\(([^)\s]+)(?:\s+&quot;[^&]*&quot;)?\)/g, (m, alt, url) =>
    (SAFE_URL.test(url) ? `<img src="${url}" alt="${alt}" loading="lazy" decoding="async">` : alt));
  s = s.replace(/\[([^\]]+)\]\(([^)\s]+)(?:\s+&quot;[^&]*&quot;)?\)/g, (m, label, url) =>
    (SAFE_URL.test(url) ? `<a href="${url}"${/^https?:/i.test(url) ? ' target="_blank" rel="noopener"' : ''}>${label}</a>` : label));
  s = s.replace(/\*\*(.+?)\*\*|__(.+?)__/g, (m, a, b) => `<strong>${a || b}</strong>`);
  s = s.replace(/(^|[^*\w])\*(?!\s)(.+?)\*(?!\w)/g, '$1<em>$2</em>').replace(/(^|\W)_(?!\s)(.+?)_(?!\w)/g, '$1<em>$2</em>');
  return s.replace(/ {2,}\n|\\\n/g, '<br>').replace(/\n/g, ' ');
}

export function markdownToHtml(md) {
  const lines = String(md).replace(/\r\n?/g, '\n').split('\n');
  const out = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) { i++; continue; }
    const h = line.match(/^(#{2,4})\s+(.*)$/) || line.match(/^(#)\s+(.*)$/);
    if (h) {
      const level = Math.max(2, h[1].length); // the post title is the page's only h1
      out.push(`<h${level}>${inline(h[2].trim())}</h${level}>`);
      i++;
      continue;
    }
    const list = line.match(/^\s*([-*+]|\d+[.)])\s+/);
    if (list) {
      const ordered = /\d/.test(list[1]);
      const re = ordered ? /^\s*\d+[.)]\s+(.*)$/ : /^\s*[-*+]\s+(.*)$/;
      const items = [];
      while (i < lines.length && re.test(lines[i])) {
        let item = lines[i].match(re)[1];
        i++;
        while (i < lines.length && /^\s{2,}\S/.test(lines[i]) && !re.test(lines[i])) item += `\n${lines[i++].trim()}`;
        items.push(`<li>${inline(item)}</li>`);
      }
      out.push(`<${ordered ? 'ol' : 'ul'}>${items.join('')}</${ordered ? 'ol' : 'ul'}>`);
      continue;
    }
    if (/^>\s?/.test(line)) {
      const quote = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) quote.push(lines[i++].replace(/^>\s?/, ''));
      out.push(`<blockquote><p>${inline(quote.join('\n'))}</p></blockquote>`);
      continue;
    }
    const para = [];
    while (i < lines.length && lines[i].trim() && !/^(#{1,4}\s|>|\s*([-*+]|\d+[.)])\s)/.test(lines[i])) para.push(lines[i++]);
    out.push(`<p>${inline(para.join('\n'))}</p>`);
  }
  return out.join('\n');
}
