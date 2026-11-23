import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { GOLDEN_HOUR_START, GOLDEN_HOUR_END, TIME_PRESETS } from './timePresets.ts';

describe('shared time presets', () => {
  it('keeps the four stages on the same ordered hours', () => {
    assert.deepEqual(
      TIME_PRESETS.map((preset) => [preset.key, preset.hour]),
      [
        ['dawn', 6.3],
        ['noon', 13],
        ['dusk', 17.8],
        ['night', 22],
      ]
    );
  });

  it('places the dusk preset inside the golden-hour band', () => {
    const dusk = TIME_PRESETS.find((preset) => preset.key === 'dusk');
    assert.ok(dusk);
    assert.ok(dusk.hour >= GOLDEN_HOUR_START);
    assert.ok(dusk.hour <= GOLDEN_HOUR_END);
  });

  it('uses unique keys and labels', () => {
    assert.equal(new Set(TIME_PRESETS.map((p) => p.key)).size, TIME_PRESETS.length);
    assert.equal(new Set(TIME_PRESETS.map((p) => p.label)).size, TIME_PRESETS.length);
  });
});
