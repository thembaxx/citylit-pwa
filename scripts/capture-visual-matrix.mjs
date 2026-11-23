#!/usr/bin/env node
/**
 * Visual baseline / comparison capture for the Citylit 3D scenes.
 *
 * Unlike scripts/capture-contact-sheets.mjs this script drives the LIVE app and
 * screenshots the composited WebGL canvas. The contact-sheet harness relies on
 * readRenderTargetPixels(), which returns an empty buffer in some headless
 * Chrome builds; the on-screen canvas path does not, so this harness is the
 * reliable way to compare visual changes on this host.
 *
 * Prerequisites (not started here):
 *   1. Vite dev server (default http://localhost:3000).
 *   2. Chrome with --remote-debugging-port=9222 (default CDP endpoint).
 *
 * Usage:
 *   node scripts/capture-visual-matrix.mjs --out docs/visual-baseline
 *   node scripts/capture-visual-matrix.mjs --out docs/visual-reports/new --no-all
 *
 * Every captured state is reproducible: motion is frozen (motionScale = 0),
 * theme is pinned to daylight, and time/weather/tier/landmark are applied
 * immediately before a fixed number of warmup frames.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parseArgs } from 'node:util';

const HELP = `
Capture a reproducible before/after visual matrix of the live Citylit app.

Options:
  --base-url <url>    Dev server (default http://localhost:3000)
  --cdp <url>         Chrome DevTools HTTP endpoint (default http://127.0.0.1:9222)
  --out <dir>         Output directory (default docs/visual-baseline)
  --heroes <list>     Comma-separated landmark indices (default 0,1,3,7,14)
  --times <list>      Hours (default 6,12,18,22)
  --tiers <list>      high|balanced (default high,balanced)
  --weather <list>    sun|rain|fog for the clear/rain/fog sweep (default sun,rain,fog)
  --no-all            Skip the all-landmarks sweep
  --no-shot           Capture stats only
  --no-stats          Capture screenshots only
  --quality <n>       JPEG quality 1-100 (default 72)
  --help              Show this help
`;

function parseCli() {
  const { values } = parseArgs({
    options: {
      'base-url': { type: 'string', default: 'http://localhost:3000' },
      cdp: { type: 'string', default: 'http://127.0.0.1:9222' },
      out: { type: 'string', default: 'docs/visual-baseline' },
      heroes: { type: 'string', default: '0,1,3,7,14' },
      times: { type: 'string', default: '6,12,18,22' },
      tiers: { type: 'string', default: 'high,balanced' },
      weather: { type: 'string', default: 'sun,rain,fog' },
      'no-all': { type: 'boolean', default: false },
      'no-shot': { type: 'boolean', default: false },
      'no-stats': { type: 'boolean', default: false },
      quality: { type: 'string', default: '72' },
      help: { type: 'boolean', default: false },
    },
    allowPositionals: false,
  });
  if (values.help) {
    process.stdout.write(HELP);
    process.exit(0);
  }
  const list = (s) =>
    s
      .split(',')
      .map((v) => v.trim())
      .filter(Boolean);
  const q = Number(values.quality);
  if (!Number.isFinite(q) || q < 1 || q > 100) throw new Error('--quality must be 1-100');
  return {
    baseUrl: values['base-url'].replace(/\/+$/, ''),
    cdp: values.cdp.replace(/\/+$/, ''),
    outDir: resolve(values.out),
    heroes: list(values.heroes).map(Number),
    times: list(values.times).map(Number),
    tiers: list(values.tiers),
    weather: list(values.weather),
    all: !values['no-all'],
    shots: !values['no-shot'],
    stats: !values['no-stats'],
    quality: q,
  };
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

class Cdp {
  constructor(url) {
    this.url = url;
    this.id = 0;
    this.pending = new Map();
    this.events = new Set();
  }
  open() {
    return new Promise((complete, fail) => {
      this.ws = new WebSocket(this.url);
      this.ws.addEventListener('open', () => complete(), { once: true });
      this.ws.addEventListener('error', (e) => fail(e), { once: true });
      this.ws.addEventListener('message', (ev) => {
        const msg = JSON.parse(ev.data);
        if (msg.id && this.pending.has(msg.id)) {
          const { resolve: ok, reject: no, timer } = this.pending.get(msg.id);
          this.pending.delete(msg.id);
          clearTimeout(timer);
          msg.error ? no(new Error(JSON.stringify(msg.error))) : ok(msg.result);
        } else if (msg.method) {
          for (const fn of this.events) fn(msg);
        }
      });
    });
  }
  send(method, params = {}) {
    const id = ++this.id;
    const timer = setTimeout(() => {
      const entry = this.pending.get(id);
      if (entry) {
        this.pending.delete(id);
        entry.reject(new Error(`CDP ${method} timed out`));
      }
    }, 180000);
    this.ws.send(JSON.stringify({ id, method, params }));
    return new Promise((resolve, reject) => this.pending.set(id, { resolve, reject, timer }));
  }
  async eval(expression) {
    const r = await this.send('Runtime.evaluate', {
      expression,
      awaitPromise: true,
      returnByValue: true,
    });
    if (r.exceptionDetails) {
      throw new Error(r.exceptionDetails.exception?.description || JSON.stringify(r.exceptionDetails));
    }
    return r.result.value;
  }
  close() {
    try {
      this.ws?.close();
    } catch {
      /* noop */
    }
    for (const { timer } of this.pending.values()) clearTimeout(timer);
    this.pending.clear();
  }
}

