import * as THREE from 'three';

/** Half-extent of the diorama shadow frustum in world units. */
export const DIORAMA_SHADOW_EXTENT = 3.6;

/** Tight ortho shadow frustum and bias tuned for the 3x3 isometric slice. */
export function configureDioramaShadow(light: THREE.DirectionalLight): void {
  // 4096 means real contact shadows under fine architectural detail; the
  // depth bias keeps self-shadowing artifacts off the miniature scale.
  light.shadow.mapSize.set(4096, 4096);
  const cam = light.shadow.camera;
  cam.left = -DIORAMA_SHADOW_EXTENT;
  cam.right = DIORAMA_SHADOW_EXTENT;
  cam.top = DIORAMA_SHADOW_EXTENT;
  cam.bottom = -DIORAMA_SHADOW_EXTENT;
  cam.near = 0.5;
  cam.far = 60;
  cam.updateProjectionMatrix();
  light.shadow.bias = -0.00028;
  light.shadow.normalBias = 0.022;
  // Soft miniature penumbra balanced against high-res PCF maps for crisp contact shadows.
  light.shadow.radius = 4.2;
  light.shadow.intensity = 0.66;
}

const tmpShadowSize = new THREE.Vector3();

/** Fit the shadow frustum tightly around the active landmark bounds for sharper shadows. */
export function fitDioramaShadowBounds(light: THREE.DirectionalLight, box: THREE.Box3): void {
  if (box.isEmpty()) return;
  box.getSize(tmpShadowSize);
  const extent = THREE.MathUtils.clamp(
    Math.max(tmpShadowSize.x, tmpShadowSize.z, tmpShadowSize.y) * 0.54,
    3.2,
    8.2
  );
  const cam = light.shadow.camera;
  cam.left = -extent;
  cam.right = extent;
  cam.top = extent;
  cam.bottom = -extent;
  cam.updateProjectionMatrix();
}

/** Modulate directional shadow softness & density cleanly across day, dusk, night, and studio. */
export function updateShadowMood(
  light: THREE.DirectionalLight,
  night: number,
  hor: number,
  studioWeight: number,
  dt = 0.016,
  motionScale = 1
): void {
  const k = motionScale === 0 ? 1 : 1 - Math.exp(-Math.max(0, dt) * 2.4);
  const outdoorIntensity = THREE.MathUtils.lerp(0.68, 0.44, THREE.MathUtils.clamp(night, 0, 1)) - hor * 0.06;
  const targetIntensity = THREE.MathUtils.lerp(outdoorIntensity, 0.5, studioWeight);
  const targetRadius = THREE.MathUtils.lerp(4.0 + hor * 0.7 + night * 0.6, 5.0, studioWeight);
  light.shadow.intensity += (targetIntensity - light.shadow.intensity) * k;
  light.shadow.radius += (targetRadius - light.shadow.radius) * k;
}

/** Subtle cool/warm back light that separates cliffs, domes and trees from the sky. */
export function createRimLight(): THREE.DirectionalLight {
  const rim = new THREE.DirectionalLight('#b9d4ff', 0.6);
  rim.position.set(-9, 7, -11);
  rim.castShadow = false;
  rim.target.position.set(0, 0.8, 0);
  return rim;
}

const rimBaseCol = new THREE.Color('#b9d4ff');
const rimSiteCol = new THREE.Color('#b9d4ff');
const rimWarmCol = new THREE.Color('#ffd3a6');

export function updateRimLight(
  rim: THREE.DirectionalLight,
  night: number,
  sun: number,
  hor = 0,
  dt = 0.016,
  motionScale = 1,
  boost = 0,
  siteRimHex?: string,
  siteRimScale = 1
): void {
  const k = motionScale === 0 ? 1 : 1 - Math.exp(-Math.max(0, dt) * 2.8);
  const prevBase = (rim.userData.baseIntensity as number | undefined) ?? rim.intensity;
  const targetIntensity = (0.34 + 0.68 * night + 0.12 * (1 - sun) + 0.16 * hor) * siteRimScale;
  const nextBase = prevBase + (targetIntensity - prevBase) * k;
  rim.userData.baseIntensity = nextBase;
  rim.intensity = nextBase + boost;
  if (siteRimHex) rimSiteCol.set(siteRimHex);
  else rimSiteCol.copy(rimBaseCol);
  rim.color.lerpColors(rimSiteCol, rimWarmCol, hor * 0.58);
}

