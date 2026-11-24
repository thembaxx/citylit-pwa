import { chromium } from 'playwright';

const browser = await chromium.launch({
  headless: true,
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
const page = await browser.newPage({ viewport: { width: 900, height: 600 } });
await page.goto('http://127.0.0.1:3002/?creatures=on#boulders-beach', {
  waitUntil: 'load',
  timeout: 60_000,
});
await page.waitForTimeout(6000);
const read = () =>
  page.evaluate(() => {
    const engine = window.citylitEngine;
    const group = engine?.scene?.getObjectByName('creatures:Boulders Beach');
    const fieldGroup = group?.children?.[0];
    const mesh = fieldGroup?.children?.[0];
    return {
      motionScale: engine?.motionScale,
      elapsed: engine?.elapsed,
      tickType: typeof engine?.currentGroup?.userData?.tick,
      currentName: engine?.currentGroup?.name,
      groupVisible: fieldGroup?.visible,
      scale: mesh ? [mesh.instanceMatrix.array[0], mesh.instanceMatrix.array[5]] : null,
      layerStats: group?.userData?.creatureLayer?.stats?.(),
    };
  });
const a = await read();
await page.waitForTimeout(2500);
const b = await read();
console.log(JSON.stringify({ a, b }, null, 2));
await browser.close();
