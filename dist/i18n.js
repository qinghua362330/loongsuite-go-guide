import { enBasic } from './locales/en/basic.js';
import { enSource } from './locales/en/source.js';
import { enDemos } from './locales/en/demos.js';
import { enMaps } from './locales/en/maps.js';
import { enOfficial } from './locales/en/official.js';
import { enLabs } from './locales/en/labs.js';

export const languageStorageKey = 'loongsuite-guide-language';
export const normalizeLanguage = value => /^en(?:[-_]|$)/i.test(String(value || '')) ? 'en' : 'zh';
export function detectLanguage(search = '', saved = '') {
  const requested = new URLSearchParams(search).get('lang');
  return requested ? normalizeLanguage(requested) : normalizeLanguage(saved);
}
let savedLanguage = '';
try { if (typeof window !== 'undefined') savedLanguage = window.localStorage.getItem(languageStorageKey) || ''; } catch {}
export const locale = detectLanguage(typeof location === 'undefined' ? '' : location.search, savedLanguage);
export const isEnglish = locale === 'en';
export const t = (zh, en) => isEnglish ? en : zh;
const dictionaries = {};
for (const source of [enBasic, enSource, enDemos, enMaps, enOfficial, enLabs]) {
  for (const [domain, entries] of Object.entries(source)) Object.assign(dictionaries[domain] ||= {}, entries);
}
export function localizeData(value, domain, trail = []) {
  if (!isEnglish) return value;
  if (typeof value === 'string') {
    const key = trail.at(-1);
    // Keep executable examples, source excerpts, captured evidence and machine identifiers exact.
    if (['id', 'stage', 'href', 'path', 'url', 'command', 'snippet', 'symbol', 'evidence', 'code'].includes(key) || (key === 'output' && domain !== 'sourceLessons') || (key === 'text' && trail.at(-2) === 'code') || trail.includes('evidence')) return value;
    return dictionaries[domain]?.[value] ?? value;
  }
  if (Array.isArray(value)) return value.map((item, index) => localizeData(item, domain, [...trail, index]));
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, localizeData(item, domain, [...trail, key])]));
  return value;
}
export function languageUrl(language, href = typeof location === 'undefined' ? 'http://localhost/' : location.href) {
  const url = new URL(href); url.searchParams.set('lang', normalizeLanguage(language)); return url.href;
}
export function switchLanguage(language) {
  const selected = normalizeLanguage(language);
  try { localStorage.setItem(languageStorageKey, selected); } catch {}
  location.assign(languageUrl(selected));
}
