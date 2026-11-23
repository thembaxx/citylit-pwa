import * as THREE from 'three';
import { FullScreenQuad } from 'three/examples/jsm/postprocessing/Pass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { GRADE_GUARDRAILS } from '../lib/albedoAudit.ts';

export interface MiniatureTuning {
  focusY: number;
  focusRange: number;
  blur: number;
  vignette: number;
  aperture: number;
}

const fallbackDepth = new THREE.DataTexture(new Uint8Array([255, 255, 255, 255]), 1, 1);
fallbackDepth.needsUpdate = true;

const MiniatureShader = {
  uniforms: {
    tDiffuse: { value: null },
    /** Half-resolution blurred beauty; .a carries the per-pixel blur amount. */
    tBlur: { value: null },
    tDepth: { value: fallbackDepth as THREE.Texture },
    uResolution: { value: new THREE.Vector2(1280, 720) },
    uFocusY: { value: 0.49 },
    uFocusRange: { value: 0.2 },
    uMaxBlur: { value: 1.7 },
    uVignette: { value: 0.2 },
    uAperture: { value: 1.0 },
    uUseDepth: { value: 0 },
    uNear: { value: 0.2 },
    uFar: { value: 200 },
    uFocusDistance: { value: 9.0 },
    uDepthRange: { value: 2.0 },
    uContrast: { value: 1.0 },
    uSaturation: { value: 1.05 },
    uShadowLift: { value: 0.0 },
    uShadowTint: { value: new THREE.Vector3(0.95, 0.98, 1.06) },
    uHighlightTint: { value: new THREE.Vector3(1.05, 1.01, 0.95) },
    uNightFactor: { value: 0.0 },
    uClarity: { value: 0.22 },
    // Grade-domain albedo guardrails (see src/lib/albedoAudit.ts). Baked once
    // at shader-object creation from the pure contract constants; never written
    // per frame and never applied to material colours. There is no literal L*25
    // material floor — this is the grade-only perceptual floor.
    uAlbedoFloorLift: { value: GRADE_GUARDRAILS.shadowFloorLift },
    uWhiteKnee: { value: GRADE_GUARDRAILS.whiteShoulderKnee },
    uWhiteRange: { value: GRADE_GUARDRAILS.whiteShoulderRange },
    toneMappingExposure: { value: 1.08 },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform sampler2D tBlur;
    uniform sampler2D tDepth;
    uniform vec2 uResolution;
    uniform float uFocusY;
    uniform float toneMappingExposure;
    uniform float uFocusRange;
    uniform float uMaxBlur;
    uniform float uVignette;
    uniform float uAperture;
    uniform float uUseDepth;
    uniform float uNear;
    uniform float uFar;
    uniform float uFocusDistance;
    uniform float uDepthRange;
    uniform float uContrast;
    uniform float uSaturation;
    uniform float uShadowLift;
    uniform vec3 uShadowTint;
    uniform vec3 uHighlightTint;
    uniform float uNightFactor;
    uniform float uClarity;
    uniform float uAlbedoFloorLift;
    uniform float uWhiteKnee;
    uniform float uWhiteRange;
    varying vec2 vUv;

    float linearDepth(vec2 uv) {
      float d = texture2D(tDepth, uv).x;
      float z = d * 2.0 - 1.0;
      return (2.0 * uNear * uFar) / (uFar + uNear - z * (uFar - uNear));
    }

    vec3 grade(vec3 c) {
      float luma = dot(c, vec3(0.2126, 0.7152, 0.0722));
      c = mix(vec3(luma), c, uSaturation);
      // Pivot contrast in linear HDR. This separates pale masonry from dark
      // rock without washing out crisp silhouette edges.
      c = max(vec3(0.0), (c - 0.10) * uContrast + 0.10);
      // Per-landmark AAA split-tone grading (cool crevice ink / luminous key highlight).
      c *= mix(uShadowTint, uHighlightTint, smoothstep(0.14, 0.86, luma));
      // Lift dim material tones (more subtly during day, deeper relief at night) while keeping sky ink clean.
      // uAlbedoFloorLift is the grade-only perceptual floor: a tiny additive
      // amount in the darkest band so surfaces never crush to pure black under
      // the vignette. It is NOT a material albedo floor and is bounded at 0.004.
      float dimBand = smoothstep(0.004, 0.026, luma) * (1.0 - smoothstep(0.075, 0.24, luma));
      c += (uShadowLift + uAlbedoFloorLift + uNightFactor * 0.014) * dimBand;
      return c;
    }

    void main() {
      vec4 base = texture2D(tDiffuse, vUv);

      // The expensive golden-angle blur now runs once at half resolution in a
      // separate pass. Its alpha carries the per-pixel blur amount so the
      // focus mask needs no second depth fetch here.
      vec4 blurSample = texture2D(tBlur, vUv);
      float blurAmt = blurSample.a;
      // Ramp across the focus boundary so the half-res upsample never leaves a
      // visible seam; below 0.02 stay exactly on the full-resolution source.
      vec4 col = mix(base, blurSample, smoothstep(0.02, 0.08, blurAmt));

      if (blurAmt <= 0.02 && uClarity > 0.005) {
        // Fast 4-tap focal micro-clarity inside the sharp plane so fine stonework, leaves,
        // and architectural moldings stay razor-crisp against the soft bokeh fringe.
        vec2 stepUv = 1.0 / max(uResolution, vec2(1.0));
        vec3 nSum =
          texture2D(tDiffuse, clamp(vUv + vec2(stepUv.x, 0.0), 0.001, 0.999)).rgb +
          texture2D(tDiffuse, clamp(vUv - vec2(stepUv.x, 0.0), 0.001, 0.999)).rgb +
          texture2D(tDiffuse, clamp(vUv + vec2(0.0, stepUv.y), 0.001, 0.999)).rgb +
          texture2D(tDiffuse, clamp(vUv - vec2(0.0, stepUv.y), 0.001, 0.999)).rgb;
        vec3 detail = col.rgb - nSum * 0.25;
        float focusMask = 1.0 - smoothstep(0.0, 0.02, blurAmt);
        col.rgb = max(vec3(0.0), col.rgb + detail * (uClarity * focusMask));
      }

      col.rgb = grade(col.rgb);

      vec2 centered = vUv - 0.5;
      float r2 = dot(centered, centered);
      float vig = 1.0 - smoothstep(0.18, 0.68, r2) * uVignette;
      col.rgb *= vig;

      gl_FragColor = col;
      // Local tone mapping: ACES filmic with an exposure that widens slightly
      // where the local luma gradient (fwidth of luma) is strong, keeping open
      // water breathing and compressing high-contrast textured areas.
      {
        vec3 c = gl_FragColor.rgb;
        float lg = fwidth(0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b);
        float bs = mix(0.03, 0.012, smoothstep(0.03, 0.08, lg));
        const float a = 2.51, c2 = 2.43, d = 0.59, m = 1.46;
        // Bounded white shoulder: gently compress only very bright LINEAR HDR
        // (above uWhiteKnee) so physical whites / bloom accents keep a little
        // separation instead of flattening at the final 8-bit clip. Knee 1.2 and
        // range 0.65 leave the 0.75 albedo and 0.80-0.88 white bands untouched.
        vec3 over = max(c - uWhiteKnee, vec3(0.0));
        c = c - over + uWhiteRange * (over / (over + uWhiteRange));
        // Keep the miniature-pass ~1.8x exposure (/ 0.6) and ACES curve verbatim.
        vec3 t = c * (toneMappingExposure / 0.6);
        gl_FragColor = vec4(clamp((t * (a * t + bs)) / (t * (c2 * t + d) + m), 0.0, 1.0), gl_FragColor.a);
      }
      #include <colorspace_fragment>
    }
  `,
};

/**
 * Half-resolution bokeh stage. The alpha channel carries the tilt-shift /
 * depth focus mask so the full-resolution composite can pick its sample without
 * re-deriving the mask (or reading depth) a second time.
 */
const MiniatureBlurShader = {
  uniforms: {
    tDiffuse: { value: null },
    tDepth: { value: fallbackDepth as THREE.Texture },
    uResolution: { value: new THREE.Vector2(1280, 720) },
    uFocusY: { value: 0.49 },
    uFocusRange: { value: 0.2 },
    uMaxBlur: { value: 1.7 },
    uAperture: { value: 1.0 },
    uUseDepth: { value: 0 },
    uNear: { value: 0.2 },
    uFar: { value: 200 },
    uFocusDistance: { value: 9.0 },
    uDepthRange: { value: 2.0 },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform sampler2D tDepth;
    uniform vec2 uResolution;
    uniform float uFocusY;
    uniform float uFocusRange;
    uniform float uMaxBlur;
    uniform float uAperture;
    uniform float uUseDepth;
    uniform float uNear;
    uniform float uFar;
    uniform float uFocusDistance;
    uniform float uDepthRange;
    varying vec2 vUv;

    float linearDepth(vec2 uv) {
      float d = texture2D(tDepth, uv).x;
      float z = d * 2.0 - 1.0;
      return (2.0 * uNear * uFar) / (uFar + uNear - z * (uFar - uNear));
    }

    void main() {
      float bandBlur = smoothstep(uFocusRange * 0.45, uFocusRange * 1.95, abs(vUv.y - uFocusY));
      float depthBlur = 0.0;
      if (uUseDepth > 0.5) {
        float z = linearDepth(vUv);
        depthBlur = smoothstep(uDepthRange * 0.30, uDepthRange * 1.75, abs(z - uFocusDistance));
      }
      float blurAmt = max(bandBlur * 0.9, depthBlur) * uMaxBlur * uAperture;

      // uResolution stays at full composer resolution: the texel step is a
      // screen-space radius, not a half-res one, so the bokeh size is unchanged.
      vec2 px = (1.0 / max(uResolution, vec2(1.0))) * blurAmt;
      vec3 col = texture2D(tDiffuse, vUv).rgb * 0.16;
      float total = 0.16;
      for (int i = 0; i < 10; i++) {
        float a = float(i) * 2.399963 + 0.35;
        float r = sqrt((float(i) + 0.5) / 10.0);
        vec2 off = vec2(cos(a), sin(a)) * r * px;
        col += texture2D(tDiffuse, clamp(vUv + off, 0.001, 0.999)).rgb * 0.084;
        total += 0.084;
      }
      gl_FragColor = vec4(col / total, blurAmt);
    }
  `,
};

export interface MiniatureGradeOptions {
  contrast?: number;
  saturation?: number;
  shadowLift?: number;
  shadowTint?: readonly [number, number, number];
  highlightTint?: readonly [number, number, number];
  clarity?: number;
  nightFactor?: number;
}

export interface MiniaturePass extends ShaderPass {
  setResolution(width: number, height: number): void;
  setDepth(texture: THREE.Texture | null, near: number, far: number): void;
  setFocus(distance: number, depthRange?: number, aperture?: number): void;
  setExposure(exposure: number): void;
  setGrade(grade: MiniatureGradeOptions): void;
  applyTuning(tuning: Partial<MiniatureTuning>): void;
}

const DitherShader = {
  uniforms: {
    tDiffuse: { value: null },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    varying vec2 vUv;
    void main() {
      vec4 c = texture2D(tDiffuse, vUv);
      // Ordered-value dither: kicks posterization bands of the 8-bit grid up
      // by a half-step per pixel. Cheap at full resolution, visible only at 1/4.
      float u = fract(sin(dot(vUv, vec2(127.1, 311.7))) * 43758.5453);
      gl_FragColor = vec4(c.rgb + vec3(u * 0.0078 - 0.0039), c.a);
    }
  `,
};

/** Ordered-dither pass; runs last on the final sRGB pixels. */
export function createDitherPass(): ShaderPass {
  return new ShaderPass(DitherShader);
}

export function createMiniaturePass(initialTuning: Partial<MiniatureTuning> = {}): MiniaturePass {
  const pass = new ShaderPass(MiniatureShader) as MiniaturePass;
  pass.material.toneMapped = true;
  // Stable program cache key for the guardrail-augmented grade. Isolated to this
  // ShaderPass material — WU and all shared/shader materials are untouched.
  pass.material.customProgramCacheKey = () => GRADE_GUARDRAILS.cacheKey;

  // Half-resolution bokeh stage. The uniform objects are shared, not copied,
  // so setDepth/setFocus/applyTuning keep driving both materials.
  const blurPass = new ShaderPass(MiniatureBlurShader);
  const shared = [
    'tDepth',
    'uResolution',
    'uFocusY',
    'uFocusRange',
    'uMaxBlur',
    'uAperture',
    'uUseDepth',
    'uNear',
    'uFar',
    'uFocusDistance',
    'uDepthRange',
  ] as const;
  for (const key of shared) blurPass.uniforms[key] = pass.uniforms[key];
  const blurQuad = new FullScreenQuad(blurPass.material);

  let blurTarget: THREE.WebGLRenderTarget | null = null;
  const ensureBlurTarget = (width: number, height: number) => {
    const w = Math.max(1, Math.ceil(width / 2));
    const h = Math.max(1, Math.ceil(height / 2));
    if (!blurTarget) {
      blurTarget = new THREE.WebGLRenderTarget(w, h, {
        type: THREE.HalfFloatType,
        format: THREE.RGBAFormat,
        depthBuffer: false,
        stencilBuffer: false,
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter,
      });
    } else if (blurTarget.width !== w || blurTarget.height !== h) {
      blurTarget.setSize(w, h);
    }
  };
  ensureBlurTarget(1280, 720);

  pass.setResolution = (width: number, height: number) => {
    const res = pass.uniforms.uResolution.value as THREE.Vector2;
    res.set(Math.max(1, width), Math.max(1, height));
  };

  const baseSetSize = pass.setSize.bind(pass);
  pass.setSize = (width: number, height: number) => {
    baseSetSize(width, height);
    pass.setResolution(width, height);
    ensureBlurTarget(width, height);
  };

  pass.setDepth = (texture, near, far) => {
    pass.uniforms.tDepth.value = texture ?? fallbackDepth;
    pass.uniforms.uUseDepth.value = texture ? 1 : 0;
    pass.uniforms.uNear.value = near;
    pass.uniforms.uFar.value = far;
  };

  pass.setFocus = (distance, depthRange, aperture) => {
    const d = Math.max(0.1, distance);
    pass.uniforms.uFocusDistance.value = d;
    pass.uniforms.uDepthRange.value =
      depthRange !== undefined ? depthRange : THREE.MathUtils.clamp(d * 0.24, 0.8, 3.4);
    if (aperture !== undefined) {
      pass.uniforms.uAperture.value = aperture;
    }
  };

  pass.setExposure = (exposure) => {
    pass.uniforms.toneMappingExposure.value = exposure;
  };

  pass.setGrade = (grade) => {
    if (grade.contrast !== undefined) pass.uniforms.uContrast.value = grade.contrast;
    if (grade.saturation !== undefined) pass.uniforms.uSaturation.value = grade.saturation;
    if (grade.shadowLift !== undefined) pass.uniforms.uShadowLift.value = grade.shadowLift;
    if (grade.shadowTint !== undefined) {
      (pass.uniforms.uShadowTint.value as THREE.Vector3).set(
        grade.shadowTint[0],
        grade.shadowTint[1],
        grade.shadowTint[2]
      );
    }
    if (grade.highlightTint !== undefined) {
      (pass.uniforms.uHighlightTint.value as THREE.Vector3).set(
        grade.highlightTint[0],
        grade.highlightTint[1],
        grade.highlightTint[2]
      );
    }
    if (grade.clarity !== undefined) pass.uniforms.uClarity.value = grade.clarity;
    if (grade.nightFactor !== undefined) pass.uniforms.uNightFactor.value = grade.nightFactor;
  };

  pass.applyTuning = (tuning: Partial<MiniatureTuning>) => {
    if (tuning.focusY !== undefined) pass.uniforms.uFocusY.value = tuning.focusY;
    if (tuning.focusRange !== undefined) pass.uniforms.uFocusRange.value = tuning.focusRange;
    if (tuning.blur !== undefined) pass.uniforms.uMaxBlur.value = tuning.blur;
    if (tuning.vignette !== undefined) pass.uniforms.uVignette.value = tuning.vignette;
    if (tuning.aperture !== undefined) pass.uniforms.uAperture.value = tuning.aperture;
  };

  // Render the bokeh into the small target before the full-res composite.
  // ShaderPass assigns the read-buffer texture to tDiffuse inside baseRender,
  // so the blur stage takes its source directly from readBuffer.
  const baseRender = pass.render.bind(pass);
  pass.render = (renderer, writeBuffer, readBuffer, deltaTime, maskActive) => {
    if (blurTarget) {
      blurPass.uniforms.tDiffuse.value = readBuffer.texture;
      const prevTarget = renderer.getRenderTarget();
      renderer.setRenderTarget(blurTarget);
      blurQuad.render(renderer);
      renderer.setRenderTarget(prevTarget);
      pass.uniforms.tBlur.value = blurTarget.texture;
    }
    baseRender(renderer, writeBuffer, readBuffer, deltaTime, maskActive);
  };

  const baseDispose = pass.dispose.bind(pass);
  pass.dispose = () => {
    blurTarget?.dispose();
    blurQuad.dispose();
    blurPass.material.dispose();
    baseDispose();
  };

  pass.applyTuning(initialTuning);
  return pass;
}

