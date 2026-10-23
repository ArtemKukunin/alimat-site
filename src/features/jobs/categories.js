import { readJson } from '../../core/util.js';
import { LANG_CODES } from '../../core/i18n.js';
import { CATEGORIES } from './model.js';

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const FIELDS = ['slug', 'name', 'h1', 'desc', 'intro'];

/** Job sections (data/categories.json). Slugs share the jobs/ URL space with job ids, so they must not collide. */
export function loadCategories(file, jobs) {
  const data = readJson(file);
  const errors = [];
  const jobIds = new Set(jobs.map((j) => j.id));
  for (const cat of CATEGORIES) if (!data[cat]) errors.push(`missing category "${cat}"`);
  for (const [cat, c] of Object.entries(data)) {
    if (!CATEGORIES.includes(cat)) errors.push(`unknown category "${cat}" (allowed: ${CATEGORIES.join(', ')})`);
    if (!c.icon) errors.push(`${cat}: icon is required`);
    for (const lang of LANG_CODES) {
      const tx = c[lang];
      if (!tx) { errors.push(`${cat}: missing "${lang}"`); continue; }
      for (const f of FIELDS) if (!String(tx[f] || '').trim()) errors.push(`${cat}.${lang}: "${f}" is required`);
      if (tx.slug && !SLUG_RE.test(tx.slug)) errors.push(`${cat}.${lang}: slug must be lowercase ascii with dashes`);
      if (jobIds.has(tx.slug)) errors.push(`${cat}.${lang}: slug "${tx.slug}" collides with a job id`);
    }
  }
  for (const lang of LANG_CODES) {
    const slugs = Object.values(data).map((c) => c[lang]?.slug);
    const dup = slugs.filter((s, i) => s && slugs.indexOf(s) !== i);
    if (dup.length) errors.push(`${lang}: duplicate section slugs ${dup.join(', ')}`);
  }
  if (errors.length) throw new Error(`categories.json:\n  - ${errors.join('\n  - ')}`);
  // Keep the canonical display order.
  return Object.fromEntries(CATEGORIES.map((c) => [c, data[c]]));
}
