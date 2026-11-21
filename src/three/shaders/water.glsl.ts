import { PLACES_VOLUMETRIC_FOG_GLSL } from './volumetricFog.glsl';

export const WATER_TOP_VERTEX = /* glsl */ `
attribute float aDepth;
attribute float aShore;
uniform float uTime;
uniform float uTurbulence;
uniform float uWind;
varying float vDepth;
varying float vShore;
varying vec3 vWorldPos;
varying vec3 vLocalPos;

void main() {
  vDepth = aDepth;
  vShore = aShore;
  vec3 pos = position;
  float edgeMask = smoothstep(0.018, 0.22, max(0.0, aDepth));
  float chop = 0.85 + 0.35 * uWind;
  float wave = sin(pos.x * 5.6 + uTime * 2.2) * 0.011
             + cos(pos.z * 6.4 - uTime * 1.85) * 0.010
             + sin((pos.x - pos.z) * 9.2 + uTime * 3.1) * 0.005;
  pos.y += wave * uTurbulence * chop * edgeMask;
  vLocalPos = pos;
  vec4 wp = modelMatrix * vec4(pos, 1.0);
  vWorldPos = wp.xyz;
  gl_Position = projectionMatrix * viewMatrix * wp;
}
`;

export const WATER_TOP_FRAGMENT = /* glsl */ `
uniform float uTime;
uniform float uSun;
uniform float uRain;
uniform float uFoamStrength;
uniform float uTurbulence;
uniform float uClarity;
uniform float uGlint;
uniform float uCaustic;
uniform float uFresnel;
uniform float uMinAlpha;
uniform vec3 uSky;
uniform vec3 uSunDir;
uniform vec3 uSunColor;
uniform vec3 uShallow;
uniform vec3 uDeep;

varying float vDepth;
varying float vShore;
varying vec3 vWorldPos;
varying vec3 vLocalPos;

float wtHash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}
float wtNoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(wtHash(i), wtHash(i + vec2(1.0, 0.0)), f.x),
    mix(wtHash(i + vec2(0.0, 1.0)), wtHash(i + vec2(1.0, 1.0)), f.x),
    f.y
  );
}
float wtHeight(vec2 p, float t) {
  float h = sin(p.x * 5.6 + t * 2.15) * 0.34
          + cos(p.y * 6.6 - t * 1.85) * 0.30
          + (wtNoise(p * 4.8 + vec2(t * 0.48, -t * 0.35)) - 0.5) * 0.44
          + (wtNoise(p * 11.2 - vec2(t * 0.62, t * 0.42)) - 0.5) * 0.20;
  h += uRain * 0.22 * sin(p.x * 24.0 + t * 12.0) * cos(p.y * 22.0 - t * 10.0);
  return h;
}
${PLACES_VOLUMETRIC_FOG_GLSL}

void main() {
  if (vDepth < -0.004) discard;
  float depth = max(0.0, vDepth);

  vec2 q = vWorldPos.xz;
  float eps = 0.06;
  float h = wtHeight(q, uTime);
  float hx = wtHeight(q + vec2(eps, 0.0), uTime);
  float hz = wtHeight(q + vec2(0.0, eps), uTime);
  float tilt = 0.10 * uTurbulence;
  vec3 N = normalize(vec3(-(h - hx) / eps * tilt, 1.0, -(h - hz) / eps * tilt));
  vec3 V = normalize(cameraPosition - vWorldPos);
  vec3 L = normalize(uSunDir);

  float fresnel = pow(1.0 - max(dot(N, V), 0.0), 3.4) * uFresnel;
  float shallowMix = smoothstep(0.004, 0.13, depth);
  // Distance from shore keeps wide shallows turquoise; only basin centres go deep.
  float deepMix = max(smoothstep(0.07, 0.42, depth), smoothstep(0.15, 0.9, vShore) * 0.88);
  vec3 waterBody = mix(uShallow, uDeep, deepMix);
  waterBody *= 0.92 + 0.20 * shallowMix;

  float nDotL = max(dot(N, L), 0.0);
  vec3 H = normalize(L + V);
  float specBroad = pow(max(dot(N, H), 0.0), 96.0) * (0.35 + 1.0 * uSun);
  float specGlint = pow(max(dot(N, H), 0.0), 340.0) * (0.6 + 1.6 * uSun);

  vec3 col = waterBody * (0.44 + 0.68 * nDotL * (0.42 + 0.58 * uSun));
  col += waterBody * uSky * 0.20;
  col = mix(col, uSky * 1.10, fresnel * 0.55);
  col += uSunColor * (specBroad * 1.25 + specGlint * 2.4) * uGlint;

  // Dual-layer sunlit underwater caustics in clear turquoise shallows.
  float c1 = wtNoise(q * 11.5 + vec2(uTime * 0.36, -uTime * 0.28));
  float c2 = wtNoise(q * 14.0 - vec2(uTime * 0.25, uTime * 0.34));
  float caustic = pow(c1 * c2 * 2.1, 2.2);
  col += uShallow * caustic * 0.30 * (1.0 - smoothstep(0.04, 0.58, depth)) * (0.40 + 0.60 * uSun) * uCaustic;

  // Crisp rolling breaking surf, lacy reverse-shore froth and a bright waterline.
  float surfPhase = fract(vShore * 5.2 - uTime * 0.42 + wtNoise(q * 4.2) * 0.30);
  float surfRing = smoothstep(0.62, 0.86, surfPhase) * (1.0 - smoothstep(0.0, 0.62, vShore));
  float shoreLip = (1.0 - smoothstep(0.0, 0.24, vShore))
                 * (0.62 + 0.38 * wtNoise(q * 17.0 + uTime * 0.72));
  float lacyFoam = smoothstep(0.46, 0.72, h)
                 * smoothstep(0.56, 0.86, wtNoise(q * 15.5 - uTime * 0.55))
                 * 0.44 * uTurbulence;
  float rainRipples = uRain * smoothstep(0.75, 0.95,
    sin(q.x * 32.0 + uTime * 14.0) * cos(q.y * 30.0 - uTime * 12.0)) * 0.22;
  float foam = clamp(
    (surfRing * 0.95 + shoreLip * 1.08 + lacyFoam + rainRipples) * uFoamStrength,
    0.0, 1.0
  );
  float foamAA = max(fwidth(foam), 0.02);
  foam = smoothstep(0.30 - foamAA, 0.66 + foamAA, foam);
  vec3 foamColor = mix(vec3(0.98, 1.0, 1.0), uSunColor, 0.06);
  col = mix(col, foamColor * 1.06, foam);

  // Faint glassy meniscus right at the cutaway block perimeter.
  float rim = smoothstep(1.455, 1.49, max(abs(vLocalPos.x), abs(vLocalPos.z)));
  col += mix(uShallow, vec3(0.72, 0.96, 1.0), 0.55) * rim * 0.10;

  float alpha = mix(uMinAlpha, 0.92,
    smoothstep(0.0, 0.38, depth) * (1.10 - uClarity * 0.26));
  alpha = clamp(max(alpha, foam * 0.97), uMinAlpha, 0.96);

  col = plApplyVolumetricFog(col, vWorldPos);

  gl_FragColor = vec4(col, alpha);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`;

