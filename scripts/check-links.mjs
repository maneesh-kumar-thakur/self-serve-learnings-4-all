#!/usr/bin/env node
/* Link-liveness check for every read/code URL in data/catalog.js.
   Low-noise: real UA, retries, HEAD→GET fallback, and soft-passes anti-bot /
   rate-limit codes (403/429/999/…) that live pages routinely return.
   Only 404/410/5xx/DNS-failure/timeout count as broken.
   Writes link-report.md and exits 1 if any hard-broken link is found.
   Run: `npm run linkcheck`. */
import { readFileSync, writeFileSync } from 'node:fs';
import vm from 'node:vm';

const sandbox = { window: {} };
vm.createContext(sandbox);
vm.runInContext(readFileSync(new URL('../data/catalog.js', import.meta.url), 'utf8'), sandbox);
const cat = sandbox.window.CATALOG;

// Unique URL -> which tool/field(s) use it
const urls = new Map();
for (const t of cat.tools) {
  for (const [kind, o] of [['read', t.read], ['code', t.code]]) {
    if (o && o.url && /^https?:\/\//.test(o.url)) {
      if (!urls.has(o.url)) urls.set(o.url, new Set());
      urls.get(o.url).add(`${t.name} (${kind})`);
    }
  }
}

const UA = 'Mozilla/5.0 (compatible; SelfServeLearnings-linkcheck/1.0; +https://github.com/maneesh-kumar-thakur/self-serve-learnings-4-all)';
const SOFT = new Set([401, 403, 405, 406, 429, 503, 999]); // blocked / rate-limited / auth-walled → treat as alive
const RETRY_STATUS = new Set([403, 405, 501, 999]);        // retry HEAD as GET on these
const CONCURRENCY = 8;
const TIMEOUT_MS = 20000;

async function probe(url) {
  for (const method of ['HEAD', 'GET']) {
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
      const res = await fetch(url, { method, redirect: 'follow', signal: ctrl.signal, headers: { 'user-agent': UA, accept: '*/*' } });
      clearTimeout(timer);
      if (method === 'HEAD' && RETRY_STATUS.has(res.status)) continue; // some servers block HEAD; try GET
      return res.status;
    } catch (e) {
      if (method === 'GET') return 'ERR:' + ((e.cause && e.cause.code) || e.name || 'fetch');
    }
  }
  return 'ERR';
}

async function check(url) {
  let last;
  for (let i = 0; i < 3; i++) {
    last = await probe(url);
    if (typeof last === 'number' && (last < 400 || SOFT.has(last))) return last;
    await new Promise((r) => setTimeout(r, 600 * (i + 1)));
  }
  return last;
}

const entries = [...urls.keys()];
const results = [];
let idx = 0;
async function worker() { while (idx < entries.length) { const u = entries[idx++]; results.push([u, await check(u)]); } }
await Promise.all(Array.from({ length: CONCURRENCY }, worker));

const ok = (s) => typeof s === 'number' && s < 400;
const soft = (s) => typeof s === 'number' && SOFT.has(s);
const broken = results.filter(([, s]) => !ok(s) && !soft(s));
const softHits = results.filter(([, s]) => soft(s));

const stamp = new Date().toISOString().slice(0, 10);
let report = `# Link check — ${stamp}\n\n`;
report += `Checked **${entries.length}** unique URLs across ${cat.tools.length} tools.\n\n`;
report += `- ✅ OK: ${results.length - broken.length - softHits.length}\n`;
report += `- ⚠️ Soft (blocked/rate-limited, likely fine): ${softHits.length}\n`;
report += `- ❌ Broken: ${broken.length}\n`;
if (broken.length) {
  report += `\n## ❌ Broken links (${broken.length})\n\n`;
  for (const [u, s] of broken.sort((a, b) => String(a[1]).localeCompare(String(b[1])))) {
    report += `- \`${s}\` — ${u}\n  - used by: ${[...urls.get(u)].join(', ')}\n`;
  }
}
writeFileSync('link-report.md', report);
console.log(report);
process.exit(broken.length ? 1 : 0);
