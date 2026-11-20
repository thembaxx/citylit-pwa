/**
 * ThreeRT host bridge (scaffold).
 *
 * ThreeRT (github.com/meshy-dev/ThreeRT) is a native, hardware-ray-traced
 * runtime with a three.js-style API. Its engine is MIT licensed, but its
 * clients are native apps — it is *not* a browser library, so a PWA cannot
 * simply `npm install` a path tracer into WebGL.
 *
 * This module defines the small capability contract the web app needs in
 * order to cooperate with a native host if one is present (for example a
 * desktop wrapper that loads the same scene through ThreeRT). When no host
 * exists, the app stays on its normal WebGL renderer — see docs/THREERT.md.
 */

export interface NativeCinematicHost {
  /** e.g. "ThreeRT", "0.1.0" — used only for diagnostics/UI. */
  readonly name: string;
  readonly version: string;
  /** Ask the host to render a high-quality still of the current scene. */
  captureFrame?(options?: { width?: number; height?: number; samples?: number }): Promise<string | null>;
  /** Ask the host to switch its renderer to path-traced lighting. */
  setCinematic?(enabled: boolean): void;
}

declare global {
  interface Window {
    // Native hosts inject a bridge with this exact name; keep it stable.
    // eslint-disable-next-line no-underscore-dangle
    __CITYLIT_NATIVE_HOST__?: NativeCinematicHost;
  }
}

function isHost(value: unknown): value is NativeCinematicHost {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<NativeCinematicHost>;
  return typeof candidate.name === 'string' && typeof candidate.version === 'string';
}

/** Returns the native host only when the embedder injected a valid bridge. */
export function detectNativeHost(): NativeCinematicHost | null {
  if (typeof window === 'undefined') return null;
  // eslint-disable-next-line no-underscore-dangle
  const host = window.__CITYLIT_NATIVE_HOST__;
  return isHost(host) ? host : null;
}

export function hasCinematicHost(): boolean {
  return detectNativeHost() !== null;
}

/**
 * Optional deep link a native host can register as a URL handler. This is a
 * convention, not a public ThreeRT API — it is intentionally inert in a
 * browser, where the link simply does nothing.
 */
export function nativeHostUrl(lat: number, lon: number): string | null {
  const host = detectNativeHost();
  if (!host) return null;
  return `threert://open?lat=${lat.toFixed(6)}&lon=${lon.toFixed(6)}&renderer=pathtraced`;
}
