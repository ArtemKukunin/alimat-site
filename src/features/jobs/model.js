import fs from 'node:fs';
import path from 'node:path';
import { readJson } from '../../core/util.js';
import { LANG_CODES, DEFAULT_LANG } from '../../core/i18n.js';

export const CATEGORIES = ['production', 'meat', 'agriculture', 'kitchen', 'drivers', 'logistics'];
export const CONTRACTS = ['employment', 'mandate', 'b2b'];
export const TAGS =['housing', 'transport', 'meals', 'coordinator'];
export const TEXT_FIELDS = ['title', 'summary', 'duties', 'requirements', 'offer', 'conditions'];
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Job file format (Decap CMS i18n "single_file"):
 * { "pl": { shared fields + Polish text }, "uk": { text }, ... }
 */
export function validateJob(id, raw) {
  const errors = [];
  const base = raw[DEFAULT_LANG];
  if (!SLUG_RE.test(id)) errors.push(`file name must be a lowercase-ascii slug`);
  if (!base) return [...errors, `missing "${DEFAULT_LANG}" block`];
  if (typeof base.active !== 'boolean') errors.push('active must be true/false');
  if (!CATEGORIES.includes(base.category)) errors.push(`category must be one of ${CATEGORIES.join(', ')}`);
  if (!base.city) errors.push('city is required (use "*" for various cities)');
  if (!/^[A-Z]{2}$/.test(base.country || '')) errors.push('country must be a 2-letter code');
  if (!DATE_RE.test(base.datePosted || '')) errors.push('datePosted must be YYYY-MM-DD');
  if (base.validThrough && !DATE_RE.test(base.validThrough)) errors.push('validThrough must be YYYY-MM-DD');
  const s = base.salary;
  if (!s || !(s.min > 0) || (s.max && s.max < s.min) || !['hour', 'month'].includes(s.unit)) {
    errors.push('salary needs min > 0, max >= min (optional), unit hour|month');
  }
  if (s && 'net' in s && typeof s.net !== 'boolean') errors.push('salary.net must be true/false');
  if (base.contract && !CONTRACTS.includes(base.contract)) errors.push(`contract must be one of ${CONTRACTS.join(', ')}`);
  for (const tag of base.tags || []) if (!TAGS.includes(tag)) errors.push(`unknown tag "${tag}"`);
  for (const lang of LANG_CODES) {
    const tx = raw[lang];
    if (!tx?.title || !tx?.summary) errors.push(`${lang}: title and summary are required`);
    for (const f of ['duties', 'requirements', 'offer', 'conditions']) {
      const own = tx?.[f] || [];
      const ref = base[f] || [];
      if (own.length !== ref.length) errors.push(`${lang}: "${f}" has ${own.length} items, Polish has ${ref.length}`);
    }
  }
  return errors;
}

export function loadJobs(dir) {
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.json')).sort();
  const jobs = files.map((f) => {
    const id = path.basename(f, '.json');
    const raw = readJson(path.join(dir, f));
    const errors = validateJob(id, raw);
    if (errors.length) throw new Error(`Job "${id}":\n  - ${errors.join('\n  - ')}`);
    const base = raw[DEFAULT_LANG];
    const text = Object.fromEntries(LANG_CODES.map((l) => [l, Object.fromEntries(
      TEXT_FIELDS.map((f) => [f, raw[l][f] ?? (Array.isArray(base[f]) ? [] : '')]),
    )]));
    return {
      id,
      active: base.active,
      category: base.category,
      city: base.city,
      region: base.region || '',
      country: base.country,
      datePosted: base.datePosted,
      validThrough: base.validThrough || '',
      salary: base.salary,
      contract: base.contract || '',
      tags: base.tags || [],
      text,
    };
  });
  // Newest first
  return jobs.sort((a, b) => b.datePosted.localeCompare(a.datePosted));
}
