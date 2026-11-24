import { chromium } from 'playwright';

const url = process.argv[2] ?? 'http://127.0.0.1:3002/?lab=creatures';
const browser = await chromium.launch({
  headless: true,
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
const page = await browser.newPage({ viewport: { width: 900, height: 600 } });
const logs = [];
page.on('console', (m) => logs.push(`${m.type()}: ${m.text()}`));
page.on('pageerror', (e) => logs.push(`pageerror: ${e.message}\n${e.stack ?? ''}`));
page.on('requestfailed', (r) => logs.push(`requestfailed: ${r.url()} ${r.failure()?.errorText}`));
await page.goto(url, { waitUntil: 'load', timeout: 60_000 });
await page.waitForTimeout(6000);
const html = await page.evaluate(() => document.body.innerHTML.slice(0, 600));
const hasRoot = await page.evaluate(() => Boolean(document.getElementById('root')));
console.log(JSON.stringify({ hasRoot, html, logs }, null, 2));
await browser.close();
