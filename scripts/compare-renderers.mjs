#!/usr/bin/env node
/** Captures desktop/mobile views on both Citylit renderer backends. */
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import puppeteer from 'puppeteer';
import { startQaServer } from './qaServer.mjs';

const outDir = path.resolve(process.env.QA_RENDERERS_OUT ?? 'qa-renderers');
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const viewports = [
  { name: 'desktop', width: 900, height: 600, isMobile: false, hasTouch: false },
  { name: 'mobile', width: 390, height: 844, isMobile: true, hasTouch: true },
];

await mkdir(outDir, { recursive: true });
const server = await startQaServer({
  mode: 'preview',
  port: Number(process.env.QA_RENDERERS_PORT ?? 4173),
});
const url = process.env.QA_URL ?? `${server.url}/`;
let browser;
const results = [];

try {
  browser = await puppeteer.launch({
    headless: !process.argv.includes('--headed'),
    args: ['--no-sandbox'],
  });

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
      const errors = [];
      await page.evaluateOnNewDocument(() => {
        // Keep one-time passport onboarding out of deterministic renderer captures.
        localStorage.setItem(
          'cl-vs',
          JSON.stringify(Array.from({ length: 43 }, (_, index) => index))
        );
      });
      page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`));
      page.on('console', (message) => {
        if (message.type() === 'error') errors.push(`console: ${message.text()}`);
      });
      const label = `${backend}-${view.name}`;
      try {
        await page.goto(`${url}?renderer=${backend}`, {
          waitUntil: 'domcontentloaded',
          timeout: 90000,
        });
        await page.waitForFunction('window.citylitEngine?.rendererBackend', { timeout: 90000 });
        await page.waitForFunction(
          () => !document.querySelector('[aria-label="Sketching the 3D landmarks"]'),
          { timeout: 15000 }
        );
        await wait(250);

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

        const info = await page.evaluate(() => {
          const engine = window.citylitEngine;
          const compactButton = document.querySelector('[aria-label="Expand controls"]');
          const card = compactButton?.closest('.pointer-events-auto');
          const cardRect = card?.getBoundingClientRect();
          const buttonRect = compactButton?.getBoundingClientRect();
          return {
            backend: engine.rendererBackend,
            quality: engine.qualitySetting,
            tier: engine.qualityIndex,
            dpr: engine.renderer.getPixelRatio(),
            gpu: !!navigator.gpu,
            compactCard: !!compactButton,
            card: cardRect
              ? { x: cardRect.x, y: cardRect.y, width: cardRect.width, height: cardRect.height }
              : null,
            compactButton: buttonRect
              ? { width: buttonRect.width, height: buttonRect.height }
              : null,
            canvas: !!document.querySelector('canvas'),
          };
        });
        if (info.backend !== backend) {
          throw new Error(`Requested ${backend}, initialized ${info.backend}`);
        }
        if (!info.canvas) throw new Error('Scene canvas was not rendered');
        if (view.isMobile && !info.compactCard)
          throw new Error('Compact card controls were not rendered on mobile');
        if (
          info.compactButton &&
          (info.compactButton.width < 44 || info.compactButton.height < 44)
        ) {
          throw new Error('Compact navigation controls are below the 44px touch target');
        }
        if (
          info.card &&
          (info.card.x < 0 ||
            info.card.y < 0 ||
            info.card.x + info.card.width > view.width ||
            info.card.y + info.card.height > view.height)
        ) {
          throw new Error('Compact landmark card is clipped outside the viewport');
        }

        const screenshot = path.join(outDir, `${label}.png`);
        await page.screenshot({ path: screenshot });
        results.push({ label, ...info, benchmark, screenshot, errors });
      } catch (error) {
        results.push({ label, error: String(error), errors });
      } finally {
        await context.close();
      }
    }
  }

  await writeFile(
    path.join(outDir, 'report.json'),
    JSON.stringify({ url, capturedAt: new Date().toISOString(), results }, null, 2)
  );
  console.log(JSON.stringify(results, null, 2));
  const failed = results.filter((result) => result.error || result.errors.length > 0);
  if (failed.length) {
    console.error(`Renderer QA failed: ${failed.map((result) => result.label).join(', ')}`);
    process.exitCode = 1;
  }
} finally {
  await browser?.close();
  await server.stop();
}
