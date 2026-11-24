import assert from 'node:assert/strict';
import test from 'node:test';
import {
  HABITATS,
  habitatForSpecies,
  habitatSeasonForMonth,
  resolveHabitat,
  timeBandForHour,
  weatherBandFor,
  type HabitatConditions,
} from '../three/creatures/habitat.ts';

const DAY: HabitatConditions = {
  biome: 'coastal',
  month: 7,
  hour: 12,
  rain: 0,
  wind: 1,
  storm: 0,
};

test('every habitat entry is well formed and unique', () => {
  const ids = new Set<string>();
  for (const entry of HABITATS) {
    assert.ok(!ids.has(entry.species), `duplicate species ${entry.species}`);
    ids.add(entry.species);
    assert.ok(entry.biomes.length > 0);
    assert.ok(entry.density > 0, `${entry.species} needs a density`);
    assert.ok(entry.scale[0] > 0 && entry.scale[1] >= entry.scale[0]);
    assert.ok(['ground', 'air', 'water'].includes(entry.zone));
    assert.ok(['spine', 'parts', 'flap'].includes(entry.animation));
    assert.ok(['hero', 'mid', 'ambient'].includes(entry.priority));
  }
  assert.equal(habitatForSpecies('whale')?.zone, 'water');
});

test('time bands split the day consistently', () => {
  assert.equal(timeBandForHour(5), 'dawn');
  assert.equal(timeBandForHour(6.9), 'dawn');
  assert.equal(timeBandForHour(7), 'day');
  assert.equal(timeBandForHour(16.9), 'day');
  assert.equal(timeBandForHour(17), 'dusk');
  assert.equal(timeBandForHour(19.4), 'dusk');
  assert.equal(timeBandForHour(19.5), 'night');
  assert.equal(timeBandForHour(0), 'night');
  assert.equal(timeBandForHour(Number.NaN), 'day');
  assert.equal(timeBandForHour(-1), 'night');
});

test('weather bands prioritise storm, then rain, then wind', () => {
  assert.equal(weatherBandFor(0, 0, 0), 'clear');
  assert.equal(weatherBandFor(0, 3, 0), 'wind');
  assert.equal(weatherBandFor(0.6, 0, 0), 'rain');
  assert.equal(weatherBandFor(0.9, 4, 0.8), 'storm');
  assert.equal(weatherBandFor(Number.NaN, Number.NaN, Number.NaN), 'clear');
});

test('southern-hemisphere seasons match the calendar', () => {
  assert.equal(habitatSeasonForMonth(1), 'summer');
  assert.equal(habitatSeasonForMonth(4), 'autumn');
  assert.equal(habitatSeasonForMonth(7), 'winter');
  assert.equal(habitatSeasonForMonth(10), 'spring');
  assert.equal(habitatSeasonForMonth(13), 'summer');
  assert.equal(habitatSeasonForMonth(Number.NaN), 'summer');
});

test('coastal daytime resolves coastal species and no savannah ones', () => {
  const entries = resolveHabitat(DAY);
  const ids = entries.map((entry) => entry.species);
  assert.ok(ids.includes('gull'));
  assert.ok(ids.includes('penguin'));
  assert.ok(ids.includes('fish'));
  assert.ok(!ids.includes('gemsbok'));
  assert.ok(!ids.includes('meerkat'));
  // Hero priority first.
  assert.equal(entries[0].priority, 'hero');
});

test('season and month gates hide the whales outside winter', () => {
  const summer = resolveHabitat({ ...DAY, month: 1 }).map((entry) => entry.species);
  assert.ok(!summer.includes('whale'));
  const winter = resolveHabitat({ ...DAY, month: 7 }).map((entry) => entry.species);
  assert.ok(winter.includes('whale'));
});

test('butterflies need spring or summer and clear weather', () => {
  const spring = resolveHabitat({ ...DAY, biome: 'urban', month: 10, rain: 0 });
  assert.ok(spring.some((entry) => entry.species === 'butterfly'));
  const winter = resolveHabitat({ ...DAY, biome: 'urban', month: 7 });
  assert.ok(!winter.some((entry) => entry.species === 'butterfly'));
  const rainy = resolveHabitat({ ...DAY, biome: 'urban', month: 10, rain: 0.5 });
  assert.ok(!rainy.some((entry) => entry.species === 'butterfly'));
});

test('bats only appear at dusk and night', () => {
  const day = resolveHabitat({ ...DAY, biome: 'urban', hour: 12 });
  assert.ok(!day.some((entry) => entry.species === 'bat'));
  const night = resolveHabitat({ ...DAY, biome: 'urban', hour: 22 });
  assert.ok(night.some((entry) => entry.species === 'bat'));
});

test('resolution is deterministic regardless of evaluation order', () => {
  for (const biome of ['coastal', 'savannah', 'urban', 'desert', 'wetland'] as const) {
    const a = resolveHabitat({ ...DAY, biome });
    const b = resolveHabitat({ ...DAY, biome });
    assert.deepEqual(
      a.map((entry) => entry.species),
      b.map((entry) => entry.species)
    );
  }
});

test('every biome in the landmark set has at least one species', () => {
  for (const biome of ['coastal', 'waterfall', 'mountain', 'savannah', 'urban', 'desert', 'wetland'] as const) {
    const entries = resolveHabitat({ ...DAY, biome, hour: 12, month: 10 });
    assert.ok(entries.length > 0, `no species active for ${biome}`);
  }
});
