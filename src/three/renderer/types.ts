import type * as THREE from 'three';
import type { WebGPURenderer } from 'three/webgpu';
import type { MiniatureGradeOptions } from '../postfx';

export type RendererBackend = 'webgpu' | 'webgl';
export type RendererPreference = 'auto' | 'webgpu' | 'webgl';

export type AnyRenderer = THREE.WebGLRenderer | WebGPURenderer;

export interface RendererSelection {
  backend: RendererBackend;
  renderer: AnyRenderer;
  /** Human-readable explanation, logged once for diagnostics. */
  reason: string;
  /** Set when the WebGPU modules were loaded, so the engine can build node PMREM/FX. */
  webgpuModule?: typeof import('three/webgpu');
  tslModule?: typeof import('three/tsl');
  bloomModule?: typeof import('three/addons/tsl/display/BloomNode.js');
  ssaoModule?: typeof import('three/addons/tsl/display/SSAONode.js');
  dofModule?: typeof import('three/addons/tsl/display/DepthOfFieldNode.js');
}

export interface PMREMResult {
  texture: THREE.Texture;
}

export interface PMREMGeneratorLike {
  fromScene(scene: THREE.Scene, sigma?: number, near?: number, far?: number): PMREMResult;
  fromEquirectangular(texture: THREE.Texture): PMREMResult;
  dispose(): void;
}

/**
 * The subset of renderer API the engine actually uses, with a single shape for
 * both backends. WebGL keeps the existing WebGLRenderer/GLSL stack unchanged;
 * WebGPU exposes only the compatible subset and flags expensive readbacks off.
 */
export interface SceneRenderer {
  readonly backend: RendererBackend;
  readonly raw: AnyRenderer;
  readonly domElement: HTMLCanvasElement;
  readonly isWebGPU: boolean;
  /** Thumbnails/postcards use synchronous pixel readback, which WebGPU cannot do. */
  readonly supportsReadback: boolean;
  readonly supportsAsyncReadback: boolean;
  readonly xr: { isPresenting: boolean };

  toneMapping: THREE.ToneMapping;
  toneMappingExposure: number;
  outputColorSpace: THREE.ColorSpace;
  shadowMap: {
    enabled: boolean;
    type: THREE.ShadowMapType;
    autoUpdate: boolean;
    needsUpdate: boolean;
  };
  debug: { checkShaderErrors: boolean };
  localClippingEnabled: boolean;
  capabilities: { getMaxAnisotropy(): number };

  setSize(width: number, height: number, updateStyle?: boolean): void;
  setPixelRatio(value: number): void;
  getPixelRatio(): number;
  setRenderTarget(target: THREE.RenderTarget | null): void;
  getRenderTarget(): THREE.RenderTarget | null;
  /** `postFX` enables the WebGPU TSL pipeline; WebGL uses its composer instead. */
  render(scene: THREE.Object3D, camera: THREE.Camera, postFX?: boolean): void;
  compile(scene: THREE.Object3D, camera: THREE.Camera, targetScene?: THREE.Scene): void | Promise<void>;
  compileAsync(scene: THREE.Object3D, camera: THREE.Camera, targetScene?: THREE.Scene): Promise<void>;
  readRenderTargetPixels(
    target: THREE.RenderTarget,
    x: number,
    y: number,
    width: number,
    height: number,
    buffer: ArrayBufferView,
    textureIndex?: number,
    faceIndex?: number
  ): void;
  readRenderTargetPixelsAsync(
    target: THREE.RenderTarget,
    x: number,
    y: number,
    width: number,
    height: number
  ): Promise<ArrayBufferView>;
  getContext(): WebGL2RenderingContext | null;
  dispose(): void;
  createPMREM(): PMREMGeneratorLike;
  /** Replace GLSL-only materials before a WebGPU render. No-op on WebGL. */
  adaptScene(root: THREE.Object3D): void;
  /** Push animated uniform values into WebGPU node replacements. No-op on WebGL. */
  syncUniforms(): void;
  /** Quality tier for the WebGPU TSL post chain. No-op on WebGL. */
  setPostFXQuality(index: number): void;
  /** Grade knobs for the WebGPU TSL post chain. No-op on WebGL. */
  setPostFXGrade(grade: MiniatureGradeOptions, vignette?: number): void;
  setPostFXFocus(distance: number): void;
  setPostFXAperture(aperture: number): void;
  startGpuTiming(): void;
  endGpuTiming(): void;
  /** Last resolved GPU render time in ms, or null when unsupported/pending. */
  takeGpuMs(): number | null;
}
