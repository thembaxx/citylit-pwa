/**
 * One creature-animation shader chunk, patched into the shared three.js
 * standard material through `onBeforeCompile`.
 *
 * The whole layer runs three program variants (spine, parts, flap) plus one eye
 * variant — never one program per species. High-frequency body motion happens
 * on the GPU from a single time uniform plus per-instance attributes; the CPU
 * only writes agent transforms at a low tick rate.
 */
import * as THREE from 'three';
import type { CreatureAnimation } from './habitat';

export interface CreatureUniforms {
  uTime: { value: number };
  uMotion: { value: number };
  uWind: { value: number };
  uRim: { value: number };
}

/** Shared uniform objects: every creature material points at these. */
export const CREATURE_UNIFORMS: CreatureUniforms = {
  uTime: { value: 0 },
  uMotion: { value: 1 },
  uWind: { value: 0.4 },
  uRim: { value: 0.55 },
};

export function updateCreatureUniforms(time: number, motion: number, wind: number): void {
  CREATURE_UNIFORMS.uTime.value = Number.isFinite(time) ? time : 0;
  CREATURE_UNIFORMS.uMotion.value = Number.isFinite(motion) ? Math.max(0, Math.min(motion, 2)) : 0;
  CREATURE_UNIFORMS.uWind.value = Number.isFinite(wind) ? Math.max(0, Math.min(wind, 5)) : 0;
}

export interface CreatureMaterialOptions {
  eyes?: boolean;
  roughness?: number;
  metalness?: number;
  rim?: number;
  /** Vertex colours are always on; instance colour is applied by InstancedMesh. */
  tint?: number;
}

/*
 * Attribute budget: a standard material with instancing already spends 9
 * locations (position, normal, colour, instanceMatrix x4, instanceColor).
 * The creature data is packed into four more so the program links on every
 * driver:
 *   aBend     spine weight
 *   aPivot    part pivot
 *   aMotion   (weight, freq, phaseOffset, axisId 0=x 1=y 2=z)
 *   aInstance (phase, speed, seed, state)
 */
const VERTEX_HEADER = /* glsl */ `
attribute float aBend;
attribute vec3 aPivot;
attribute vec4 aMotion;
attribute vec4 aInstance;
uniform float uTime;
uniform float uMotion;
uniform float uWind;

vec3 creatureRotate(vec3 p, vec3 axis, float angle) {
  float c = cos(angle);
  float s = sin(angle);
  return p * c + cross(axis, p) * s + axis * dot(axis, p) * (1.0 - c);
}

vec3 creatureAxis() {
  if (aMotion.w < 0.5) return vec3(1.0, 0.0, 0.0);
  if (aMotion.w < 1.5) return vec3(0.0, 1.0, 0.0);
  return vec3(0.0, 0.0, 1.0);
}
`;

function deformation(): string {
  return /* glsl */ `
  // 0 at rest, 1 fully active. Ground animals graze at ~0.55, perched birds 0.
  float creatureActive = 1.0 - clamp(aInstance.w, 0.0, 1.0);
  float creatureSpeed = max(0.15, aInstance.y);
  float creaturePhase = aInstance.x * 6.2831853;
  float creatureMotion = uMotion;
  float creatureWeight = aMotion.x;
  float creatureFreq = aMotion.y;
  float creaturePhaseOff = aMotion.z;
  vec3 creatureAxisDir = creatureAxis();

  transformed *= 1.0 + sin(uTime * 1.05 + creaturePhase) * 0.006 * creatureMotion;

  #if defined(ANIM_SPINE)
    float spineWave = sin(uTime * 5.4 * creatureSpeed + creaturePhase - aBend * 5.2);
    transformed.x += spineWave * aBend * aBend * 0.11 * creatureMotion * (0.4 + 0.6 * creatureActive);
    // Tail fin / fluke steering adds a small lagged rotation on top.
    float tailLag = max(0.0, length(transformed - aPivot));
    float tailAngle = sin(uTime * 5.4 * creatureSpeed + creaturePhase - aBend * 5.2 - tailLag * 3.0)
      * creatureWeight * creatureMotion;
    if (abs(creatureWeight) > 0.0001) {
      transformed = creatureRotate(transformed - aPivot, creatureAxisDir, tailAngle) + aPivot;
    }
  #elif defined(ANIM_PARTS)
    float partLag = max(0.0, length(transformed - aPivot) - 0.02);
    float partAngle = sin(uTime * creatureFreq * creatureSpeed + creaturePhaseOff + creaturePhase - partLag * 4.0)
      * creatureWeight * creatureMotion * (0.35 + 0.65 * creatureActive);
    transformed = creatureRotate(transformed - aPivot, creatureAxisDir, partAngle) + aPivot;
  #else
    float wingLag = length(transformed - aPivot);
    float wingAngle = sin(uTime * creatureFreq * creatureSpeed + creaturePhaseOff + creaturePhase - wingLag * 9.0)
      * creatureWeight * creatureMotion * (0.35 + 0.65 * creatureActive) * (1.0 + uWind * 0.05);
    transformed = creatureRotate(transformed - aPivot, creatureAxisDir, wingAngle) + aPivot;
  #endif

  #if defined(CREATURE_EYES)
    float blinkClock = fract(uTime * 0.09 + aInstance.z);
    float blink = smoothstep(0.955, 0.988, blinkClock) * (1.0 - smoothstep(0.988, 1.0, blinkClock));
    vec3 lid = transformed - aPivot;
    lid.y *= 1.0 - blink * 0.9 * creatureMotion;
    transformed = lid + aPivot;
  #endif
  `;
}

