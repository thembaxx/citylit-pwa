import { chromium } from 'playwright';

const browser = await chromium.launch({
  headless: true,
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
const page = await browser.newPage({ viewport: { width: 1200, height: 800 } });

const shoot = async (url, out) => {
  await page.goto(url, { waitUntil: 'load', timeout: 60_000 });
  await page.waitForTimeout(9000);
  await page.screenshot({
    path: out,
    clip: { x: 380, y: 240, width: 460, height: 340 },
    timeout: 90_000,
    animations: 'disabled',
  });
};

await shoot('http://127.0.0.1:3002/?creatures=on#boulders-beach', 'docs/creatures/zoom-with.png');
await shoot('http://127.0.0.1:3002/#boulders-beach', 'docs/creatures/zoom-without.png');
console.log('done');
await browser.close();
