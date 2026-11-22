import assert from 'node:assert/strict';
import test from 'node:test';
import {
  ALBEDO_CONTRACT,
  DEFAULT_SATURATION_REDUCTION,
  GRADE_GUARDRAILS,
  auditAlbedo,
  auditHeroLuminance,
  isPhysicalWhite,
  isSurfaceAlbedo,
  linearToSrgb,
  normalizeAlbedo,
  parseHexColour,
  reduceSaturation,
  relativeLuminance,
  srgbLuma,
  srgbToLinear,
  toHex,
} from './albedoAudit.ts';

const approx = (actual: number, expected: number, tol = 0.01) =>
  assert.ok(
    Math.abs(actual - expected) <= tol,
    `expected ${actual} to be within ${tol} of ${expected}`
  );

test('parseHexColour and toHex round-trip #rrggbb and expand #rgb', () => {
  assert.deepEqual(parseHexColour('#6B6B6B'), { r: 107 / 255, g: 107 / 255, b: 107 / 255 });
  assert.deepEqual(parseHexColour('abc'), parseHexColour('#aabbcc'));
  assert.equal(toHex(parseHexColour('#a96345')), '#a96345');
  assert.throws(() => parseHexColour('#12'), /invalid hex colour/);
  assert.throws(() => parseHexColour('#gggggg'), /invalid hex colour/);
});

test('transfer functions round-trip and hit known anchors', () => {
  approx(srgbToLinear(0), 0, 1e-6);
  approx(srgbToLinear(1), 1, 1e-6);
  approx(srgbToLinear(0.5), 0.214, 0.001);
  approx(linearToSrgb(srgbToLinear(0.37)), 0.37, 1e-6);
});

test('representative valid surface albedos are accepted', () => {
  // Values straight from the research palettes (§3) and the hero-luminance band.
  for (const hex of ['#6B6B6B', '#797a73', '#9a7660', '#aaa394', '#c5af8a', '#73755d']) {
    const a = auditAlbedo(parseHexColour(hex));
    assert.equal(a.band, 'surface', hex);
    assert.equal(a.ok, true, hex);
    assert.equal(isSurfaceAlbedo(parseHexColour(hex)), true, hex);
  }
});

test('representative white-band albedos are accepted but flagged as whites', () => {
  // Deliberate physical whites inside sRGB 0.80-0.88 (research §3 aged whitewash,
  // PTFE-adjacent pale stone, penguin breast, pale trim).
  for (const hex of ['#d9d5c5', '#dce1df', '#d5d2c4', '#e1d8bd']) {
    const a = auditAlbedo(parseHexColour(hex));
    assert.equal(a.band, 'white', hex);
    assert.equal(a.ok, true, hex);
    assert.equal(isPhysicalWhite(parseHexColour(hex)), true, hex);
  }
});

test('near-pure highlight colours exceed the 0.88 white ceiling and are rejected', () => {
  // Research palettes use values like foam/cloud white for emissive/bloom accents.
  // As ALBEDO (lit surface) they clip flat under the 1.8x exposure — the guardrail
  // must reject them so authors treat them as highlights, not wall paint.
  for (const hex of ['#e8f6ff', '#f1e6d2', '#ffffff']) {
    assert.equal(auditAlbedo(parseHexColour(hex)).band, 'too-bright', hex);
  }
});

test('invalid albedos are rejected: surface gap and over-bright whites', () => {
  const gap = auditAlbedo(parseHexColour('#d0c9b8')); // 0.78-0.80 gap
  assert.equal(gap.band, 'gap');
  assert.equal(gap.ok, false);

  const blown = auditAlbedo(parseHexColour('#ffffff'));
  assert.equal(blown.band, 'too-bright');
  assert.equal(blown.ok, false);
  assert.equal(isSurfaceAlbedo(parseHexColour('#ffffff')), false);
  assert.equal(isPhysicalWhite(parseHexColour('#ffffff')), false);
});

