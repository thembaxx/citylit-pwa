import * as THREE from 'three';
import type { RendererPreference, RendererSelection } from './types';

const PREFERENCE_KEY = 'cl-renderer-pref';

interface GPUCapableNavigator {
  gpu?: {
    requestAdapter(options?: { powerPreference?: 'high-performance' | 'low-power' }): Promise<unknown>;
  };
}

/** `?renderer=webgl|webgpu` wins; otherwise use the persisted choice, else auto. */
export function readRendererPreference(): RendererPreference {
  try {
    const url = new URLSearchParams(window.location.search).get('renderer');
    if (url === 'webgl' || url === 'webgpu') return url;
    const stored = window.localStorage.getItem(PREFERENCE_KEY);
    if (stored === 'webgl' || stored === 'webgpu') return stored;
    const settings = window.localStorage.getItem('cl-st');
    if (settings) {
      const renderer = (JSON.parse(settings) as { renderer?: unknown }).renderer;
      if (renderer === 'webgl' || renderer === 'webgpu') return renderer;
    }
  } catch {
    // Ignore URL/storage failures.
  }
  return 'auto';
}

export function createWebGLRendererSelection(softwareGl: boolean, reason: string): RendererSelection {
  const renderer = new THREE.WebGLRenderer({
    antialias: !softwareGl,
    powerPreference: 'high-performance',
    preserveDrawingBuffer: false,
  });
  return { backend: 'webgl', renderer, reason };
}

/**
 * Preferred path: a real WebGPU backend. Anything less (no `navigator.gpu`,
 * no adapter, failed init, three silently falling back to its WebGL2 backend)
 * returns the untouched WebGLRenderer stack.
 */
export async function selectRenderer(softwareGl: boolean): Promise<RendererSelection> {
  const preference = readRendererPreference();
  if (preference === 'webgl') {
    return createWebGLRendererSelection(softwareGl, 'WebGL requested by renderer preference');
  }

  const gpu = (navigator as GPUCapableNavigator).gpu;
  if (!gpu) return createWebGLRendererSelection(softwareGl, 'navigator.gpu unavailable');

  let candidate: import('three/webgpu').WebGPURenderer | null = null;
  try {
    const adapter = await gpu.requestAdapter({ powerPreference: 'high-performance' });
    if (!adapter) return createWebGLRendererSelection(softwareGl, 'no WebGPU adapter');

    const [webgpu, tsl, bloomModule, ssaoModule, dofModule] = await Promise.all([
      import('three/webgpu'),
      import('three/tsl'),
      import('three/addons/tsl/display/BloomNode.js'),
      import('three/addons/tsl/display/SSAONode.js'),
      import('three/addons/tsl/display/DepthOfFieldNode.js'),
    ]);
    candidate = new webgpu.WebGPURenderer({
      antialias: !softwareGl,
      alpha: false,
      powerPreference: 'high-performance',
      trackTimestamp: true,
    });
    await candidate.init();

    const backend = candidate.backend as { isWebGPUBackend?: boolean };
    if (!backend.isWebGPUBackend) {
      candidate.dispose();
      return createWebGLRendererSelection(softwareGl, 'WebGPURenderer fell back to WebGL2');
    }

    return {
      backend: 'webgpu',
      renderer: candidate,
      reason: 'WebGPU backend initialised',
      webgpuModule: webgpu,
      tslModule: tsl,
      bloomModule,
      ssaoModule,
      dofModule,
    };
  } catch (error) {
    candidate?.dispose();
    const message = error instanceof Error ? error.message : String(error);
    return createWebGLRendererSelection(softwareGl, `WebGPU init failed: ${message}`);
  }
}
