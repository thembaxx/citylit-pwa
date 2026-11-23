import * as THREE from 'three';

type WebGPUModule = typeof import('three/webgpu');
type TSLModule = typeof import('three/tsl');

interface UniformLink {
  source: { value: unknown };
  node: { value: unknown };
}

export interface WebGPUCompat {
  /** Convert GLSL-only materials on `root` into node materials three's WebGPU renderer can draw. */
  adaptScene(root: THREE.Object3D): void;
  /** Push animated uniform values into the node uniforms created by adaptScene. */
  syncUniforms(): void;
  dispose(): void;
}

const COLOR_UNIFORMS = ['uCol', 'uColor', 'color', 'uTint', 'uBase', 'top', 'uZenith', 'diffuse'];
const ALPHA_UNIFORMS = ['uAlpha', 'uOpacity', 'opacity'];
const INTENSITY_UNIFORMS = ['uLit', 'uIntensity', 'uGlow'];
const UV_MAP_KEYS = [
  'map',
  'alphaMap',
  'aoMap',
  'bumpMap',
  'normalMap',
  'displacementMap',
  'emissiveMap',
  'lightMap',
  'roughnessMap',
  'metalnessMap',
];

/**
 * WebGPU cannot compile GLSL ShaderMaterial or onBeforeCompile patches. This
 * adapter keeps the WebGL stack untouched and provides a deliberately simple
 * node-material stand-in for the WebGPU path: base colour, opacity and blend
 * state survive, while hand-written GLSL effects (fog, DoF, AO, glow shapes)
 * are approximated. Full visual parity requires porting those shaders to TSL.
 */