/** Freeze motion, pin daylight theme and hide DOM overlays so only the scene shows. */
const setupEval = `(() => {
  const e = window.citylitEngine;
  if (!e) return { ok: false, reason: 'window.citylitEngine missing' };
  e.setTheme('daylight', true);
  e.motionScale = 0;
  e.setFpsCap && e.setFpsCap('0');
  const canvas = e.renderer.raw.domElement;
  const root = document.getElementById('root');
  const keep = new Set();
  let n = canvas;
  while (n && n !== root) { keep.add(n); n = n.parentElement; }
  root.querySelectorAll('*').forEach((el) => { if (!keep.has(el)) el.style.display = 'none'; });
  const info = e.renderer.raw.info;
  info.autoReset = false;
  window.__visualPrevAutoReset = true;
  return { ok: true, count: e.scene.children.length };
})()`;

/**
 * Apply a state deterministically. setSunAltitudeImmediate snaps time; the
 * lighting/grade lerps all use motionScale === 0 to settle on the next frame.
 */
function stateEval(index, hour, weather, tier) {
  const night = hour < 6 || hour >= 19 ? 1 : 0;
  return `(() => {
    const e = window.citylitEngine;
    e.applyQuality('${tier}');
    e.setTheme('daylight', true);
    e.setSunAltitudeImmediate(${hour});
    e.setWeather('${weather}', ${night === 1}, ${hour});
    e.showLandmarkImmediate(${index});
    e.motionScale = 0;
    return true;
  })()`;
}

/** Settle N frames and sample renderer.info + mean frame time in-page. */
const sampleEval = (frames) => `(async () => {
  const e = window.citylitEngine;
  const info = e.renderer.raw.info;
  const raf = () => new Promise((r) => requestAnimationFrame(r));
  for (let i = 0; i < 6; i++) await raf();
  info.reset();
  let prev = performance.now();
  const samples = [];
  for (let i = 0; i < ${frames}; i++) {
    await raf();
    const now = performance.now();
    samples.push(now - prev);
    prev = now;
  }
  const mean = samples.reduce((a, b) => a + b, 0) / samples.length;
  return {
    calls: info.render.calls,
    triangles: info.render.triangles,
    programs: info.programs ? info.programs.length : 0,
    textures: info.memory.textures,
    geometries: info.memory.geometries,
    frameMs: +mean.toFixed(2),
  };
})()`;

async function captureState(cdp, cfg, state, file) {
  await cdp.eval(stateEval(state.index, state.hour, state.weather, state.tier));
  const info = await cdp.eval(sampleEval(8));
  if (cfg.shots) {
    const shot = await cdp.send('Page.captureScreenshot', {
      format: 'jpeg',
      quality: cfg.quality,
      fromSurface: true,
      captureBeyondViewport: false,
    });
    writeFileSync(file, Buffer.from(shot.data, 'base64'));
  }
  return { ...state, file: cfg.shots ? file.replace(/\\/g, '/') : null, ...info };
}

