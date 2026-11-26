import type { MotionSetting } from '../types/citylit';

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

/** Read the operating-system motion preference, safely handling non-browser contexts. */
export function getSystemMotionPreference(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia(REDUCED_MOTION_QUERY).matches
  );
}

/** Subscribe to live OS accessibility changes (including older Safari listeners). */
export function subscribeToMotionPreference(onChange: () => void): () => void {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return () => {};
  }

  const query = window.matchMedia(REDUCED_MOTION_QUERY);
  if (typeof query.addEventListener === 'function') {
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }

  query.addListener(onChange);
  return () => query.removeListener(onChange);
}

/** Explicit app preference can request reduced motion; auto follows the OS. */
export function shouldReduceMotion(setting: MotionSetting, systemPreference: boolean): boolean {
  return setting === 'reduce' || (setting === 'auto' && systemPreference);
}