export function createWebGPUCompat(webgpu: WebGPUModule, tsl: TSLModule): WebGPUCompat {
  const converted = new WeakMap<THREE.Material, THREE.Material>();
  const replacements = new Set<THREE.Material>();
  const uvPatched = new WeakSet<THREE.BufferGeometry>();
  const links: UniformLink[] = [];

  function findColorUniform(src: THREE.ShaderMaterial): { value: unknown } | null {
    for (const key of COLOR_UNIFORMS) {
      const uniform = src.uniforms[key];
      if (uniform && uniform.value instanceof THREE.Color) return uniform;
    }
    return null;
  }

  function findAlphaUniform(src: THREE.ShaderMaterial): { value: unknown } | null {
    for (const key of ALPHA_UNIFORMS) {
      const uniform = src.uniforms[key];
      if (uniform && typeof uniform.value === 'number') return uniform;
    }
    return null;
  }

  function findIntensityUniform(src: THREE.ShaderMaterial): { value: unknown } | null {
    for (const key of INTENSITY_UNIFORMS) {
      const uniform = src.uniforms[key];
      if (uniform && typeof uniform.value === 'number') return uniform;
    }
    return null;
  }

  /** TSL versions of the two sky domes (procedural PMREM env and live weather sky). */
  function trySkyMaterial(src: THREE.ShaderMaterial): THREE.Material | null {
    const u = src.uniforms;
    const envSky = u.uZenith && u.uHorizon && u.uGround && u.uSunGlow && u.uSunDir && u.uSunStrength;
    const weatherSky = u.top && u.bot && u.sunDir;
    if (!envSky && !weatherSky) return null;

    const toColorNode = (uniform: { value: unknown } | undefined, fallback: string) => {
      const value = uniform?.value instanceof THREE.Color ? uniform.value : new THREE.Color(fallback);
      const node = tsl.uniform(value.clone());
      if (uniform) links.push({ source: uniform, node });
      return node;
    };
    const zenith = toColorNode(envSky ? u.uZenith : u.top, '#27476e');
    const horizon = toColorNode(envSky ? u.uHorizon : u.bot, '#0c0e16');
    const ground = toColorNode(envSky ? u.uGround : u.bot, '#3a2d20');
    const glowColor = toColorNode(envSky ? u.uSunGlow : u.uSiteHor, '#ffd394');
    const sunUniform = envSky ? u.uSunDir : u.sunDir;
    const sunValue = sunUniform?.value instanceof THREE.Vector3 ? sunUniform.value : new THREE.Vector3(0.5, 0.8, 0.3);
    const sunDir = tsl.uniform(sunValue.clone());
    if (sunUniform) links.push({ source: sunUniform, node: sunDir });
    const strengthUniform = envSky ? u.uSunStrength : undefined;
    const strength = tsl.uniform(strengthUniform && typeof strengthUniform.value === 'number' ? strengthUniform.value : 1);
    if (strengthUniform) links.push({ source: strengthUniform, node: strength });

    const dir = tsl.normalize(tsl.positionLocal);
    const up = dir.y;
    const upper = tsl.mix(horizon, zenith, tsl.pow(tsl.max(up, 0), 0.58));
    const lower = tsl.mix(horizon, ground, tsl.pow(tsl.max(up.mul(-1), 0), 0.5));
    const base = tsl.mix(lower, upper, tsl.smoothstep(-0.01, 0.01, up));
    const mu = tsl.max(tsl.dot(dir, sunDir), 0);
    const glow = glowColor.mul(
      tsl.pow(mu, 18).mul(1.15).add(tsl.pow(mu, 4).mul(0.24))
    ).mul(strength);

    const material = new webgpu.MeshBasicNodeMaterial();
    material.colorNode = base.add(glow);
    material.side = src.side;
    material.depthWrite = src.depthWrite;
    material.depthTest = src.depthTest;
    material.toneMapped = src.toneMapped;
    return material;
  }

  function uniformColor(
    uniform: { value: unknown } | undefined,
    fallback: string
  ) {
    const value = uniform?.value instanceof THREE.Color ? uniform.value : new THREE.Color(fallback);
    const node = tsl.uniform(value.clone());
    if (uniform) links.push({ source: uniform, node });
    return node;
  }

  function uniformNumber(
    uniform: { value: unknown } | undefined,
    fallback: number
  ) {
    const value = typeof uniform?.value === 'number' ? uniform.value : fallback;
    const node = tsl.uniform(value);
    if (uniform) links.push({ source: uniform, node });
    return node;
  }

  /** Volumetric-looking far ridges: the vertex profile is the important part. */
  function tryHorizonRing(src: THREE.ShaderMaterial): THREE.Material | null {
    const u = src.uniforms;
    if (!u.uBaseCol || !u.uHorizonCol || !u.uWeights || !u.uAlpha) return null;

    const base = uniformColor(u.uBaseCol, '#2d3c4e');
    const horizon = uniformColor(u.uHorizonCol, '#7fa3c4');
    const glow = uniformColor(u.uGlowCol, '#ff9d5c');
    const weightsValue = u.uWeights.value instanceof THREE.Vector4 ? u.uWeights.value : new THREE.Vector4(1, 0, 0, 0);
    const weights = tsl.uniform(weightsValue.clone());
    links.push({ source: u.uWeights, node: weights });
    const seed = uniformNumber(u.uSeed, 0);
    const alpha = uniformNumber(u.uAlpha, 0.4);
    const golden = uniformNumber(u.uHor, 0);
    const night = uniformNumber(u.uNight, 0);

    const local = tsl.positionLocal;
    const ang = tsl.atan(local.z, local.x);
    const topMask = tsl.smoothstep(-1.3, 0.2, local.y);
    const ridge = (freq: number, phase: number) =>
      tsl.sin(ang.mul(freq).add(seed.mul(phase))).mul(0.5).add(0.5);
    const mountain = ridge(3, 1).mul(0.52).add(ridge(7, -1.4).mul(0.3)).add(ridge(13, 2.1).mul(0.18));
    const dune = tsl.pow(ridge(2, 0.7), 1.4).mul(0.52).add(ridge(5, -0.9).mul(0.18));
    const coast = tsl
      .pow(tsl.max(tsl.sin(ang.mul(2).add(seed.mul(1.7))), 0), 6)
      .mul(0.58)
      .add(0.08);
    const block = tsl.fract(
      tsl.sin(tsl.floor(ang.add(3.14159).div(0.16)).add(seed.mul(11))).mul(43758.5453)
    );
    const urban = tsl.step(0.42, block).mul(block.mul(0.48).add(0.24));
    const profile = mountain
      .mul(weights.x)
      .add(dune.mul(weights.y))
      .add(coast.mul(weights.z))
      .add(urban.mul(weights.w));
    const lift = tsl.add(0.35, profile.mul(4.6)).mul(topMask);
    const displacedY = tsl.mix(-1.4, tsl.add(-1.4, lift), topMask);
    const displaced = tsl.vec3(local.x, displacedY, local.z);

    const worldY = tsl.positionWorld.y;
    const heightMix = tsl.smoothstep(-1.4, 0.7, worldY);
    const color = tsl
      .mix(base, horizon, heightMix.mul(0.65).add(0.2))
      .add(glow.mul(golden).mul(0.18))
      .add(tsl.vec3(0.12, 0.18, 0.3).mul(night).mul(heightMix).mul(0.18));
    const opacity = alpha
      .mul(tsl.smoothstep(-1.45, -0.35, worldY))
      .mul(tsl.float(1).sub(tsl.smoothstep(0.35, 1.1, worldY)));

    const material = new webgpu.MeshBasicNodeMaterial();
    material.positionNode = displaced;
    material.colorNode = color;
    material.opacityNode = opacity;
    material.transparent = src.transparent;
    material.depthWrite = src.depthWrite;
    material.side = src.side;
    material.toneMapped = src.toneMapped;
    return material;
  }

  /** Stage ground catcher: radial fade plus moonlit/golden ripple sheen. */
  function tryGroundSheen(src: THREE.ShaderMaterial): THREE.Material | null {
    const u = src.uniforms;
    if (!u.uGroundCol || !u.uOpacity || !u.uGlowCol) return null;
    const ground = uniformColor(u.uGroundCol, '#0e131d');
    const glow = uniformColor(u.uGlowCol, '#ff9d5c');
    const opacity = uniformNumber(u.uOpacity, 0.4);
    const night = uniformNumber(u.uNight, 0);
    const golden = uniformNumber(u.uHor, 0);
    const rain = uniformNumber(u.uRain, 0);
    const coastal = uniformNumber(u.uCoastal, 0);
    const time = uniformNumber(u.uTime, 0);

    const r = tsl.uv().sub(0.5).mul(2).length();
    const inside = tsl.float(1).sub(tsl.step(1, r));
    const radial = tsl.pow(tsl.max(tsl.float(1).sub(r), 0), 1.65);
    const waterMix = tsl.max(coastal, rain.mul(0.75));
    const dir = tsl.normalize(tsl.positionWorld.xz.add(0.0001));
    const trackAlign = tsl.pow(tsl.max(tsl.dot(dir, tsl.vec2(-0.52, -0.85)), 0), 4);
    const ripple = tsl.sin(
      tsl.positionWorld.x.mul(2.4).add(tsl.positionWorld.z.mul(3.1)).sub(time.mul(1.4))
    ).mul(0.5).add(0.5);
    const rippleFine = tsl.cos(
      tsl.positionWorld.x.mul(5.1).sub(tsl.positionWorld.z.mul(4.4)).add(time.mul(1.9))
    ).mul(0.5).add(0.5);
    const sheen = trackAlign
      .mul(ripple.mul(0.6).add(rippleFine.mul(0.4)))
      .mul(tsl.smoothstep(0.34, 0.56, r))
      .mul(tsl.float(1).sub(r));
    const sheenColor = tsl.mix(
      tsl.vec3(0.68, 0.84, 1),
      glow,
      golden.mul(tsl.float(1).sub(night.mul(0.6)))
    );
    const sheenAmount = sheen
      .mul(waterMix)
      .mul(night.mul(0.28).add(golden.mul(0.36)).add(rain.mul(0.18)));

    const material = new webgpu.MeshBasicNodeMaterial();
    material.colorNode = ground.rgb.add(sheenColor.mul(sheenAmount).mul(1.4));
    material.opacityNode = tsl.clamp(
      radial.mul(opacity).add(sheenAmount.mul(0.35)).mul(inside),
      0,
      0.88
    );
    material.transparent = src.transparent;
    material.depthWrite = src.depthWrite;
    material.side = src.side;
    material.toneMapped = src.toneMapped;
    return material;
  }

  /** Simplified TSL water: depth-tinted shallow/deep blend + Fresnel + gentle waves. */
  function tryWaterMaterial(src: THREE.ShaderMaterial): THREE.Material | null {
    const u = src.uniforms;
    if (!u.uShallow || !u.uDeep || !u.uTime) return null;
    const shallow = uniformColor(u.uShallow, '#7fc6d6');
    const deep = uniformColor(u.uDeep, '#123a52');
    const time = uniformNumber(u.uTime, 0);
    const wind = u.uWind ? uniformNumber(u.uWind, 0) : null;
    const minAlpha = u.uMinAlpha ? uniformNumber(u.uMinAlpha, 0.32) : null;
    const sun = u.uSun ? uniformNumber(u.uSun, 0) : null;

    const local = tsl.positionLocal;
    const displaced = wind
      ? tsl.vec3(
          local.x,
          local.y.add(tsl.sin(local.x.mul(2).add(time.mul(1.3))).mul(wind).mul(0.02)),
          local.z
        )
      : local;
    const facing = tsl.abs(tsl.dot(tsl.normalView, tsl.positionViewDirection));
    const fresnel = tsl.pow(tsl.float(1).sub(facing), 3);
    const base = tsl.mix(deep.rgb, shallow.rgb, fresnel.mul(0.7).add(0.2));
    const color = sun ? base.add(shallow.rgb.mul(sun).mul(fresnel).mul(0.15)) : base;
    const opacity = (minAlpha ?? tsl.float(0.32)).add(fresnel.mul(0.35));

    const material = new webgpu.MeshBasicNodeMaterial();
    if (wind) material.positionNode = displaced;
    material.colorNode = color;
    material.opacityNode = opacity;
    material.transparent = src.transparent;
    material.depthWrite = src.depthWrite;
    material.side = src.side;
    material.toneMapped = src.toneMapped;
    return material;
  }

  /** Animated rain/snow points: the GLSL vertex fall and drift, in TSL. */
  function tryWeatherParticles(
    src: THREE.ShaderMaterial,
    isPoints: boolean
  ): THREE.Material | null {
    const u = src.uniforms;
    if (!isPoints || !u.uTime || !u.uWind || !u.uOpacity || !u.uColor) return null;
    const isRain = src.vertexShader.includes('vec4 aSeed');

    const time = uniformNumber(u.uTime, 0);
    const wind = uniformNumber(u.uWind, 0);
    const opacity = uniformNumber(u.uOpacity, 0);
    const color = uniformColor(u.uColor, '#f2f6ff');

    const seed4 = isRain ? tsl.attribute('aSeed', 'vec4') : null;
    const seed3 = isRain ? null : tsl.attribute('aSeed', 'vec3');
    let position;
    let fade;
    if (seed4) {
      const fall = tsl.mod(seed4.y.sub(time.mul(19)), 18);
      const driftX = tsl.mod(seed4.x.add(time.mul(wind).mul(1.4)).add(14), 28).sub(14);
      position = tsl.vec3(driftX, fall.sub(seed4.w.mul(0.65)), seed4.z);
      fade = tsl
        .smoothstep(0, 1.5, fall)
        .mul(tsl.float(1).sub(tsl.smoothstep(15.5, 18, fall)));
    } else if (seed3) {
      const fall = tsl.mod(seed3.y.sub(time.mul(2.2)), 20);
      const drift = tsl.sin(time.mul(0.45).add(seed3.z.mul(0.7))).mul(0.8).add(wind.mul(0.14));
      position = tsl.vec3(seed3.x.add(drift), fall, seed3.z);
      fade = tsl.smoothstep(0, 1, fall).mul(tsl.float(1).sub(tsl.smoothstep(17, 20, fall)));
    } else {
      return null;
    }

    const material = new webgpu.PointsNodeMaterial();
    material.positionNode = position;
    material.colorNode = color;
    material.opacityNode = opacity.mul(fade);
    material.transparent = src.transparent;
    material.depthWrite = src.depthWrite;
    material.blending = src.blending;
    material.toneMapped = src.toneMapped;
    return material;
  }

  function convert(material: THREE.Material, isPoints: boolean): THREE.Material {
    const cached = converted.get(material);
    if (cached) return cached;

    if (!(material instanceof THREE.ShaderMaterial)) {
      converted.set(material, material);
      return material;
    }

    const src = material as THREE.ShaderMaterial;
    const sky = trySkyMaterial(src);
    if (sky) {
      converted.set(material, sky);
      replacements.add(sky);
      return sky;
    }
    const ridge = tryHorizonRing(src);
    if (ridge) {
      converted.set(material, ridge);
      replacements.add(ridge);
      return ridge;
    }
    const ground = tryGroundSheen(src);
    if (ground) {
      converted.set(material, ground);
      replacements.add(ground);
      return ground;
    }
    const particles = tryWeatherParticles(src, isPoints);
    if (particles) {
      converted.set(material, particles);
      replacements.add(particles);
      return particles;
    }
    const water = tryWaterMaterial(src);
    if (water) {
      converted.set(material, water);
      replacements.add(water);
      return water;
    }
    const baseColor = findColorUniform(src);
    const alpha = findAlphaUniform(src);
    const intensity = findIntensityUniform(src);
    const baseNode = tsl.uniform(new THREE.Color((baseColor?.value as THREE.Color) ?? '#ffffff'));
    if (baseColor) links.push({ source: baseColor, node: baseNode });
    const intensityNode = intensity ? tsl.uniform(intensity.value as number) : null;
    if (intensity && intensityNode) links.push({ source: intensity, node: intensityNode });
    const colorNode = intensityNode ? baseNode.mul(intensityNode) : baseNode;

    const replacement = isPoints ? new webgpu.PointsNodeMaterial() : new webgpu.MeshBasicNodeMaterial();
    replacement.colorNode = colorNode;
    if (alpha) {
      const opacityNode = tsl.uniform(alpha.value as number);
      replacement.opacityNode = opacityNode;
      links.push({ source: alpha, node: opacityNode });
    }
    replacement.transparent = src.transparent;
    // Additive GLSL glows fade via shader math; without their alpha expression
    // a plain node quad would be a harsh full-strength block.
    const additive = src.blending === THREE.AdditiveBlending;
    replacement.opacity = alpha || !additive ? src.opacity : Math.min(src.opacity, 0.18);
    if (additive && !alpha) {
      // GLSL glows fade with distance from the sprite centre. Reproduce that
      // shape with a radial alpha falloff so additive quads do not read as
      // flat rectangular blocks.
      const radial = tsl
        .pow(tsl.max(tsl.float(1).sub(tsl.uv().sub(0.5).mul(2).length()), 0), 1.5)
        .mul(replacement.opacity);
      replacement.opacityNode = radial;
    }
    replacement.blending = src.blending;
    replacement.side = src.side;
    replacement.depthWrite = src.depthWrite;
    replacement.depthTest = src.depthTest;
    replacement.depthFunc = src.depthFunc;
    replacement.toneMapped = src.toneMapped;
    replacement.vertexColors = src.vertexColors;

    converted.set(material, replacement);
    replacements.add(replacement);
    return replacement;
  }

  return {
    adaptScene(root) {
      root.traverse((object) => {
        const candidate = object as THREE.Mesh;
        if (!candidate.material) return;
        const isPoints = object instanceof THREE.Points;
        const materials = Array.isArray(candidate.material)
          ? candidate.material
          : [candidate.material];

        // WebGL silently substitutes (0,0) when a texture needs uv but the
        // geometry has none. three's node path warns instead, so supply a
        // neutral attribute: centre for point sprites, origin elsewhere.
        const geometry = candidate.geometry;
        if (geometry && !geometry.getAttribute('uv') && !uvPatched.has(geometry)) {
          const needsUv = materials.some((mat) =>
            UV_MAP_KEYS.some((key) => (mat as unknown as Record<string, unknown>)[key])
          );
          if (needsUv) {
            uvPatched.add(geometry);
            const count = geometry.getAttribute('position')?.count ?? 0;
            if (count > 0) {
              const data = new Float32Array(count * 2).fill(0.5);
              geometry.setAttribute('uv', new THREE.BufferAttribute(data, 2));
            }
          }
        }

        if (Array.isArray(candidate.material)) {
          candidate.material = candidate.material.map((mat) => convert(mat, isPoints));
        } else {
          candidate.material = convert(candidate.material, isPoints);
        }
      });
    },
    syncUniforms() {
      for (const link of links) {
        const sourceValue = link.source.value;
        if (sourceValue instanceof THREE.Vector4) {
          if (link.node.value instanceof THREE.Vector4) link.node.value.copy(sourceValue);
          else link.node.value = sourceValue.clone();
        } else if (sourceValue instanceof THREE.Vector3) {
          if (link.node.value instanceof THREE.Vector3) link.node.value.copy(sourceValue);
          else link.node.value = sourceValue.clone();
        } else if (sourceValue instanceof THREE.Color) {
          if (link.node.value instanceof THREE.Color) link.node.value.copy(sourceValue);
          else link.node.value = sourceValue.clone();
        } else if (typeof sourceValue === 'number') {
          link.node.value = sourceValue;
        }
      }
    },
    dispose() {
      for (const material of replacements) material.dispose();
      replacements.clear();
    },
  };
}
