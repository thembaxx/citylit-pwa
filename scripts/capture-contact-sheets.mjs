#!/usr/bin/env node
/**
 * Repeatable QA capture for the Living Diorama contact sheet.
 *
 * Prerequisites (this script does NOT start or stop anything for you):
 *   1. The Vite dev server must already be running on the base URL
 *      (default http://localhost:3004). `contact-sheet.html` is DEV-ONLY:
 *      it is not an entry in the production build (see vite.config.ts).
 *   2. A Chrome/Chromium must already be running with remote debugging, e.g.
 *      chrome --remote-debugging-port=9222 --headless=new about:blank
 *      Point --cdp at its DevTools HTTP endpoint (default http://127.0.0.1:9222).
 *
 * No npm dependencies are used: CDP is driven over Node's built-in fetch +
 * WebSocket. Node >= 22 is required for the global WebSocket.
 *
 * Perf guardrail: every stats run compares each sampled site's calls/triangles
 * against docs/baseline/current-stats.json (+10% ceiling, harness-matched).
 * Breaches are
 * printed as a per-site table and fail the run (exit code 1); the emitted
 * stats.json is unchanged and stays JSON-compatible.
 *
 * Usage:
 *   pnpm qa:capture
 *   pnpm qa:shots -- --base-url http://localhost:3004 --out docs/qa/latest
 *   node scripts/capture-contact-sheets.mjs --stats-only --cdp http://127.0.0.1:9222
 */

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { fileURLToPath } from 'node:url';

const HOUR_KEYS = { 12: 'noon', 18: 'golden', 22: 'night' };
const SHOT_FILES = {
  12: 'contact-sheet-noon.png',
  18: 'contact-sheet-dusk.png',
  22: 'contact-sheet-night.png',
};
const EXPECTED_LANDMARKS = 43;
const SAMPLES_PER_SITE = 8;
const WARMUP_FRAMES = 2;
// Default to the most recent harness-matched capture. Older phase baselines
// (baseline/phase1/phase2) were captured with a different browser/renderer
// stack and can differ by ~10% in draw calls on untouched sites; pass
// --baseline <file> to compare against any of them explicitly.
const BASELINE_PATH = fileURLToPath(
  new URL('../docs/baseline/current-stats.json', import.meta.url)
);
const PERF_GUARDRAIL_FACTOR = 1.1;

const HELP = `
Capture dev-only contact-sheet screenshots and renderer stats via CDP.

Options:
  --base-url <url>        Dev server base URL (default: http://localhost:3004)
  --out <dir>             Output directory (default: docs/qa/latest)
  --cdp <url>             Chrome DevTools HTTP endpoint (default: http://127.0.0.1:9222)
  --baseline <file>       Perf baseline JSON (default: docs/baseline/current-stats.json)
  --hours <list>          Comma-separated hours to capture (default: 12,18,22)
  --chunk-size <n>        Sites per page evaluation (default: 9)
  --status-timeout-ms <n> Max wait for the "43 landmarks" status (default: 180000)
  --shots-only            Capture screenshots only (no stats.json)
  --stats-only            Capture stats only (no screenshots)
  --help                  Show this help

The dev server and a remote-debugging Chrome must already be running.

Perf guardrail: with stats enabled, calls/triangles are checked against
docs/baseline/current-stats.json (+10% per site, harness-matched) or --baseline.
Violations print a per-site table and exit non-zero; stats.json stays JSON-compatible.
`;

