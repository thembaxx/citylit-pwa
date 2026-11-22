import assert from 'node:assert/strict';
import test from 'node:test';
import { LANDMARKS, LANDMARK_TAGS } from '../data/landmarks.ts';
import { countLandmarksByTag, filterLandmarks, parseSearch } from './landmarkSearch.ts';

test('every landmark has at least one valid tag and no duplicates', () => {
  const valid = new Set(LANDMARK_TAGS);
  for (const lm of LANDMARKS) {
    assert.ok(lm.tags.length > 0, `${lm.k} must have at least one tag`);
    assert.equal(new Set(lm.tags).size, lm.tags.length, `${lm.k} must not have duplicate tags`);
    for (const tag of lm.tags) {
      assert.ok(valid.has(tag), `${lm.k} has unknown tag "${tag}"`);
    }
  }
});

test('every defined tag matches at least one landmark', () => {
  const counts = countLandmarksByTag(LANDMARKS, LANDMARK_TAGS, {
    province: 'All',
    favorites: new Set(),
    tokens: [],
  });
  for (const tag of LANDMARK_TAGS) {
    assert.ok(counts[tag] > 0, `Tag "${tag}" should match at least one landmark`);
  }
});

test('filterLandmarks filters by interest tag and composes with province and search query', () => {
  const emptyFavs = new Set<number>();

  const coastal = filterLandmarks(LANDMARKS, {
    province: 'All',
    tag: 'Coastal',
    favorites: emptyFavs,
    tokens: [],
  });
  assert.ok(coastal.length > 0);
  assert.ok(coastal.every(({ lm }) => lm.tags.includes('Coastal')));

  const easternCapeCoastal = filterLandmarks(LANDMARKS, {
    province: 'Eastern Cape',
    tag: 'Coastal',
    favorites: emptyFavs,
    tokens: [],
  });
  assert.ok(easternCapeCoastal.length > 0);
  assert.ok(
    easternCapeCoastal.every(
      ({ lm }) => lm.c.endsWith('Eastern Cape') && lm.tags.includes('Coastal')
    )
  );

  const parsed = parseSearch('sunset at wildlife');
  assert.equal(parsed.label, 'Sunset');
  const sunsetWildlife = filterLandmarks(LANDMARKS, {
    province: 'All',
    tag: 'All',
    favorites: emptyFavs,
    tokens: parsed.tokens,
  });
  assert.ok(sunsetWildlife.length > 0);
  assert.ok(sunsetWildlife.every(({ lm }) => lm.tags.includes('Wildlife')));
});
