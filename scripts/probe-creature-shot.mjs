/**
 * Capture one pilot landmark with the creature layer forced on.
 * Run: node scripts/probe-creature-shot.mjs <slug> <outPath> [base]
 */
import { chromium } from 'playwright';

const slug = process.argv[2] ?? 'boulders-beach';
const out = process.argv[3] ?? 'docs/creatures/boulders-beach.png';
const base = process.argv[4] ?? 'http://127.0.0.1:3002/?creatures=on';

const browser = await chromium.launch({
  headless: true,
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
const page = await browser.newPage({ viewport: { width: 1200, height: 800 } });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => {
  if (m.type() === 'error') errors.push(m.text());
});

await page.goto(`${base}#${slug}`, { waitUntil: 'load', timeout: 60_000 });
await page.waitForTimeout(12_000);
await page.screenshot({ path: out, timeout: 90_000, animations: 'disabled' });

const stats = await page.evaluate((name) => {
  const scene = window.citylitEngine?.scene;
  const group = scene?.getObjectByName(`creatures:${name}`);
  return group?.userData.creatureLayer?.stats?.() ?? null;
}, {
  'boulders-beach': 'Boulders Beach',
  'kruger-national-park': 'Kruger National Park',
  'orlando-towers': 'Orlando Towers',
}[slug] ?? slug);

console.log(JSON.stringify({ out, stats, errors }, null, 2));
await browser.close();
process.exit(errors.length ? 1 : 0);
