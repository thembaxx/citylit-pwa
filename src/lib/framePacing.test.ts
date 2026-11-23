import assert from 'node:assert/strict';
import test from 'node:test';
import {
  DEFAULT_QUIET_SECONDS,
  IDLE_QUIET_MS,
  IDLE_REDUCED_MS,
  IDLE_SOFTWARE_MS,
  frameThrottleMs,
  stageQuiet,
} from './framePacing.ts';

test('an active stage with no fps cap renders every frame', () => {
  assert.equal(
    frameThrottleMs({ fpsCapMs: 0, reducedStaticIdle: false, batterySoftIdle: false, quietIdle: false }),
    0
  );
});

test('idle classes use their own pacing (15 / 20 / 30 fps)', () => {
  const base = { fpsCapMs: 0, batterySoftIdle: false, quietIdle: false };
  assert.equal(frameThrottleMs({ ...base, reducedStaticIdle: true }), IDLE_REDUCED_MS);
  assert.equal(
    frameThrottleMs({ fpsCapMs: 0, reducedStaticIdle: false, batterySoftIdle: true, quietIdle: false }),
    IDLE_SOFTWARE_MS
  );
  assert.equal(
    frameThrottleMs({ fpsCapMs: 0, reducedStaticIdle: false, batterySoftIdle: false, quietIdle: true }),
    IDLE_QUIET_MS
  );
});

test('the strictest idle cap wins over other idle flags', () => {
  assert.equal(
    frameThrottleMs({ fpsCapMs: 0, reducedStaticIdle: true, batterySoftIdle: true, quietIdle: true }),
    IDLE_REDUCED_MS
  );
  assert.equal(
    frameThrottleMs({ fpsCapMs: 0, reducedStaticIdle: false, batterySoftIdle: true, quietIdle: true }),
    IDLE_SOFTWARE_MS
  );
});

test('a user fps cap is a ceiling, not an override of idle pacing', () => {
  const active = { fpsCapMs: 1000 / 60, reducedStaticIdle: false, batterySoftIdle: false, quietIdle: false };
  assert.equal(frameThrottleMs(active), 1000 / 60);
  const idle = { ...active, quietIdle: true };
  assert.equal(frameThrottleMs(idle), IDLE_QUIET_MS);
  const slowCap = { ...active, fpsCapMs: 100 };
  assert.equal(frameThrottleMs(slowCap), 100);
  assert.equal(frameThrottleMs({ ...slowCap, quietIdle: true }), 100);
});

test('stageQuiet requires both settled motion and elapsed idle time', () => {
  assert.equal(stageQuiet({ active: true, idleSeconds: 10 }), false);
  assert.equal(stageQuiet({ active: false, idleSeconds: DEFAULT_QUIET_SECONDS - 0.01 }), false);
  assert.equal(stageQuiet({ active: false, idleSeconds: DEFAULT_QUIET_SECONDS }), true);
  assert.equal(stageQuiet({ active: true, idleSeconds: 0 }), false);
});

test('stageQuiet supports the shorter hero reduced-motion threshold', () => {
  assert.equal(stageQuiet({ active: false, idleSeconds: 1.6, thresholdSeconds: 1.5 }), true);
  assert.equal(stageQuiet({ active: false, idleSeconds: 1.4, thresholdSeconds: 1.5 }), false);
});