export const WATER_WALL_VERTEX = /* glsl */ `
varying vec2 vUv;
varying vec3 vWorldPos;
void main() {
  vUv = uv;
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vWorldPos = wp.xyz;
  gl_Position = projectionMatrix * viewMatrix * wp;
}
`;

export const WATER_WALL_FRAGMENT = /* glsl */ `
uniform float uTime;
uniform float uSun;
uniform vec3 uSky;
uniform vec3 uShallow;
uniform vec3 uDeep;
uniform float uClarity;

varying vec2 vUv;
varying vec3 vWorldPos;
${PLACES_VOLUMETRIC_FOG_GLSL}

void main() {
  float depthMix = 1.0 - vUv.y;
  vec3 col = mix(uShallow * 1.04, uDeep * 0.62, pow(depthMix, 0.58));

  // Sediment laminations and slow underwater caustics in the cross-section.
  float sediment = 0.5 + 0.5 * sin(vWorldPos.y * 26.0 + sin(vWorldPos.x * 5.0 + vWorldPos.z * 4.0) * 1.4);
  col *= 0.91 + 0.12 * sediment;
  float caustic = sin(vWorldPos.x * 10.0 + vWorldPos.z * 9.5 + uTime * 2.2) * 0.5 + 0.5;
  caustic *= sin(vUv.y * 18.0 - uTime * 1.5) * 0.5 + 0.5;
  col += uShallow * caustic * 0.24 * (0.4 + 0.6 * uSun) * vUv.y;

  float meniscus = smoothstep(0.94, 1.0, vUv.y);
  col = mix(col, mix(uSky, vec3(0.88, 0.98, 1.0), 0.7), meniscus * 0.42);

  float alpha = mix(0.40, 0.82, depthMix) * (1.12 - uClarity * 0.30);
  alpha = clamp(max(alpha, meniscus * 0.62), 0.32, 0.86);

  col = plApplyVolumetricFog(col, vWorldPos);

  gl_FragColor = vec4(col, alpha);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`;
