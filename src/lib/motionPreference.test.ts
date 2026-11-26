import assert from 'node:assert/strict';
import test from 'node:test';
import {
  getSystemMotionPreference,
  shouldReduceMotion,
  subscribeToMotionPreference,
} from './motionPreference.ts';

interface MotionMediaQuery {
  matches: boolean;
  addEventListener?: (type: 'change', listener: () => void) => void;
  removeEventListener?: (type: 'change', listener: () => void) => void;
  addListener?: (listener: () => void) => void;
  removeListener?: (listener: () => void) => void;
}

function withMatchMedia(query: MotionMediaQuery, run: () => void): void {
  const global = globalThis as unknown as { window?: { matchMedia: () => MotionMediaQuery } };
  const previous = global.window;
  global.window = { matchMedia: () => query };
  try {
    run();
  } finally {
    if (previous === undefined) delete global.window;
    else global.window = previous;
  }
}

test('auto motion follows the current system preference and explicit reduce always reduces', () => {
  assert.equal(shouldReduceMotion('auto', false), false);
  assert.equal(shouldReduceMotion('auto', true), true);
  assert.equal(shouldReduceMotion('reduce', false), true);
  assert.equal(shouldReduceMotion('reduce', true), true);
});

test('system preference safely defaults to no reduction outside a browser', () => {
  const global = globalThis as unknown as { window?: unknown };
  const previous = global.window;
  delete global.window;
  try {
    assert.equal(getSystemMotionPreference(), false);
  } finally {
    if (previous !== undefined) global.window = previous;
  }
});

test('live preference subscription attaches and removes the modern change listener', () => {
  let listener: (() => void) | undefined;
  let removed: (() => void) | undefined;
  withMatchMedia(
    {
      matches: false,
      addEventListener: (_type, next) => {
        listener = next;
      },
      removeEventListener: (_type, next) => {
        removed = next;
      },
    },
    () => {
      let changes = 0;
      const unsubscribe = subscribeToMotionPreference(() => changes++);
      listener?.();
      unsubscribe();
      assert.equal(changes, 1);
      assert.equal(removed, listener);
    }
  );
});

test('live preference subscription supports the legacy Safari media-query API', () => {
  let listener: (() => void) | undefined;
  let removed: (() => void) | undefined;
  withMatchMedia(
    {
      matches: true,
      addListener: (next) => {
        listener = next;
      },
      removeListener: (next) => {
        removed = next;
      },
    },
    () => {
      let changes = 0;
      const unsubscribe = subscribeToMotionPreference(() => changes++);
      listener?.();
      unsubscribe();
      assert.equal(changes, 1);
      assert.equal(removed, listener);
    }
  );
});
