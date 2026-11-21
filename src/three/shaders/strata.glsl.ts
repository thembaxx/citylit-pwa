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

    // Bright geological sequence: humus -> iron-rich clay -> cream sandstone
    // -> shale -> bedrock, with the per-landmark palette still showing through.
    vec3 cTopsoil = mix(diffuseColor.rgb, vec3(0.24, 0.16, 0.10), 0.62);
    vec3 cClay = mix(diffuseColor.rgb, vec3(0.62, 0.19, 0.075), 0.62);
    vec3 cSandstone = mix(diffuseColor.rgb, vec3(0.86, 0.76, 0.58), 0.62);
    vec3 cShale = mix(diffuseColor.rgb, vec3(0.32, 0.31, 0.30), 0.58);
    vec3 cBedrock = mix(diffuseColor.rgb, vec3(0.17, 0.18, 0.19), 0.60);

    vec3 strataCol = cTopsoil;
    strataCol = mix(strataCol, cClay, smoothstep(0.07, 0.15, layer));
    strataCol = mix(strataCol, cSandstone, smoothstep(0.31, 0.40, layer));
    strataCol = mix(strataCol, cShale, smoothstep(0.62, 0.70, layer));
    strataCol = mix(strataCol, cBedrock, smoothstep(0.84, 0.91, layer));

    // Thin chalk and iron seams break the broad bands into readable strata.
    float chalk = 1.0 - smoothstep(0.0, 0.030, abs(layer - 0.28));
    float ironSeam = 1.0 - smoothstep(0.0, 0.022, abs(layer - 0.55));
    strataCol = mix(strataCol, vec3(0.92, 0.88, 0.78), chalk * 0.42);
    strataCol = mix(strataCol, cClay * 1.05, ironSeam * 0.38);

    // Fine laminated sedimentary lines + mineral seams running through the section.
    float lamination = 0.5 + 0.5 * sin(
      layer * 132.0 + horizCoord * 2.2
      + clNoise2(vec2(horizCoord * 2.6, vPlacePos.y * 3.4)) * 3.0
    );
    strataCol *= 0.94 + 0.11 * lamination;

    // Soft bedding-plane shadow at each geological contact.
    float contact = (1.0 - smoothstep(0.0, 0.02, abs(layer - 0.155)))
                  + (1.0 - smoothstep(0.0, 0.02, abs(layer - 0.38)))
                  + (1.0 - smoothstep(0.0, 0.02, abs(layer - 0.67)))
                  + (1.0 - smoothstep(0.0, 0.02, abs(layer - 0.875)));
    strataCol *= 1.0 - clamp(contact, 0.0, 1.0) * 0.16;

    float quartz = smoothstep(0.90, 0.99, 0.5 + 0.5 * sin(
      layer * 88.0 + clNoise2(vec2(horizCoord * 3.0, vPlacePos.y * 2.5)) * 3.4
    ));
    strataCol = mix(strataCol, mix(diffuseColor.rgb, vec3(0.78, 0.74, 0.64), 0.7), quartz * 0.22);

    float pebbles = smoothstep(0.68, 0.92, clNoise2(vec2(horizCoord * 18.0, vPlacePos.y * 22.0)));
    float pebbleLight = smoothstep(0.70, 0.95, clNoise2(vec2(horizCoord * 15.0 + 7.3, vPlacePos.y * 19.0 - 2.1)));
    strataCol = mix(strataCol, strataCol * 0.68, pebbles * 0.30);
    strataCol = mix(strataCol, strataCol * 1.18, pebbleLight * 0.20);

    float fissure = smoothstep(0.90, 0.995, clNoise2(
      vec2(horizCoord * 6.4 + vPlacePos.y * 1.4, vPlacePos.y * 2.5)
    ));
    strataCol *= 1.0 - fissure * 0.30;

    // Rich dark humus/root overhang directly under the grass rim.
    float humusBand = 1.0 - smoothstep(0.012, 0.075, depthBelow);
    strataCol = mix(strataCol, diffuseColor.rgb * vec3(0.26, 0.22, 0.17), humusBand * 0.9);

    // Soft contact occlusion toward the base of the diorama block.
    float baseAO = smoothstep(-0.05, 0.55, vPlacePos.y);
    strataCol *= 0.78 + 0.22 * baseAO;
    diffuseColor.rgb = strataCol;
  } else {
    // Terrain surface micro-relief: grass tufts, pebbles, damp soil.
    float broad = clFbm2(vPlacePos.xz * 3.8);
    float fine = clNoise2(vPlacePos.xz * 18.5);
    float micro = clNoise2(vPlacePos.xz * 44.0);
    float slopeHint = clamp(1.0 - vPlaceNorm.y, 0.0, 1.0);

    diffuseColor.rgb *= 0.88 + 0.20 * broad + (fine - 0.5) * 0.09 + (micro - 0.5) * 0.04;
    diffuseColor.rgb *= 1.0 - slopeHint * 0.16 * (1.0 - fine);
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
