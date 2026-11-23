#!/usr/bin/env node
/**
 * Compare two capture-visual-matrix stats.json files and report budget deltas.
 * Usage: node scripts/compare-metrics.mjs <before.json> <after.json>
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const [, , beforePath, afterPath] = process.argv;
if (!beforePath || !afterPath) {
  console.error('Usage: node scripts/compare-metrics.mjs <before.json> <after.json>');
  process.exit(1);
}
const read = (p) => JSON.parse(readFileSync(resolve(p), 'utf8'));
const before = read(beforePath);
const after = read(afterPath);
const key = (s) => s.file?.split(/[\\/]/).pop() || `${s.index}-${s.hour}-${s.weather}-${s.tier}-${s.viewport}`;
const afterByKey = new Map(after.states.map((s) => [key(s), s]));

const rows = before.states
  .map((b) => {
    const a = afterByKey.get(key(b));
    if (!a) return null;
    return {
      name: key(b),
      dCalls: a.calls - b.calls,
      dTris: a.triangles - b.triangles,
      dPrograms: a.programs - b.programs,
      dMs: a.frameMs - b.frameMs,
      beforeMs: b.frameMs,
      afterMs: a.frameMs,
    };
  })
  .filter(Boolean);

if (!rows.length) throw new Error('No matching states found');
const max = (field) => Math.max(...rows.map((r) => Math.abs(r[field])));
const mean = (field) => rows.reduce((a, r) => a + r[field], 0) / rows.length;
const p95 = (field) => {
  const sorted = rows.map((r) => r[field]).sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length * 0.95)];
};
const pct = (field, denominator) => mean(field) / denominator * 100;

const worstCalls = [...rows].sort((a, b) => Math.abs(b.dCalls) - Math.abs(a.dCalls)).slice(0, 5);
const worstMs = [...rows].sort((a, b) => b.dMs - a.dMs).slice(0, 5);

console.log(`Matched states: ${rows.length}`);
console.log(
  `draw calls:    mean ${mean('dCalls').toFixed(2)}, max |delta| ${max('dCalls')}, worst: ` +
    worstCalls.map((r) => `${r.name} ${r.dCalls > 0 ? '+' : ''}${r.dCalls}`).join(', ')
);
console.log(`triangles:     mean ${mean('dTris').toFixed(0)}, max |delta| ${max('dTris')}`);
console.log(
  `programs:      mean ${mean('dPrograms').toFixed(2)}, max |delta| ${max('dPrograms')} ` +
    `(a program increase is a hard budget breach)`
);
console.log(
  `frame time:    mean ${mean('dMs').toFixed(2)} ms (${pct('dMs', mean('beforeMs')).toFixed(1)}%), ` +
    `p95 ${p95('dMs').toFixed(2)} ms, worst: ` +
    worstMs.map((r) => `${r.name} ${r.dMs > 0 ? '+' : ''}${r.dMs.toFixed(1)}ms`).join(', ')
);

const breaches = rows.filter((r) => r.dPrograms > 0);
if (breaches.length) {
  console.error(`PROGRAM REGRESSIONS: ${breaches.length} state(s)`);
  process.exitCode = 1;
} else {
  console.log('Program count: PASS (no state increased shader programs).');
}