test('normalizeAlbedo pulls gap and over-bright colours back inside the contract', () => {
  const gap = normalizeAlbedo(parseHexColour('#d0c9b8'));
  assert.equal(auditAlbedo(gap).band, 'surface');
  approx(srgbLuma(gap), ALBEDO_CONTRACT.surfaceCeiling, 0.001);

  const blown = normalizeAlbedo(parseHexColour('#ffffff'));
  assert.equal(auditAlbedo(blown).band, 'white');
  approx(srgbLuma(blown), ALBEDO_CONTRACT.whiteMax, 0.001);

  // A valid surface or white is returned unchanged (same object identity).
  const valid = parseHexColour('#9a8b82');
  assert.equal(normalizeAlbedo(valid), valid);
});

test('hero luminance targets the 0.15-0.35 LINEAR band', () => {
  // #6B6B6B ~= 0.15 linear; #9A9A9A ~= 0.32 linear (research §1 rule 2).
  const darkHero = parseHexColour('#6B6B6B');
  const brightHero = parseHexColour('#9A9A9A');
  assert.equal(auditHeroLuminance(darkHero).ok, true);
  assert.equal(auditHeroLuminance(brightHero).ok, true);
  approx(relativeLuminance(darkHero), 0.15, 0.01);
  assert.ok(relativeLuminance(brightHero) < ALBEDO_CONTRACT.heroLuminanceMax);

  assert.equal(auditHeroLuminance(parseHexColour('#202020')).ok, false); // too dark (no L*25 material floor)
  assert.equal(auditHeroLuminance(parseHexColour('#f0f0f0')).ok, false); // too bright
});

test('reduceSaturation lowers linear chroma by exactly the reduction and preserves luminance', () => {
  const colour = parseHexColour('#d94b64'); // Bo-Kaap coral
  const before = relativeLuminance(colour);
  const reduced = reduceSaturation(colour, 0.08);
  assert.equal(reduced.r < colour.r, true, 'red channel should drop');
  assert.equal(reduced.g > colour.g, true, 'desaturation toward grey lifts green');
  assert.equal(reduced.b > colour.b, true, 'desaturation toward grey lifts blue');
  approx(relativeLuminance(reduced), before, 0.001);

  const ratio = linearChroma(reduced) / linearChroma(colour);
  approx(ratio, 1 - 0.08, 0.001);
});

test('reduceSaturation clamps to the 5-12% contract band', () => {
  const colour = parseHexColour('#30a5ac'); // Bo-Kaap turquoise
  const clampedLow = reduceSaturation(colour, 0);
  const clampedHigh = reduceSaturation(colour, 1);
  approx(linearChroma(clampedLow) / linearChroma(colour), 1 - 0.05, 0.001);
  approx(linearChroma(clampedHigh) / linearChroma(colour), 1 - 0.12, 0.001);
  assert.equal(
    DEFAULT_SATURATION_REDUCTION >= ALBEDO_CONTRACT.saturationReductionMin &&
      DEFAULT_SATURATION_REDUCTION <= ALBEDO_CONTRACT.saturationReductionMax,
    true
  );
});

test('grade guardrails stay small, bounded, and carry a stable cache key', () => {
  assert.ok(GRADE_GUARDRAILS.shadowFloorLift <= 0.01);
  assert.ok(GRADE_GUARDRAILS.whiteShoulderKnee > 1);
  assert.ok(GRADE_GUARDRAILS.whiteShoulderRange > 0 && GRADE_GUARDRAILS.whiteShoulderRange < 1);
  assert.match(GRADE_GUARDRAILS.cacheKey, /^miniature_albedo_guard_v\d+$/);
});

function linearChroma(rgb: { r: number; g: number; b: number }): number {
  const r = srgbToLinear(rgb.r);
  const g = srgbToLinear(rgb.g);
  const b = srgbToLinear(rgb.b);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  return max - min;
}
