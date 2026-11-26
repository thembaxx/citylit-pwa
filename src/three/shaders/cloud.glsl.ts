import { NOISE_GLSL } from './noise.glsl';
import { PLACES_VOLUMETRIC_FOG_GLSL } from './volumetricFog.glsl';

/**
 * Instanced puff clouds: per-instance phase drives a slow atmospheric drift and
 * bob entirely on the GPU, so an entire cluster is one draw call.
 */
export const CLOUD_VERTEX = /* glsl */ `
attribute float aPhase;
uniform float uTime;
uniform float uWind;
uniform vec2 uWindDir;
varying vec3 vWorldPos;
varying vec3 vWorldNormal;
varying vec3 vViewDir;
varying vec3 vTint;
varying float vSeed;

void main() {
  vec4 inst = instanceMatrix * vec4(position, 1.0);
  float wind = clamp(uWind, 0.0, 2.0);
  vec2 windDir = length(uWindDir) > 0.0001 ? normalize(uWindDir) : vec2(1.0, 0.0);
  float along = sin(uTime * (0.12 + wind * 0.04) + aPhase) * (0.03 + wind * 0.035);
  float across = sin(uTime * 0.07 + aPhase * 1.7) * (0.025 + wind * 0.01);
  inst.xz += vec2(windDir.x * along - windDir.y * across, windDir.y * along + windDir.x * across);
  inst.y += cos(uTime * 0.45 + aPhase * 1.13) * 0.045;

  // Per-puff colour jitter from a hash of the instance translation, so
  // neighbouring puffs read as distinct instead of a wall of identical discs.
  float seed = fract(abs(inst.x) * 0.61 + abs(inst.y) * 0.37 + abs(inst.z) * 0.83 + aPhase * 1.13);
  vSeed = seed;
  vTint = mix(vec3(1.0), vec3(0.92, 0.96, 1.04), seed);

  vec4 wp = modelMatrix * inst;
  vWorldPos = wp.xyz;
  vWorldNormal = normalize(mat3(modelMatrix) * mat3(instanceMatrix) * normal);
  vViewDir = normalize(cameraPosition - wp.xyz);
  gl_Position = projectionMatrix * viewMatrix * wp;
}
`;

export const CLOUD_FRAGMENT = /* glsl */ `
uniform float uTime;
uniform float uDY;
uniform float uSun;
uniform float uLit;
uniform vec3 uSky;
uniform vec3 uTint;
uniform vec3 uSunDir;
uniform vec3 uSunColor;

varying vec3 vWorldPos;
varying vec3 vWorldNormal;
varying vec3 vViewDir;
varying vec3 vTint;
varying float vSeed;
${NOISE_GLSL}
${PLACES_VOLUMETRIC_FOG_GLSL}

void main() {
  if (uDY < 90.0 && vWorldPos.y > uDY && dot(vWorldPos.xz, vWorldPos.xz) < 110.0 && vWorldPos.y < 14.0) discard;
  vec3 N = normalize(vWorldNormal);
  vec3 V = normalize(vViewDir);
  vec3 L = normalize(uSunDir);

  // Cauliflower surface breakup: perturb the shading normal with 3D noise so
  // each puff reads as a bundle of rounded lobes rather than a smooth sphere.
  vec3 jitter = vec3(
    clFbm3(vWorldPos * 9.0 + vec3(vSeed * 12.0, 0.0, 0.0)),
    clFbm3(vWorldPos * 9.0 + vec3(0.0, vSeed * 9.0, 5.0)),
    clFbm3(vWorldPos * 9.0 + vec3(9.0, 0.0, vSeed * 7.0))
  ) - 0.5;
  vec3 Np = normalize(N + jitter * 0.5);

  float ndl = dot(Np, L);
  float litSun = clamp(ndl * 0.5 + 0.5, 0.0, 1.0);
  float up = clamp(Np.y, -1.0, 1.0);
  float topness = up * 0.5 + 0.5;

  // Soft blue-grey shaded underside, bright warm-white sunlit crown.
  vec3 shadeLow = mix(vec3(0.60, 0.66, 0.77), uSky, 0.36);
  vec3 shadeMid = mix(uTint * vTint, vec3(0.90, 0.93, 0.98), 0.34);
  vec3 shadeTop = mix(uTint * vTint, uSunColor, 0.18);

  vec3 col = mix(shadeLow * 0.98, shadeMid, smoothstep(0.10, 0.60, topness * 0.55 + litSun * 0.54));
  col = mix(col, shadeTop * 1.10, smoothstep(0.56, 0.98, litSun * 0.62 + topness * 0.48));
  col *= mix(0.95, 1.05, uSun);
  // Night clouds become cool, dim moonlit masses instead of day-white puffs.
  col *= 1.0 - uLit * 0.55;
  col = mix(col, col * vec3(0.74, 0.82, 1.0), uLit);

  // Gentle self-shadow creeping up from the flat base of the cumulus.
  col *= mix(0.84, 1.02, smoothstep(-0.9, 0.25, up));

  // Cool rim separates the puff from the sky, warm rim catches the sun.
  float rim = pow(1.0 - max(dot(N, V), 0.0), 2.1);
  col += mix(uSky, uSunColor, 0.42) * rim * 0.16;

  // Noise-broken silhouette gives ragged cauliflower edges instead of discs.
  // Horizontal noise keeps the edge ragged without vertical streaks.
  float facing = max(dot(N, V), 0.0);
  float cauli = clFbm3(vec3(vWorldPos.xz * 7.5, vWorldPos.y * 3.0) + vec3(0.0, uTime * 0.05, 0.0)) - 0.5;
  float alpha = smoothstep(0.05, 0.62, facing + cauli * 0.32);
  alpha *= 0.98;
  if (alpha < 0.02) discard;

  col = plApplyVolumetricFog(col, vWorldPos);

  gl_FragColor = vec4(col, alpha);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`;
