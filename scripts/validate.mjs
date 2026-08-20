#!/usr/bin/env node
/* Structural validation for data/catalog.js — fast, no network.
   Fails (exit 1) if any tool is malformed. Run: `npm run validate`. */
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const url = new URL('../data/catalog.js', import.meta.url);
let cat;
try {
  const sandbox = { window: {} };
  vm.createContext(sandbox);
  vm.runInContext(readFileSync(url, 'utf8'), sandbox);
  cat = sandbox.window.CATALOG;
} catch (e) {
  console.error('❌ data/catalog.js failed to parse:', e.message);
  process.exit(1);
}

if (!cat || !Array.isArray(cat.tools)) {
  console.error('❌ window.CATALOG.tools is missing or not an array.');
  process.exit(1);
}

const definedLevels = new Set((cat.levels || []).map((l) => l.n));
const definedTopics = new Set((cat.topics || []).map((t) => t.id));
const errors = [];
const seen = new Map();

cat.tools.forEach((t, i) => {
  const where = `#${i} "${(t && t.name) || '?'}"`;
  if (!t || typeof t !== 'object') { errors.push(`${where}: not an object`); return; }
  if (!t.name) errors.push(`${where}: missing name`);
  if (![0, 1, 2, 3, 4].includes(t.level)) errors.push(`${where}: level must be 0–4 (got ${JSON.stringify(t.level)})`);
  else if (definedLevels.size && !definedLevels.has(t.level)) errors.push(`${where}: level ${t.level} not defined in levels[]`);
  if (!t.category) errors.push(`${where}: missing category`);
  for (const k of ['read', 'code']) {
    if (!t[k] || !t[k].url) errors.push(`${where}: missing ${k}.url`);
    else if (!/^https:\/\//.test(t[k].url)) errors.push(`${where}: ${k}.url is not https (${t[k].url})`);
  }
  const topic = t.topic || 'llms';
  if (definedTopics.size && !definedTopics.has(topic)) errors.push(`${where}: unknown topic "${topic}"`);
  if (t.name) {
    const key = topic + '::' + t.name.toLowerCase();
    if (seen.has(key)) errors.push(`${where}: duplicate name in topic "${topic}" (also at ${seen.get(key)})`);
    else seen.set(key, where);
  }
});

const byLevel = {};
cat.tools.forEach((t) => { byLevel[t.level] = (byLevel[t.level] || 0) + 1; });
const byTopic = {};
cat.tools.forEach((t) => { const tp = t.topic || 'llms'; byTopic[tp] = (byTopic[tp] || 0) + 1; });
const cats = new Set(cat.tools.map((t) => t.category)).size;
console.log(`Catalog: ${cat.tools.length} tools · topics ${JSON.stringify(byTopic)} · levels ${JSON.stringify(byLevel)} · ${cats} categories`);

if (errors.length) {
  console.error(`\n❌ ${errors.length} structural problem(s):`);
  errors.forEach((e) => console.error('  - ' + e));
  process.exit(1);
}
console.log('✅ Structure valid.');
