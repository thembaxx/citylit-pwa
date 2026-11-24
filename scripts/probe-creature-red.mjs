import { chromium } from 'playwright';

const browser = await chromium.launch({
  headless: true,
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
const page = await browser.newPage({ viewport: { width: 1200, height: 800 } });
page.on('pageerror', (e) => console.log('pageerror', e.message));
await page.goto('http://127.0.0.1:3002/?creatures=on#boulders-beach', {
  waitUntil: 'load',
  timeout: 60_000,
});
await page.waitForTimeout(9000);

const keys = await page.evaluate(() => Object.keys(window.citylitEngine ?? {}));
const result = await page.evaluate(() => {
  const group = window.citylitEngine?.scene?.getObjectByName('creatures:Boulders Beach');
  if (!group) return 'missing';
  let meshes = 0;
  group.traverse((o) => {
    if (!o.isInstancedMesh) return;
    meshes++;
    o.visible = true;
    const m = o.material;
    if (m?.emissive) {
      m.emissive.setHex(0xff0000);
      m.emissiveIntensity = 8;
      m.needsUpdate = true;
    }
    if (m?.color) {
      m.color.setHex(0xff0000);
      m.needsUpdate = true;
    }
    o.frustumCulled = false;
  });
  return { meshes, parentChain: (() => { const chain=[]; let p=group; while(p){ chain.push(p.type+':'+(p.name||'-')+':'+p.visible); p=p.parent; } return chain; })() };
});
await page.waitForTimeout(1500);
await page.screenshot({ path: 'docs/creatures/red.png', timeout: 90_000, animations: 'disabled' });
console.log(JSON.stringify({ keys, result }, null, 2));
await browser.close();
