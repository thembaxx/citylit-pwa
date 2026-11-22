import assert from 'node:assert/strict';
import test from 'node:test';
import { getSkyEvent, getUpcomingSkyEvents, SKY_CALENDAR_SIZE } from './skyEvents.ts';

test('calendar is small but covers all four kinds of real events', () => {
  assert.ok(SKY_CALENDAR_SIZE >= 20 && SKY_CALENDAR_SIZE <= 40);
  assert.equal(getSkyEvent(8, 12, 2026)?.kind, 'solar-eclipse');
  assert.equal(getSkyEvent(3, 3, 2026)?.kind, 'lunar-eclipse');
  assert.equal(getSkyEvent(12, 14, 2026)?.kind, 'meteor-shower');
  assert.equal(getSkyEvent(10, 12, 2024)?.kind, 'comet');
});

test('the right event appears on the right date', () => {
  const geminids = getSkyEvent(12, 14, 2026);
  assert.equal(geminids?.id, 'geminids');
  assert.equal(geminids?.intensity, 1);
  assert.equal(geminids?.when, '14 Dec');
  assert.equal(geminids?.cadence, 'Annual');

  const perseids = getSkyEvent(8, 8, 2026);
  assert.equal(perseids?.id, 'perseids');
  assert.ok(perseids!.intensity > 0 && perseids!.intensity < 1, 'outside the peak the shower fades');
});

test('dated eclipses only fire in their year and outrank a same-day shower', () => {
  const eclipse = getSkyEvent(8, 12, 2026);
  assert.equal(eclipse?.id, 'total-solar-2026-08-12');
  assert.equal(getSkyEvent(8, 12, 2027)?.id, 'perseids');
  assert.equal(getSkyEvent(2, 17, 2026)?.id, 'annular-solar-2026-02-17');
  assert.equal(getSkyEvent(2, 17, 2025), null);
});

test('windows wrap the year boundary and comets can peak in the next year', () => {
  assert.equal(getSkyEvent(1, 3, 2026)?.id, 'quadrantids');
  assert.equal(getSkyEvent(12, 30, 2025)?.id, 'quadrantids');
  const comet = getSkyEvent(1, 6, 2027);
  assert.equal(comet?.id, 'c2024-j3');
  assert.equal(comet?.when, '6 Jan 2027');
});

test('quiet dates have no event and invalid dates are clamped', () => {
  assert.equal(getSkyEvent(6, 15, 2026), null);
  assert.equal(getSkyEvent(8, 12, 2026)?.id, 'total-solar-2026-08-12');
  assert.equal(getSkyEvent(8, 99, 2026), null, 'day 99 clamps to month end');
  assert.equal(getSkyEvent(Number.NaN, 12, 2026), null);
});

test('upcoming events are chronological and skip the past', () => {
  const next = getUpcomingSkyEvents(11, 22, 2026, 4);
  assert.equal(next.length, 4);
  for (let i = 1; i < next.length; i++) {
    assert.ok(next[i - 1].when !== next[i].when);
  }
  assert.equal(next[0].id, 'geminids');
  assert.ok(next.some((event) => event.id === 'c2024-j3'));
});
