import assert from 'node:assert/strict';
import test from 'node:test';
import { CreatureEffectsPool } from '../three/creatures/effects.ts';
import { getSpeciesBuild, SPECIES_IDS, type SpeciesLod } from '../three/creatures/species.ts';

test('every species builds cleanly across all 3 LODs with finite vertices', () => {
  for (const id of SPECIES_IDS) {
    let prevTris = Infinity;
    for (const lod of [0, 1, 2] as SpeciesLod[]) {
      const build = getSpeciesBuild(id, lod);
      assert.ok(build.triangles > 0, `${id} LOD ${lod} must have triangles`);
      assert.ok(
        build.triangles <= prevTris,
        `${id} LOD ${lod} triangles (${build.triangles}) exceeded LOD ${lod - 1} (${prevTris})`
      );
      prevTris = build.triangles;

      const pos = build.body.attributes.position;
      const bend = build.body.attributes.aBend;
      assert.ok(pos && pos.count > 0, `${id} LOD ${lod} missing positions`);
      assert.ok(bend && bend.count === pos.count, `${id} LOD ${lod} missing aBend`);
      for (let i = 0; i < pos.count; i++) {
        assert.ok(Number.isFinite(pos.getX(i)));
        assert.ok(Number.isFinite(pos.getY(i)));
        assert.ok(Number.isFinite(pos.getZ(i)));
        const b = bend.getX(i);
        assert.ok(b >= 0 && b <= 1, `${id} aBend out of [0,1]: ${b}`);
      }

      if (lod === 2) {
        assert.equal(build.eyes, null, `${id} LOD 2 should omit micro eyes`);
      }
    }
  }
});

test('spine swimmers align eye aBend coordinates with their body head zone', () => {
  for (const id of ['fish', 'dolphin', 'whale'] as const) {
    const build = getSpeciesBuild(id, 0);
    assert.ok(build.eyes, `${id} should have eyes at LOD 0`);
    const eyeBend = build.eyes.attributes.aBend;
    let maxEyeBend = 0;
    for (let i = 0; i < eyeBend.count; i++) {
      maxEyeBend = Math.max(maxEyeBend, eyeBend.getX(i));
    }
    assert.ok(
      maxEyeBend < 0.45,
      `${id} eye max aBend (${maxEyeBend}) should stay near the head (<0.45)`
    );
  }
});

test('CreatureEffectsPool spawns, ticks, expires and cleans up cleanly', () => {
  const pool = new CreatureEffectsPool(1);
  pool.spawnRipple(1, 0.05, 2, 0.4, 0.8);
  pool.spawnSplash(0, 0.05, 0, 5, 0.5, 0.05);
  pool.spawnDust(-1, 0.02, 1, 4, 0.2, 0.07);
  pool.update(0.1);
  const mid = pool.stats();
  assert.equal(mid.activeRipples, 1);
  assert.equal(mid.activeParticles, 9);
  assert.equal(mid.drawCalls, 2);

  // Advance past max lifetime to ensure instances expire to hidden cleanly.
  for (let s = 0; s < 15; s++) pool.update(0.2);
  const end = pool.stats();
  assert.equal(end.activeRipples, 0);
  assert.equal(end.activeParticles, 0);
  assert.equal(end.drawCalls, 0);
  pool.dispose();
});
