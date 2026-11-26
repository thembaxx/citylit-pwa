import assert from 'node:assert/strict';
import test from 'node:test';
import {
  computeFrameStats,
  FrameTimeBenchmark,
  pickQualityTier,
  readCachedBenchmark,
  type BenchmarkConfig,
} from './qualityBenchmark.ts';

const FAST: BenchmarkConfig = {
  warmupFrames: 2,
  sampleFrames: 6,
  maxFrameMs: 100,
  stallMs: 1000,
  targetMs: 16.7,
  tailCeilingMs: 24,
  midCeilingMs: 22,
};

test('FrameTimeBenchmark ignores warm-up frames', () => {
  const bench = new FrameTimeBenchmark(FAST);
  for (let i = 0; i < 2; i++) bench.addFrame(500);
  assert.equal(bench.done, false);
  assert.equal(bench.stats().count, 0);
  for (let i = 0; i < 6; i++) bench.addFrame(14);
  assert.equal(bench.done, true);
  assert.equal(bench.stats().count, 6);
  assert.equal(bench.stats().medianMs, 14);
});

test('FrameTimeBenchmark clamps slow frames, drops tab-switch gaps, and uses the slower of interval/render time', () => {
  const bench = new FrameTimeBenchmark(FAST);
  bench.addFrame(8);
  bench.addFrame(8);
  bench.addFrame(2000); // tab switch, ignored
  bench.addFrame(300); // genuinely slow frame, clamped to maxFrameMs
  bench.addFrame(8, 30); // CPU-bound render hidden by vsync
  bench.addFrame(8);
  bench.addFrame(8);
  bench.addFrame(8);
  bench.addFrame(8);
  bench.addFrame(8);
  const stats = bench.stats();
  assert.equal(stats.count, 6);
  assert.equal(stats.medianMs, 8);
  assert.equal(stats.p95Ms, 100);
});

test('FrameTimeBenchmark uses a GPU timestamp when it is slower than the frame interval', () => {
  const bench = new FrameTimeBenchmark(FAST);
  bench.addFrame(8);
  bench.addFrame(8);
  bench.addFrame(8, 0, 25);
  bench.addFrame(8, 0, null);
  bench.addFrame(8);
  bench.addFrame(8);
  bench.addFrame(8);
  bench.addFrame(8);
  assert.equal(bench.stats().p95Ms, 25);
});

test('pickQualityTier chooses high for fast frames, mid for moderate, low for slow', () => {
  assert.equal(pickQualityTier(computeFrameStats([14, 15, 16, 15, 14]), false), 0);
  assert.equal(pickQualityTier(computeFrameStats([19, 20, 18, 21, 19]), false), 1);
  assert.equal(pickQualityTier(computeFrameStats([28, 30, 27, 33, 29]), false), 2);
});

test('pickQualityTier requires a clean tail for high and floors software renderers', () => {
  assert.equal(pickQualityTier(computeFrameStats([14, 14, 14, 14, 40]), false), 1);
  assert.equal(pickQualityTier(computeFrameStats([14, 14, 14, 14, 40]), true), 2);
  assert.equal(pickQualityTier(computeFrameStats([]), false), 2);
});

test('readCachedBenchmark accepts a fresh valid entry for the same backend and DPR', () => {
  const stored = new Map<string, string>();
  const global = globalThis as unknown as { localStorage?: Storage };
  const previous = global.localStorage;
  global.localStorage = {
    getItem: (key) => stored.get(key) ?? null,
    setItem: (key, value) => stored.set(key, value),
    removeItem: (key) => stored.delete(key),
    clear: () => stored.clear(),
    key: (index) => [...stored.keys()][index] ?? null,
    get length() {
      return stored.size;
    },
  };
  try {
    const now = Date.now();
    stored.set(
      'cl-quality-benchmark-v1',
      JSON.stringify({
        version: 1,
        backend: 'webgpu',
        dpr: 2,
        tier: 1,
        medianMs: 18,
        p95Ms: 23,
        measuredAt: now,
      })
    );
    assert.deepEqual(readCachedBenchmark('webgpu', 2), {
      version: 1,
      backend: 'webgpu',
      dpr: 2,
      tier: 1,
      medianMs: 18,
      p95Ms: 23,
      measuredAt: now,
    });
    assert.equal(readCachedBenchmark('webgl', 2), null);
    assert.equal(readCachedBenchmark('webgpu', 1), null);
  } finally {
    if (previous === undefined) delete global.localStorage;
    else global.localStorage = previous;
  }
});

test('readCachedBenchmark rejects invalid tiers, incomplete stats, future timestamps and expired entries', () => {
  const stored = new Map<string, string>();
  const global = globalThis as unknown as { localStorage?: Storage };
  const previous = global.localStorage;
  global.localStorage = {
    getItem: (key) => stored.get(key) ?? null,
    setItem: (key, value) => stored.set(key, value),
    removeItem: (key) => stored.delete(key),
    clear: () => stored.clear(),
    key: (index) => [...stored.keys()][index] ?? null,
    get length() {
      return stored.size;
    },
  };
  try {
    const now = Date.now();
    const valid = {
      version: 1,
      backend: 'webgpu',
      dpr: 2,
      tier: 1,
      medianMs: 18,
      p95Ms: 23,
      measuredAt: now,
    };
    const invalidEntries = [
      { ...valid, tier: 3 },
      { ...valid, tier: -1 },
      { ...valid, medianMs: Number.NaN },
      { ...valid, medianMs: -1 },
      { ...valid, p95Ms: undefined },
      { ...valid, p95Ms: 17 },
      { ...valid, measuredAt: now + 60_000 },
      { ...valid, measuredAt: now - 60_000 },
    ];

    for (const entry of invalidEntries) {
      stored.set('cl-quality-benchmark-v1', JSON.stringify(entry));
      assert.equal(readCachedBenchmark('webgpu', 2, 1000), null);
    }
  } finally {
    if (previous === undefined) delete global.localStorage;
    else global.localStorage = previous;
  }
});
