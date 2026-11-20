import * as THREE from 'three';

/** Half-extent of the diorama shadow frustum in world units. */
export const DIORAMA_SHADOW_EXTENT = 3.6;

/** Tight ortho shadow frustum and bias tuned for the 3x3 isometric slice. */
export function configureDioramaShadow(light: THREE.DirectionalLight): void {
  light.shadow.mapSize.set(2048, 2048);
  const cam = light.shadow.camera;
  cam.left = -DIORAMA_SHADOW_EXTENT;
  cam.right = DIORAMA_SHADOW_EXTENT;
  cam.top = DIORAMA_SHADOW_EXTENT;
  cam.bottom = -DIORAMA_SHADOW_EXTENT;
  cam.near = 0.5;
  cam.far = 60;
  cam.updateProjectionMatrix();
  light.shadow.bias = -0.0005;
  light.shadow.normalBias = 0.02;
}

/** Subtle cool back light that separates cliffs, domes and trees from the sky. */
export function createRimLight(): THREE.DirectionalLight {
  const rim = new THREE.DirectionalLight('#9ec6ff', 0.42);
  rim.position.set(-9, 7, -11);
  rim.castShadow = false;
  rim.target.position.set(0, 0.8, 0);
  return rim;
}

export function updateRimLight(rim: THREE.DirectionalLight, night: number, sun: number): void {
  rim.intensity = 0.24 + 0.58 * night + 0.08 * (1 - sun);
}
