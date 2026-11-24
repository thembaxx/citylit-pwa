/**
 * Headless runtime check for the dev-only creature Lab.
 *
 * Loads ?lab=creatures, cycles through a species for each animation path
 * (flap, parts, spine), then reports console errors, WebGL shader failures and
 * the live instance counters.
 * Run: node scripts/probe-creatures-lab.mjs [url]
 */
import { chromium } from 'playwright';

const url = process.argv[2] ?? 'http://127.0.0.1:3002/?lab=creatures';

const browser = await chromium.launch({
  headless: true,
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
const page = await browser.newPage({ viewport: { width: 1100, height: 760 } });

const errors = [];
page.on('console', (msg) => {
  if (msg.type() === 'error') errors.push(msg.text());
});
page.on('pageerror', (err) => errors.push(`pageerror: ${err.message}`));

await page.goto(url, { waitUntil: 'load', timeout: 60_000 });
await page.waitForTimeout(3500);

const results = [];
const selectSpecies = async (id) => {
  await page.selectOption('select', id);
  await page.waitForTimeout(900);
  results.push({
    species: id,
    stats: await page.evaluate(() =>
      typeof window.creatureLabStats === 'function' ? window.creatureLabStats() : null
    ),
  });
};

await selectSpecies('gull'); // flap
await selectSpecies('penguin'); // parts
await selectSpecies('fish'); // spine
await selectSpecies('whale');

const panelText = await page.evaluate(
  () => document.querySelector('#root > div:nth-of-type(2)')?.innerText?.slice(0, 260) ?? ''
);
await page.screenshot({ path: 'docs/creatures-lab.png' });

console.log(JSON.stringify({ url, results, errors, panelText }, null, 2));
await browser.close();
process.exit(errors.length > 0 ? 1 : 0);
