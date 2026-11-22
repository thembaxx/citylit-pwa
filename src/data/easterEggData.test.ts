import assert from 'node:assert/strict';
import test from 'node:test';
import { EASTER_EGGS } from './easterEggs.ts';
import { LANDMARKS } from './landmarks.ts';

test('there is exactly one hidden detail per landmark', () => {
  assert.equal(Object.keys(EASTER_EGGS).length, LANDMARKS.length);
  const ids = new Set<string>();
  const hints = new Set<string>();
  for (const lm of LANDMARKS) {
    const egg = EASTER_EGGS[lm.k];
    assert.ok(egg, `missing easter egg for ${lm.k}`);
    assert.equal(egg.siteKey, lm.k);
    assert.ok(!ids.has(egg.id), `duplicate egg id ${egg.id}`);
    ids.add(egg.id);
    assert.ok(/^[a-z0-9-]+$/.test(egg.id), `non-kebab id ${egg.id}`);
    assert.ok(egg.label.trim().length > 0);
    assert.ok(egg.hint.trim().length > 8, `hint too short for ${lm.k}`);
    assert.ok(egg.fact.trim().length > 20, `fact too short for ${lm.k}`);
    hints.add(egg.hint);
  }
  assert.equal(hints.size, LANDMARKS.length, 'hints must be unique');
});

test('hidden details stay tiny and inside the plinth', () => {
  for (const egg of Object.values(EASTER_EGGS)) {
    assert.ok(egg.position.every(Number.isFinite), `bad position for ${egg.id}`);
    assert.ok(Math.abs(egg.position[0]) < 8 && Math.abs(egg.position[2]) < 8);
    assert.ok(egg.position[1] >= 0 && egg.position[1] < 5);
  }
});
