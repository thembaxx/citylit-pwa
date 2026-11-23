/**
 * Captures the same pinned high-tier view on both renderer backends at desktop
 * and mobile sizes, and logs the first-load quality benchmark state.
 * Run with `npm run qa:renderers` (requires a server on QA_URL).
 */
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import puppeteer from 'puppeteer';

const url = process.env.QA_URL ?? 'http://127.0.0.1:4173/';
const outDir = path.resolve('qa-renderers');
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const viewports = [
  { name: 'desktop', width: 900, height: 600, isMobile: false, hasTouch: false },
  { name: 'mobile', width: 390, height: 844, isMobile: true, hasTouch: true },
];

await mkdir(outDir, { recursive: true });
const browser = await puppeteer.launch({
  headless: !process.argv.includes('--headed'),
  args: ['--no-sandbox'],
});
const results = [];

for (const backend of ['webgl', 'webgpu']) {
  for (const view of viewports) {
    const context = await browser.createBrowserContext();
    const page = await context.newPage();
    await page.setViewport({
      width: view.width,
      height: view.height,
      isMobile: view.isMobile,
      hasTouch: view.hasTouch,
      deviceScaleFactor: 1,
    });
    const messages = [];
    page.on('pageerror', (err) => messages.push(`pageerror: ${err.message}`));
    page.on('console', (msg) => {
      if (msg.type() === 'error' || msg.type() === 'warning') {
        messages.push(`${msg.type()}: ${msg.text()}`);
      }
    });
    const label = `${backend}-${view.name}`;
    try {
      await page.goto(`${url}?renderer=${backend}`, {
        waitUntil: 'domcontentloaded',
        timeout: 90000,
      });
      await page.waitForFunction('window.citylitEngine?.rendererBackend', { timeout: 90000 });
      await wait(3000);

      // Read benchmark state before pinning the tier (pinning cancels it).
      const benchmark = await page.evaluate(() => {
        const engine = window.citylitEngine;
        let cached = null;
        try {
          cached = JSON.parse(localStorage.getItem('cl-quality-benchmark-v1') ?? 'null');
        } catch {
          cached = null;
        }
        return {
          resolved: engine.qualityTierResolved,
          tier: engine.qualityIndex,
          samples: engine.qualityBenchmark?.samples?.length ?? 'committed',
          cached,
        };
      });

      await page.evaluate(() => {
        const engine = window.citylitEngine;
        engine.cancelQualityBenchmark();
        engine.setQualityIndex(0);
      });
      await wait(3000);
      const info = await page.evaluate(() => ({
        backend: window.citylitEngine.rendererBackend,
        quality: window.citylitEngine.qualitySetting,
        tier: window.citylitEngine.qualityIndex,
        dpr: window.citylitEngine.renderer.getPixelRatio(),
        gpu: !!navigator.gpu,
        compactCard: !!document.querySelector('[aria-label="Expand controls"]'),
        heroButton: !!document.querySelector('[aria-label="Reset to hero framing"]'),
      }));
      const shot = path.join(outDir, `${label}.png`);
      await page.screenshot({ path: shot });
      results.push({ label, ...info, benchmark, screenshot: shot, messages });
    } catch (error) {
      results.push({ label, error: String(error), messages });
    }
    await context.close();
  }
}

await browser.close();
await writeFile(
  path.join(outDir, 'report.json'),
  JSON.stringify({ url, capturedAt: new Date().toISOString(), results }, null, 2)
);
console.log(JSON.stringify(results, null, 2));
