import assert from 'node:assert/strict';
import test from 'node:test';
import { SCALE_FACTS } from '../data/scaleFacts.ts';
import { metresToUnits, siteMetresPerUnit } from './scale.ts';

test('siteMetresPerUnit prefers the curated ratio and falls back to magnitude / model units', () => {
  assert.equal(siteMetresPerUnit(SCALE_FACTS['Table Mountain']!), 362);
  const derived = siteMetresPerUnit({ magnitudeM: 106, modelUnits: 7.3 });
  assert.ok(derived && Math.abs(derived - 106 / 7.3) < 1e-9);
  assert.equal(siteMetresPerUnit({ magnitudeM: null }), null);
  assert.equal(siteMetresPerUnit({ magnitudeM: 10, modelUnits: 0 }), null);
});

test('metresToUnits converts honestly and rejects unknown or invalid ratios', () => {
  const ratio = siteMetresPerUnit(SCALE_FACTS['Table Mountain']!);
  const units = metresToUnits(1086, ratio);
  assert.ok(units && Math.abs(units - 3) < 1e-9);
  assert.equal(metresToUnits(10, null), null);
  assert.equal(metresToUnits(Number.NaN, 2), null);
  assert.equal(metresToUnits(10, 0), null);
});
