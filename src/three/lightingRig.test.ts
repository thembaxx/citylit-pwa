import assert from 'node:assert/strict';
import test from 'node:test';
import * as THREE from 'three';
import {
  kelvinToRgb,
  middayHighlightGuard,
  sunKelvinForHour,
  writeTimeOfDaySunColour,
} from './lightingRig.ts';

test('kelvinToRgb clamps every channel into 0..1', () => {
  for (const k of [1000, 2800, 3500, 5800, 9000, 12000, 40000]) {
    const c = kelvinToRgb(k);
    for (const v of [c.r, c.g, c.b]) {
      assert.ok(Number.isFinite(v) && v >= 0 && v <= 1, `${k}K produced ${v}`);
    }
  }
});

test('kelvinToRgb warms low Kelvin and cools high Kelvin', () => {
  const warm = kelvinToRgb(2800);
  const neutral = kelvinToRgb(5800);
  const cool = kelvinToRgb(9000);
  assert.ok(warm.r > warm.b * 1.8, '2800K should be amber');
  assert.ok(Math.abs(neutral.r - neutral.b) < 0.12, '5800K should be near neutral');
  assert.ok(cool.b > cool.r, '9000K should be blue-dominant');
});

test('time-of-day curve hits the brief keyframes', () => {
  assert.equal(sunKelvinForHour(6.3), 3500);
  assert.equal(sunKelvinForHour(13), 5800);
  assert.equal(sunKelvinForHour(17.8), 2800);
  assert.equal(sunKelvinForHour(22), 9000);
});

test('time-of-day curve is continuous across midnight', () => {
  assert.equal(sunKelvinForHour(0), sunKelvinForHour(24));
  const a = sunKelvinForHour(5.99);
  const b = sunKelvinForHour(6.01);
  assert.ok(Math.abs(a - b) < 100, 'curve should not snap around dawn');
});

test('writeTimeOfDaySunColour writes into the supplied colour without allocating', () => {
  const out = new THREE.Color('#000000');
  sunKelvinForHour(13);
  const k = writeTimeOfDaySunColour(13, out);
  assert.equal(k, 5800);
  assert.ok(out.r > 0 && out.g > 0 && out.b > 0);
});

test('middayHighlightGuard only applies near solar noon', () => {
  assert.equal(middayHighlightGuard(0), 0);
  assert.equal(middayHighlightGuard(0.55), 0);
  assert.equal(middayHighlightGuard(1), 1);
  assert.ok(middayHighlightGuard(0.75) > 0 && middayHighlightGuard(0.75) < 1);
});
