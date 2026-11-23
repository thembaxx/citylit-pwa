#!/usr/bin/env node
/**
 * Histogram check for the 3D visual matrix: flags frames with clipped highlights
 * (>1% near-white pixels) or crushed blacks (>1% near-black pixels).
 * Decodes JPEGs in a CDP page canvas — no image dependency in the repo.
 *
 * Usage: node scripts/check-exposure.mjs <dir> [--top 10]
 */
import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { parseArgs } from 'node:util';

const { values, positionals } = parseArgs({
  options: { cdp: { type: 'string', default: 'http://127.0.0.1:9222' }, top: { type: 'string', default: '10' } },
  allowPositionals: true,
});
if (!positionals[0]) {
  console.error('Usage: node scripts/check-exposure.mjs <dir> [--top 10]');
  process.exit(1);
}
const dir = resolve(positionals[0]);
const topN = Number(values.top) || 10;
const files = readdirSync(dir).filter((f) => /\.jpe?g$/i.test(f)).sort();
if (!files.length) throw new Error(`No JPEGs in ${dir}`);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const target = await (await fetch(`${values.cdp}/json/new?about:blank`, { method: 'PUT' })).json();
const ws = new WebSocket(target.webSocketDebuggerUrl);
let id = 0;
const pending = new Map();
ws.addEventListener('message', (ev) => {
  const msg = JSON.parse(ev.data);
  if (msg.id && pending.has(msg.id)) {
    const { resolve: ok, reject: no } = pending.get(msg.id);
    pending.delete(msg.id);
    if (msg.error) no(new Error(JSON.stringify(msg.error)));
    else ok(msg.result);
  }
});
await new Promise((r) => ws.addEventListener('open', r, { once: true }));
const send = (method, params = {}) => {
  const n = ++id;
  ws.send(JSON.stringify({ id: n, method, params }));
  return new Promise((ok, no) => pending.set(n, { resolve: ok, reject: no }));
};
const evaluate = async (expression) => {
  const r = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || 'evaluation failed');
  return r.result.value;
};

try {
  await send('Page.enable');
  await send('Page.navigate', { url: 'http://localhost:3000/?_hist=' + Date.now() });
  for (let i = 0; i < 120; i++) {
    await sleep(500);
    try {
      if (await evaluate('Boolean(document.createElement("canvas").getContext("2d"))')) break;
    } catch {
      /* navigating */
    }
  }

  const results = [];
  for (const file of files) {
    const b64 = readFileSync(resolve(dir, file)).toString('base64');
    const raw = await evaluate(`(async () => {
      const img = new Image();
      img.src = 'data:image/jpeg;base64,${b64}';
      await img.decode();
      const c = document.createElement('canvas');
      c.width = img.width; c.height = img.height;
      const x = c.getContext('2d', { willReadFrequently: true });
      x.drawImage(img, 0, 0);
      const d = x.getImageData(0, 0, c.width, c.height).data;
      let n = 0, white = 0, nearWhite = 0, black = 0, sum = 0;
      for (let i = 0; i < d.length; i += 4) {
        const r = d[i], g = d[i+1], b = d[i+2];
        n++;
        const l = 0.2126*r + 0.7152*g + 0.0722*b;
        sum += l;
        if (r >= 254 && g >= 254 && b >= 254) white++;
        if (r >= 250 && g >= 250 && b >= 250) nearWhite++;
        if (r <= 5 && g <= 5 && b <= 5) black++;
      }
      return JSON.stringify({ white: 100*white/n, nearWhite: 100*nearWhite/n,
        black: 100*black/n, luma: sum/n });
    })()`);
    results.push({ file, ...JSON.parse(raw) });
  }

  const overWhite = results.filter((r) => r.white > 1).sort((a, b) => b.white - a.white);
  const overBlack = results.filter((r) => r.black > 1).sort((a, b) => b.black - a.black);
  const round = (r) => ({
    file: r.file,
    white: +r.white.toFixed(2),
    nearWhite: +r.nearWhite.toFixed(2),
    black: +r.black.toFixed(2),
    luma: +r.luma.toFixed(1),
  });
  console.log(`Frames: ${results.length}`);
  console.log(`Mean luma: ${(results.reduce((a, r) => a + r.luma, 0) / results.length).toFixed(1)}`);
  console.log(`>1% pure white: ${overWhite.length}; >1% pure black: ${overBlack.length}`);
  console.log('Worst highlight frames:');
  for (const r of [...results].sort((a, b) => b.white - a.white).slice(0, topN)) console.log(' ', round(r));
  console.log('Worst shadow frames:');
  for (const r of [...results].sort((a, b) => b.black - a.black).slice(0, topN)) console.log(' ', round(r));
  if (overWhite.length || overBlack.length) process.exitCode = 1;
} finally {
  ws.close();
  await fetch(`${values.cdp}/json/close/${target.id}`).catch(() => {});
}
