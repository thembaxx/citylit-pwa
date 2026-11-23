import assert from 'node:assert/strict';
import test from 'node:test';
import { msUntilNextThemeBoundary, resolveAutoTheme, resolveTheme } from './theme.ts';

function localTime(hour: number, minute = 0): Date {
  return new Date(2026, 6, 15, hour, minute, 0, 0);
}

test('resolveAutoTheme switches to daylight between 06:00 and 18:59 local time', () => {
  assert.equal(resolveAutoTheme(localTime(5, 59)), 'dark');
  assert.equal(resolveAutoTheme(localTime(6, 0)), 'daylight');
  assert.equal(resolveAutoTheme(localTime(13, 30)), 'daylight');
  assert.equal(resolveAutoTheme(localTime(18, 59)), 'daylight');
  assert.equal(resolveAutoTheme(localTime(19, 0)), 'dark');
  assert.equal(resolveAutoTheme(localTime(23, 15)), 'dark');
  assert.equal(resolveAutoTheme(localTime(0, 0)), 'dark');
});

test('resolveTheme passes explicit themes through and resolves auto dynamically', () => {
  const noon = localTime(12, 0);
  const midnight = localTime(23, 0);
  assert.equal(resolveTheme('dark', noon), 'dark');
  assert.equal(resolveTheme('daylight', midnight), 'daylight');
  assert.equal(resolveTheme('studio', midnight), 'studio');
  assert.equal(resolveTheme('auto', noon), 'daylight');
  assert.equal(resolveTheme('auto', midnight), 'dark');
  assert.equal(resolveTheme(undefined, noon), 'daylight');
});

test('msUntilNextThemeBoundary targets 06:00 or 19:00 local time', () => {
  const beforeDawn = localTime(5, 30);
  const msDawn = msUntilNextThemeBoundary(beforeDawn);
  assert.equal(Math.round(msDawn / 60000), 30);

  const afternoon = localTime(18, 0);
  const msDusk = msUntilNextThemeBoundary(afternoon);
  assert.equal(Math.round(msDusk / 60000), 60);

  const lateNight = localTime(23, 0);
  const msNextDawn = msUntilNextThemeBoundary(lateNight);
  assert.equal(Math.round(msNextDawn / 3600000), 7);
});