const FRAGMENT_RIM = /* glsl */ `
  float rimTerm = pow(
    1.0 - clamp(dot(normalize(vNormal), normalize(vViewPosition)), 0.0, 1.0),
    3.0
  );
  gl_FragColor.rgb += rimTerm * uRim * vec3(0.30, 0.36, 0.40);
`;

export function createCreatureMaterial(
  animation: CreatureAnimation,
  options: CreatureMaterialOptions = {}
): THREE.MeshStandardMaterial {
  const eyes = Boolean(options.eyes);
  const material = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: options.roughness ?? (eyes ? 0.08 : 0.66),
    metalness: options.metalness ?? (eyes ? 0 : 0.05),
    envMapIntensity: options.tint ?? 1,
  });
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = CREATURE_UNIFORMS.uTime;
    shader.uniforms.uMotion = CREATURE_UNIFORMS.uMotion;
    shader.uniforms.uWind = CREATURE_UNIFORMS.uWind;
    shader.uniforms.uRim = { value: options.rim ?? 0.55 };
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', `#include <common>\n${VERTEX_HEADER}`)
      .replace('#include <begin_vertex>', `#include <begin_vertex>\n${deformation()}`);
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform float uRim;')
      .replace('#include <dithering_fragment>', `${FRAGMENT_RIM}\n#include <dithering_fragment>`);
  };
  material.customProgramCacheKey = () =>
    `creature_${animation}_${eyes ? 'eyes' : 'body'}_${options.rim ?? 0.55}`;
  material.userData.creatureUniforms = CREATURE_UNIFORMS;
  return material;
}

/* ------------------------------------------------------------------ */
/* Blob shadow                                                         */
/* ------------------------------------------------------------------ */

let blobTexture: THREE.CanvasTexture | null = null;

/** Soft radial falloff, generated once and shared by every blob shadow. */
export function getBlobShadowTexture(): THREE.CanvasTexture {
  if (blobTexture) return blobTexture;
  const size = 64;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    gradient.addColorStop(0, 'rgba(0,0,0,0.62)');
    gradient.addColorStop(0.55, 'rgba(0,0,0,0.28)');
    gradient.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
  }
  blobTexture = new THREE.CanvasTexture(canvas);
  blobTexture.colorSpace = THREE.SRGBColorSpace;
  return blobTexture;
}

let blobMaterial: THREE.MeshBasicMaterial | null = null;

export function getBlobShadowMaterial(): THREE.MeshBasicMaterial {
  if (blobMaterial) return blobMaterial;
  blobMaterial = new THREE.MeshBasicMaterial({
    map: getBlobShadowTexture(),
    transparent: true,
    depthWrite: false,
    color: 0x000000,
    opacity: 0.7,
    toneMapped: false,
  });
  blobMaterial.userData.sharedResource = true;
  return blobMaterial;
}
