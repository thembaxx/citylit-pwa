import assert from 'node:assert/strict';
import test from 'node:test';
import { createServer } from 'vite';

const VISUAL_FIELDS = [
  'bounceDay',
  'bounceNight',
  'rimColor',
  'skyTopTint',
  'skyHorizonTint',
  'aoShadowColor',
  'plinthRingDay',
  'plinthRingNight',
] as const;

test('every curated landmark has a bespoke model, context profile and valid site palette', async () => {
  const vite = await createServer({
    configFile: 'vite.config.ts',
    server: { middlewareMode: true },
    appType: 'custom',
    logLevel: 'error',
  });

  try {
    const [catalog, builders, context, visuals] = await Promise.all([
      vite.ssrLoadModule('/src/data/landmarks.ts'),
      vite.ssrLoadModule('/src/three/builders/landmarksB.ts'),
      vite.ssrLoadModule('/src/three/builders/dioramaKit.ts'),
      vite.ssrLoadModule('/src/three/siteVisuals.ts'),
    ]);

    const { LANDMARKS } = catalog;
    const { LANDMARK_BUILDERS } = builders;
    const { hasSiteProfile } = context;
    const { getSiteVisualProfile } = visuals;

    assert.equal(Object.keys(LANDMARK_BUILDERS).length, LANDMARKS.length);
    for (const { k, biome } of LANDMARKS) {
      assert.equal(typeof LANDMARK_BUILDERS[k], 'function', `${k} needs a bespoke model builder`);
      assert.ok(hasSiteProfile(k), `${k} needs a curated context profile`);

      const profile = getSiteVisualProfile(k, biome);
      for (const field of VISUAL_FIELDS) {
        assert.match(profile[field], /^#[0-9a-f]{6}$/i, `${k}.${field} must be a valid color`);
      }
      assert.ok(Number.isFinite(profile.rimBoost), `${k}.rimBoost must be finite`);
      assert.ok(Number.isFinite(profile.grade.saturation), `${k}.grade.saturation must be finite`);
    }
  } finally {
    await vite.close();
  }
});
