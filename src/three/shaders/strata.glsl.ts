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
    float warp = (clFbm2(vec2(horizCoord * 1.4, vPlacePos.y * 1.6)) - 0.5) * 0.14
               + (clFbm3(vec3(vPlacePos.xz * 0.5, vPlacePos.y * 0.7)) - 0.5) * 0.08;
    float layer = clamp(layerT + warp, 0.0, 1.0);

    // Geological sequence: humus -> terracotta clay -> sandstone -> shale -> bedrock.
    vec3 cTopsoil = mix(diffuseColor.rgb, vec3(0.15, 0.10, 0.062), 0.78);
    vec3 cClay = mix(diffuseColor.rgb, vec3(0.52, 0.215, 0.095), 0.74);
    vec3 cSandstone = mix(diffuseColor.rgb, vec3(0.66, 0.49, 0.29), 0.72);
    vec3 cShale = mix(diffuseColor.rgb, vec3(0.20, 0.195, 0.185), 0.72);
    vec3 cBedrock = mix(diffuseColor.rgb, vec3(0.115, 0.125, 0.145), 0.78);

    vec3 strataCol = cTopsoil;
    strataCol = mix(strataCol, cClay, smoothstep(0.075, 0.155, layer));
    strataCol = mix(strataCol, cSandstone, smoothstep(0.34, 0.42, layer));
    strataCol = mix(strataCol, cShale, smoothstep(0.64, 0.70, layer));
    strataCol = mix(strataCol, cBedrock, smoothstep(0.845, 0.905, layer));

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

    float pebbles = smoothstep(0.72, 0.94, clNoise2(vec2(horizCoord * 18.0, vPlacePos.y * 22.0)));
    strataCol = mix(strataCol, strataCol * 0.74, pebbles * 0.26);

    float fissure = smoothstep(0.90, 0.995, clNoise2(
      vec2(horizCoord * 6.4 + vPlacePos.y * 1.4, vPlacePos.y * 2.5)
    ));
    strataCol *= 1.0 - fissure * 0.30;

    // Rich dark humus/root overhang directly under the grass rim.
    float humusBand = 1.0 - smoothstep(0.012, 0.075, depthBelow);
    strataCol = mix(strataCol, diffuseColor.rgb * vec3(0.26, 0.22, 0.17), humusBand * 0.9);

    // Soft contact occlusion toward the base of the diorama block.
    float baseAO = smoothstep(-0.05, 0.55, vPlacePos.y);
    strataCol *= 0.64 + 0.36 * baseAO;
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
