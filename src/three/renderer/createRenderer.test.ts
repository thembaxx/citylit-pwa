import assert from 'node:assert/strict';
import test from 'node:test';
import { decideRendererBackend, readRendererPreference } from './createRenderer.ts';

/** Minimal `window` stand-in for the DOM bits read by readRendererPreference. */
interface StubWindow {
  location: { search: string };
  localStorage: {
    getItem(key: string): string | null;
    setItem(key: string, value: string): void;
  };
}

function withWindow(search: string, stored: Record<string, string>, run: () => void): void {
  const global = globalThis as unknown as { window?: StubWindow };
  const previous = global.window;
  global.window = {
    location: { search },
    localStorage: {
      getItem: (key: string) => stored[key] ?? null,
      setItem: () => {},
    },
  };
  try {
    run();
  } finally {
    if (previous === undefined) delete global.window;
    else global.window = previous;
  }
}

test('readRendererPreference gives the URL override priority over stored settings', () => {
  withWindow('?renderer=webgl', { 'cl-renderer-pref': 'webgpu' }, () => {
    assert.equal(readRendererPreference(), 'webgl');
  });
  withWindow('?renderer=webgpu', { 'cl-st': JSON.stringify({ renderer: 'webgl' }) }, () => {
    assert.equal(readRendererPreference(), 'webgpu');
  });
});

test('readRendererPreference honours the dedicated key, then the settings blob', () => {
  withWindow('', { 'cl-renderer-pref': 'webgpu' }, () => {
    assert.equal(readRendererPreference(), 'webgpu');
  });
  withWindow('', { 'cl-st': JSON.stringify({ renderer: 'webgl' }) }, () => {
    assert.equal(readRendererPreference(), 'webgl');
  });
  withWindow(
    '',
    {
      'cl-renderer-pref': 'webgpu',
      'cl-st': JSON.stringify({ renderer: 'webgl' }),
    },
    () => {
      assert.equal(readRendererPreference(), 'webgpu');
    }
  );
});

test('readRendererPreference defaults to auto for missing or invalid values', () => {
  withWindow('', {}, () => assert.equal(readRendererPreference(), 'auto'));
  withWindow('?renderer=canvas', { 'cl-renderer-pref': 'metal' }, () => {
    assert.equal(readRendererPreference(), 'auto');
  });
  withWindow('', { 'cl-st': '{not json' }, () => {
    assert.equal(readRendererPreference(), 'auto');
  });
});

test('decideRendererBackend selects WebGPU only when every probe succeeds', () => {
  assert.deepEqual(
    decideRendererBackend({
      preference: 'auto',
      hasGpu: true,
      hasAdapter: true,
      webgpuReady: true,
    }),
    { backend: 'webgpu', reason: 'WebGPU backend initialised' }
  );
});

test('decideRendererBackend falls back to WebGL when the user asks for it', () => {
  assert.deepEqual(
    decideRendererBackend({
      preference: 'webgl',
      hasGpu: true,
      hasAdapter: true,
      webgpuReady: true,
    }),
    { backend: 'webgl', reason: 'WebGL requested by renderer preference' }
  );
});

test('decideRendererBackend falls back to WebGL when WebGPU is unavailable', () => {
  assert.deepEqual(
    decideRendererBackend({
      preference: 'auto',
      hasGpu: false,
      hasAdapter: false,
      webgpuReady: false,
    }),
    { backend: 'webgl', reason: 'navigator.gpu unavailable' }
  );
  assert.deepEqual(
    decideRendererBackend({
      preference: 'webgpu',
      hasGpu: true,
      hasAdapter: false,
      webgpuReady: false,
    }),
    { backend: 'webgl', reason: 'no WebGPU adapter' }
  );
});

test('decideRendererBackend falls back to WebGL when init fails or three downgrades', () => {
  assert.deepEqual(
    decideRendererBackend({
      preference: 'webgpu',
      hasGpu: true,
      hasAdapter: true,
      webgpuReady: false,
      error: 'device lost',
    }),
    { backend: 'webgl', reason: 'WebGPU init failed: device lost' }
  );
  assert.deepEqual(
    decideRendererBackend({
      preference: 'auto',
      hasGpu: true,
      hasAdapter: true,
      webgpuReady: false,
    }),
    { backend: 'webgl', reason: 'WebGPURenderer fell back to WebGL2' }
  );
});
