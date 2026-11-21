/**
 * Shared GLSL for the month-driven seasonal colour morph.
 *
 * The uniforms are bound to the global WU season values, which the weather
 * scene eases every frame. Green-dominant surfaces (grass, canopies) morph the
 * most; blooms and rock keep most of their own hue so the dioramas stay legible.
 */
export const SEASON_UNIFORMS_GLSL = /* glsl */ `
uniform float uSeasonF;
uniform float uSeasonAutumn;
uniform float uSeasonSpring;
`;

export const SEASON_MORPH_GLSL = /* glsl */ `
vec3 clSeasonMorph(vec3 base, float strength) {
  float lum = dot(base, vec3(0.299, 0.587, 0.114));
  float green = smoothstep(0.01, 0.14, base.g - max(base.r, base.b));
  float veg = mix(0.28, 1.0, green);
  float s = clamp(strength * veg, 0.0, 1.0);

  vec3 lush = base * vec3(0.93, 1.12, 0.90);
  vec3 dry = mix(vec3(lum), vec3(0.46, 0.37, 0.22), 0.82) * (0.80 + 0.34 * lum);
  vec3 autumn = mix(lush, vec3(0.72, 0.40, 0.13), 0.55);
  vec3 spring = mix(lush, vec3(0.42, 0.66, 0.22), 0.45);

  vec3 col = mix(dry, lush, smoothstep(0.03, 0.97, clamp(uSeasonF, 0.0, 1.0)));
  col = mix(col, autumn, clamp(uSeasonAutumn, 0.0, 1.0) * 0.55);
  col = mix(col, spring, clamp(uSeasonSpring, 0.0, 1.0) * 0.45);
  return mix(base, col, s);
}
`;
