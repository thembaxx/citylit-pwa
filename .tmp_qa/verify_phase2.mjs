import { chromium } from 'playwright';

const CHROME_PATH =
  '/root/.cache/puppeteer/chrome/linux-157.0.8103.78/chrome-linux64/chrome';

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function waitAnimationFrames(page, count = 30) {
  await page.evaluate(
    (n) =>
      new Promise((resolve) => {
        let i = 0;
        function step() {
          i++;
          if (i >= n) resolve();
          else requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
      }),
    count
  );
}

async function orbit(page, dx, dy) {
  const cx = 640;
  const cy = 400;
  await page.mouse.move(cx, cy);
  await page.mouse.down();
  await page.mouse.move(cx + dx, cy + dy, { steps: 12 });
  await page.mouse.up();
  await waitAnimationFrames(page, 6);
}

async function zoom(page, deltaY) {
  await page.mouse.move(640, 400);
  await page.mouse.wheel(0, deltaY);
  await waitAnimationFrames(page, 6);
}

async function setFullscreen(page, wantFullscreen) {
  const btn = page.locator('button[aria-label="Toggle fullscreen view"]');
  if ((await btn.count()) === 0) return;
  const pressed = await btn.getAttribute('aria-pressed');
  if (String(wantFullscreen) !== pressed) {
    await btn.click();
    await sleep(450);
  }
}

async function setWeatherControls(page, { presetLabel, month }) {
  const weatherBtn = page.locator('button[aria-expanded]:has-text("SAST")').first();
  await weatherBtn.waitFor({ state: 'visible', timeout: 15000 });
  const isExpanded = await weatherBtn.getAttribute('aria-expanded');
  if (isExpanded !== 'true') {
    await weatherBtn.click();
    await sleep(500);
  }
  if (month !== undefined) {
    const slider = page.locator('input[aria-label="Select month"]');
    await slider.waitFor({ state: 'visible', timeout: 8000 });
    await slider.evaluate((el, m) => {
      const setter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        'value'
      ).set;
      setter.call(el, String(m));
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    }, month);
    await sleep(300);
  }
  if (presetLabel) {
    const presetBtn = page.locator(`button[aria-label="Set time to ${presetLabel}"]`);
    await presetBtn.waitFor({ state: 'visible', timeout: 8000 });
    await presetBtn.click();
    await sleep(300);
  }
  const stillExpanded = await weatherBtn.getAttribute('aria-expanded');
  if (stillExpanded === 'true') {
    await weatherBtn.click();
    await sleep(650);
  }
}

async function setHourViaScrubber(page, hour) {
  const todBtn = page.locator('button[aria-label="Time of day"]');
  await todBtn.waitFor({ state: 'visible', timeout: 8000 });
  await todBtn.click();
  await sleep(350);
  const slider = page.locator('input[aria-label="Time of day hour"]');
  await slider.waitFor({ state: 'visible', timeout: 8000 });
  await slider.evaluate((el, h) => {
    const setter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype,
      'value'
    ).set;
    setter.call(el, String(h));
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }, hour);
  await sleep(300);
  await todBtn.click();
  await sleep(500);
}

async function waitUntilBooted(page) {
  await page.waitForSelector('canvas', { timeout: 25000 });
  await page
    .locator('.boot-splash')
    .waitFor({ state: 'detached', timeout: 25000 })
    .catch(() => {});
  await page.locator('button[aria-expanded]:has-text("SAST")').first().waitFor({
    state: 'visible',
    timeout: 15000,
  });
  await waitAnimationFrames(page, 18);
}

