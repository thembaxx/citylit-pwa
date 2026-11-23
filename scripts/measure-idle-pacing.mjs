#!/usr/bin/env node
/**
 * Deterministic integration check for the shared idle render pacing.
 *
 * Starts its own Vite dev server on :3004, drives CitylitEngine.frame() with
 * synthetic 60 fps timestamps (headless Chrome throttles real rAF), and counts
 * stage renders for the hero diorama, Places cutaway and Globe.
 *
 * Prerequisite: Chrome/Chromium already running with --remote-debugging-port=9222.
 * Usage: node scripts/measure-idle-pacing.mjs
 *
 * Expected: settled stages render ~60 times in 120 frames (30 fps); a
 * reduced-motion stage renders ~30 times (15 fps). Auto-rotating stages are
 * intentionally excluded from the idle cap and stay at full rate.
 */
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));
const CDP = process.env.CDP_URL ?? 'http://127.0.0.1:9222';
const BASE = process.env.BASE_URL ?? 'http://localhost:3004';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const server = spawn(process.execPath, [resolve(ROOT, 'node_modules/vite/bin/vite.js'),
  '--host', '0.0.0.0', '--port', '3004', '--strictPort'], { cwd: ROOT, stdio: 'ignore' });
let ready = false;
for (let i = 0; i < 40; i++) {
  await sleep(500);
  try {
    if ((await fetch(BASE, { signal: AbortSignal.timeout(1500) })).ok) { ready = true; break; }
  } catch {}
}
if (!ready) { server.kill(); throw new Error('dev server did not start'); }

class CdpSession {
  constructor(wsUrl) { this.wsUrl = wsUrl; this.id = 0; this.pending = new Map(); }
  open() {
    return new Promise((complete, fail) => {
      const ws = new WebSocket(this.wsUrl);
      this.ws = ws;
      const onOpen = () => { cleanup(); complete(); };
      const onError = (e) => { cleanup(); fail(e); };
      const onMessage = (ev) => {
        let msg;
        try { msg = JSON.parse(ev.data); } catch { return; }
        if (!msg.id || !this.pending.has(msg.id)) return;
        const { resolve: done, reject, timer } = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        clearTimeout(timer);
        if (msg.error) reject(new Error(JSON.stringify(msg.error)));
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
      if (entry) { this.pending.delete(id); entry.reject(new Error(`CDP ${method} timed out`)); }
    }, 60000);
    this.ws.send(JSON.stringify({ id, method, params }));
    return new Promise((done, reject) => this.pending.set(id, { resolve: done, reject, timer }));
  }
  async eval(expression) {
    const r = await this.send('Runtime.evaluate', {
      expression, awaitPromise: true, returnByValue: true,
    });
    if (r.exceptionDetails) {
      throw new Error(r.exceptionDetails.exception?.description || JSON.stringify(r.exceptionDetails));
    }
    return r.result.value;
  }
  close() { try { this.ws?.close(); } catch {} }
}

const tab = await (await fetch(`${CDP}/json/new?about:blank`, { method: 'PUT' })).json();
const cdp = new CdpSession(tab.webSocketDebuggerUrl);
await cdp.open();
try {
  await cdp.send('Page.enable');
  await cdp.send('Runtime.enable');
  await cdp.send('Emulation.setFocusEmulationEnabled', { enabled: true });
  await cdp.send('Page.navigate', { url: `${BASE}/?renderer=webgl` });
  await cdp.send('Page.bringToFront');

  let booted = false;
  for (let i = 0; i < 90; i++) {
    await sleep(1000);
    try { booted = await cdp.eval(`!!window.citylitEngine?.renderer`); } catch {}
    if (booted) break;
  }
  if (!booted) throw new Error('engine did not boot');
  await sleep(2000);

  await cdp.eval(`(() => {
    const e = window.citylitEngine;
    cancelAnimationFrame(e.rafId);
    e.scheduleNextFrame = () => {};
    e.isSoftwareGl = false;
    e.fpsCapMs = 0;
    e.motionScale = 1;
    e.paused = false;
    e.disposed = false;
    e.contextLost = false;
    window.__passes = 0;
    const origPass = e.renderCurrentPass.bind(e);
    e.renderCurrentPass = (...a) => { window.__passes++; return origPass(...a); };
    const origRaw = e.renderer.render.bind(e.renderer);
    e.renderer.render = (...a) => { window.__raw++; return origRaw(...a); };
    return true;
  })()`);

  const drive = async (label, mode) => {
    const r = await cdp.eval(`(() => {
      const e = window.citylitEngine;
      ${mode}
      let t = performance.now();
      // Let boot damping / camera springs decay before sampling.
      for (let i = 0; i < 600; i++) { e.frame(t); t += 1000 / 60; }
      e.lastInteractAt = e.elapsed - 10;
      window.__passes = 0; window.__raw = 0;
      for (let i = 0; i < 120; i++) { e.frame(t); t += 1000 / 60; }
      return { passes: window.__passes, raw: window.__raw };
    })()`);
    console.log(`${label}: ${r.passes} stage / ${r.raw} renderer renders in 120 frames`);
    return r;
  };

  const results = [];
  results.push(await drive('Hero settled idle   ', `
    e.controls.autoRotate = false; e.controls.enableDamping = false;
    e.camGoal = null; e.dissolvePhase = 0; e.timeLapsePlaying = false;
    e.isUserOrbiting = false; e.dustPoints.visible = false;
  `));
  await cdp.eval(`window.citylitEngine.openPlaces(new Set(), 'All', 0); true`);
  await sleep(2500);
  results.push(await drive('Places settled idle ', `
    e.places.isOpen = true; e.globe.isOpen = false;
  `));
  await cdp.eval(`window.citylitEngine.closePlaces(); true`);
  await sleep(500);
  await cdp.eval(`window.citylitEngine.openGlobe(new Set()); true`);
  await sleep(1500);
  results.push(await drive('Globe reduced idle  ', `
    e.motionScale = 0; e.globe.controls.enableDamping = false;
    e.places.isOpen = false; e.globe.isOpen = true;
  `));

  const ok = results[0].passes <= 70 && results[1].passes <= 70 && results[2].raw <= 40;
  console.log(ok ? 'PASS: all three stages honour the idle caps' : 'FAIL: a stage did not throttle');
  if (!ok) process.exitCode = 1;
} finally {
  cdp.close();
  await fetch(`${CDP}/json/close/${tab.id}`).catch(() => {});
  server.kill();
}
