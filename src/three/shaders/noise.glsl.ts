/**
 * Shared procedural noise chunks for the Places diorama shaders.
 * Kept dependency-free so every material compiles the same functions once.
 */
export const NOISE_GLSL = /* glsl */ `
float clHash2(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float clHash3(vec3 p) {
  return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453123);
}

float clNoise2(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  float a = clHash2(i);
  float b = clHash2(i + vec2(1.0, 0.0));
  float c = clHash2(i + vec2(0.0, 1.0));
  float d = clHash2(i + vec2(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

float clFbm2(vec2 p) {
  float sum = 0.0;
  float amp = 0.5;
  for (int i = 0; i < 4; i++) {
    sum += amp * clNoise2(p);
    p = p * 2.04 + vec2(11.3, 7.1);
    amp *= 0.5;
  }
  return sum;
}

float clNoise3(vec3 p) {
  vec3 i = floor(p);
  vec3 f = fract(p);
  vec3 u = f * f * (3.0 - 2.0 * f);
  float n000 = clHash3(i);
  float n100 = clHash3(i + vec3(1.0, 0.0, 0.0));
  float n010 = clHash3(i + vec3(0.0, 1.0, 0.0));
  float n110 = clHash3(i + vec3(1.0, 1.0, 0.0));
  float n001 = clHash3(i + vec3(0.0, 0.0, 1.0));
  float n101 = clHash3(i + vec3(1.0, 0.0, 1.0));
  float n011 = clHash3(i + vec3(0.0, 1.0, 1.0));
  float n111 = clHash3(i + vec3(1.0, 1.0, 1.0));
  float nx00 = mix(n000, n100, u.x);
  float nx10 = mix(n010, n110, u.x);
  float nx01 = mix(n001, n101, u.x);
  float nx11 = mix(n011, n111, u.x);
  return mix(mix(nx00, nx10, u.y), mix(nx01, nx11, u.y), u.z);
}

float clFbm3(vec3 p) {
  float sum = 0.0;
  float amp = 0.5;
  for (int i = 0; i < 3; i++) {
    sum += amp * clNoise3(p);
    p = p * 2.03 + vec3(9.1, 4.7, 6.3);
    amp *= 0.5;
  }
  return sum;
}
`;
