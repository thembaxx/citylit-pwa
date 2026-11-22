import assert from 'node:assert/strict';
import test from 'node:test';
import { solarDeclination, southernSunDirection } from './solarPosition.ts';

const LAT_CAPE = -26;

test('December declination is southern and June declination is northern', () => {
  assert.ok(solarDeclination(12) < -20);
  assert.ok(solarDeclination(6) > 20);
  assert.ok(solarDeclination(12) < solarDeclination(6));
});

test('December noon at -26 degrees is high and toward north (-Z)', () => {
  const [x, y, z] = southernSunDirection(12, LAT_CAPE, 12);
  assert.ok(y > 0.85, `noon altitude ${y} should be near overhead`);
  assert.ok(z < 0, `noon z ${z} should point north (-Z)`);
  assert.ok(Math.abs(x) < 0.01, `noon x ${x} should be near zero`);
  assert.ok(Math.abs(Math.hypot(x, y, z) - 1) < 1e-12, 'direction must be normalized');
});

test('June noon at -26 degrees is lower than December noon and still north', () => {
  const june = southernSunDirection(12, LAT_CAPE, 6);
  const december = southernSunDirection(12, LAT_CAPE, 12);
  assert.ok(june[1] < december[1], 'winter sun should be lower');
  assert.ok(june[2] < 0, `winter noon z ${june[2]} should point north (-Z)`);
});

test('morning sun is east (+X) and afternoon sun is west (-X)', () => {
  const noon = southernSunDirection(12, LAT_CAPE, 12);
  const morning = southernSunDirection(8, LAT_CAPE, 12);
  const afternoon = southernSunDirection(16, LAT_CAPE, 12);
  assert.ok(morning[0] > noon[0], '08:00 should have a larger +X component than noon');
  assert.ok(afternoon[0] < noon[0], '16:00 should have a smaller X component than noon');
  assert.ok(morning[0] > 0 && afternoon[0] < 0);
});

test('late-night sun is below the horizon', () => {
  assert.ok(southernSunDirection(0, LAT_CAPE, 12)[1] < 0);
  assert.ok(southernSunDirection(23, LAT_CAPE, 12)[1] < 0);
});
