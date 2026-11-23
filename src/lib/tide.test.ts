import assert from 'node:assert/strict';
import test from 'node:test';
import {
  computeCoastalTideOffset,
  TIDE_CENTER_OFFSET,
  TIDE_HALF_AMPLITUDE,
  TIDE_WAVE_AMPLITUDE,
} from './tide.ts';

test('computeCoastalTideOffset wraps seamlessly across midnight (hour 0 equals hour 24)', () => {
  assert.ok(Math.abs(computeCoastalTideOffset(0) - computeCoastalTideOffset(24)) < 1e-10);
  assert.ok(Math.abs(computeCoastalTideOffset(-6) - computeCoastalTideOffset(18)) < 1e-10);
});

test('computeCoastalTideOffset produces two distinct tidal highs and lows across 24 hours', () => {
  const samples = Array.from({ length: 48 }, (_, i) => computeCoastalTideOffset(i * 0.5));
  let highs = 0;
  let lows = 0;
  for (let i = 0; i < samples.length; i++) {
    const prev = samples[(i - 1 + samples.length) % samples.length];
    const curr = samples[i];
    const next = samples[(i + 1) % samples.length];
    if (curr > prev && curr > next) highs++;
    if (curr < prev && curr < next) lows++;
  }
  assert.equal(highs, 2);
  assert.equal(lows, 2);
});

test('computeCoastalTideOffset stays within safe diorama plinth bounds across all hours and wave phases', () => {
  const minPossible = TIDE_CENTER_OFFSET - TIDE_HALF_AMPLITUDE - TIDE_WAVE_AMPLITUDE;
  const maxPossible = TIDE_CENTER_OFFSET + TIDE_HALF_AMPLITUDE + TIDE_WAVE_AMPLITUDE;
  for (let h = 0; h < 24; h += 0.25) {
    for (let t = 0; t < 10; t += 0.7) {
      const y = computeCoastalTideOffset(h, t, 1);
      assert.ok(y >= minPossible - 1e-9);
      assert.ok(y <= maxPossible + 1e-9);
      // Never drops low enough to sink the square water plate (y=0.06) beneath rim (y=0.04)
      assert.ok(0.06 + y > 0.04);
    }
  }
});
