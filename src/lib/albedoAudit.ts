/**
 * Pure colour / albedo guardrails for the Living Diorama upgrade.
 *
 * Contract source: docs/LANDMARK-RESEARCH.md §1–2, carried forward by
 * docs/SCENERY-UPGRADE.md ("Phase 2 carry-forward"). Numbers here encode the
 * render pipeline described there: ACES filmic, a HalfFloat composer target,
 * renderer tone mapping skipped in render targets, and a miniature pass that
 * applies its own ACES at an effective ~1.8× exposure.
 *
 * IMPORTANT — there is no literal L*25 material floor. The research note that
 * "anything under ~L*25 crushes to black under the vignette" is a warning about
 * the *rendered* image, not a lower bound on authored albedo. Any perceptual
 * floor belongs in the grade / tone-map domain only (the bounded shadow lift
 * wired in postfx.ts). These helpers therefore AUDIT and NORMALISE authored
 * values; they never lift a dark surface or tint a shared material.
 *
 * This module is dependency-free (no THREE, no DOM) so it can run under
 * `node --test` as well as in the renderer.
 */

export interface Rgb {
  /** sRGB red, 0..1. */
  readonly r: number;
  /** sRGB green, 0..1. */
  readonly g: number;
  /** sRGB blue, 0..1. */
  readonly b: number;
}

/** Authoring ceilings from the render research contract. */
export const ALBEDO_CONTRACT = {
  /** Ordinary surfaces: sRGB value must not exceed ~0.75. */
  surfaceCeiling: 0.75,
  /** Deliberate physical whites (lighthouse, penguin breast, foam, PTFE roof). */
  whiteMin: 0.8,
  whiteMax: 0.88,
  /** Hero surfaces target this LINEAR relative-luminance band. */
  heroLuminanceMin: 0.15,
  heroLuminanceMax: 0.35,
  /** Author this much less saturated than the reference photo (the grade adds 5%). */
  saturationReductionMin: 0.05,
  saturationReductionMax: 0.12,
  /** Tolerance for 8-bit hex rounding and floating point drift. */
  epsilon: 0.005,
} as const;

/** Midpoint of the allowed authoring desaturation band. */
export const DEFAULT_SATURATION_REDUCTION = 0.08;

const REC709_R = 0.2126;
const REC709_G = 0.7152;
const REC709_B = 0.0722;

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/** Parse `#rgb` or `#rrggbb` into sRGB channels in 0..1. Throws on malformed input. */
export function parseHexColour(hex: string): Rgb {
  if (typeof hex !== 'string') throw new Error('colour must be a string');
  const raw = hex.trim();
  let body: string;
  if (raw.startsWith('#')) body = raw.slice(1);
  else if (/^[0-9a-fA-F]{3}$|^[0-9a-fA-F]{6}$/.test(raw)) body = raw;
  else throw new Error(`invalid hex colour: ${hex}`);

  if (/^[0-9a-fA-F]{3}$/.test(body)) {
    body = body
      .split('')
      .map((c) => c + c)
      .join('');
  }
  if (!/^[0-9a-fA-F]{6}$/.test(body)) throw new Error(`invalid hex colour: ${hex}`);
  return {
    r: parseInt(body.slice(0, 2), 16) / 255,
    g: parseInt(body.slice(2, 4), 16) / 255,
    b: parseInt(body.slice(4, 6), 16) / 255,
  };
}

/** Format an sRGB colour back to `#rrggbb` (useful for assertions/debug overlays). */
export function toHex(rgb: Rgb): string {
  const byte = (v: number) => Math.round(clamp(v, 0, 1) * 255).toString(16).padStart(2, '0');
  return `#${byte(rgb.r)}${byte(rgb.g)}${byte(rgb.b)}`;
}

/** sRGB electro-optical transfer function (sRGB channel -> linear light). */
export function srgbToLinear(c: number): number {
  const x = clamp(c, 0, 1);
  return x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
}

/** Inverse sRGB transfer function (linear light -> sRGB channel). */
export function linearToSrgb(c: number): number {
  const x = clamp(c, 0, 1);
  return x <= 0.0031308 ? x * 12.92 : 1.055 * x ** (1 / 2.4) - 0.055;
}

/**
 * Peak sRGB channel. This is the channel that clips first under the ~1.8×
 * miniature exposure; reported alongside the perceptual value for clipping
 * awareness.
 */
export function srgbValue(rgb: Rgb): number {
  return Math.max(rgb.r, rgb.g, rgb.b);
}

/** Perceptual sRGB "value" (Rec.709 weights applied to gamma-encoded channels). */
export function srgbLuma(rgb: Rgb): number {
  return REC709_R * rgb.r + REC709_G * rgb.g + REC709_B * rgb.b;
}

/** Linear relative luminance (Rec.709 weights applied after linearisation). */
export function relativeLuminance(rgb: Rgb): number {
  return (
    REC709_R * srgbToLinear(rgb.r) +
    REC709_G * srgbToLinear(rgb.g) +
    REC709_B * srgbToLinear(rgb.b)
  );
}

export type AlbedoBand =
  /** Within the <=0.75 sRGB surface ceiling. */
  | 'surface'
  /** Deliberate physical white inside 0.80–0.88. */
  | 'white'
  /** Too bright for a surface, too dim for a declared white. */
  | 'gap'
  /** Above the 0.88 sRGB white ceiling. */
  | 'too-bright';

