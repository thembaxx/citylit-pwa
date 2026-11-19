declare module 'n8ao' {
  import type * as THREE from 'three';
  import type { Pass } from 'three/examples/jsm/postprocessing/Pass.js';

  export interface N8AOPassConfiguration {
    aoSamples: number;
    aoRadius: number;
    aoTones: number;
    denoiseSamples: number;
    denoiseRadius: number;
    distanceFalloff: number;
    intensity: number;
    denoiseIterations: number;
    renderMode: 0 | 1 | 2 | 3 | 4;
    biasOffset: number;
    biasMultiplier: number;
    color: THREE.Color;
    gammaCorrection: boolean;
    depthBufferType: 1 | 2 | 3;
    screenSpaceRadius: boolean;
    halfRes: boolean;
    depthAwareUpsampling: boolean;
    autoRenderBeauty: boolean;
    colorMultiply: boolean;
    transparencyAware: boolean;
    stencil: boolean;
    accumulate: boolean;
    neuralDenoise: boolean;
  }

  export type N8AOQualityMode =
    | 'Performance'
    | 'Low'
    | 'Medium'
    | 'High'
    | 'Ultra'
    | 'Neural-Performance'
    | 'Neural-Low'
    | 'Neural-Medium'
    | 'Neural-High';

  export class N8AOPass extends Pass {
    scene: THREE.Scene;
    camera: THREE.Camera;
    width: number;
    height: number;
    configuration: N8AOPassConfiguration;
    beautyRenderTarget: THREE.WebGLRenderTarget;

    constructor(scene: THREE.Scene, camera: THREE.Camera, width?: number, height?: number);
    setQualityMode(mode: N8AOQualityMode): void;
    firstFrame(): void;
  }
}
