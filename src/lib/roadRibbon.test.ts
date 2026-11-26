import assert from 'node:assert/strict';
import test from 'node:test';
import { sampleRoadRibbon } from './roadRibbon.ts';

test('terrain-conformed road samples stay at the local ground plus authored grade', () => {
  const heightAt = (x: number, z: number) => 0.25 * x * x + Math.sin(z * 2) * 0.08;
  const points = [
    { x: -1, y: heightAt(-1, 0) + 0.02, z: 0 },
    { x: 0, y: heightAt(0, 0.5) + 0.02, z: 0.5 },
    { x: 1, y: heightAt(1, 1) + 0.02, z: 1 },
  ];
  const samples = sampleRoadRibbon(points, heightAt, 24);

  assert.equal(samples.length, 25);
  for (const sample of samples) {
    assert.ok(Number.isFinite(sample.x) && Number.isFinite(sample.y) && Number.isFinite(sample.z));
    assert.ok(Math.abs(sample.y - heightAt(sample.x, sample.z) - 0.02) < 1e-6);
  }
  assert.deepEqual(samples[0], { ...points[0] });
  assert.deepEqual(samples.at(-1), { ...points.at(-1) });
});

test('road sampling handles invalid point counts and clamps segment counts', () => {
  const heightAt = () => 0;
  assert.deepEqual(sampleRoadRibbon([], heightAt), []);
  assert.deepEqual(sampleRoadRibbon([{ x: 0, y: 0, z: 0 }], heightAt), []);
  assert.equal(
    sampleRoadRibbon(
      [
        { x: 0, y: 0, z: 0 },
        { x: 1, y: 0, z: 0 },
      ],
      heightAt,
      0
    ).length,
    2
  );
});
