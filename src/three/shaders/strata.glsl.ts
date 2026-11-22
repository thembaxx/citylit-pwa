import { SEASON_MORPH_GLSL, SEASON_UNIFORMS_GLSL } from './season.glsl';
import { NOISE_GLSL } from './noise.glsl';

/** Vertex declarations injected into MeshStandardMaterial's `<common>` block. */
export const STRATA_VERT_COMMON = /* glsl */ `
attribute float aTopY;
varying vec3 vPlacePos;
varying vec3 vPlaceNorm;
varying float vTopY;
varying vec3 vVolFogWPos;
`;

/** Capture local attributes before the world transform is resolved. */
export const STRATA_VERT_BEGIN = /* glsl */ `
vPlacePos = position;
vPlaceNorm = normal;
`;

/** World-space position, normal and top-height for seamless cutaway strata. */
export const STRATA_VERT_WORLD = /* glsl */ `
vec4 plStrataWorld = modelMatrix * vec4(transformed, 1.0);
vVolFogWPos = plStrataWorld.xyz;
vPlacePos = plStrataWorld.xyz;
vPlaceNorm = normalize(mat3(modelMatrix) * objectNormal);
vTopY = aTopY + modelMatrix[3].y;
`;

export const STRATA_FRAG_COMMON = /* glsl */ `
varying vec3 vPlacePos;
varying vec3 vPlaceNorm;
varying float vTopY;
varying vec3 vVolFogWPos;
uniform float uRN;
uniform float uWT;
${SEASON_UNIFORMS_GLSL}
${SEASON_MORPH_GLSL}
${NOISE_GLSL}
`;

/**
 * Geological cutaway: topsoil -> terracotta clay -> sandstone -> bedrock,
 * warped by 2D/3D noise in world space so all four walls meet organically.
 */
