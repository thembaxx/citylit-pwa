/**
 * Runtime check for the three pilot landmarks in the real app.
 *
 * Loads each deep link, waits for the diorama to settle, then reads the
 * creature layer's own statistics from the scene graph and reports console
 * errors. Non-pilot landmarks must report no creature layer.
 *
 * Run: node scripts/probe-creature-sites.mjs [baseUrl]
 */
import { chromium } from 'playwright';

const base = process.argv[2] ?? 'http://127.0.0.1:3002/';
const sites = [
  { slug: 'boulders-beach', expect: true, name: 'Boulders Beach' },
  { slug: 'kruger-national-park', expect: true, name: 'Kruger National Park' },
  { slug: 'orlando-towers', expect: true, name: 'Orlando Towers' },
  { slug: 'table-mountain', expect: false, name: 'Table Mountain' },
];

const browser = await chromium.launch({
  headless: true,
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});

const report = [];
for (const site of sites) {
  const page = await browser.newPage({ viewport: { width: 1200, height: 800 } });
  const errors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', (err) => errors.push(`pageerror: ${err.message}`));
  await page.goto(`${base}#${site.slug}`, { waitUntil: 'load', timeout: 60_000 });
  await page.waitForTimeout(11_000);

  const stats = await page.evaluate((name) => {
    const engine = window.citylitEngine;
    const scene = engine?.scene;
    if (!scene) return { error: 'no scene' };
    const group = scene.getObjectByName(`creatures:${name}`);
    if (!group) return { found: false };
    const layer = group.userData.creatureLayer;
    return {
      found: true,
      visible: group.visible,
      children: group.children.length,
      stats: layer?.stats?.() ?? null,
      biome: engine.currentGroup?.userData?.biome ?? null,
    };
  }, site.name);

  report.push({ site: site.name, slug: site.slug, expect: site.expect, stats, errors });
  await page.close();
}

await browser.close();
console.log(JSON.stringify(report, null, 2));

const failed = report.some((entry) => {
  const okFound = entry.stats?.found === true;
  if (entry.expect && !okFound) return true;
  if (!entry.expect && okFound) return true;
  return entry.errors.length > 0;
});
process.exit(failed ? 1 : 0);
