import assert from 'node:assert/strict';
import test from 'node:test';
import { getWeatherMoment } from './weatherMoments.ts';
import type { LiveWeatherSample } from '../types/citylit.ts';

const sample = (overrides: Partial<LiveWeatherSample> = {}): LiveWeatherSample => ({
  code: 0,
  temp: 18,
  feelsLike: 18,
  humidity: 60,
  cloudCover: 20,
  precipitation: 0,
  windSpeed: 10,
  windGusts: 15,
  windDirection: 210,
  isDay: true,
  observedAt: '2026-11-22T12:00',
  ...overrides,
});

const HIGHVELD = 'Nelson Mandela Bridge';
const DRAKENSBERG = 'Drakensberg Amphitheatre';
const CAPE_POINT = 'Cape Point Lighthouse';

test('Highveld lightning only appears at Highveld places on a real thunderstorm', () => {
  assert.equal(getWeatherMoment(HIGHVELD, sample({ code: 0 })), null);
  assert.equal(getWeatherMoment(HIGHVELD, sample({ code: 61 })), null);

  const storm = getWeatherMoment(HIGHVELD, sample({ code: 95, precipitation: 4 }));
  assert.equal(storm?.kind, 'highveld-lightning');
  assert.equal(storm?.intensity, 1);

  // The same observation at Cape Point is not a Highveld moment.
  assert.equal(getWeatherMoment(CAPE_POINT, sample({ code: 95 })), null);
});

test('Drakensberg snow needs snowfall codes or genuinely freezing conditions', () => {
  assert.equal(getWeatherMoment(DRAKENSBERG, sample({ temp: 12 })), null);
  const snow = getWeatherMoment(DRAKENSBERG, sample({ code: 71, temp: -1 }));
  assert.equal(snow?.kind, 'drakensberg-snow');
  assert.equal(snow?.intensity, 1);

  const frost = getWeatherMoment(DRAKENSBERG, sample({ code: 0, temp: 0 }));
  assert.equal(frost?.kind, 'drakensberg-snow');
  assert.ok(frost!.intensity > 0 && frost!.intensity < 1);
});

test('Cape Point mist is tied to fog codes or humid, light-wind air', () => {
  const fog = getWeatherMoment(CAPE_POINT, sample({ code: 45, humidity: 96, windSpeed: 6 }));
  assert.equal(fog?.kind, 'cape-point-mist');
  assert.equal(fog?.intensity, 1);

  const humid = getWeatherMoment(CAPE_POINT, sample({ humidity: 94, windSpeed: 8 }));
  assert.equal(humid?.kind, 'cape-point-mist');
  assert.ok(humid!.intensity > 0);

  assert.equal(getWeatherMoment(CAPE_POINT, sample({ humidity: 94, windSpeed: 40 })), null);
  assert.equal(getWeatherMoment(HIGHVELD, sample({ code: 45 })), null);
});

test('unknown landmarks never produce a weather moment', () => {
  assert.equal(getWeatherMoment('', sample({ code: 99 })), null);
  assert.equal(getWeatherMoment('Unknown place', sample({ code: 99 })), null);
});
