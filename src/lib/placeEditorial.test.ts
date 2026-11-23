import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  HIGHLIGHT_FOCUS,
  resolveExplorerEditorial,
  resolvePlaceEditorial,
} from './placeEditorial.ts';

describe('place editorial grammar', () => {
  it('resolves a curated landmark with narrative, tags and source links', () => {
    const editorial = resolvePlaceEditorial(0);
    assert.ok(editorial);
    assert.equal(editorial.title, 'Table Mountain');
    assert.equal(editorial.category, 'Cape Town · Western Cape');
    assert.match(editorial.narrative, /Khoi/);
    assert.ok(editorial.tags.includes('Natural'));
    assert.equal(editorial.positionsAreIllustrative, true);
    assert.ok(editorial.sources.some((s) => s.url.includes('Table_Mountain')));
    assert.ok(editorial.sources.some((s) => s.label === 'OpenStreetMap'));
  });

  it('caps highlights at three and gives each a focus point from the shared table', () => {
    for (let index = 0; index < 43; index++) {
      const editorial = resolvePlaceEditorial(index);
      assert.ok(editorial, `missing editorial for ${index}`);
      assert.ok(editorial.highlights.length > 0);
      assert.ok(editorial.highlights.length <= HIGHLIGHT_FOCUS.length);
      editorial.highlights.forEach((highlight, i) => {
        assert.deepEqual(highlight.focus, HIGHLIGHT_FOCUS[i]);
        assert.ok(highlight.text.length > 0);
        assert.ok(highlight.label.length > 0);
      });
    }
  });

  it('returns null for an out-of-range landmark', () => {
    assert.equal(resolvePlaceEditorial(-1), null);
    assert.equal(resolvePlaceEditorial(9999), null);
  });

  it('gives coordinate explorers the same grammar with real OSM stats', () => {
    const editorial = resolveExplorerEditorial({
      label: 'Stellenbosch',
      detail: 'A 400 m radius around the dropped pin.',
      stats: { buildings: 128, roads: 12, water: 0, green: 4, elevation: 136 },
      coords: { lat: -33.93, lon: 18.42 },
    });
    assert.equal(editorial.title, 'Stellenbosch');
    assert.equal(editorial.highlights.length, 3);
    assert.match(editorial.highlights[0].text, /128 buildings/);
    assert.match(editorial.highlights[2].text, /136 m/);
    assert.ok(editorial.sources[0].url.includes('-33.93/18.42'));
  });
});
