import * as THREE from 'three';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';

export interface MiniatureTuning {
  focusY: number;
  focusRange: number;
  blur: number;
  vignette: number;
}

const MiniatureShader = {
  uniforms: {
    tDiffuse: { value: null },
    uResolution: { value: new THREE.Vector2(1280, 720) },
    uFocusY: { value: 0.49 },
    uFocusRange: { value: 0.2 },
    uMaxBlur: { value: 1.7 },
    uVignette: { value: 0.2 },
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
    uniform vec2 uResolution;
    uniform float uFocusY;
    uniform float uFocusRange;
    uniform float uMaxBlur;
    uniform float uVignette;
    varying vec2 vUv;

    void main() {
      float dy = abs(vUv.y - uFocusY);
      float blurAmt = smoothstep(uFocusRange * 0.45, uFocusRange * 1.95, dy) * uMaxBlur;

      vec4 col;
      if (blurAmt > 0.02) {
        vec2 px = (1.0 / max(uResolution, vec2(1.0))) * blurAmt;
        vec2 o1 = vec2(px.x, 0.0);
        vec2 o2 = vec2(0.0, px.y);
        vec2 o3 = vec2(px.x * 0.7071, px.y * 0.7071);
        vec2 o4 = vec2(-px.x * 0.7071, px.y * 0.7071);

        col = texture2D(tDiffuse, vUv) * 0.20;
        col += texture2D(tDiffuse, clamp(vUv + o1, 0.001, 0.999)) * 0.11;
        col += texture2D(tDiffuse, clamp(vUv - o1, 0.001, 0.999)) * 0.11;
        col += texture2D(tDiffuse, clamp(vUv + o2, 0.001, 0.999)) * 0.11;
        col += texture2D(tDiffuse, clamp(vUv - o2, 0.001, 0.999)) * 0.11;
        col += texture2D(tDiffuse, clamp(vUv + o3, 0.001, 0.999)) * 0.09;
        col += texture2D(tDiffuse, clamp(vUv - o3, 0.001, 0.999)) * 0.09;
        col += texture2D(tDiffuse, clamp(vUv + o4, 0.001, 0.999)) * 0.09;
        col += texture2D(tDiffuse, clamp(vUv - o4, 0.001, 0.999)) * 0.09;
      } else {
        col = texture2D(tDiffuse, vUv);
      }

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

  pass.applyTuning = (tuning: Partial<MiniatureTuning>) => {
    if (tuning.focusY !== undefined) pass.uniforms.uFocusY.value = tuning.focusY;
    if (tuning.focusRange !== undefined) pass.uniforms.uFocusRange.value = tuning.focusRange;
    if (tuning.blur !== undefined) pass.uniforms.uMaxBlur.value = tuning.blur;
    if (tuning.vignette !== undefined) pass.uniforms.uVignette.value = tuning.vignette;
  };

  pass.applyTuning(initialTuning);
  return pass;
}
