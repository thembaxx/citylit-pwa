import * as THREE from 'three';
import type { WebGPURenderer } from 'three/webgpu';
import { createWebGPUCompat, type WebGPUCompat } from './webgpuCompat';
import { WebGPUPostFX } from './webgpuPostFX';
import type { MiniatureGradeOptions } from '../postfx';
import type { PMREMGeneratorLike, RendererSelection, SceneRenderer } from './types';

class WebGLSceneRenderer implements SceneRenderer {
  readonly backend = 'webgl' as const;
  readonly raw: THREE.WebGLRenderer;
  readonly domElement: HTMLCanvasElement;
  readonly isWebGPU = false;
  readonly supportsReadback = true;
  readonly supportsAsyncReadback = true;
  get xr() {
    return { isPresenting: this.raw.xr.isPresenting };
  }
  // Forward to the raw renderer: three only honours per-material clipping
  // planes when local clipping is enabled on the renderer itself.
  get localClippingEnabled() {
    return this.raw.localClippingEnabled;
  }
  set localClippingEnabled(value: boolean) {
    this.raw.localClippingEnabled = value;
  }
  readonly shadowMap: SceneRenderer['shadowMap'];
  readonly debug: SceneRenderer['debug'];
  readonly capabilities: SceneRenderer['capabilities'];
  private timerExt: { TIME_ELAPSED_EXT: number; GPU_DISJOINT_EXT: number } | null;
  private get gl2(): WebGL2RenderingContext {
    return this.raw.getContext() as WebGL2RenderingContext;
  }
  private activeQuery: WebGLQuery | null = null;
  private pendingQueries: WebGLQuery[] = [];
  private lastGpuMs: number | null = null;

  constructor(selection: RendererSelection) {
    this.raw = selection.renderer as THREE.WebGLRenderer;
    const gl = this.gl2;
    this.timerExt = gl.getExtension('EXT_disjoint_timer_query_webgl2') as typeof this.timerExt;
    this.domElement = this.raw.domElement;
    const raw = this.raw;
    this.shadowMap = {
      get enabled() {
        return raw.shadowMap.enabled;
      },
      set enabled(value: boolean) {
        raw.shadowMap.enabled = value;
      },
      get type() {
        return raw.shadowMap.type;
      },
      set type(value: THREE.ShadowMapType) {
        raw.shadowMap.type = value;
      },
      get autoUpdate() {
        return raw.shadowMap.autoUpdate;
      },
      set autoUpdate(value: boolean) {
        raw.shadowMap.autoUpdate = value;
      },
      get needsUpdate() {
        return raw.shadowMap.needsUpdate;
      },
      set needsUpdate(value: boolean) {
        raw.shadowMap.needsUpdate = value;
      },
    };
    this.debug = {
      get checkShaderErrors() {
        return raw.debug.checkShaderErrors;
      },
      set checkShaderErrors(value: boolean) {
        raw.debug.checkShaderErrors = value;
      },
    };
    this.capabilities = { getMaxAnisotropy: () => raw.capabilities.getMaxAnisotropy() };
  }

  get toneMapping() {
    return this.raw.toneMapping;
  }
  set toneMapping(value: THREE.ToneMapping) {
    this.raw.toneMapping = value;
  }
  get toneMappingExposure() {
    return this.raw.toneMappingExposure;
  }
  set toneMappingExposure(value: number) {
    this.raw.toneMappingExposure = value;
  }
  get outputColorSpace(): THREE.ColorSpace {
    return this.raw.outputColorSpace as THREE.ColorSpace;
  }
  set outputColorSpace(value: THREE.ColorSpace) {
    this.raw.outputColorSpace = value;
  }

