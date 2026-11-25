import { useRef } from 'react';

type Point = { x: number; y: number };

/** Last-100ms velocity tracking from the fluid-interactions skill. */
class VelocityTracker {
  private samples: Array<{ t: number; x: number; y: number }> = [];

  reset() {
    this.samples = [];
  }

  add(x: number, y: number) {
    const t = performance.now();
    this.samples.push({ t, x, y });
    this.samples = this.samples.filter((s) => t - s.t < 100);
  }

  get(): Point {
    const now = performance.now();
    const recent = this.samples.filter((s) => now - s.t < 100);
    if (recent.length < 2) return { x: 0, y: 0 };
    const first = recent[0];
    const last = recent[recent.length - 1];
    const dt = (last.t - first.t) / 1000;
    if (dt === 0) return { x: 0, y: 0 };
    return { x: (last.x - first.x) / dt, y: (last.y - first.y) / dt };
  }
}

interface DragOptions {
  onStart?: (start: Point) => void;
  onMove: (delta: Point) => void;
  onEnd?: (velocity: Point) => void;
  /** Axis to commit to after ~10px, so taps and native scrolling still work. */
  lockAxis?: 'x' | 'y';
}

/**
 * Pointer drag with direction lock and a guaranteed end (pointercancel /
 * lostpointercapture included). Spread onto the element you want to drag.
 */
export function useDrag({ onStart, onMove, onEnd, lockAxis }: DragOptions) {
  const state = useRef<{ id: number | null; x: number; y: number; locked: 'x' | 'y' | null }>({
    id: null,
    x: 0,
    y: 0,
    locked: lockAxis ?? null,
  });
  const tracker = useRef(new VelocityTracker());

  const end = (e: React.PointerEvent<Element>) => {
    if (e.pointerId !== state.current.id) return;
    state.current.id = null;
    state.current.locked = lockAxis ?? null;
    if (e.currentTarget.hasPointerCapture(e.pointerId))
      e.currentTarget.releasePointerCapture(e.pointerId);
    onEnd?.(tracker.current.get());
  };

  return {
    onPointerDown: (e: React.PointerEvent<Element>) => {
      if (e.button !== 0 || e.ctrlKey) return;
      if (state.current.id !== null) return;
      e.stopPropagation();
      e.currentTarget.setPointerCapture(e.pointerId);
      state.current = { id: e.pointerId, x: e.clientX, y: e.clientY, locked: lockAxis ?? null };
      tracker.current.reset();
      tracker.current.add(e.clientX, e.clientY);
      onStart?.({ x: e.clientX, y: e.clientY });
    },
    onPointerMove: (e: React.PointerEvent<Element>) => {
      if (e.pointerId !== state.current.id) return;
      const dx = e.clientX - state.current.x;
      const dy = e.clientY - state.current.y;
      if (!state.current.locked && Math.hypot(dx, dy) > 10) {
        state.current.locked = Math.abs(dx) > Math.abs(dy) * 2 ? 'x' : 'y';
      }
      tracker.current.add(e.clientX, e.clientY);
      // Report only the committed axis: a horizontal flick must not drag the
      // card vertically, and a vertical drag must not slide it sideways.
      if (state.current.locked === 'x') onMove({ x: dx, y: 0 });
      else if (state.current.locked === 'y') onMove({ x: 0, y: dy });
      else onMove({ x: dx, y: dy });
    },
    onPointerUp: end,
    onPointerCancel: end,
    onLostPointerCapture: end,
  };
}
