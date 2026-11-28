import assert from 'node:assert/strict';
import test, { afterEach } from 'node:test';
import {
  readInitialCoordinate,
  readInitialGlobeState,
  getLandmarkShareUrl,
  readInitialRouteId,
  resolveRouteStopIndex,
  setUrlForCoordinates,
  setUrlForGlobe,
  setUrlForLandmark,
} from './urlState.ts';

const globals = globalThis as unknown as { window?: unknown };
const originalWindow = globals.window;

function stubLocation(search: string, pathname = '/', hash = ''): string[] {
  const writes: string[] = [];
  globals.window = {
    location: {
      search,
      pathname,
      hash,
      href: `https://citylit.example${pathname}${search}${hash}`,
    },
    history: {
      replaceState: (_data: unknown, _title: string, url: string) => writes.push(url),
    },
  };
  return writes;
}

afterEach(() => {
  globals.window = originalWindow;
});

test('readInitialGlobeState defaults to closed', () => {
  stubLocation('');
  assert.deepEqual(readInitialGlobeState(['Gauteng']), { open: false, province: 'All' });
  stubLocation('?globe=0');
  assert.deepEqual(readInitialGlobeState(['Gauteng']), { open: false, province: 'All' });
});

test('readInitialGlobeState validates the province', () => {
  stubLocation('?globe=1&province=Gauteng');
  assert.deepEqual(readInitialGlobeState(['Gauteng', 'Western Cape']), {
    open: true,
    province: 'Gauteng',
  });
  stubLocation('?globe=1&province=Atlantis');
  assert.deepEqual(readInitialGlobeState(['Gauteng']), { open: true, province: 'All' });
});

test('setUrlForGlobe preserves unrelated params and the hash', () => {
  const writes = stubLocation('?lat=-33.9&lon=18.4', '/', '#mapungubwe-hill');
  setUrlForGlobe(true, 'Gauteng');
  assert.equal(writes[0], '/?lat=-33.9&lon=18.4&globe=1&province=Gauteng#mapungubwe-hill');
});

test('setUrlForGlobe removes globe state when closed', () => {
  const writes = stubLocation('?globe=1&province=Gauteng&lat=1', '/', '#frag');
  setUrlForGlobe(false, 'All');
  assert.equal(writes[0], '/?lat=1#frag');
});

test('coordinate links parse with bounds checking', () => {
  stubLocation('?lat=-33.9249&lon=18.4241');
  assert.deepEqual(readInitialCoordinate(), { lat: -33.9249, lon: 18.4241 });
  stubLocation('?lat=91&lon=0');
  assert.equal(readInitialCoordinate(), null);
  stubLocation('?lat=abc&lon=0');
  assert.equal(readInitialCoordinate(), null);
  stubLocation('');
  assert.equal(readInitialCoordinate(), null);
});

test('route state validates curated route IDs and resolves valid initial stops', () => {
  stubLocation('?route=cape-peninsula');
  assert.equal(readInitialRouteId(['cape-peninsula', 'highveld-heritage']), 'cape-peninsula');
  assert.equal(readInitialRouteId(['highveld-heritage']), null);
  assert.equal(
    resolveRouteStopIndex([4, 8, 12], 8),
    8,
    'a shared stop in the active route is preserved'
  );
  assert.equal(resolveRouteStopIndex([4, 8, 12], 99), 4);
  stubLocation('');
  assert.equal(readInitialRouteId(['cape-peninsula']), null);
  assert.equal(resolveRouteStopIndex([], 99), 0);
});

test('coordinate and landmark URLs are written in the expected shape', () => {
  const coordWrites = stubLocation('');
  setUrlForCoordinates({ lat: -33.9249, lon: 18.4241 });
  assert.equal(coordWrites[0], '/?lat=-33.924900&lon=18.424100');

  const landmarkWrites = stubLocation('?globe=1');
  setUrlForLandmark('table-mountain');
  assert.equal(landmarkWrites[0], '/#table-mountain');

  const routeWrites = stubLocation('');
  setUrlForLandmark('table-mountain', 'cape-peninsula');
  assert.equal(routeWrites[0], '/?route=cape-peninsula#table-mountain');
});

test('share links preserve a curated route and landmark, not transient query state', () => {
  stubLocation('?lat=-33.9&lon=18.4', '/', '#table-mountain');
  assert.equal(
    getLandmarkShareUrl('table-mountain', 'cape-peninsula'),
    'https://citylit.example/?route=cape-peninsula#table-mountain'
  );
  assert.equal(getLandmarkShareUrl('table-mountain'), 'https://citylit.example/#table-mountain');
});
