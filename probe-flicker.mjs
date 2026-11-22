// Temporary diagnostic v2: frame-accurate canvas sampling while driving the
// real UI (keyboard slice/landmark steps, time presets).
const PORT = 9222;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function listTargets() {
  const res = await fetch(`http://127.0.0.1:${PORT}/json/list`);
  return res.json();
}

class CDP {
  constructor(url) {
    this.ws = new WebSocket(url);
    this.id = 0;
    this.pending = new Map();
    this.ws.addEventListener('message', (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.id && this.pending.has(msg.id)) {
        const { resolve, reject } = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        if (msg.error) reject(new Error(JSON.stringify(msg.error)));
        else resolve(msg.result);
      }
    });
  }
  open() {
    return new Promise((resolve, reject) => {
      this.ws.addEventListener('open', () => resolve());
      this.ws.addEventListener('error', (e) => reject(e));
    });
  }
  send(method, params = {}) {
    const id = ++this.id;
    this.ws.send(JSON.stringify({ id, method, params }));
    return new Promise((resolve, reject) => this.pending.set(id, { resolve, reject }));
  }
  async eval(expression) {
    const r = await this.send('Runtime.evaluate', {
      expression,
      awaitPromise: true,
      returnByValue: true,
    });
    if (r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails));
    return r.result.value;
  }
}

const probeSource = `
(() => {
  const e = window.citylitEngine;
  const glCanvas = e.renderer.domElement;
  if (!glCanvas) return 'no-canvas';
  if (window.__fps) return 'already';
  const small = document.createElement('canvas');
  small.width = 72; small.height = 40;
  const sctx = small.getContext('2d', { willReadFrequently: true });
  const samples = [];
  let last = performance.now();
  const tick = () => {
    const now = performance.now();
    const dt = now - last;
    last = now;
    try {
      sctx.drawImage(glCanvas, 0, 0, 72, 40);
      const d = sctx.getImageData(0, 0, 72, 40).data;
      let sum = 0, sum2 = 0;
      for (let i = 0; i < d.length; i += 4) {
        const v = (0.2126 * d[i] + 0.7152 * d[i+1] + 0.0722 * d[i+2]) / 255;
        sum += v; sum2 += v*v;
      }
      const n = d.length / 4;
      const mean = sum / n;
      const sd = Math.sqrt(Math.max(0, sum2 / n - mean * mean));
      samples.push({
        t: Math.round(now), dt: +dt.toFixed(0), mean: +mean.toFixed(3), sd: +sd.toFixed(3),
        dy: e.dissolvePhase, wx: +(e.dissolveT || 0).toFixed(2),
        exp: +e.renderer.toneMappingExposure.toFixed(2),
        fog: e.scene.fog ? +e.scene.fog.density.toFixed(4) : null,
        pl: e.places.isOpen ? e.places.getSelectedInfo().sliceIndex : null,
        hero: e.heroRoot.visible, cam: e.camera.position.toArray().map(v => +v.toFixed(1)).join(','),
      });
      if (samples.length > 900) samples.shift();
    } catch (err) { samples.push({ t: Math.round(now), err: String(err) }); }
    requestAnimationFrame(tick);
  };
  window.__fps = { samples, glCanvas };
  requestAnimationFrame(tick);
  return 'ok';
})()
`;

const run = async () => {
  const targets = await listTargets();
  const page = targets.find((t) => t.type === 'page');
  const cdp = new CDP(page.webSocketDebuggerUrl);
  await cdp.open();
  await cdp.send('Runtime.enable');
  await cdp.send('Page.navigate', { url: 'http://localhost:3003/' });
  for (let i = 0; i < 60; i++) {
    await sleep(500);
    if (await cdp.eval('Boolean(window.citylitEngine && window.citylitEngine.currentGroup)')) break;
  }
  await sleep(2000);
  console.log('probe', await cdp.eval(probeSource));
  console.log('canvas', await cdp.eval('const c=window.citylitEngine.renderer.domElement; JSON.stringify({w:c.width,h:c.height,cw:c.clientWidth,ch:c.clientHeight})'));

  const clear = () => cdp.eval('window.__fps.samples.length = 0');
  const dump = async (tag) => {
    const arr = JSON.parse(await cdp.eval('JSON.stringify(window.__fps.samples)'));
    const bad = arr.filter((s) => s.err || (s.mean !== undefined && s.mean < 0.06) || (s.sd !== undefined && s.sd < 0.02));
    let bigJumps = 0;
    for (let i = 1; i < arr.length; i++) {
      const a = arr[i - 1], b = arr[i];
      if (a.mean !== undefined && b.mean !== undefined && Math.abs(a.mean - b.mean) > 0.22) bigJumps++;
    }
    console.log(`--- ${tag}: ${arr.length} frames, ${bad.length} suspicious, ${bigJumps} big jumps`);
    if (bad.length) console.log(JSON.stringify(bad.slice(0, 8), null, 1));
    const dts = arr.map((s) => s.dt).filter(Number.isFinite).sort((a, b) => a - b);
    console.log('dt p50/p90/max', dts[Math.floor(dts.length*0.5)], dts[Math.floor(dts.length*0.9)], dts[dts.length-1]);
  };

  // HERO: landmark steps through keyboard
  await clear();
  for (let i = 0; i < 6; i++) {
    await cdp.eval(`document.dispatchEvent(new KeyboardEvent('keydown', {key:'ArrowRight', bubbles:true}))`);
    await sleep(700);
  }
  await sleep(500);
  await dump('hero-landmark-keys');

  // HERO: time presets via UI buttons
  const clickTime = async (label) => {
    return cdp.eval(`(() => {
      const btns = [...document.querySelectorAll('button')].filter(b => (b.textContent||'').trim() === '${label}');
      if (!btns.length) return 'none';
      btns[0].click(); return 'clicked ' + btns.length;
    })()`);
  };
  await clear();
  for (const h of ['Dawn','Noon','Dusk','Night','Noon','Dusk']) {
    console.log('time', h, await clickTime(h));
    await sleep(650);
  }
  await sleep(500);
  await dump('hero-time-buttons');

  // Open Places through the engine, then step slices with keys + time presets
  await cdp.eval('window.citylitEngine.openPlaces(new Set(), "All", 2);');
  await sleep(1500);
  console.log('places open', await cdp.eval('JSON.stringify({open: window.citylitEngine.places.isOpen, vis: window.citylitEngine.places.group.visible})'));
  await clear();
  for (let i = 0; i < 12; i++) {
    await cdp.eval(`document.dispatchEvent(new KeyboardEvent('keydown', {key:'ArrowRight', bubbles:true}))`);
    await sleep(320);
  }
  await sleep(400);
  await dump('places-slice-keys');

  await clear();
  for (const h of ['Dawn','Noon','Dusk','Night','Noon']) {
    const r = await clickTime(h);
    if (i0(r)) console.log('places time', h, r);
    await sleep(650);
  }
  await sleep(400);
  await dump('places-time-buttons');

  cdp.ws.close();
};
const i0 = (s) => typeof s === 'string';

run().catch((err) => { console.error('FAILED', err); process.exit(1); });
