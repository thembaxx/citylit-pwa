import assert from 'node:assert/strict';
import test from 'node:test';
import {
  angularDistance,
  createRng,
  easeOutBack,
  hashString,
  mulberry32,
  poissonInterval,
  scatterRing,
} from '../three/creatures/seeded.ts';

test('hashString is deterministic and well distributed', () => {
  assert.equal(hashString('Boulders Beach'), hashString('Boulders Beach'));
  assert.notEqual(hashString('Boulders Beach'), hashString('Kruger National Park'));
  for (const value of ['', 'a', 'pretoria', 'x'.repeat(512)]) {
    const hash = hashString(value);
    assert.ok(Number.isInteger(hash));
    assert.ok(hash >= 0 && hash <= 0xffffffff);
  }
});

test('mulberry32 stays inside [0, 1) and repeats for the same seed', () => {
  const a = mulberry32(42);
  const b = mulberry32(42);
  for (let i = 0; i < 100; i++) {
    const value = a();
    assert.equal(value, b());
    assert.ok(value >= 0 && value < 1);
  }
});

test('createRng helpers honour their bounds', () => {
  const rng = createRng('seed');
  for (let i = 0; i < 200; i++) {
    const r = rng.range(2, 5);
    assert.ok(r >= 2 && r < 5);
    const n = rng.int(1, 6);
    assert.ok(Number.isInteger(n) && n >= 1 && n <= 6);
    assert.ok(Math.abs(rng.jitter(0.25)) <= 0.25);
  }
  assert.equal(rng.chance(0), false);
  assert.equal(rng.chance(1), true);
});

test('fork is deterministic and diverges from the parent stream', () => {
  const parent = createRng('landmark');
  const a = parent.fork('fish');
  const b = parent.fork('fish');
  for (let i = 0; i < 20; i++) assert.equal(a.next(), b.next());
  const aValues = Array.from({ length: 5 }, () => createRng('landmark').fork('fish').next());
  const cValues = Array.from({ length: 5 }, () => createRng('landmark').fork('gull').next());
  assert.notDeepEqual(aValues, cValues);
});

test('angularDistance wraps the short way around', () => {
  assert.ok(Math.abs(angularDistance(0.1, 0.4) - 0.3) < 1e-9);
  assert.ok(Math.abs(angularDistance(6.2, 0.1) - 0.183185) < 1e-4);
  assert.ok(angularDistance(1, 1 + Math.PI * 2) < 1e-9);
});

test('scatterRing is deterministic, bounded and respects the keep-out wedge', () => {
  const options = {
    count: 24,
    innerRadius: 2,
    outerRadius: 3,
    keepOutAngle: Math.PI / 4,
    keepOutHalf: 0.55,
    minSeparation: 0.25,
  };
  const a = scatterRing(createRng('kruger'), options);
  const b = scatterRing(createRng('kruger'), options);
  assert.equal(a.length, 24);
  assert.deepEqual(a, b);
  for (const spot of a) {
    const r = Math.hypot(spot.x, spot.z);
    assert.ok(r >= 1.99 && r <= 3.01, `radius out of range: ${r}`);
    assert.ok(
      angularDistance(spot.angle, Math.PI / 4) >= 0.54,
      'spot landed inside the hero sightline'
    );
  }
});

test('scatterRing handles degenerate input', () => {
  const rng = createRng(1);
  assert.deepEqual(scatterRing(rng, { count: 0, innerRadius: 1, outerRadius: 2 }), []);
  assert.deepEqual(scatterRing(rng, { count: -4, innerRadius: 1, outerRadius: 2 }), []);
  const one = scatterRing(rng, { count: 1, innerRadius: 0, outerRadius: 0 });
  assert.equal(one.length, 1);
});

test('poissonInterval is clamped and deterministic', () => {
  const rng = createRng('timers');
  for (let i = 0; i < 50; i++) {
    const gap = poissonInterval(rng, 4, 1, 9);
    assert.ok(gap >= 1 && gap <= 9);
  }
  const a = poissonInterval(createRng('x'), 2, 0, 100);
  const b = poissonInterval(createRng('x'), 2, 0, 100);
  assert.equal(a, b);
});

test('easeOutBack ends at 1, starts at 0 and never returns NaN', () => {
  assert.equal(easeOutBack(0), 0);
  assert.ok(Math.abs(easeOutBack(1) - 1) < 1e-9);
  for (const t of [-1, 0, 0.2, 0.5, 0.9, 1, 2, Number.NaN]) {
    assert.ok(Number.isFinite(easeOutBack(t)));
  }
});