/**
 * Biome colour for the soft, shadowless bounce fill. Unknown/future biome keys
 * fall back to a neutral cool white so new sites still read as lit miniatures.
 */
const BIOME_BOUNCE_COLORS: Record<string, string> = {
  coastal: '#8fd9e8',
  waterfall: '#9fe0f2',
  mountain: '#b9cfe8',
  savannah: '#f0c987',
  urban: '#c8c6e0',
  desert: '#f2b98c',
  wetland: '#a9d8b2',
  fynbos: '#e0b7cf',
};

const DEFAULT_BOUNCE_COLOR = '#dfe8f2';
const bounceDayTmp = new THREE.Color();
const bounceNightTmp = new THREE.Color();
const bounceMixTmp = new THREE.Color();

/** Low, non-shadow-casting bounce fill that carries the site's biome tint. */
export function createBounceLight(): THREE.DirectionalLight {
  const bounce = new THREE.DirectionalLight(DEFAULT_BOUNCE_COLOR, 0.7);
  bounce.position.set(6, 1.5, 9);
  bounce.castShadow = false;
  bounce.target.position.set(0, 1, 0);
  return bounce;
}

/** Re-tint the bounce fill when the active landmark's biome changes. */
export function setBounceLightBiome(light: THREE.DirectionalLight, biome?: string): void {
  light.color.set(BIOME_BOUNCE_COLORS[biome ?? ''] ?? DEFAULT_BOUNCE_COLOR);
}

/** Smoothly transition bounce fill color between a landmark's day and night bounce colors. */
export function updateBounceLightMood(
  light: THREE.DirectionalLight,
  dayHex: string,
  nightHex: string,
  nightWeight: number,
  studioWeight: number,
  dt = 0.016,
  motionScale = 1
): void {
  const k = motionScale === 0 ? 1 : 1 - Math.exp(-Math.max(0, dt) * 2.8);
  bounceDayTmp.set(dayHex);
  bounceNightTmp.set(nightHex);
  bounceMixTmp.copy(bounceDayTmp).lerp(bounceNightTmp, THREE.MathUtils.clamp(nightWeight, 0, 1));
  if (studioWeight > 0.001) {
    bounceDayTmp.set(DEFAULT_BOUNCE_COLOR);
    bounceMixTmp.lerp(bounceDayTmp, studioWeight);
  }
  light.color.lerp(bounceMixTmp, k);
}

/* -------------------------------------------------------------------------- */
/* Time-of-day colour temperature (brief workstream A)                        */
/* -------------------------------------------------------------------------- */

/**
 * Master switch for the physical colour-temperature curve. Set to false to
 * restore the hand-tuned seasonal palette exactly; no other code needs editing.
 * The curve only retints existing lights — it never adds a light or changes the
 * fixed lamp-pool count, so shader programs stay constant at runtime.
 */
export const KELVIN_LIGHTING = true;

/**
 * Auto-exposure adaptation rate. The original 0.9/s left a multi-second
 * blown-out window whenever the hour or weather changed; 1.6/s settles in
 * roughly a second while staying slow enough to avoid pumping while orbiting.
 * Set to 0.9 to restore the original pacing.
 */
export const AUTO_EXPOSURE_ADAPT_RATE = 1.6;

/** How strongly the Kelvin curve pulls the key light away from the seasonal tint. */
export const KELVIN_KEY_MIX = 0.34;

/**
 * Fractional reduction of key intensity at solar noon. Protects pale limestone,
 * cream strata and white walls from bleaching while leaving dawn/dusk/night
 * untouched. Dial to 0 to restore the original midday exposure.
 */
