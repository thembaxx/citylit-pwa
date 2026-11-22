import assert from 'node:assert/strict';
import test from 'node:test';
import { LANDMARKS } from './landmarks.ts';
import {
  formatMetres,
  REFERENCE_HEIGHTS,
  referenceHeightM,
  SCALE_FACTS,
  scaleRatio,
} from './scaleFacts.ts';

test('every landmark has a curated scale fact', () => {
  assert.equal(Object.keys(SCALE_FACTS).length, LANDMARKS.length);
  for (const lm of LANDMARKS) {
    const fact = SCALE_FACTS[lm.k];
    assert.ok(fact, `missing scale fact for ${lm.k}`);
    assert.ok(fact.label.length > 0, `empty label for ${lm.k}`);
    assert.ok(['height', 'span', 'length', 'depth'].includes(fact.measure));
    if (fact.magnitudeM !== null) {
      assert.ok(Number.isFinite(fact.magnitudeM) && fact.magnitudeM > 0, `bad magnitude for ${lm.k}`);
    }
  }
});

test('formatting and ratios handle real and unusable values', () => {
  assert.equal(formatMetres(1086), '1,086 m');
  assert.equal(formatMetres(0.9), '0.9 m');
  assert.equal(formatMetres(null), '—');
  assert.equal(formatMetres(Number.NaN), '—');
  assert.equal(scaleRatio(1086, 1.7), 1086 / 1.7);
  assert.equal(scaleRatio(Number.NaN, 1), 0);
  assert.equal(scaleRatio(10, 0), 0);
});

test('reference heights are ordered from person to tower', () => {
  assert.equal(referenceHeightM('person'), 1.7);
  assert.equal(referenceHeightM('springbok'), 0.9);
  assert.equal(referenceHeightM('eiffel'), 330);
  assert.ok(REFERENCE_HEIGHTS.person < REFERENCE_HEIGHTS.eiffel);
});
