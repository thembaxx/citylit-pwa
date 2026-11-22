import assert from 'node:assert/strict';
import test from 'node:test';
import {
  computeFrameStats,
  FrameTimeBenchmark,
  pickQualityTier,
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
