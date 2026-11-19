/**
 * Analytical depth- and height-stratified volumetric fog with Mie directional
 * sun in-scattering, ray wisp modulation, and focus-zone clarity.
 * Operates in linear HDR space right before tonemapping/colorspace conversion.
 */
export const PLACES_VOLUMETRIC_FOG_GLSL = /* glsl */ `
uniform vec3 uVolSunDir;
uniform vec3 uVolSunColor;
uniform vec3 uVolFogColor;
uniform vec3 uVolFogDeepColor;
uniform float uVolFogDensity;
uniform vec3 uVolFocusPos;
uniform float uVolFocusClear;
uniform float uVolCamDist;
uniform float uVolSun;
uniform float uVolTime;

vec3 plApplyVolumetricFog(vec3 sceneRgb, vec3 worldPos) {
  vec3 rayVec = worldPos - cameraPosition;
  float dist = length(rayVec);
  vec3 viewDir = rayVec / max(dist, 0.0001);

  // Adaptive near clear distance keeps the hero geological slice sharp at close range
  float nearClear = max(4.2, uVolCamDist * 0.74);
  float effDist = max(0.0, dist - nearClear);

  // Analytical exponential height-fog ray integral above slice datum (y = -0.35)
  float y0 = -0.35;
  float falloff = 0.25;
  float camH = cameraPosition.y - y0;
  float fragH = worldPos.y - y0;
  float dH = (fragH - camH) * falloff;
  float heightIntegral;
  if (abs(dH) > 0.001) {
    heightIntegral =
      (exp(-clamp(camH * falloff, -2.0, 8.0)) - exp(-clamp(fragH * falloff, -2.0, 8.0))) / dH;
  } else {
    heightIntegral = exp(-clamp(camH * falloff, -2.0, 8.0));
  }
  heightIntegral = clamp(heightIntegral, 0.16, 2.2);

  // Gentle depth separation ramp across distant ridges & mist plumes
  float farRamp = smoothstep(nearClear * 0.92, nearClear + 22.0, dist);
  float rayWisp = 0.88 + 0.12 * sin(worldPos.x * 0.42 + uVolTime * 0.20)
                       * cos(worldPos.z * 0.38 - uVolTime * 0.16);
  float opticalDepth =
    effDist * uVolFogDensity * (0.52 + 0.85 * heightIntegral) * rayWisp
    + farRamp * uVolFogDensity * 6.5;

  // Preserve silhouette clarity across the centered slice
  float focusDist = length(worldPos.xz - uVolFocusPos.xz);
  float focusLens = mix(1.0, smoothstep(1.35, 4.2, focusDist), clamp(uVolFocusClear, 0.0, 1.0) * 0.88);

  float fogAmount = clamp((1.0 - exp(-opticalDepth)) * focusLens, 0.0, 0.86);

  // Altitude-stratified haze color + forward-scattered Mie solar glow
  float altMix = smoothstep(-0.3, 2.8, worldPos.y);
  vec3 hazeCol = mix(uVolFogDeepColor, uVolFogColor, altMix);
  float sunCos = max(dot(viewDir, normalize(uVolSunDir)), 0.0);
  float mie = pow(sunCos, 5.0) * 0.36 + pow(sunCos, 16.0) * 0.28;
  vec3 scattered = hazeCol + uVolSunColor * mie * (0.30 + 0.70 * uVolSun);

  return mix(sceneRgb, scattered, fogAmount);
}
`;