function parseCli() {
  const { values } = parseArgs({
    options: {
      'base-url': { type: 'string', default: 'http://localhost:3004' },
      out: { type: 'string', default: 'docs/qa/latest' },
      cdp: { type: 'string', default: 'http://127.0.0.1:9222' },
      baseline: { type: 'string', default: BASELINE_PATH },
      hours: { type: 'string', default: '12,18,22' },
      'chunk-size': { type: 'string', default: '9' },
      'status-timeout-ms': { type: 'string', default: '180000' },
      'shots-only': { type: 'boolean', default: false },
      'stats-only': { type: 'boolean', default: false },
      help: { type: 'boolean', default: false },
    },
    allowPositionals: false,
  });
  if (values.help) {
    process.stdout.write(HELP);
    process.exit(0);
  }
  if (values['shots-only'] && values['stats-only']) {
    throw new Error('--shots-only and --stats-only cannot be combined');
  }
  const hours = values.hours
    .split(',')
    .map((h) => Number(h.trim()))
    .filter((h) => Number.isFinite(h));
  if (!hours.length || hours.some((h) => !HOUR_KEYS[h])) {
    throw new Error(`Unsupported hours: ${values.hours}; use 12, 18 and/or 22`);
  }
  const chunkSize = Number(values['chunk-size']);
  const statusTimeoutMs = Number(values['status-timeout-ms']);
  if (!Number.isInteger(chunkSize) || chunkSize < 1) {
    throw new Error('--chunk-size must be a positive integer');
  }
  if (!Number.isFinite(statusTimeoutMs) || statusTimeoutMs < 1000) {
    throw new Error('--status-timeout-ms must be at least 1000');
  }
  return {
    baseUrl: values['base-url'].replace(/\/+$/, ''),
    outDir: resolve(values.out),
    cdp: values.cdp.replace(/\/+$/, ''),
    baseline: resolve(values.baseline),
    hours,
    chunkSize,
    statusTimeoutMs,
    shots: !values['stats-only'],
    stats: !values['shots-only'],
  };
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const pad = (n) => String(n).padStart(2, '0');

/**
 * Compare sampled renderer.info figures with the documented per-site ceilings.
 * The sampling method matches the baseline (same warmup/sample frame counts),
 * so no extra allowance is needed beyond the +10% guardrail; Math.ceil only
 * absorbs integer rounding. Missing baseline rows are reported, not assumed.
 */
function checkPerfGuardrails(stats, baseline) {
  const violations = [];
  let checked = 0;
  for (const key of Object.values(HOUR_KEYS)) {
    const rows = stats[key];
    if (!Array.isArray(rows)) continue;
    const baseRows = baseline[key];
    if (!Array.isArray(baseRows)) {
      console.warn(`  guardrail: no baseline for ${key}, skipping`);
      continue;
    }
    const byIndex = new Map(baseRows.map((row) => [row.i, row]));
    for (const row of rows) {
      const base = byIndex.get(row.i);
      if (!base || !Number.isFinite(base.calls) || !Number.isFinite(base.tris)) continue;
      checked++;
      const callLimit = Math.ceil(base.calls * PERF_GUARDRAIL_FACTOR);
      const trisLimit = Math.ceil(base.tris * PERF_GUARDRAIL_FACTOR);
      if (row.calls <= callLimit && row.tris <= trisLimit) continue;
      violations.push({
        hour: key,
        site: row.name,
        calls: row.calls,
        callLimit,
        tris: row.tris,
        trisLimit,
      });
    }
  }
  return { violations, checked };
}

function reportPerfGuardrails(violations, checked) {
  if (violations.length === 0) {
    console.log(`Perf guardrail: PASS (${checked} site checks, +10% calls/tris ceiling).`);
    return;
  }
  console.error(`Perf guardrail: FAIL — ${violations.length} site(s) exceed baseline +10%:`);
  console.error(
    [
      '  hour   site                                                calls     limit       tris     limit',
      ...violations.map(
        (v) =>
          `  ${v.hour.padEnd(7)} ${v.site.slice(0, 44).padEnd(45)} ` +
          `${String(v.calls).padStart(7)} ${String(v.callLimit).padStart(8)} ` +
          `${String(v.tris).padStart(10)} ${String(v.trisLimit).padStart(9)}`
      ),
    ].join('\n')
  );
  process.exitCode = 1;
}

/** Minimal CDP session over the global WebSocket (Node >= 22). */
class CdpSession {
  constructor(wsUrl, commandTimeoutMs = 120000) {
    if (typeof WebSocket === 'undefined') {
      throw new Error('Global WebSocket is unavailable; use Node >= 22');
    }
    this.wsUrl = wsUrl;
    this.commandTimeoutMs = commandTimeoutMs;
    this.id = 0;
    this.pending = new Map();
  }

  open() {
    return new Promise((complete, failOpen) => {
      const ws = new WebSocket(this.wsUrl);
      this.ws = ws;
      const onOpen = () => {
        cleanup();
        complete();
      };
      const onError = (err) => {
        cleanup();
        failOpen(err instanceof Error ? err : new Error(String(err)));
      };
      const onMessage = (ev) => {
        let msg;
        try {
          msg = JSON.parse(ev.data);
        } catch {
          return;
        }
        if (!msg.id || !this.pending.has(msg.id)) return;
        const { resolve: done, reject: fail, timer } = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        clearTimeout(timer);
        if (msg.error) fail(new Error(JSON.stringify(msg.error)));
        else done(msg.result);
      };
      const cleanup = () => {
        ws.removeEventListener('open', onOpen);
        ws.removeEventListener('error', onError);
      };
      ws.addEventListener('open', onOpen);
      ws.addEventListener('error', onError);
      ws.addEventListener('message', onMessage);
    });
  }

  send(method, params = {}) {
    const id = ++this.id;
    const timer = setTimeout(() => {
      const entry = this.pending.get(id);
      if (entry) {
        this.pending.delete(id);
        entry.reject(new Error(`CDP ${method} timed out after ${this.commandTimeoutMs}ms`));
      }
    }, this.commandTimeoutMs);
    this.ws.send(JSON.stringify({ id, method, params }));
    return new Promise((resolveCommand, rejectCommand) =>
      this.pending.set(id, { resolve: resolveCommand, reject: rejectCommand, timer })
    );
  }

  async eval(expression) {
    const r = await this.send('Runtime.evaluate', {
      expression,
      awaitPromise: true,
      returnByValue: true,
    });
    if (r.exceptionDetails) {
      const detail =
        r.exceptionDetails.exception?.description || JSON.stringify(r.exceptionDetails);
      throw new Error(`Page evaluation failed: ${detail}`);
    }
    return r.result.value;
  }

  close() {
    try {
      this.ws?.close();
    } catch {
      // Best effort.
    }
    for (const { timer } of this.pending.values()) clearTimeout(timer);
    this.pending.clear();
  }
}

/** Open a dedicated Chrome tab, or fall back to an existing page target. */
async function acquirePageTarget(cdpUrl) {
  try {
    const res = await fetch(`${cdpUrl}/json/new?about:blank`, { method: 'PUT' });
    if (res.ok) {
      const target = await res.json();
      return {
        target,
        close: () => fetch(`${cdpUrl}/json/close/${encodeURIComponent(target.id)}`).catch(() => {}),
      };
    }
  } catch {
    // Older Chrome builds do not support PUT /json/new; fall back below.
  }
  const res = await fetch(`${cdpUrl}/json/list`);
  if (!res.ok) throw new Error(`Cannot list CDP targets at ${cdpUrl} (HTTP ${res.status})`);
  const targets = await res.json();
  const page = targets.find((t) => t.type === 'page');
  if (!page)
    throw new Error(
      `No CDP page target at ${cdpUrl}; launch Chrome with --remote-debugging-port=9222`
    );
  return { target: page, close: () => {} };
}

async function waitForStatus(cdp, expected, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  const expr = `(document.getElementById('status')?.textContent || '').trim()`;
  let last = '';
  while (Date.now() < deadline) {
    try {
      last = (await cdp.eval(expr)) || '';
      if (last === expected) return;
    } catch {
      // Page may be navigating; keep polling.
    }
    await sleep(250);
  }
  throw new Error(`Timed out waiting for status "${expected}" (last: "${last}")`);
}

function setupEval() {
  return `(() => {
    const e = window.citylitEngine;
    if (!e) return { ok: false, reason: 'window.citylitEngine missing' };
    if (window.__qaPrevAutoReset === undefined) window.__qaPrevAutoReset = e.renderer.raw.info.autoReset;
    window.__qaPrevSoftwareGl = e.isSoftwareGl;
    e.isSoftwareGl = false;
    e.applyQuality('high');
    e.renderer.raw.info.autoReset = false;
    const images = [...document.querySelectorAll('#grid img')];
    const imageChecks = images.map((image) => {
      if (!image.complete || image.naturalWidth === 0 || !image.src.startsWith('data:image/')) {
        return { loaded: false, variedPixels: false };
      }
      const canvas = document.createElement('canvas');
      canvas.width = 16;
      canvas.height = 16;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return { loaded: true, variedPixels: false };
      ctx.drawImage(image, 0, 0, 16, 16);
      const pixels = ctx.getImageData(0, 0, 16, 16).data;
      const colors = new Set();
      let opaquePixels = 0;
      for (let offset = 0; offset < pixels.length; offset += 16) {
        colors.add([pixels[offset], pixels[offset + 1], pixels[offset + 2], pixels[offset + 3]].join(','));
        if (pixels[offset + 3] > 0) opaquePixels++;
      }
      return { loaded: true, variedPixels: colors.size > 8 && opaquePixels > 32 };
    });
    return {
      ok: true,
      figures: document.querySelectorAll('#grid figure').length,
      thumbnails: {
        count: imageChecks.length,
        loaded: imageChecks.filter((image) => image.loaded).length,
        rendered: imageChecks.filter((image) => image.variedPixels).length,
      },
      qualitySetting: e.qualitySetting,
      qualityIndex: e.qualityIndex,
      isSoftwareGl: e.isSoftwareGl,
      autoReset: e.renderer.raw.info.autoReset
    };
  })()`;
}

function restoreEval() {
  return `(() => {
    const e = window.citylitEngine;
    if (!e) return false;
    e.renderer.raw.info.autoReset = window.__qaPrevAutoReset !== undefined ? window.__qaPrevAutoReset : true;
    if (window.__qaPrevSoftwareGl !== undefined) e.isSoftwareGl = window.__qaPrevSoftwareGl;
    return e.renderer.raw.info.autoReset;
  })()`;
}

/** Sample a contiguous range of sites in one bounded page evaluation. */
function statsChunkEval(start, end) {
  return `(async () => {
    const e = window.citylitEngine;
    const info = e.renderer.raw.info;
    const raf = () => new Promise((r) => requestAnimationFrame(r));
    const captions = [...document.querySelectorAll('#grid figcaption')];
    const out = [];
    for (let i = ${start}; i <= ${end}; i++) {
      e.showLandmarkImmediate(i);
      for (let w = 0; w < ${WARMUP_FRAMES}; w++) await raf(); // warmup frames
      info.reset();
      const frames = [];
      let prev = performance.now();
      for (let s = 0; s < ${SAMPLES_PER_SITE}; s++) {
        await raf();
        const now = performance.now();
        frames.push(now - prev);
        prev = now;
      }
      const mean = frames.reduce((a, b) => a + b, 0) / frames.length;
      out.push({
        i,
        name: (captions[i]?.textContent || ('Site ' + (i + 1))).replace(/\\s+/g, ' ').trim(),
        calls: info.render.calls,
        tris: info.render.triangles,
        fps: +(1000 / mean).toFixed(1)
      });
    }
    return out;
  })()`;
}

async function captureHour(cdp, cfg, hour, stats) {
  const key = HOUR_KEYS[hour];
  const expectedStatus = `${EXPECTED_LANDMARKS} landmarks · daylight · ${pad(hour)}:00`;
  // The harness samples WebGLRenderer.info, so pin the WebGL backend explicitly:
  // on WebGPU-capable browsers `auto` selects WebGPU, whose wrapper has no .info.
  const url = `${cfg.baseUrl}/contact-sheet.html?theme=daylight&hour=${hour}&renderer=webgl&_qa=${Date.now()}`;

  await cdp.send('Page.enable');
  await cdp.send('Page.navigate', { url });

  await waitForStatus(cdp, expectedStatus, cfg.statusTimeoutMs);

  const setup = await cdp.eval(setupEval());
  if (!setup?.ok) throw new Error(`Setup failed for hour ${hour}: ${setup?.reason || 'unknown'}`);
  if (setup.figures !== EXPECTED_LANDMARKS) {
    throw new Error(`Expected ${EXPECTED_LANDMARKS} landmarks, found ${setup.figures}`);
  }
  if (
    setup.thumbnails?.count !== EXPECTED_LANDMARKS ||
    setup.thumbnails.loaded !== EXPECTED_LANDMARKS ||
    setup.thumbnails.rendered !== EXPECTED_LANDMARKS
  ) {
    throw new Error(
      `Incomplete or blank thumbnails for hour ${hour}: ${JSON.stringify(setup.thumbnails)}`
    );
  }

  try {
    if (cfg.shots) {
      const shot = await cdp.send('Page.captureScreenshot', {
        format: 'png',
        captureBeyondViewport: true,
        fromSurface: true,
      });
      const file = resolve(cfg.outDir, SHOT_FILES[hour]);
      writeFileSync(file, Buffer.from(shot.data, 'base64'));
      console.log(`  screenshot: ${file}`);
    }

    if (cfg.stats) {
      const rows = [];
      for (let start = 0; start < EXPECTED_LANDMARKS; start += cfg.chunkSize) {
        const end = Math.min(start + cfg.chunkSize - 1, EXPECTED_LANDMARKS - 1);
        const chunk = await cdp.eval(statsChunkEval(start, end));
        rows.push(...chunk);
        console.log(`  stats: sites ${start + 1}-${end + 1}/${EXPECTED_LANDMARKS}`);
      }
      rows.sort((a, b) => a.i - b.i);
      stats[key] = rows;
    }
  } finally {
    await cdp.eval(restoreEval()).catch(() => {});
  }
}

async function main() {
  const cfg = parseCli();
  if (typeof WebSocket === 'undefined') {
    throw new Error('Global WebSocket is unavailable; use Node >= 22');
  }
  mkdirSync(cfg.outDir, { recursive: true });

  const handle = await acquirePageTarget(cfg.cdp);
  const cdp = new CdpSession(handle.target.webSocketDebuggerUrl);
  try {
    await cdp.open();
    await cdp.send('Runtime.enable');

    const stats = {
      captured: new Date().toISOString().slice(0, 10),
      app: 'Citylit contact sheet',
      urlTemplate: `${cfg.baseUrl}/contact-sheet.html?hour={12|18|22}`,
      engineState: {
        qualitySetting: 'high',
        qualityIndex: 0,
        isSoftwareGl: false,
        theme: 'daylight',
        composer: true,
        renderer: true,
      },
      method:
        'renderer.raw.info.autoReset=false; per-site showLandmarkImmediate; two warmup rAF frames; ' +
        'info.reset(); 8 rAF samples; calls/tris read after the 8-frame window; ' +
        'FPS=1000/mean(frame ms). Sampling split into chunks to bound page evaluations.',
      caveat:
        'Headless/remote browser via CDP on this host. FPS is a relative comparison only, ' +
        'not a mid-range-laptop or mobile certification.',
    };
    if (cfg.stats) {
      for (const key of Object.values(HOUR_KEYS)) stats[key] = [];
    }

    for (const hour of cfg.hours) {
      console.log(`Capturing hour ${hour} (${HOUR_KEYS[hour]})...`);
      await captureHour(cdp, cfg, hour, stats);
    }

    if (cfg.stats) {
      let guardrail = null;
      try {
        const baseline = JSON.parse(readFileSync(cfg.baseline, 'utf8'));
        guardrail = checkPerfGuardrails(stats, baseline);
      } catch (err) {
        guardrail = {
          violations: [],
          checked: 0,
          error: `cannot load ${cfg.baseline}: ${err?.message || err}`,
        };
      }
      const file = resolve(cfg.outDir, 'stats.json');
      writeFileSync(file, `${JSON.stringify(stats, null, 2)}\n`);
      console.log(`stats: ${file}`);
      if (guardrail.error) {
        console.error(`Perf guardrail: FAILED: ${guardrail.error}`);
        process.exitCode = 1;
      } else {
        reportPerfGuardrails(guardrail.violations, guardrail.checked);
      }
    }
    console.log('Done.');
  } finally {
    cdp.close();
    await handle.close();
  }
}

main().catch((err) => {
  console.error(`FAILED: ${err?.message || err}`);
  process.exitCode = 1;
});
