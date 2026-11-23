import assert from 'node:assert/strict';
import test from 'node:test';
import { LANDMARKS } from './landmarks.ts';
import { WILDLIFE } from './wildlife.ts';

const KINDS = [
  'generic',
  'elephant',
  'penguin',
  'whale',
  'hippo',
  'gemsbok',
  'flamingo',
  'seabird',
  'vulture',
  'dassie',
  'bird',
];
const IDLES = ['bob', 'graze', 'lookup', 'waddle', 'submerge', 'rock'];
const SEASONS = ['summer', 'autumn', 'winter', 'spring'];

test('wildlife spots point at real sites with matching biomes', () => {
  const ids = new Set<string>();
  for (const spot of WILDLIFE) {
    const lm = LANDMARKS.find((entry) => entry.k === spot.siteKey);
    assert.ok(lm, `unknown site ${spot.siteKey}`);
    assert.equal(spot.biome, lm?.biome, `biome mismatch at ${spot.siteKey}`);
    assert.ok(!ids.has(spot.id), `duplicate spot id ${spot.id}`);
    ids.add(spot.id);
    assert.ok(spot.fact.trim().length > 20, `fact too short for ${spot.id}`);
    assert.ok(spot.label.trim().length > 0);
  }
});

test('species, idle and seasonal gates use valid values', () => {
  for (const spot of WILDLIFE) {
    assert.ok(KINDS.includes(spot.species), `bad species ${spot.species}`);
    if (spot.idle) assert.ok(IDLES.includes(spot.idle), `bad idle ${spot.idle}`);
    for (const month of spot.months ?? []) {
      assert.ok(Number.isInteger(month) && month >= 1 && month <= 12, `bad month in ${spot.id}`);
    }
    for (const season of spot.seasons ?? []) {
      assert.ok(SEASONS.includes(season), `bad season in ${spot.id}`);
    }
    assert.ok(spot.position.every(Number.isFinite));
    assert.ok(Math.abs(spot.position[0]) < 8 && Math.abs(spot.position[2]) < 8);
  }
});

test('required showcase species are represented', () => {
  const at = (site: string, species: string) =>
    WILDLIFE.some((spot) => spot.siteKey === site && spot.species === species);
  assert.ok(at('Boulders Beach', 'penguin'));
  assert.ok(at('Hermanus Whale Watching', 'whale'));
  assert.ok(at('iSimangaliso Wetland Park', 'flamingo'));
  const whales = WILDLIFE.find((spot) => spot.siteKey === 'Hermanus Whale Watching');
  assert.ok((whales?.months?.length ?? 0) > 0);
});