async function captureSite(page, slug, namePrefix, shots) {
  console.error(`Navigating to #${slug}...`);
  await page.goto('about:blank');
  await page.goto(`http://localhost:3000/#${slug}`, {
    waitUntil: 'domcontentloaded',
  });
  await waitUntilBooted(page);

  for (const shot of shots) {
    console.error(`Preparing ${namePrefix}_${shot.file}...`);
    if (shot.reloadTheme) {
      await setFullscreen(page, false);
      await page.evaluate((theme) => {
        const raw = localStorage.getItem('cl-st');
        const st = raw ? JSON.parse(raw) : {};
        st.theme = theme;
        localStorage.setItem('cl-st', JSON.stringify(st));
      }, shot.reloadTheme);
      await page.goto('about:blank');
      await page.goto(`http://localhost:3000/#${slug}`, {
        waitUntil: 'domcontentloaded',
      });
      await waitUntilBooted(page);
    }
    if (shot.month !== undefined || shot.preset) {
      await setFullscreen(page, false);
      await setWeatherControls(page, {
        month: shot.month,
        presetLabel: shot.preset,
      });
    }
    if (shot.hour !== undefined) {
      await setFullscreen(page, false);
      await setHourViaScrubber(page, shot.hour);
    }
    if (shot.cutaway !== undefined) {
      await setFullscreen(page, false);
      const btn = page.locator('button[aria-label="Inspect architectural cutaway layers"]');
      if ((await btn.count()) > 0) {
        const pressed = await btn.getAttribute('aria-pressed');
        if (String(shot.cutaway) !== pressed) {
          await btn.click();
          await waitAnimationFrames(page, 15);
        }
      }
    }
    await setFullscreen(page, shot.fullscreen !== false);
    if (shot.orbitDx || shot.orbitDy) {
      await orbit(page, shot.orbitDx ?? 0, shot.orbitDy ?? 0);
    }
    if (shot.zoomDelta) {
      await zoom(page, shot.zoomDelta);
    }
    // Wait enough animation frames so weatherScene smooth lighting/time lerps converge
    await waitAnimationFrames(page, shot.settleFrames ?? 36);
    await page.screenshot({ path: `.tmp_qa/${namePrefix}_${shot.file}.png` });
    console.error(`Captured ${namePrefix}_${shot.file}.png`);
  }
}

async function main() {
  console.error('Launching Chrome...');
  const browser = await chromium.launch({
    executablePath: CHROME_PATH,
    args: [
      '--headless=new',
      '--no-sandbox',
      '--use-gl=angle',
      '--use-angle=swiftshader',
      '--enable-webgl',
      '--ignore-gpu-blocklist',
    ],
  });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();

  const errors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      errors.push(`console.error: ${msg.text()}`);
      console.error('BROWSER CONSOLE ERROR:', msg.text());
    }
  });
  page.on('pageerror', (err) => {
    errors.push(`pageerror: ${err.message}`);
    console.error('BROWSER PAGEERROR:', err.message);
  });

  await page.goto('http://localhost:3000/', { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => {
    localStorage.setItem(
      'cl-st',
      JSON.stringify({
        theme: 'daylight',
        quality: 'high',
        wildlife: true,
        hiddenDetails: true,
        motion: 'auto',
      })
    );
  });

  await captureSite(page, 'boulders-beach', 'boulders', [
    { file: 'noon', month: 1, preset: 'Noon', fullscreen: false, settleFrames: 24 },
    {
      file: 'strata_bay',
      fullscreen: true,
      orbitDx: -95,
      orbitDy: 105,
      zoomDelta: -360,
      settleFrames: 18,
    },
    { file: 'dusk', preset: 'Dusk', fullscreen: true, settleFrames: 40 },
    { file: 'night', preset: 'Night', fullscreen: true, settleFrames: 42 },
    { file: 'rain', month: 7, preset: 'Noon', fullscreen: true, settleFrames: 36 },
    {
      file: 'studio_cutaway',
      reloadTheme: 'studio',
      preset: 'Noon',
      cutaway: true,
      fullscreen: true,
      orbitDx: -85,
      orbitDy: 75,
      settleFrames: 24,
    },
  ]);

  await page.evaluate(() => {
    const st = JSON.parse(localStorage.getItem('cl-st') || '{}');
    st.theme = 'daylight';
    localStorage.setItem('cl-st', JSON.stringify(st));
  });

  await captureSite(page, 'kruger-national-park', 'kruger', [
    { file: 'noon', month: 1, preset: 'Noon', fullscreen: false, settleFrames: 24 },
    {
      file: 'strata_low',
      fullscreen: true,
      orbitDx: -105,
      orbitDy: 110,
      zoomDelta: -340,
      settleFrames: 18,
    },
    { file: 'dusk', preset: 'Dusk', fullscreen: true, settleFrames: 40 },
    { file: 'night', preset: 'Night', fullscreen: true, settleFrames: 42 },
    { file: 'storm', month: 1, hour: 16, fullscreen: true, settleFrames: 36 },
  ]);

  await captureSite(page, 'orlando-towers', 'orlando', [
    { file: 'noon', month: 1, preset: 'Noon', fullscreen: false, settleFrames: 24 },
    {
      file: 'strata_low',
      fullscreen: true,
      orbitDx: 80,
      orbitDy: 110,
      zoomDelta: -320,
      settleFrames: 18,
    },
    { file: 'dusk', preset: 'Dusk', fullscreen: true, settleFrames: 40 },
    { file: 'night', preset: 'Night', fullscreen: true, settleFrames: 42 },
  ]);

  console.error('Total console/page errors:', errors.length);
  if (errors.length > 0) {
    console.error(errors.join('\n'));
    process.exitCode = 1;
  }

  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
