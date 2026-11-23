import * as THREE from 'three';
import type { RendererBackend, RendererPreference, RendererSelection } from './types';

const PREFERENCE_KEY = 'cl-renderer-pref';

/**
 * HiDPI displays already resolve edges at device resolution. Stacking 4x MSAA
 * on top multiplies shaded samples for no visible benefit, so only 1x/low-DPR
 * displays pay for multisampling.
 */
function wantsMsaa(): boolean {
  const dpr = typeof devicePixelRatio === 'number' ? devicePixelRatio : 1;
  return dpr <= 1.25;
}

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

/** Outcome of the async WebGPU probe, consumed by the pure decision below. */
export interface RendererProbe {
  preference: RendererPreference;
  hasGpu: boolean;
  hasAdapter: boolean;
  /** True only when WebGPURenderer.init() produced a real WebGPU backend. */
  webgpuReady: boolean;
  /** Error text when probing or init threw. */
  error?: string;
}

/**
 * Backend policy, kept pure so the WebGPU -> WebGL fallback can be unit-tested
 * without a browser or a GPU. WebGPU is used only when the user allows it and
 * every probe succeeds; any miss keeps the original WebGL stack.
 */
export function decideRendererBackend(probe: RendererProbe): {
  backend: RendererBackend;
  reason: string;
} {
  if (probe.preference === 'webgl') {
    return { backend: 'webgl', reason: 'WebGL requested by renderer preference' };
  }
  if (!probe.hasGpu) return { backend: 'webgl', reason: 'navigator.gpu unavailable' };
  if (!probe.hasAdapter) return { backend: 'webgl', reason: 'no WebGPU adapter' };
  if (probe.error) return { backend: 'webgl', reason: `WebGPU init failed: ${probe.error}` };
  if (!probe.webgpuReady) {
    return { backend: 'webgl', reason: 'WebGPURenderer fell back to WebGL2' };
  }
  return { backend: 'webgpu', reason: 'WebGPU backend initialised' };
}

export function createWebGLRendererSelection(softwareGl: boolean, reason: string): RendererSelection {
  const renderer = new THREE.WebGLRenderer({
    antialias: !softwareGl && wantsMsaa(),
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
  const gpu = (navigator as GPUCapableNavigator).gpu;

  if (preference === 'webgl' || !gpu) {
    const decision = decideRendererBackend({
      preference,
      hasGpu: !!gpu,
      hasAdapter: false,
      webgpuReady: false,
    });
    return createWebGLRendererSelection(softwareGl, decision.reason);
  }

  let candidate: import('three/webgpu').WebGPURenderer | null = null;
  try {
    const adapter = await gpu.requestAdapter({ powerPreference: 'high-performance' });
    if (!adapter) {
      const decision = decideRendererBackend({
        preference,
        hasGpu: true,
        hasAdapter: false,
        webgpuReady: false,
      });
      return createWebGLRendererSelection(softwareGl, decision.reason);
    }

    const [webgpu, tsl, bloomModule, ssaoModule, dofModule] = await Promise.all([
      import('three/webgpu'),
      import('three/tsl'),
      import('three/addons/tsl/display/BloomNode.js'),
      import('three/addons/tsl/display/SSAONode.js'),
      import('three/addons/tsl/display/DepthOfFieldNode.js'),
    ]);
    candidate = new webgpu.WebGPURenderer({
      antialias: !softwareGl && wantsMsaa(),
      alpha: false,
      powerPreference: 'high-performance',
      trackTimestamp: true,
    });
    await candidate.init();

    const backend = candidate.backend as { isWebGPUBackend?: boolean };
    const decision = decideRendererBackend({
      preference,
      hasGpu: true,
      hasAdapter: true,
      webgpuReady: !!backend.isWebGPUBackend,
    });
    if (decision.backend === 'webgl') {
      candidate.dispose();
      return createWebGLRendererSelection(softwareGl, decision.reason);
    }

    return {
      backend: 'webgpu',
      renderer: candidate,
      reason: decision.reason,
      webgpuModule: webgpu,
      tslModule: tsl,
      bloomModule,
      ssaoModule,
      dofModule,
    };
  } catch (error) {
    candidate?.dispose();
    const message = error instanceof Error ? error.message : String(error);
    const decision = decideRendererBackend({
      preference,
      hasGpu: true,
      hasAdapter: true,
      webgpuReady: false,
      error: message,
    });
    return createWebGLRendererSelection(softwareGl, decision.reason);
  }
}
