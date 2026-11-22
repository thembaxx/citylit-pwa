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