export interface AlbedoAudit {
  /** Perceptual sRGB value used for band classification. */
  readonly luma: number;
  /** Peak sRGB channel (first to clip under exposure). */
  readonly peak: number;
  readonly band: AlbedoBand;
  /** Linear relative luminance, for cross-checking against hero targets. */
  readonly luminance: number;
  readonly ok: boolean;
  readonly reason: string;
}

/** Classify an authored colour against the albedo / white contract. */
export function auditAlbedo(rgb: Rgb): AlbedoAudit {
  const luma = srgbLuma(rgb);
  const peak = srgbValue(rgb);
  const { surfaceCeiling, whiteMin, whiteMax, epsilon } = ALBEDO_CONTRACT;
  let band: AlbedoBand;
  let reason: string;
  if (luma <= surfaceCeiling + epsilon) {
    band = 'surface';
    reason = 'within the <=0.75 sRGB surface ceiling';
  } else if (luma < whiteMin - epsilon) {
    band = 'gap';
    reason = 'above the surface ceiling but below the 0.80 physical-white window';
  } else if (luma <= whiteMax + epsilon) {
    band = 'white';
    reason = 'inside the 0.80-0.88 physical-white window (deliberate whites only)';
  } else {
    band = 'too-bright';
    reason = 'above the 0.88 sRGB white ceiling';
  }
  return {
    luma,
    peak,
    band,
    luminance: relativeLuminance(rgb),
    ok: band === 'surface' || band === 'white',
    reason,
  };
}

export function isSurfaceAlbedo(rgb: Rgb): boolean {
  return auditAlbedo(rgb).band === 'surface';
}

export function isPhysicalWhite(rgb: Rgb): boolean {
  return auditAlbedo(rgb).band === 'white';
}

/**
 * Scale sRGB channels uniformly so the perceptual value lands back inside the
 * contract, preserving hue and saturation ratios. Gap values fall back to the
 * 0.75 surface ceiling; over-bright whites clamp to the 0.88 ceiling. This is
 * a pure authoring aid — callers must NOT apply it to shared material colours
 * at runtime.
 */
export function normalizeAlbedo(rgb: Rgb): Rgb {
  const luma = srgbLuma(rgb);
  const { surfaceCeiling, whiteMin, whiteMax, epsilon } = ALBEDO_CONTRACT;
  if (luma <= 0) return rgb;
  let target: number;
  if (luma > whiteMax + epsilon) target = whiteMax;
  else if (luma >= whiteMin - epsilon) return rgb;
  else target = Math.min(luma, surfaceCeiling);
  if (Math.abs(target - luma) < 1e-9) return rgb;
  const scale = target / luma;
  return {
    r: clamp(rgb.r * scale, 0, 1),
    g: clamp(rgb.g * scale, 0, 1),
    b: clamp(rgb.b * scale, 0, 1),
  };
}

export interface HeroLuminanceAudit {
  readonly luminance: number;
  readonly ok: boolean;
  readonly reason: string;
}

/** Check a hero surface against the 0.15–0.35 LINEAR luminance target. */
export function auditHeroLuminance(rgb: Rgb): HeroLuminanceAudit {
  const luminance = relativeLuminance(rgb);
  const { heroLuminanceMin, heroLuminanceMax, epsilon } = ALBEDO_CONTRACT;
  const ok = luminance >= heroLuminanceMin - epsilon && luminance <= heroLuminanceMax + epsilon;
  return {
    luminance,
    ok,
    reason: ok
      ? 'hero luminance within the 0.15-0.35 linear target'
      : `hero luminance ${luminance.toFixed(3)} outside the 0.15-0.35 linear target`,
  };
}

/**
 * Reduce an authored colour's saturation by the contract band (clamped to
 * 5–12%). Desaturation is done in linear light toward the colour's own
 * relative luminance, so luminance is preserved and linear chroma shrinks by
 * exactly (1 - reduction). The grade already adds 5% saturation, so this is
 * the authoring-side compensation the research calls for.
 */
export function reduceSaturation(
  rgb: Rgb,
  reduction: number = DEFAULT_SATURATION_REDUCTION
): Rgb {
  const amount = clamp(
    reduction,
    ALBEDO_CONTRACT.saturationReductionMin,
    ALBEDO_CONTRACT.saturationReductionMax
  );
  const lr = srgbToLinear(rgb.r);
  const lg = srgbToLinear(rgb.g);
  const lb = srgbToLinear(rgb.b);
  const y = REC709_R * lr + REC709_G * lg + REC709_B * lb;
  const keep = 1 - amount;
  return {
    r: linearToSrgb(y + (lr - y) * keep),
    g: linearToSrgb(y + (lg - y) * keep),
    b: linearToSrgb(y + (lb - y) * keep),
  };
}

/**
 * Grade-domain guardrail values wired into the miniature pass in postfx.ts.
 * These are LINEAR HDR values applied after the HalfFloat composer and before
 * the final local ACES curve. They are deliberately small and bounded so the
 * soft-but-vibrant look is preserved. They are NOT material albedo values.
 */
export const GRADE_GUARDRAILS = {
  /** Additive lift for the darkest band (the perceptual floor is grade-only). */
  shadowFloorLift: 0.004,
  /** Linear level where the gentle white shoulder begins. */
  whiteShoulderKnee: 1.2,
  /** Width of the white shoulder; it asymptotes to knee + range. */
  whiteShoulderRange: 0.65,
  /** Stable shader-program cache key for the guardrail-augmented pass. */
  cacheKey: 'miniature_albedo_guard_v1',
} as const;