export const MIDDAY_HIGHLIGHT_TRIM = 0.12;

interface RgbChannels {
  r: number;
  g: number;
  b: number;
}

/** Shared scratch for the render path: never retained by callers. */
const kelvinColourScratch: RgbChannels = { r: 1, g: 1, b: 1 };

/**
 * Correlated colour temperature to sRGB, using Tanner Helland's piecewise fit.
 * Channels are clamped to 0..1. Returns a fresh object for callers that need to
 * keep the result; render code uses the allocation-free `writeTimeOfDaySunColour`.
 */
export function kelvinToRgb(kelvin: number): RgbChannels {
  const out: RgbChannels = { r: 1, g: 1, b: 1 };
  writeKelvinRgb(kelvin, out);
  return out;
}

function writeKelvinRgb(kelvin: number, out: RgbChannels): void {
  const temp = THREE.MathUtils.clamp(kelvin, 1000, 40000) / 100;
  let r: number;
  let g: number;
  let b: number;
  if (temp <= 66) {
    r = 255;
    g = 99.4708025861 * Math.log(temp) - 161.1195681661;
    b = temp <= 19 ? 0 : 138.5177312231 * Math.log(temp - 10) - 305.0447927307;
  } else {
    r = 329.698727446 * Math.pow(temp - 60, -0.1332047592);
    g = 288.1221695283 * Math.pow(temp - 60, -0.0755148492);
    b = 255;
  }
  out.r = THREE.MathUtils.clamp(r, 0, 255) / 255;
  out.g = THREE.MathUtils.clamp(g, 0, 255) / 255;
  out.b = THREE.MathUtils.clamp(b, 0, 255) / 255;
}

/**
 * The four brief keyframes — dawn 3500K, noon 5800K, dusk 2800K, night 9000K —
 * with gentle shoulder points so scrubbing time never snaps the light colour.
 * Hour is 24h; 0 and 24 are identical so the curve is continuous at midnight.
 */
const SUN_KELVIN_KEYFRAMES: ReadonlyArray<readonly [number, number]> = [
  [0, 9000],
  [4.6, 9000],
  [5.6, 4600],
  [6.3, 3500],
  [8.5, 4700],
  [10.5, 5500],
  [13, 5800],
  [15.5, 5500],
  [16.5, 4200],
  [17.8, 2800],
  [18.7, 3600],
  [19.5, 7200],
  [20.4, 9000],
  [24, 9000],
];

/** Correlated colour temperature in Kelvin for a given hour of day. */
export function sunKelvinForHour(hour: number): number {
  const h = ((hour % 24) + 24) % 24;
  for (let i = 1; i < SUN_KELVIN_KEYFRAMES.length; i++) {
    const [h1, k1] = SUN_KELVIN_KEYFRAMES[i];
    if (h <= h1) {
      const [h0, k0] = SUN_KELVIN_KEYFRAMES[i - 1];
      const t = THREE.MathUtils.smoothstep((h - h0) / (h1 - h0), 0, 1);
      return k0 + (k1 - k0) * t;
    }
  }
  return 9000;
}

/**
 * Write the time-of-day sun colour into `out` (linear working colour space).
 * Returns the Kelvin value so callers can log/grade without a second lookup.
 */
export function writeTimeOfDaySunColour(hour: number, out: THREE.Color): number {
  const kelvin = sunKelvinForHour(hour);
  writeKelvinRgb(kelvin, kelvinColourScratch);
  out.setRGB(
    kelvinColourScratch.r,
    kelvinColourScratch.g,
    kelvinColourScratch.b,
    THREE.SRGBColorSpace
  );
  return kelvin;
}

/**
 * 0 below 0.55 solar altitude, ramping to 1 at 0.92. Used to trim only the
 * high-noon key: dawn and dusk keep their full golden-hour intensity.
 */
export function middayHighlightGuard(altitude: number): number {
  return THREE.MathUtils.smoothstep(altitude, 0.55, 0.92);
}

