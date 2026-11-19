import * as THREE from 'three';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';

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
    uniform float uVignette;
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

    vec3 grade(vec3 c) {
      float luma = dot(c, vec3(0.2126, 0.7152, 0.0722));
      c = mix(vec3(luma), c, 1.05);
      // Gentle cool-shadow / warm-highlight split for a photographic finish.
      c *= mix(vec3(0.97, 0.99, 1.05), vec3(1.04, 1.01, 0.96), smoothstep(0.15, 0.85, luma));
      return c;
    }

    void main() {
      vec4 base = texture2D(tDiffuse, vUv);

      // Screen-space tilt-shift band keeps the miniature tabletop read at any focus.
      float bandBlur = smoothstep(uFocusRange * 0.45, uFocusRange * 1.95, abs(vUv.y - uFocusY));
      float depthBlur = 0.0;
      if (uUseDepth > 0.5) {
        float z = linearDepth(vUv);
        depthBlur = smoothstep(uDepthRange * 0.30, uDepthRange * 1.75, abs(z - uFocusDistance));
      }

      float blurAmt = max(bandBlur * 0.9, depthBlur) * uMaxBlur * uAperture;
      vec4 col = base;

      if (blurAmt > 0.02) {
        vec2 px = (1.0 / max(uResolution, vec2(1.0))) * blurAmt;
        col = base * 0.16;
        float total = 0.16;
        for (int i = 0; i < 10; i++) {
          float a = float(i) * 2.399963 + 0.35;
          float r = sqrt((float(i) + 0.5) / 10.0);
          vec2 off = vec2(cos(a), sin(a)) * r * px;
          col += texture2D(tDiffuse, clamp(vUv + off, 0.001, 0.999)) * 0.084;
          total += 0.084;
        }
        col /= total;
      }

      col.rgb = grade(col.rgb);

      vec2 centered = vUv - 0.5;
      float r2 = dot(centered, centered);
      float vig = 1.0 - smoothstep(0.18, 0.68, r2) * uVignette;
      col.rgb *= vig;

      gl_FragColor = col;
    }
  `,
};

export interface MiniaturePass extends ShaderPass {
  setResolution(width: number, height: number): void;
  setDepth(texture: THREE.Texture | null, near: number, far: number): void;
  setFocus(distance: number): void;
  applyTuning(tuning: Partial<MiniatureTuning>): void;
}

export function createMiniaturePass(initialTuning: Partial<MiniatureTuning> = {}): MiniaturePass {
  const pass = new ShaderPass(MiniatureShader) as MiniaturePass;

  pass.setResolution = (width: number, height: number) => {
    const res = pass.uniforms.uResolution.value as THREE.Vector2;
    res.set(Math.max(1, width), Math.max(1, height));
  };

  const baseSetSize = pass.setSize.bind(pass);
  pass.setSize = (width: number, height: number) => {
    baseSetSize(width, height);
    pass.setResolution(width, height);
  };

  pass.setDepth = (texture, near, far) => {
    pass.uniforms.tDepth.value = texture ?? fallbackDepth;
    pass.uniforms.uUseDepth.value = texture ? 1 : 0;
    pass.uniforms.uNear.value = near;
    pass.uniforms.uFar.value = far;
  };

  pass.setFocus = (distance) => {
    const d = Math.max(0.1, distance);
    pass.uniforms.uFocusDistance.value = d;
    pass.uniforms.uDepthRange.value = THREE.MathUtils.clamp(d * 0.24, 0.8, 3.4);
  };

  pass.applyTuning = (tuning: Partial<MiniatureTuning>) => {
    if (tuning.focusY !== undefined) pass.uniforms.uFocusY.value = tuning.focusY;
    if (tuning.focusRange !== undefined) pass.uniforms.uFocusRange.value = tuning.focusRange;
    if (tuning.blur !== undefined) pass.uniforms.uMaxBlur.value = tuning.blur;
    if (tuning.vignette !== undefined) pass.uniforms.uVignette.value = tuning.vignette;
    if (tuning.aperture !== undefined) pass.uniforms.uAperture.value = tuning.aperture;
  };

  pass.applyTuning(initialTuning);
  return pass;
}
