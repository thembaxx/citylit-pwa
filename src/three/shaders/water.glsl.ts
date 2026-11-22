import { PLACES_VOLUMETRIC_FOG_GLSL } from './volumetricFog.glsl';

export const WATER_TOP_VERTEX = /* glsl */ `
attribute float aDepth;
attribute float aShore;
uniform float uTime;
uniform float uTurbulence;
uniform float uWind;
uniform float uTideAmp;
uniform float uTidePeriod;
uniform float uTidePhase;
varying float vDepth;
varying float vShore;
varying vec3 vWorldPos;
varying vec3 vLocalPos;

void main() {
  // Tide is derived from the shared WU clock, so it freezes with reduced motion.
  float tide = uTideAmp * sin(uTime * 6.2831853 / max(uTidePeriod, 0.001) + uTidePhase);
  vDepth = aDepth + tide;
  vShore = aShore;
  vec3 pos = position;
  float edgeMask = smoothstep(0.018, 0.22, max(0.0, aDepth));
  float chop = 0.85 + 0.35 * uWind;
  float wave = sin(pos.x * 5.6 + uTime * 2.2) * 0.011
             + cos(pos.z * 6.4 - uTime * 1.85) * 0.010
             + sin((pos.x - pos.z) * 9.2 + uTime * 3.1) * 0.005;
  pos.y += wave * uTurbulence * chop * edgeMask + tide;
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
uniform float uWind;
uniform float uGlint;
uniform float uCaustic;
uniform float uFresnel;
uniform float uMinAlpha;
uniform vec3 uSky;
uniform vec3 uSunDir;
uniform vec3 uSunColor;
uniform vec3 uShallow;
uniform vec3 uDeep;
uniform vec3 uConfSeam;
uniform float uConfWidth;
uniform float uConfStrength;
uniform vec3 uConfShallow;
uniform vec3 uConfDeep;
uniform float uConfTurb;
uniform vec3 uWake;
uniform float uWakeStrength;

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
float wtFbm(vec2 p) {
  float s = 0.0;
  float a = 0.5;
  for (int i = 0; i < 4; i++) {
    s += a * wtNoise(p);
    p = p * 2.06 + vec2(9.1, 5.3);
    a *= 0.5;
  }
  return s;
}
float wtRidge(vec2 p) {
  return 1.0 - abs(wtNoise(p) * 2.0 - 1.0);
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

  // Confluence: a positive-width mixing band where two water bodies meet.
  float confLine = (1.0 - smoothstep(
    0.0, max(uConfWidth, 0.0001), abs(dot(q, uConfSeam.xy) - uConfSeam.z)
  )) * uConfStrength;
  float confPatch = confLine
    * (0.55 + 0.45 * wtFbm(q * 9.0 + vec2(uTime * 0.35, -uTime * 0.28)));

  // Pointer wake: concentric ripples that decay away from the cursor.
  vec2 wakeD = q - uWake.xz;
  float wakeDist = length(wakeD);
  float wakeEnv = exp(-wakeDist * 3.2) * uWakeStrength;
  float wakeWave = sin(wakeDist * 26.0 - uTime * 5.5) * wakeEnv;

  // --- wave normal: two broad swells plus a fine wind-ripple octave --------
  float eps = 0.055;
  float h = wtHeight(q, uTime);
  float hx = wtHeight(q + vec2(eps, 0.0), uTime);
  float hz = wtHeight(q + vec2(0.0, eps), uTime);
  float tilt = 0.11 * uTurbulence * (1.0 + confLine * uConfTurb);
  vec3 N = normalize(vec3(-(h - hx) / eps * tilt, 1.0, -(h - hz) / eps * tilt));

  vec2 rp = q * 24.0 + vec2(uTime * 0.85, -uTime * 0.68);
  float r0 = wtNoise(rp);
  N = normalize(N + vec3(
    (r0 - wtNoise(rp + vec2(0.42, 0.0))) * 0.62 * uTurbulence,
    0.0,
    (r0 - wtNoise(rp + vec2(0.0, 0.42))) * 0.62 * uTurbulence
  ));
  if (wakeEnv > 0.001) {
    // Radial gradient of the ripple tilts the surface normal towards the cursor.
    float wakeGrad = cos(wakeDist * 26.0 - uTime * 5.5) * 26.0 * wakeEnv;
    vec2 wdir = wakeDist > 0.0001 ? wakeD / wakeDist : vec2(0.0);
    N = normalize(N + vec3(wakeGrad * wdir.x * 0.035, 0.0, wakeGrad * wdir.y * 0.035));
  }

  vec3 V = normalize(cameraPosition - vWorldPos);
  vec3 L = normalize(uSunDir);
  float nDotL = max(dot(N, L), 0.0);
  vec3 H = normalize(L + V);

  // --- water body: pale sand glows through the shallows, cobalt in basins --
  float shallowT = smoothstep(0.0, 0.14, depth);
  float deepT = smoothstep(0.11, 0.55, depth);
  vec3 seabed = mix(vec3(0.78, 0.70, 0.50), uShallow * 0.95, 0.22);
  vec3 body = mix(seabed * 0.92, uShallow, smoothstep(0.0, 0.075, depth));
  body = mix(body, uDeep, deepT);
  // At the confluence the two bodies bleed into one another with a soft,
  // noise-broken edge rather than a hard geometric line.
  body = mix(body, mix(uConfShallow, uConfDeep, deepT), confPatch * 0.82);
  // Water darkens with the sun so night basins read deep blue, not glowing cyan.
  body *= mix(0.30, 1.0, uSun);

  // Dark reef / weed patches drifting across the deeper turquoise.
  float reef = smoothstep(0.58, 0.82, wtFbm(q * 3.6 + 13.0));
  body = mix(body, mix(uDeep * 0.66, uShallow * 0.30, 0.38), reef * deepT * 0.52);

  float fresnel = pow(1.0 - max(dot(N, V), 0.0), 3.2) * uFresnel;
  float specBroad = pow(max(dot(N, H), 0.0), 90.0);
  float specGlint = pow(max(dot(N, H), 0.0), 330.0);
  float sparkle = smoothstep(0.55, 0.95, wtNoise(q * 42.0 + vec2(uTime * 1.4, -uTime * 1.2)));

  vec3 col = body * (0.48 + 0.78 * nDotL);
  col += uSky * (0.08 + fresnel * 0.26) * mix(0.90, 1.15, uSun);
  col = mix(col, mix(uShallow, uSky, 0.24), fresnel * 0.30);
  // Glints stay sun-driven, so night water reads dark instead of stippled white.
  col += uSunColor * (specBroad * (0.55 + 0.5 * uSun)
       + specGlint * (0.25 + sparkle * 1.1) * uSun) * uGlint;

  // --- sunlit caustics webbing across the pale sandy bottom ----------------
  float c1 = wtRidge(q * 7.4 + vec2(uTime * 0.22, -uTime * 0.17));
  float c2 = wtRidge(q * 9.6 - vec2(uTime * 0.15, uTime * 0.19) + 7.0);
  float caustic = pow(c1 * c2, 2.6);
  col += mix(uShallow, vec3(0.88, 1.0, 0.97), 0.45)
       * caustic * 0.52 * (1.0 - deepT) * (0.35 + 0.65 * uSun) * uCaustic;

  // --- layered breakers, shore lip, lacy foam and offshore whitecaps -------
  float shore = clamp(vShore, 0.0, 1.0);
  // Breakers hug the beach: several fine lines close to shore, none mid-lagoon.
  float surfA = smoothstep(0.60, 0.90,
    fract(shore * 9.0 - uTime * 0.55 + wtNoise(q * 3.4) * 0.30))
    * (1.0 - smoothstep(0.0, 0.48, shore));
  float surfB = smoothstep(0.72, 0.95,
    fract(shore * 14.0 - uTime * 0.82 + 0.5 + wtNoise(q * 5.2 + 9.0) * 0.24))
    * (1.0 - smoothstep(0.0, 0.30, shore));
  float shoreLip = (1.0 - smoothstep(0.0, 0.12, shore))
    * (0.68 + 0.32 * wtNoise(q * 19.0 + uTime * 0.6));
  float lacyFoam = smoothstep(0.52, 0.74, h)
    * smoothstep(0.58, 0.86, wtFbm(q * 12.0 - vec2(uTime * 0.35, uTime * 0.28)))
    * 0.20 * uTurbulence;
  float whitecaps = smoothstep(0.93, 1.0, wtRidge(q * 6.8 + vec2(uTime * 0.5, uTime * 0.22)))
    * smoothstep(0.35, 0.85, uWind)
    * (1.0 - smoothstep(0.05, 0.5, shore)) * 0.16;
  float rainRipples = uRain * smoothstep(0.72, 0.95,
    sin(q.x * 34.0 + uTime * 15.0) * cos(q.y * 31.0 - uTime * 13.0)) * 0.18;
  // Turbulent foam at the mixing line and on the crests of the pointer wake.
  float confFoam = confLine
    * smoothstep(0.45, 0.85, wtFbm(q * 14.0 - vec2(uTime * 0.4, uTime * 0.3))) * 0.55;
  float wakeFoam = max(0.0, wakeWave) * 0.42;

  float foam = clamp(
    (surfA + surfB * 0.85 + shoreLip * 1.05 + lacyFoam + whitecaps + rainRipples
      + confFoam + wakeFoam)
      * uFoamStrength,
    0.0, 1.0
  );
  float foamAA = max(fwidth(foam), 0.02);
  foam = smoothstep(0.42 - foamAA, 0.74 + foamAA, foam);
  vec3 foamColor = mix(vec3(0.985, 1.0, 1.0), uSunColor, 0.05)
    * (0.95 + 0.10 * uSun) * mix(0.42, 1.0, uSun);
  col = mix(col, foamColor, foam);

  // Faint glassy meniscus right at the cutaway block perimeter.
  float rim = smoothstep(1.452, 1.492, max(abs(vLocalPos.x), abs(vLocalPos.z)));
  col += mix(uShallow, vec3(0.72, 0.97, 1.0), 0.58) * rim * 0.12;

  float alpha = mix(uMinAlpha, 0.92, shallowT * 0.30 + deepT * 0.60);
  alpha = clamp(max(alpha, foam * 0.97), uMinAlpha, 0.96);

  col = plApplyVolumetricFog(col, vWorldPos);

  gl_FragColor = vec4(col, alpha);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`;

