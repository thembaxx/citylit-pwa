/**
 * UI safe-area registry.
 *
 * Several fixed HUD surfaces (the landmark card, the Places slice card, the
 * info / search drawers) cover part of the WebGL canvas. The 3D stage needs to
 * know how much of the viewport is actually visible so it can frame the
 * diorama inside the free area instead of behind a panel.
 *
 * Each surface publishes its own footprint under a stable source key. The
 * registry merges the footprints (widest wins per edge) so two overlapping
 * surfaces can never fight over the same edge, and CSS mirrors the result so
 * plain CSS can react to the same numbers.
 */

import { mergeInsets, type UiInsets } from './viewportFraming';

export interface SafeAreaInsets {
  /** Pixels covered along the top edge. */
  top: number;
  /** Pixels covered along the right edge. */
  right: number;
  /** Pixels covered along the bottom edge. */
  bottom: number;
  /** Pixels covered along the left edge. */
  left: number;
}

export type SafeAreaSource = string;

const EMPTY: SafeAreaInsets = { top: 0, right: 0, bottom: 0, left: 0 };

const sources = new Map<SafeAreaSource, SafeAreaInsets>();
const listeners = new Set<() => void>();

function merged(): SafeAreaInsets {
  let total: UiInsets = { top: 0, right: 0, bottom: 0, left: 0 };
  for (const insets of sources.values()) {
    total = mergeInsets(total, insets);
  }
  return total;
}

function publish(): void {
  const mergedInsets = merged();
  // The DOM mirror is for plain CSS only; the registry itself stays usable
  // in a non-browser context (tests, SSR).
  if (typeof document !== 'undefined') {
    const style = document.documentElement.style;
    style.setProperty('--cl-safe-top', `${mergedInsets.top}px`);
    style.setProperty('--cl-safe-right', `${mergedInsets.right}px`);
    style.setProperty('--cl-safe-bottom', `${mergedInsets.bottom}px`);
    style.setProperty('--cl-safe-left', `${mergedInsets.left}px`);
  }
  for (const listener of listeners) listener();
}

/** Publish (or replace) the footprint of one HUD surface. */
export function setSafeArea(source: SafeAreaSource, insets: Partial<SafeAreaInsets>): void {
  const next = { ...EMPTY, ...insets };
  const current = sources.get(source);
  if (
    current &&
    current.top === next.top &&
    current.right === next.right &&
    current.bottom === next.bottom &&
    current.left === next.left
  ) {
    return;
  }
  sources.set(source, next);
  publish();
}

/** Remove a surface's footprint, e.g. when its drawer closes. */
export function clearSafeArea(source: SafeAreaSource): void {
  if (!sources.delete(source)) return;
  publish();
}

/** The merged footprint of every registered surface. */
export function getSafeArea(): SafeAreaInsets {
  return merged();
}

/** Subscribe to safe-area changes (after any `setSafeArea` / `clearSafeArea`). */
export function onSafeAreaChange(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
