#!/usr/bin/env node
/**
 * Build a static before/after contact sheet from two capture-visual-matrix
 * output directories. Each row shows the baseline and the new frame for one
 * state, with the state's renderer.info/frame-time delta underneath.
 *
 * Usage:
 *   node scripts/make-contact-sheet.mjs --before docs/visual-baseline \
 *     --after docs/visual-reports/phase1 --out docs/visual-reports/phase1/contact-sheet.html
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, dirname, relative, resolve } from 'node:path';
import { parseArgs } from 'node:util';

const HELP = `
Options:
  --before <dir>   Baseline capture directory (with stats.json)
  --after <dir>    New capture directory (with stats.json)
  --out <file>     Output HTML path (default: <after>/contact-sheet.html)
  --filter <text>  Only include states whose file name contains this text
  --limit <n>      Maximum rows (default: 0 = all)
  --help           Show this help
`;

function parseCli() {
  const { values } = parseArgs({
    options: {
      before: { type: 'string' },
      after: { type: 'string' },
      out: { type: 'string' },
      filter: { type: 'string', default: '' },
      limit: { type: 'string', default: '0' },
      help: { type: 'boolean', default: false },
    },
    allowPositionals: false,
  });
  if (values.help || !values.before || !values.after) {
    process.stdout.write(HELP);
    process.exit(values.help ? 0 : 1);
  }
  const limit = Number(values.limit);
  return {
    before: resolve(values.before),
    after: resolve(values.after),
    out: resolve(values.out || resolve(values.after, 'contact-sheet.html')),
    filter: values.filter,
    limit: Number.isFinite(limit) && limit > 0 ? limit : 0,
  };
}

function loadStats(dir) {
  const path = resolve(dir, 'stats.json');
  if (!existsSync(path)) throw new Error(`Missing ${path}`);
  return JSON.parse(readFileSync(path, 'utf8'));
}

function delta(before, after) {
  if (typeof before !== 'number' || typeof after !== 'number') return '';
  const d = after - before;
  const pct = before ? ((d / before) * 100).toFixed(1) : '0.0';
  const sign = d > 0 ? '+' : '';
  return `${after.toFixed ? after.toFixed(2) : after} <span class="${d > 0 ? 'up' : d < 0 ? 'down' : ''}">(${sign}${pct}%)</span>`;
}

function main() {
  const cfg = parseCli();
  const before = loadStats(cfg.before);
  const after = loadStats(cfg.after);
  const afterByName = new Map(after.states.map((s) => [basename(s.file || ''), s]));
  let rows = before.states
    .map((s) => {
      const name = basename(s.file || '');
      const peer = afterByName.get(name);
      return peer ? { before: s, after: peer, name } : null;
    })
    .filter((r) => r && r.name.includes(cfg.filter));
  if (cfg.limit) rows = rows.slice(0, cfg.limit);

  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>Citylit visual comparison</title>
<style>
  body { margin:0; background:#0e0f13; color:#f3efe6; font:12px/1.4 system-ui,sans-serif; }
  header { position:sticky; top:0; z-index:2; padding:10px 14px; background:#161821; border-bottom:1px solid #2a2d36; }
  header h1 { margin:0 0 4px; font-size:14px; font-weight:600; }
  header p { margin:0; color:#9aa0ab; }
  .grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(420px,1fr)); gap:10px; padding:12px; }
  figure { margin:0; background:#1b1d26; border:1px solid #2a2d36; border-radius:8px; overflow:hidden; }
  .pair { display:grid; grid-template-columns:1fr 1fr; gap:2px; background:#000; }
  .pair img { width:100%; height:auto; display:block; }
  figcaption { padding:6px 8px; }
  .title { font-weight:600; margin-bottom:3px; }
  .stats { color:#9aa0ab; font-variant-numeric:tabular-nums; }
  .up { color:#e8a24a; } .down { color:#6ecb8a; }
</style></head><body>
<header><h1>Citylit visual comparison — ${esc(basename(cfg.before))} → ${esc(basename(cfg.after))}</h1>
<p>${rows.length} matching states. Left: baseline. Right: new. Deltas are calls / triangles / mean frame time.</p></header>
<div class="grid">
${rows
  .map(({ before: b, after: a, name }) => {
    const bImg = relative(dirname(cfg.out), resolve(cfg.before, b.file || '')).replace(/\\/g, '/');
    const aImg = relative(dirname(cfg.out), resolve(cfg.after, a.file || '')).replace(/\\/g, '/');
    return `<figure>
  <div class="pair"><img loading="lazy" src="${esc(bImg)}" alt="baseline"><img loading="lazy" src="${esc(aImg)}" alt="new"></div>
  <figcaption><div class="title">${esc(name.replace(/\.jpg$/, ''))}</div>
  <div class="stats">calls ${delta(b.calls, a.calls)} · tris ${delta(b.triangles, a.triangles)} · ms ${delta(b.frameMs, a.frameMs)} · programs ${a.programs}</div></figcaption>
</figure>`;
  })
  .join('\n')}
</div></body></html>
`;
  mkdirSync(dirname(cfg.out), { recursive: true });
  writeFileSync(cfg.out, html);
  console.log(`contact sheet: ${cfg.out} (${rows.length} rows)`);
}

try {
  main();
} catch (e) {
  console.error(`FAILED: ${e?.message || e}`);
  process.exitCode = 1;
}
