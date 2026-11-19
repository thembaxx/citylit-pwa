import { NOISE_GLSL } from './noise.glsl';
import { PLACES_VOLUMETRIC_FOG_GLSL } from './volumetricFog.glsl';

/**
 * Instanced puff clouds: per-instance phase drives a slow atmospheric drift and
 * bob entirely on the GPU, so an entire cluster is one draw call.
 */
export const CLOUD_VERTEX = /* glsl */ `
attribute float aPhase;
uniform float uTime;
varying vec3 vWorldPos;
varying vec3 vWorldNormal;
varying vec3 vViewDir;

void main() {
  vec4 inst = instanceMatrix * vec4(position, 1.0);
  inst.x += sin(uTime * 0.28 + aPhase) * 0.14;
  inst.y += cos(uTime * 0.45 + aPhase * 1.13) * 0.045;

  vec4 wp = modelMatrix * inst;
  vWorldPos = wp.xyz;
  vWorldNormal = normalize(mat3(modelMatrix) * mat3(instanceMatrix) * normal);
  vViewDir = normalize(cameraPosition - wp.xyz);
  gl_Position = projectionMatrix * viewMatrix * wp;
}
`;

export const CLOUD_FRAGMENT = /* glsl */ `
uniform float uTime;
uniform float uSun;
uniform float uLit;
uniform vec3 uSky;
uniform vec3 uTint;
uniform vec3 uSunDir;
uniform vec3 uSunColor;

varying vec3 vWorldPos;
varying vec3 vWorldNormal;
varying vec3 vViewDir;
${NOISE_GLSL}
${PLACES_VOLUMETRIC_FOG_GLSL}

void main() {
  vec3 N = normalize(vWorldNormal);
  vec3 V = normalize(vViewDir);
  vec3 L = normalize(uSunDir);

  float ndl = dot(N, L);
  float wrap = ndl * 0.5 + 0.5;
  float skyWrap = N.y * 0.5 + 0.5;

  // Cool skylight underside against warm sunlit crowns.
  vec3 ambientCool = mix(vec3(0.26, 0.33, 0.46), uSky, 0.42);
  vec3 body = mix(
    ambientCool * (0.62 + 0.42 * uSun),
    uTint,
    wrap * 0.68 + skyWrap * 0.20
  );
  vec3 sunlit = mix(uTint, uSunColor, 0.30 + 0.28 * (1.0 - uSun))
              * (0.74 + 0.34 * max(ndl, 0.0));
  vec3 col = mix(body, sunlit, smoothstep(0.08, 0.82, wrap)) * 0.90;

  // Cool rim separates the puffs from the sky and the diorama below.
  float rim = pow(1.0 - max(dot(N, V), 0.0), 2.2);
  col += mix(uSky, uSunColor, 0.40) * rim * 0.26;
  col *= 1.0 - uLit * 0.26;

  // Soft silhouette alpha + slow noise breakup gives a volumetric read.
  float facing = max(dot(N, V), 0.0);
  float softEdge = smoothstep(0.02, 0.62, facing);
  float breakup = 0.88 + 0.12 * clFbm3(vWorldPos * 3.2 + vec3(0.0, uTime * 0.05, 0.0));
  float alpha = softEdge * breakup * 0.88;
  if (alpha < 0.015) discard;

  col = plApplyVolumetricFog(col, vWorldPos);

  gl_FragColor = vec4(col, alpha);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`;
