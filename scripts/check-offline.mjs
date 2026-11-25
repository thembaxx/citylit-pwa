#!/usr/bin/env node
/** Verifies the built PWA shell can reload offline after its service worker controls it. */
import puppeteer from 'puppeteer';
import { startQaServer } from './qaServer.mjs';

const server = await startQaServer({
  mode: 'preview',
  port: Number(process.env.QA_OFFLINE_PORT ?? 4174),
});
let browser;
try {
  browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 900, height: 700 } });
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('requestfailed', (request) =>
    errors.push(`requestfailed: ${request.url()} (${request.failure()?.errorText})`)
  );

  await page.goto(`${server.url}/`, { waitUntil: 'networkidle2', timeout: 90000 });
  await page.waitForFunction(() => Boolean(window.citylitEngine?.rendererBackend), {
    timeout: 90000,
  });
  await page.evaluate(async () => {
    if (!('serviceWorker' in navigator)) throw new Error('Service workers are unsupported');
    await navigator.serviceWorker.ready;
  });

  let controlled = await page.evaluate(() => Boolean(navigator.serviceWorker.controller));
  if (!controlled) {
    await page.reload({ waitUntil: 'networkidle2', timeout: 90000 });
    await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller), {
      timeout: 30000,
    });
    await page.waitForFunction(() => Boolean(window.citylitEngine?.rendererBackend), {
      timeout: 90000,
    });
    controlled = true;
  }
  await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller), {
    timeout: 30000,
  });
  const beforeOffline = await page.evaluate(async () => ({
    controller: navigator.serviceWorker.controller?.scriptURL ?? null,
    registrations: (await navigator.serviceWorker.getRegistration())?.active?.state ?? null,
    cacheKeys: await caches.keys(),
    cachedShell: Boolean(await caches.match('/index.html', { ignoreSearch: true })),
    title: document.title,
  }));
  console.log('PWA control before offline:', JSON.stringify(beforeOffline));

  await page.setOfflineMode(true);
  await new Promise((resolve) => setTimeout(resolve, 500));
  console.log(
    'PWA state offline before reload:',
    JSON.stringify(
      await page.evaluate(() => ({
        online: navigator.onLine,
        controller: navigator.serviceWorker.controller?.scriptURL ?? null,
        title: document.title,
        root: Boolean(document.querySelector('#root')),
      }))
    )
  );
  await page.reload({ waitUntil: 'domcontentloaded', timeout: 30000 }).catch((error) => {
    console.error(`Offline navigation error: ${error.message}`);
  });
  try {
    await page.waitForFunction(
      () =>
        [...document.querySelectorAll('[role="status"]')].some((node) =>
          node.textContent?.includes('Offline')
        ) && Boolean(document.querySelector('#root')),
      { timeout: 15000 }
    );
  } catch {
    const diagnostics = await page.evaluate(() => ({
      online: navigator.onLine,
      readyState: document.readyState,
      title: document.title,
      rootText: document.querySelector('#root')?.textContent?.slice(0, 300) ?? null,
      statuses: [...document.querySelectorAll('[role="status"]')].map((node) => node.textContent),
      controller: Boolean(navigator.serviceWorker?.controller),
    }));
    throw new Error(`Offline notice did not appear: ${JSON.stringify(diagnostics)}`);
  }
  const result = await page.evaluate(() => ({
    title: document.title,
    offlineNotice:
      [...document.querySelectorAll('[role="status"]')]
        .map((node) => node.textContent?.trim())
        .find((text) => text?.startsWith('Offline')) ?? null,
    serviceWorkerControlled: Boolean(navigator.serviceWorker.controller),
    landmarkTitle: document.querySelector('h1')?.textContent?.trim() ?? null,
  }));
  if (!result.serviceWorkerControlled)
    throw new Error('Offline reload was not served by the service worker');
  if (!result.offlineNotice) throw new Error('Offline status notice did not appear');
  if (errors.length) throw new Error(`Runtime errors: ${errors.join('; ')}`);
  console.log(JSON.stringify(result, null, 2));
} catch (error) {
  console.error(
    `Offline PWA check failed: ${error instanceof Error ? error.message : String(error)}`
  );
  process.exitCode = 1;
} finally {
  await browser?.close();
  await server.stop();
}