async function main() {
  const cfg = parseCli();
  if (typeof WebSocket === 'undefined') throw new Error('Node >= 22 required (global WebSocket)');
  mkdirSync(cfg.outDir, { recursive: true });

  const targetRes = await fetch(`${cfg.cdp}/json/new?about:blank`, { method: 'PUT' });
  if (!targetRes.ok) throw new Error(`Cannot open CDP tab: HTTP ${targetRes.status}`);
  const target = await targetRes.json();
  const cdp = new Cdp(target.webSocketDebuggerUrl);
  await cdp.open();
  const states = [];

  try {
    await cdp.send('Runtime.enable');
    await cdp.send('Page.enable');
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: 960,
      height: 600,
      deviceScaleFactor: 1,
      mobile: false,
    });
    await cdp.send('Emulation.setTouchEmulationEnabled', { enabled: false });
    await cdp.send('Page.navigate', {
      url: `${cfg.baseUrl}/?_visual=${Date.now()}`,
    });

    let ready = false;
    for (let i = 0; i < 360; i++) {
      await sleep(500);
      try {
        ready = await cdp.eval('Boolean(window.citylitEngine && window.citylitEngine.currentGroup)');
      } catch {
        /* navigating */
      }
      if (ready) break;
    }
    if (!ready) throw new Error('Timed out waiting for citylitEngine.currentGroup');

    const setup = await cdp.eval(setupEval);
    if (!setup?.ok) throw new Error(`Setup failed: ${setup?.reason || 'unknown'}`);
    console.log(`Engine ready. Capturing ${cfg.heroes.length} hero landmarks.`);

    // 1. Time-of-day x tier sweep (clear weather) for hero landmarks, desktop.
    for (const index of cfg.heroes) {
      for (const hour of cfg.times) {
        for (const tier of cfg.tiers) {
          const name = `hero-${String(index).padStart(2, '0')}-${hour}-sun-${tier}-desktop`;
          const info = await captureState(cdp, cfg, { index, hour, weather: 'sun', tier, viewport: 'desktop' }, resolve(cfg.outDir, `${name}.jpg`));
          states.push(info);
          console.log(`  ${name}: ${info.calls} calls / ${info.triangles} tris / ${info.programs} programs / ${info.frameMs} ms`);
        }
      }
    }

    // 2. Weather sweep at representative times, High tier, desktop.
    const weatherHours = [12, 22];
    for (const index of cfg.heroes) {
      for (const weather of cfg.weather.filter((w) => w !== 'sun')) {
        for (const hour of weatherHours) {
          const name = `hero-${String(index).padStart(2, '0')}-${hour}-${weather}-high-desktop`;
          const info = await captureState(cdp, cfg, { index, hour, weather, tier: 'high', viewport: 'desktop' }, resolve(cfg.outDir, `${name}.jpg`));
          states.push(info);
          console.log(`  ${name}: ${info.calls} calls / ${info.frameMs} ms`);
        }
      }
    }

    // 3. Mobile viewport (390x844 @ 3x) for hero landmarks, high tier.
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: 390,
      height: 844,
      deviceScaleFactor: 3,
      mobile: true,
    });
    await cdp.eval(setupEval);
    for (const index of cfg.heroes) {
      for (const hour of [12, 22]) {
        const name = `hero-${String(index).padStart(2, '0')}-${hour}-sun-high-mobile3x`;
        const info = await captureState(cdp, cfg, { index, hour, weather: 'sun', tier: 'high', viewport: 'mobile3x' }, resolve(cfg.outDir, `${name}.jpg`));
        states.push(info);
        console.log(`  ${name}: ${info.calls} calls / ${info.frameMs} ms`);
      }
    }

    // 4. All-landmarks sweep at High, clear (desktop) for regression checking.
    if (cfg.all) {
      await cdp.send('Emulation.setDeviceMetricsOverride', {
        width: 960,
        height: 600,
        deviceScaleFactor: 1,
        mobile: false,
      });
      await cdp.eval(setupEval);
      const count = await cdp.eval('window.citylitEngine.constructor.LANDMARKS?.length || 43');
      for (const hour of [12, 18, 22]) {
        for (let index = 0; index < count; index++) {
          const name = `all-${String(index).padStart(2, '0')}-${hour}-sun-high-desktop`;
          const info = await captureState(cdp, cfg, { index, hour, weather: 'sun', tier: 'high', viewport: 'desktop' }, resolve(cfg.outDir, `${name}.jpg`));
          states.push(info);
        }
        console.log(`  all landmarks @ ${hour}: done (${count})`);
      }
    }

    if (cfg.stats) {
      const stats = {
        captured: new Date().toISOString(),
        baseUrl: cfg.baseUrl,
        method:
          'Live app via CDP; motion frozen, daylight theme, immediate time/weather/tier; ' +
          '6 warmup frames, 8 sampled frames; info.autoReset=false with manual reset.',
        caveat: 'Headless Chromium via CDP; frame times are relative only.',
        config: {
          heroes: cfg.heroes,
          times: cfg.times,
          tiers: cfg.tiers,
          weather: cfg.weather,
          quality: cfg.quality,
        },
        states,
      };
      writeFileSync(resolve(cfg.outDir, 'stats.json'), `${JSON.stringify(stats, null, 2)}\n`);
      console.log(`stats: ${resolve(cfg.outDir, 'stats.json')}`);
    }
    console.log(`Done: ${states.length} states -> ${cfg.outDir}`);
  } finally {
    cdp.close();
    await fetch(`${cfg.cdp}/json/close/${target.id}`).catch(() => {});
  }
}

main().catch((err) => {
  console.error(`FAILED: ${err?.message || err}`);
  process.exitCode = 1;
});
