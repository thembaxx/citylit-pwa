import { chromium } from 'playwright';

const browser = await chromium.launch({
  headless: true,
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
const page = await browser.newPage({ viewport: { width: 1100, height: 760 } });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
await page.goto('http://127.0.0.1:3002/?creatures=on#boulders-beach', {
  waitUntil: 'load',
  timeout: 60_000,
});
await page.waitForTimeout(9000);

const dump = await page.evaluate(() => {
  const group = window.citylitEngine?.scene?.getObjectByName('creatures:Boulders Beach');
  if (!group) return { error: 'no group' };
  const fields = [];
  for (const fg of group.children) {
    const meshes = [];
    for (const m of fg.children) {
      if (!m.isInstancedMesh) continue;
      const g = m.geometry;
      meshes.push({
        count: m.count,
        attrs: Object.keys(g.attributes),
        color: Array.from(g.attributes.color?.array?.slice(0, 9) ?? []),
        bend: Array.from(g.attributes.aBend?.array?.slice(0, 6) ?? []),
        motion: Array.from(g.attributes.aMotion?.array?.slice(0, 8) ?? []),
        instance: Array.from(g.attributes.aInstance?.array?.slice(0, 8) ?? []),
        instanceColor: Array.from(m.instanceColor?.array?.slice(0, 9) ?? []),
        instanceMatrix: Array.from(m.instanceMatrix.array.slice(0, 16)),
        visible: m.visible,
      });
    }
    fields.push({ visible: fg.visible, meshes });
  }
  return { fields, camera: window.citylitEngine.camera.position.toArray() };
});

await page.screenshot({ path: 'docs/creatures/diag-with.png', timeout: 90_000, animations: 'disabled' });
await page.evaluate(() => {
  const group = window.citylitEngine?.scene?.getObjectByName('creatures:Boulders Beach');
  if (group) group.visible = false;
});
await page.waitForTimeout(1200);
await page.screenshot({ path: 'docs/creatures/diag-without.png', timeout: 90_000, animations: 'disabled' });

console.log(JSON.stringify({ dump, errors }, null, 2));
await browser.close();