  setSize(width: number, height: number, updateStyle?: boolean) {
    this.raw.setSize(width, height, updateStyle);
  }
  setPixelRatio(value: number) {
    this.raw.setPixelRatio(value);
  }
  getPixelRatio() {
    return this.raw.getPixelRatio();
  }
  setRenderTarget(target: THREE.RenderTarget | null) {
    this.raw.setRenderTarget(target as THREE.WebGLRenderTarget | null);
  }
  getRenderTarget() {
    return this.raw.getRenderTarget() as THREE.RenderTarget | null;
  }
  render(scene: THREE.Object3D, camera: THREE.Camera) {
    this.raw.render(scene, camera);
  }
  compile(scene: THREE.Object3D, camera: THREE.Camera, targetScene?: THREE.Scene) {
    this.raw.compile(scene, camera, targetScene);
  }
  compileAsync(scene: THREE.Object3D, camera: THREE.Camera, targetScene?: THREE.Scene) {
    return this.raw.compileAsync(scene, camera, targetScene).then(() => undefined);
  }
  readRenderTargetPixels(
    target: THREE.RenderTarget,
    x: number,
    y: number,
    width: number,
    height: number,
    buffer: ArrayBufferView,
    textureIndex?: number,
    faceIndex?: number
  ) {
    this.raw.readRenderTargetPixels(
      target as THREE.WebGLRenderTarget,
      x,
      y,
      width,
      height,
      buffer as Uint8Array,
      textureIndex,
      faceIndex
    );
  }
  async readRenderTargetPixelsAsync(
    target: THREE.RenderTarget,
    x: number,
    y: number,
    width: number,
    height: number
  ): Promise<ArrayBufferView> {
    const buffer = new Uint8Array(width * height * 4);
    this.readRenderTargetPixels(target, x, y, width, height, buffer);
    return buffer;
  }
  getContext() {
    return this.raw.getContext() as WebGL2RenderingContext | null;
  }
  dispose() {
    const gl = this.gl2;
    for (const query of this.pendingQueries) gl.deleteQuery(query);
    if (this.activeQuery) gl.deleteQuery(this.activeQuery);
    this.pendingQueries.length = 0;
    this.activeQuery = null;
    this.raw.dispose();
  }
  createPMREM(): PMREMGeneratorLike {
    return new THREE.PMREMGenerator(this.raw);
  }
  adaptScene() {}
  syncUniforms() {}
  setPostFXQuality() {}
  setPostFXGrade(_grade: MiniatureGradeOptions, _vignette?: number) {}
  setPostFXFocus(_distance: number) {}
  setPostFXAperture(_aperture: number) {}
  startGpuTiming() {
    if (!this.timerExt || this.activeQuery) return;
    const gl = this.gl2;
    const query = gl.createQuery();
    if (!query) return;
    this.activeQuery = query;
    gl.beginQuery(this.timerExt.TIME_ELAPSED_EXT, query);
  }
  endGpuTiming() {
    if (!this.timerExt || !this.activeQuery) return;
    const gl = this.gl2;
    gl.endQuery(this.timerExt.TIME_ELAPSED_EXT);
    this.pendingQueries.push(this.activeQuery);
    this.activeQuery = null;
    this.pollTimers();
  }
  takeGpuMs() {
    const value = this.lastGpuMs;
    this.lastGpuMs = null;
    return value;
  }
  private pollTimers() {
    if (this.pendingQueries.length === 0) return;
    const gl = this.gl2;
    const ext = this.timerExt!;
    const query = this.pendingQueries[0];
    if (gl.getParameter(ext.GPU_DISJOINT_EXT)) {
      gl.deleteQuery(query);
      this.pendingQueries.shift();
    } else if (gl.getQueryParameter(query, gl.QUERY_RESULT_AVAILABLE)) {
      const ns = gl.getQueryParameter(query, gl.QUERY_RESULT) as number;
      this.lastGpuMs = ns / 1e6;
      gl.deleteQuery(query);
      this.pendingQueries.shift();
    }
    if (this.pendingQueries.length > 0) window.setTimeout(() => this.pollTimers(), 8);
  }
}

class WebGPUSceneRenderer implements SceneRenderer {
  readonly backend = 'webgpu' as const;
  readonly raw: WebGPURenderer;
  readonly domElement: HTMLCanvasElement;
  readonly isWebGPU = true;
  readonly supportsReadback = false;
  readonly supportsAsyncReadback = true;
  get xr() {
    return { isPresenting: this.raw.xr.isPresenting };
  }
  localClippingEnabled = false;
  readonly shadowMap: SceneRenderer['shadowMap'];
  readonly debug: SceneRenderer['debug'];
  readonly capabilities: SceneRenderer['capabilities'];
  private compat: WebGPUCompat;
  private readonly module: NonNullable<RendererSelection['webgpuModule']>;
  private postFX: WebGPUPostFX | null = null;
  private lastGpuMs: number | null = null;
  private timestampPending = false;
  private warnedReadback = false;

  constructor(selection: RendererSelection) {
    this.raw = selection.renderer as WebGPURenderer;
    this.domElement = this.raw.domElement;
    this.module = selection.webgpuModule!;
    const compat = createWebGPUCompat(this.module, selection.tslModule!);
    this.compat = compat;
    const raw = this.raw;
    let shadowEnabled = false;
    let shadowType: THREE.ShadowMapType = THREE.PCFShadowMap;
    this.shadowMap = {
      get enabled() {
        return shadowEnabled;
      },
      set enabled(value: boolean) {
        shadowEnabled = value;
        raw.shadowMap.enabled = value;
      },
      get type() {
        return shadowType;
      },
      set type(value: THREE.ShadowMapType) {
        shadowType = value;
        raw.shadowMap.type = value;
      },
      get autoUpdate() {
        return true;
      },
      set autoUpdate(_value: boolean) {},
      get needsUpdate() {
        return false;
      },
      set needsUpdate(_value: boolean) {},
    };
    this.debug = { checkShaderErrors: false };
    this.capabilities = { getMaxAnisotropy: () => raw.getMaxAnisotropy() };
    if (selection.tslModule && selection.bloomModule) {
      this.postFX = new WebGPUPostFX(
        this.module,
        raw,
        selection.tslModule,
        selection.bloomModule,
        selection.ssaoModule,
        selection.dofModule
      );
    }
  }

