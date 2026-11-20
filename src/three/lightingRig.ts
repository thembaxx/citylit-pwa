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
  light.shadow.bias = -0.0004;
  light.shadow.normalBias = 0.03;
}

/** Subtle cool back light that separates cliffs, domes and trees from the sky. */
export function createRimLight(): THREE.DirectionalLight {
  const rim = new THREE.DirectionalLight('#9ec6ff', 0.5);
  rim.position.set(-9, 7, -11);
  rim.castShadow = false;
  rim.target.position.set(0, 0.8, 0);
  return rim;
}

export function updateRimLight(rim: THREE.DirectionalLight, night: number, sun: number): void {
  rim.intensity = 0.3 + 0.6 * night + 0.1 * (1 - sun);
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

/** Low, non-shadow-casting bounce fill that carries the site's biome tint. */
export function createBounceLight(): THREE.DirectionalLight {
  const bounce = new THREE.DirectionalLight(DEFAULT_BOUNCE_COLOR, 0.22);
  bounce.position.set(6, 1.5, 9);
  bounce.castShadow = false;
  bounce.target.position.set(0, 1, 0);
  return bounce;
}

/** Re-tint the bounce fill when the active landmark's biome changes. */
export function setBounceLightBiome(light: THREE.DirectionalLight, biome?: string): void {
  light.color.set(BIOME_BOUNCE_COLORS[biome ?? ''] ?? DEFAULT_BOUNCE_COLOR);
}