export const STRATA_COLOR_FRAGMENT = /* glsl */ `
#include <color_fragment>
{
  float verticalFace = 1.0 - abs(vPlaceNorm.y);
  float atSliceEdge = step(1.42, max(abs(vPlacePos.x), abs(vPlacePos.z)));
  float isCutWall = smoothstep(0.45, 0.82, verticalFace) * atSliceEdge;

  if (isCutWall > 0.5) {
    float baseY = -0.55;
    float span = max(0.5, vTopY - baseY);
    float depthBelow = max(0.0, vTopY - vPlacePos.y);
    float layerT = clamp(depthBelow / span, 0.0, 1.0);
    float horizCoord = abs(vPlaceNorm.x) > abs(vPlaceNorm.z) ? vPlacePos.z : vPlacePos.x;

    // Organic band warp: 2D along the exposed face + 3D for corner continuity.
    float warp = (clFbm2(vec2(horizCoord * 1.4, vPlacePos.y * 1.6)) - 0.5) * 0.22
               + (clFbm3(vec3(vPlacePos.xz * 0.5, vPlacePos.y * 0.7)) - 0.5) * 0.12;
    float layer = clamp(layerT + warp, 0.0, 1.0);

    // Reference-inspired geological sequence: dark humus -> pale beach sand ->
    // terracotta iron clay -> golden ochre -> cream sandstone -> blue shale ->
    // dark bedrock, with the per-landmark palette still tinting each band.
    vec3 cHumus = mix(diffuseColor.rgb, vec3(0.22, 0.15, 0.09), 0.66);
    vec3 cSand = mix(diffuseColor.rgb, vec3(0.92, 0.84, 0.65), 0.56);
    // Muted for real daylight: the old clay read as vivid rust once the sun
    // was actually up, so it is shifted toward dry terracotta.
    vec3 cClay = mix(diffuseColor.rgb, vec3(0.55, 0.34, 0.24), 0.52);
    vec3 cOchre = mix(diffuseColor.rgb, vec3(0.76, 0.63, 0.45), 0.50);
    vec3 cSandstone = mix(diffuseColor.rgb, vec3(0.89, 0.80, 0.62), 0.56);
    vec3 cShale = mix(diffuseColor.rgb, vec3(0.35, 0.35, 0.34), 0.56);
    vec3 cBedrock = mix(diffuseColor.rgb, vec3(0.16, 0.17, 0.19), 0.64);

    vec3 strataCol = cHumus;
    strataCol = mix(strataCol, cSand, smoothstep(0.030, 0.070, layer));
    strataCol = mix(strataCol, cClay, smoothstep(0.100, 0.170, layer));
    strataCol = mix(strataCol, cOchre, smoothstep(0.265, 0.330, layer));
    strataCol = mix(strataCol, cSandstone, smoothstep(0.400, 0.470, layer));
    strataCol = mix(strataCol, cShale, smoothstep(0.630, 0.700, layer));
    strataCol = mix(strataCol, cBedrock, smoothstep(0.840, 0.920, layer));

    // Thin chalk, iron-oxide and manganese seams split the broad bands.
    float chalk = 1.0 - smoothstep(0.0, 0.026, abs(layer - 0.30));
    float ironSeam = 1.0 - smoothstep(0.0, 0.020, abs(layer - 0.52));
    float manganese = 1.0 - smoothstep(0.0, 0.024, abs(layer - 0.745));
    strataCol = mix(strataCol, vec3(0.96, 0.92, 0.80), chalk * 0.46);
    strataCol = mix(strataCol, cClay * 1.02, ironSeam * 0.24);
    strataCol = mix(strataCol, vec3(0.21, 0.20, 0.21), manganese * 0.40);

    // Fine laminated bedding planes, warped so they read as real sediment.
    float lamination = 0.5 + 0.5 * sin(
      layer * 148.0 + horizCoord * 2.4
      + clNoise2(vec2(horizCoord * 2.6, vPlacePos.y * 3.4)) * 3.4
    );
    strataCol *= 0.93 + 0.12 * lamination;

    // Rain-washed erosion gullies streak vertically down the exposed face.
    float gully = smoothstep(0.62, 0.96, clNoise2(vec2(horizCoord * 5.2, vPlacePos.y * 0.55 + 3.0)))
                * smoothstep(0.06, 0.45, layer);
    strataCol *= 1.0 - gully * 0.16;

    // Soft bedding-plane shadow where each stratum meets the next.
    float contact = (1.0 - smoothstep(0.0, 0.018, abs(layer - 0.09)))
                  + (1.0 - smoothstep(0.0, 0.018, abs(layer - 0.175)))
                  + (1.0 - smoothstep(0.0, 0.018, abs(layer - 0.30)))
                  + (1.0 - smoothstep(0.0, 0.018, abs(layer - 0.44)))
                  + (1.0 - smoothstep(0.0, 0.018, abs(layer - 0.66)))
                  + (1.0 - smoothstep(0.0, 0.018, abs(layer - 0.87)));
    strataCol *= 1.0 - clamp(contact, 0.0, 1.0) * 0.17;

    // Quartz glints, grit and embedded pebble pockets.
    float quartz = smoothstep(0.91, 0.99, 0.5 + 0.5 * sin(
      layer * 90.0 + clNoise2(vec2(horizCoord * 3.0, vPlacePos.y * 2.5)) * 3.4
    ));
    strataCol = mix(strataCol, mix(diffuseColor.rgb, vec3(0.82, 0.78, 0.68), 0.7), quartz * 0.22);

    float grit = clNoise2(vec2(horizCoord * 64.0, vPlacePos.y * 74.0));
    strataCol *= 0.95 + grit * 0.10;

    float pebbles = smoothstep(0.66, 0.90, clNoise2(vec2(horizCoord * 16.0, vPlacePos.y * 20.0)));
    float pebbleLight = smoothstep(0.68, 0.94, clNoise2(vec2(horizCoord * 13.0 + 7.3, vPlacePos.y * 17.0 - 2.1)));
    strataCol = mix(strataCol, strataCol * 0.62, pebbles * 0.34);
    strataCol = mix(strataCol, strataCol * 1.22, pebbleLight * 0.22);

    // Deep vertical cleavage fissures in the rock.
    float fissure = smoothstep(0.90, 0.995, clNoise2(
      vec2(horizCoord * 6.4 + vPlacePos.y * 1.4, vPlacePos.y * 2.5)
    ));
    strataCol *= 1.0 - fissure * 0.34;

    // Thin dark humus and root overhang directly under the grass rim.
    float humusBand = 1.0 - smoothstep(0.010, 0.055, depthBelow);
    strataCol = mix(strataCol, diffuseColor.rgb * vec3(0.24, 0.20, 0.15), humusBand * 0.92);

    // Ground contact shadow, with a cool reflected tint at the block base.
    float baseAO = smoothstep(-0.05, 0.60, vPlacePos.y);
    strataCol *= 0.74 + 0.26 * baseAO;
    strataCol = mix(strataCol, strataCol * vec3(0.84, 0.88, 0.98),
      (1.0 - smoothstep(0.0, 0.55, vPlacePos.y)) * 0.32);
    diffuseColor.rgb = strataCol;
  } else {
    // Terrain surface micro-relief: leaf litter, grass mottling, pebbles, sand.
    float broad = clFbm2(vPlacePos.xz * 3.8);
    float fine = clNoise2(vPlacePos.xz * 18.5);
    float micro = clNoise2(vPlacePos.xz * 44.0);
    float sprinkle = clNoise2(vPlacePos.xz * 92.0);
    float slopeHint = clamp(1.0 - vPlaceNorm.y, 0.0, 1.0);

    diffuseColor.rgb *= 0.87 + 0.22 * broad + (fine - 0.5) * 0.10 + (micro - 0.5) * 0.05;
    // Sandy pale patches and darker damp soil mottle the ground plane.
    float sandPatches = smoothstep(0.62, 0.86, clFbm2(vPlacePos.xz * 5.1 + 4.0));
    diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * vec3(1.16, 1.10, 0.90), sandPatches * 0.34);
    diffuseColor.rgb *= 1.0 - slopeHint * 0.18 * (1.0 - fine);
    diffuseColor.rgb *= 1.0 - (sprinkle - 0.5) * 0.06;
    diffuseColor.rgb *= 1.0 - uRN * 0.14;
    // Seasonally morph the living ground cover (lush summer / dormant winter)
    // while the exposed geological strata above stay unchanged.
    diffuseColor.rgb = clSeasonMorph(diffuseColor.rgb, 0.7);
  }
}
`;

export const STRATA_ROUGHNESS_FRAGMENT = /* glsl */ `
#include <roughnessmap_fragment>
{
  float verticalFace = 1.0 - abs(vPlaceNorm.y);
  float atSliceEdge = step(1.42, max(abs(vPlacePos.x), abs(vPlacePos.z)));
  float isCutWall = smoothstep(0.45, 0.82, verticalFace) * atSliceEdge;

  if (isCutWall > 0.5) {
    roughnessFactor = mix(roughnessFactor, 0.94, 0.55);
  } else {
    float puddle = smoothstep(0.46, 0.72, clNoise2(vPlacePos.xz * 3.2))
                 * smoothstep(0.85, 0.98, vPlaceNorm.y);
    roughnessFactor = mix(roughnessFactor, 0.20, uRN * (0.45 + 0.55 * puddle));
  }
}
`;