  get toneMapping() {
    return this.raw.toneMapping;
  }
  set toneMapping(value: THREE.ToneMapping) {
    this.raw.toneMapping = value;
  }
  get toneMappingExposure() {
    return this.raw.toneMappingExposure;
  }
  set toneMappingExposure(value: number) {
    this.raw.toneMappingExposure = value;
  }
  get outputColorSpace(): THREE.ColorSpace {
    return this.raw.outputColorSpace as THREE.ColorSpace;
  }
  set outputColorSpace(value: THREE.ColorSpace) {
    this.raw.outputColorSpace = value;
  }

  setSize(width: number, height: number, updateStyle?: boolean) {
    this.raw.setSize(width, height, updateStyle);
  }
  setPixelRatio(value: number) {
    this.raw.setPixelRatio(value);
  }
  getPixelRatio() {
    return this.raw.getPixelRatio();
  }
  setRenderTarget(target: THREE.RenderTarget | null) {
    this.raw.setRenderTarget(target);
  }
  getRenderTarget() {
    return this.raw.getRenderTarget() as THREE.RenderTarget | null;
  }
  render(scene: THREE.Object3D, camera: THREE.Camera, postFX = false) {
    // GLSL materials may be added at any time (landmark swaps, weather rigs).
    // The adapter caches conversions per material, so this traversal is cheap.
    this.compat.adaptScene(scene);
    this.compat.syncUniforms();
    if (postFX && this.postFX) this.postFX.render(scene, camera);
    else this.raw.render(scene, camera);
  }
  compile(scene: THREE.Object3D, camera: THREE.Camera, targetScene?: THREE.Scene) {
    this.compat.adaptScene(scene);
    return this.raw.compile(scene, camera, targetScene);
  }
  compileAsync(scene: THREE.Object3D, camera: THREE.Camera, targetScene?: THREE.Scene) {
    this.compat.adaptScene(scene);
    return this.raw.compileAsync(scene, camera, targetScene);
  }
  readRenderTargetPixels() {
    if (!this.warnedReadback) {
      this.warnedReadback = true;
      console.warn('[citylit] synchronous pixel readback is unavailable on the WebGPU backend');
    }
  }
  async readRenderTargetPixelsAsync(
    target: THREE.RenderTarget,
    x: number,
    y: number,
    width: number,
    height: number
  ): Promise<ArrayBufferView> {
    return this.raw.readRenderTargetPixelsAsync(target, x, y, width, height);
  }
  getContext() {
    return null;
  }
  dispose() {
    this.postFX?.dispose();
    this.compat.dispose();
    this.raw.dispose();
  }
  createPMREM(): PMREMGeneratorLike {
    return new this.module.PMREMGenerator(this.raw);
  }
  adaptScene(root: THREE.Object3D) {
    this.compat.adaptScene(root);
  }
  syncUniforms() {
    this.compat.syncUniforms();
  }
  setPostFXQuality(index: number) {
    this.postFX?.setQualityIndex(index);
  }
  setPostFXGrade(grade: MiniatureGradeOptions, vignette?: number) {
    this.postFX?.setGrade(grade, vignette);
  }
  setPostFXFocus(distance: number) {
    this.postFX?.setFocus(distance);
  }
  setPostFXAperture(aperture: number) {
    this.postFX?.setAperture(aperture);
  }
  startGpuTiming() {}
  endGpuTiming() {
    if (this.timestampPending) return;
    this.timestampPending = true;
    void this.raw
      .resolveTimestampsAsync('render')
      .then((ms) => {
        this.timestampPending = false;
        if (typeof ms === 'number' && Number.isFinite(ms)) this.lastGpuMs = ms;
      })
      .catch(() => {
        this.timestampPending = false;
      });
  }
  takeGpuMs() {
    const value = this.lastGpuMs;
    this.lastGpuMs = null;
    return value;
  }
}

export function createSceneRenderer(selection: RendererSelection): SceneRenderer {
  return selection.backend === 'webgpu'
    ? new WebGPUSceneRenderer(selection)
    : new WebGLSceneRenderer(selection);
}