export const WATER_WALL_VERTEX = /* glsl */ `
uniform float uTime;
uniform float uTideAmp;
uniform float uTidePeriod;
uniform float uTidePhase;
varying vec2 vUv;
varying vec3 vWorldPos;
void main() {
  vUv = uv;
  vec3 pos = position;
  // Only the top edge of the cut face follows the tide; the bed stays put.
  if (uv.y > 0.5) {
    float tide = uTideAmp * sin(uTime * 6.2831853 / max(uTidePeriod, 0.001) + uTidePhase);
    pos.y += tide;
  }
  vec4 wp = modelMatrix * vec4(pos, 1.0);
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
uniform vec3 uConfSeam;
uniform float uConfWidth;
uniform float uConfStrength;
uniform vec3 uConfShallow;
uniform vec3 uConfDeep;

varying vec2 vUv;
varying vec3 vWorldPos;
${PLACES_VOLUMETRIC_FOG_GLSL}

float wwHash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}
float wwNoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(wwHash(i), wwHash(i + vec2(1.0, 0.0)), f.x),
    mix(wwHash(i + vec2(0.0, 1.0)), wwHash(i + vec2(1.0, 1.0)), f.x),
    f.y
  );
}

void main() {
  float depthMix = 1.0 - vUv.y;

  // Turquoise at the surface fading into cobalt depth, exactly like the
  // translucent cut reference blocks.
  vec3 col = mix(uShallow * 1.08, uDeep * 0.66, pow(depthMix, 0.55));
  col *= mix(0.38, 1.0, uSun);
  // Keep the cut face continuous with the confluence drawn on the surface.
  float confLine = (1.0 - smoothstep(
    0.0, max(uConfWidth, 0.0001), abs(dot(vWorldPos.xz, uConfSeam.xy) - uConfSeam.z)
  )) * uConfStrength;
  vec3 confCol = mix(uConfShallow * 1.08, uConfDeep * 0.66, pow(depthMix, 0.55));
  col = mix(col, confCol * mix(0.38, 1.0, uSun), confLine * 0.7);
  col = mix(col, uSky * 0.92, smoothstep(0.0, 0.06, vUv.y) * 0.24);

  // Sediment laminations settled on the cross-section.
  float sediment = 0.5 + 0.5 * sin(
    vWorldPos.y * 24.0 + sin(vWorldPos.x * 4.6 + vWorldPos.z * 3.8) * 1.6
  );
  col *= 0.92 + 0.12 * sediment;

  // Slow caustic webbing and slanted light shafts through the water column.
  float caustic = sin(vWorldPos.x * 9.0 + vWorldPos.z * 8.5 + uTime * 1.9) * 0.5 + 0.5;
  caustic *= sin(vUv.y * 16.0 - uTime * 1.4) * 0.5 + 0.5;
  col += uShallow * caustic * 0.30 * (0.4 + 0.6 * uSun) * vUv.y;

  float shaft = smoothstep(0.62, 0.98, wwNoise(vec2(
    vUv.x * 7.0 + uTime * 0.05,
    vUv.y * 1.4
  )));
  col += mix(uShallow, vec3(1.0, 0.94, 0.80), 0.4) * shaft * 0.12 * vUv.y;

  // A few rising bubbles clinging to the cut face.
  vec2 bCell = floor(vec2(vUv.x * 26.0, vUv.y * 13.0));
  float bSeed = wwHash(bCell);
  vec2 bLocal = fract(vec2(vUv.x * 26.0, vUv.y * 13.0)) - 0.5;
  float bubble = step(0.72, bSeed)
    * (1.0 - smoothstep(0.06, 0.16, length(bLocal + vec2(0.0, sin(uTime * 1.4 + bSeed * 20.0) * 0.18))));
  col += vec3(0.85, 0.98, 1.0) * bubble * 0.28;

  // Sandy pale meniscus at the waterline, then deeper blue below.
  float meniscus = smoothstep(0.94, 1.0, vUv.y);
  col = mix(col, mix(uSky, vec3(0.88, 0.98, 1.0), 0.7), meniscus * 0.42);
  float bed = (1.0 - smoothstep(0.0, 0.16, vUv.y));
  col = mix(col, mix(vec3(0.82, 0.76, 0.58), uShallow * 0.5, 0.35), bed * 0.28);

  float alpha = mix(0.40, 0.82, depthMix) * (1.12 - uClarity * 0.30);
  alpha = clamp(max(alpha, meniscus * 0.62), 0.32, 0.86);

  col = plApplyVolumetricFog(col, vWorldPos);

  gl_FragColor = vec4(col, alpha);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`;
