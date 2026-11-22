import assert from 'node:assert/strict';
import test from 'node:test';
import { LANDMARKS } from '../data/landmarks.ts';
import {
  REGIONAL_PALETTES,
  resolveRegionalPalette,
  type RegionalPalette,
} from './biomePalette.ts';

const COLOUR_FIELDS = [
  'bounceDay',
  'bounceNight',
  'rimColor',
  'skyTopTint',
  'skyHorizonTint',
  'aoShadowColor',
  'plinthRingDay',
  'plinthRingNight',
] as const satisfies readonly (keyof Omit<RegionalPalette, 'region'>)[];

function assertValidHexes(palette: RegionalPalette, label: string): void {
  for (const field of COLOUR_FIELDS) {
    assert.match(palette[field], /^#[0-9a-f]{6}$/i, `${label}.${field}`);
  }
}

test('representative Cape sites resolve to fynbos or cape', () => {
  assert.equal(resolveRegionalPalette('Table Mountain', 'mountain')?.region, 'fynbos');
  assert.equal(resolveRegionalPalette('Cape Point Lighthouse', 'coastal')?.region, 'fynbos');
  assert.equal(resolveRegionalPalette('Groot Constantia', 'savannah')?.region, 'fynbos');
  assert.equal(resolveRegionalPalette('Bo-Kaap', 'urban')?.region, 'cape');
  assert.equal(resolveRegionalPalette('Boulders Beach', 'coastal')?.region, 'cape');
});

test('representative Gauteng/Highveld sites resolve to highveld', () => {
  assert.equal(resolveRegionalPalette('Union Buildings', 'urban')?.region, 'highveld');
  assert.equal(resolveRegionalPalette('Ponte City', 'urban')?.region, 'highveld');
  assert.equal(resolveRegionalPalette('Nelson Mandela Bridge', 'urban')?.region, 'highveld');
  assert.equal(resolveRegionalPalette('Cradle of Humankind', 'mountain')?.region, 'highveld');
});

test('representative arid sites resolve to karoo', () => {
  assert.equal(resolveRegionalPalette('Kgalagadi Red Dunes', 'desert')?.region, 'karoo');
  assert.equal(resolveRegionalPalette('Richtersveld', 'desert')?.region, 'karoo');
  assert.equal(resolveRegionalPalette('Augrabies Falls', 'waterfall')?.region, 'karoo');
  assert.equal(resolveRegionalPalette('SALT Telescope', 'desert')?.region, 'karoo');
});

test('KwaZulu-Natal sites resolve to kzn', () => {
  assert.equal(resolveRegionalPalette('iSimangaliso Wetland Park', 'wetland')?.region, 'kzn');
  assert.equal(resolveRegionalPalette('Moses Mabhida Stadium', 'urban')?.region, 'kzn');
  assert.equal(resolveRegionalPalette('Drakensberg Amphitheatre', 'waterfall')?.region, 'kzn');
});

test('Knysna/Tsitsikamma sites resolve to forest', () => {
  assert.equal(resolveRegionalPalette('Knysna Heads', 'coastal')?.region, 'forest');
  assert.equal(resolveRegionalPalette('Storms River Mouth', 'coastal')?.region, 'forest');
  assert.equal(resolveRegionalPalette('Bloukrans Bridge', 'waterfall')?.region, 'forest');
});

test('Limpopo/lowveld sites resolve to limpopo', () => {
  assert.equal(resolveRegionalPalette('Kruger National Park', 'savannah')?.region, 'limpopo');
  assert.equal(resolveRegionalPalette('Mapungubwe Hill', 'savannah')?.region, 'limpopo');
  assert.equal(resolveRegionalPalette('Baobab', 'savannah')?.region, 'limpopo');
  assert.equal(resolveRegionalPalette('Pilanesberg Crater', 'savannah')?.region, 'limpopo');
});

test('apostrophe variants resolve to the same palette', () => {
  const straight = resolveRegionalPalette("Boulders Beach Simon's Town", 'coastal');
  const curly = resolveRegionalPalette('Boulders Beach Simon’s Town', 'coastal');
  const backtick = resolveRegionalPalette('Boulders Beach Simon`s Town', 'coastal');

  assert.ok(straight);
  assert.equal(straight, curly);
  assert.equal(straight, backtick);
  assert.equal(straight.region, 'cape');

  assert.equal(
    resolveRegionalPalette("Bourke's Luck Potholes", 'waterfall'),
    resolveRegionalPalette('Bourke’s Luck Potholes', 'waterfall'),
  );
});

test('unknown keys fall back by biome without throwing', () => {
  assert.equal(resolveRegionalPalette('Unlisted Site', 'desert')?.region, 'karoo');
  assert.equal(resolveRegionalPalette('Unlisted Site', 'wetland')?.region, 'kzn');
  assert.equal(resolveRegionalPalette('Unlisted Site', 'urban')?.region, 'highveld');
  assert.equal(resolveRegionalPalette('', 'coastal')?.region, 'coastal');
});

test('every palette colour is a valid #rrggbb string', () => {
  for (const [name, palette] of Object.entries(REGIONAL_PALETTES)) {
    assertValidHexes(palette, name);
  }
});

test('every landmark key resolves to a palette with valid hex colours', () => {
  for (const landmark of LANDMARKS) {
    const palette = resolveRegionalPalette(landmark.k, landmark.biome);
    assert.ok(palette, `no regional palette for ${landmark.k}`);
    assertValidHexes(palette, landmark.k);
  }
});
