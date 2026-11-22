// Temporary: drive the real UI (globe -> places), capture day/night shots, and
// test the dissolve-leak fix.
import { writeFileSync } from 'node:fs';

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
    const r = await this.send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
    if (r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails.exception?.description || r.exceptionDetails));
    return r.result.value;
  }
  async shot(path) {
    const r = await this.send('Page.captureScreenshot', { format: 'png' });
    writeFileSync(path, Buffer.from(r.data, 'base64'));
    console.log('saved', path);
  }
}

const clickAria = (label) => `(() => {
  const el = [...document.querySelectorAll('[aria-label]')].find(e => e.getAttribute('aria-label') === '${label}');
  if (!el) return 'miss';
  el.click(); return 'ok';
})()`;

const state = `JSON.stringify({
  theme: window.citylitEngine.theme,
  places: window.citylitEngine.places.isOpen,
  globe: window.citylitEngine.globe.isOpen,
  hero: window.citylitEngine.heroRoot.visible,
  dp: window.citylitEngine.dissolvePhase,
  dy: window.__dy,
  exp: +window.citylitEngine.renderer.toneMappingExposure.toFixed(2),
  hour: +window.citylitEngine.weather.current.timeOfDay.toFixed(1),
  slice: window.citylitEngine.places.isOpen ? window.citylitEngine.places.getSelectedInfo().sliceIndex : null
})`;

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
  await sleep(2500);

  // HERO DAY
  await cdp.eval("document.documentElement.dataset.theme='daylight'; window.citylitEngine.setTheme('daylight', true); window.citylitEngine.setSunAltitudeImmediate(13);");
  await sleep(3500);
  console.log('hero day', await cdp.eval(state));
  await cdp.shot('shot2-hero-day.png');

  // HERO DARK THEME at night
  await cdp.eval("document.documentElement.dataset.theme='dark'; window.citylitEngine.setTheme('dark', true); window.citylitEngine.setSunAltitudeImmediate(22);");
  await sleep(4000);
  console.log('hero dark', await cdp.eval(state));
  await cdp.shot('shot2-hero-dark.png');

  // HERO DARK THEME at noon (dark theme in daylight)
  await cdp.eval('window.citylitEngine.setSunAltitudeImmediate(13)');
  await sleep(3000);
  console.log('hero dark-noon', await cdp.eval(state));
  await cdp.shot('shot2-hero-dark-noon.png');

  // Back to daylight; open globe then Places via real UI
  await cdp.eval("document.documentElement.dataset.theme='daylight'; window.citylitEngine.setTheme('daylight', true); window.citylitEngine.setSunAltitudeImmediate(13);");
  await sleep(1200);
  console.log('globe click', await cdp.eval(clickAria('Open 3D South Africa globe')));
  await sleep(2500);
  console.log('places click', await cdp.eval(clickAria('Open 3D Places diorama archipelago')));
  await sleep(3000);
  console.log('places day', await cdp.eval(state));
  await cdp.shot('shot2-places-day.png');

  // Slice steps via real keyboard
  for (let i = 0; i < 4; i++) {
    await cdp.eval(`document.dispatchEvent(new KeyboardEvent('keydown', {key:'ArrowRight', bubbles:true}))`);
    await sleep(600);
  }
  console.log('places slice', await cdp.eval(state));
  await cdp.shot('shot2-places-slice.png');

  // Places night preset
  await cdp.eval(`(() => { const b=[...document.querySelectorAll('button')].find(e=>(e.textContent||'').trim()==='Night'); b?.click(); return Boolean(b); })()`);
  await sleep(3500);
  console.log('places night', await cdp.eval(state));
  await cdp.shot('shot2-places-night.png');

  // Dissolve-leak test: arm a landmark switch while Places is open, then close
  const leak = await cdp.eval(`(() => {
    const e = window.citylitEngine;
    e.transitionToLandmark(5);
    const armed = e.dissolvePhase;
    e.closePlaces();
    return JSON.stringify({ armed, afterClose: e.dissolvePhase, dy: e.heroRoot.visible });
  })()`);
  console.log('leak test', leak);
  await sleep(700);
  console.log('after close', await cdp.eval(state));
  await cdp.shot('shot2-after-close.png');

  cdp.ws.close();
};
run().catch((e) => { console.error('FAILED', e); process.exit(1); });
