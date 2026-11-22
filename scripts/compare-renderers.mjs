/**
 * Captures the same hero view on both renderer backends for visual comparison.
 * Run with `npm run qa:renderers` (requires a dev/preview server on QA_URL).
 */
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import puppeteer from 'puppeteer';

const url = process.env.QA_URL ?? 'http://127.0.0.1:4173/';
const outDir = path.resolve('qa-renderers');
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

await mkdir(outDir, { recursive: true });
const browser = await puppeteer.launch({
  headless: !process.argv.includes('--headed'),
  args: ['--no-sandbox'],
});
const results = [];

for (const backend of ['webgl', 'webgpu']) {
  const context = await browser.createBrowserContext();
  const page = await context.newPage();
  await page.setViewport({ width: 900, height: 600, deviceScaleFactor: 1 });
  const messages = [];
  page.on('pageerror', (err) => messages.push(`pageerror: ${err.message}`));
  page.on('console', (msg) => {
    if (msg.type() === 'error' || msg.type() === 'warning') {
      messages.push(`${msg.type()}: ${msg.text()}`);
    }
  });
  try {
    await page.goto(`${url}?renderer=${backend}`, {
      waitUntil: 'domcontentloaded',
      timeout: 90000,
    });
    await page.waitForFunction('window.citylitEngine?.rendererBackend', { timeout: 90000 });
    // Pin the high tier so AO/DoF/bloom are active on both stacks.
    await page.evaluate(() => {
      const engine = window.citylitEngine;
      engine.cancelQualityBenchmark();
      engine.setQualityIndex(0);
    });
    await wait(4000);
    const info = await page.evaluate(() => ({
      backend: window.citylitEngine.rendererBackend,
      quality: window.citylitEngine.qualitySetting,
      tier: window.citylitEngine.qualityIndex,
      dpr: window.citylitEngine.renderer.getPixelRatio(),
      gpu: !!navigator.gpu,
    }));
    const shot = path.join(outDir, `${backend}.png`);
    await page.screenshot({ path: shot });
    results.push({ requested: backend, ...info, screenshot: shot, messages });
  } catch (error) {
    results.push({ requested: backend, error: String(error), messages });
  }
  await context.close();
}

await browser.close();
await writeFile(
  path.join(outDir, 'report.json'),
  JSON.stringify({ url, capturedAt: new Date().toISOString(), results }, null, 2)
);
console.log(JSON.stringify(results, null, 2));
