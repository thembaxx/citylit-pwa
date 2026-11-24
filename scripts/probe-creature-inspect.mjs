/**
 * Diagnostic capture: forces noon, lists every creature field's world-space
 * centre and screen projection, then screenshots the pilot scene.
 * Run: node scripts/probe-creature-inspect.mjs [slug]
 */
import { chromium } from 'playwright';

const slug = process.argv[2] ?? 'boulders-beach';
const names = {
  'boulders-beach': 'Boulders Beach',
  'kruger-national-park': 'Kruger National Park',
  'orlando-towers': 'Orlando Towers',
};

const browser = await chromium.launch({
  headless: true,
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
const page = await browser.newPage({ viewport: { width: 1200, height: 800 } });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => {
  if (m.type() === 'error') errors.push(m.text());
});

await page.goto(`http://127.0.0.1:3002/?creatures=on#${slug}`, {
  waitUntil: 'load',
  timeout: 60_000,
});
await page.waitForTimeout(9000);
await page.evaluate(() => {
  const engine = window.citylitEngine;
  engine?.setSunAltitudeImmediate?.(12);
  engine?.setSeasonMonth?.(7, true);
});
await page.waitForTimeout(4000);

const info = await page.evaluate((name) => {
  const engine = window.citylitEngine;
  const scene = engine?.scene;
  const group = scene?.getObjectByName(`creatures:${name}`);
  if (!group || !engine) return null;
  const camera = engine.camera;
  const out = [];
  for (const fieldGroup of group.children) {
    const meshes = [];
    for (const obj of fieldGroup.children) {
      if (!obj.isInstancedMesh) continue;
      let sample = null;
      if (obj.instanceMatrix) {
        const a = obj.instanceMatrix.array;
        sample = [a[12], a[13], a[14]];
      }
      meshes.push({
        type: obj.type,
        count: obj.count,
        material: obj.material?.type,
        visible: obj.visible,
        sample,
      });
    }
    out.push({ visible: fieldGroup.visible, meshes });
  }
  return { group: group.position.toArray(), camera: camera.position.toArray(), out };
}, names[slug]);

await page.screenshot({
  path: `docs/creatures/${slug}-noon.png`,
  timeout: 90_000,
  animations: 'disabled',
});
console.log(JSON.stringify({ info, errors }, null, 2));
await browser.close();
