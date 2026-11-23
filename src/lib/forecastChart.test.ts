import assert from 'node:assert/strict';
import test from 'node:test';
import { buildForecastCurve, resolveSlotHour, shortestHourDelta } from './forecastChart.ts';

test('buildForecastCurve places points at exact column centers and bounds Y coordinates', () => {
  const slots = [
    { label: 'Now', condition: 'sun' as const, night: false, temp: 18, hour: 9 },
    { label: '12:00', condition: 'partly' as const, night: false, temp: 24, hour: 12 },
    { label: '15:00', condition: 'rain' as const, night: false, temp: 22, hour: 15 },
    { label: '18:00', condition: 'cloud' as const, night: false, temp: 16, hour: 18 },
    { label: '21:00', condition: 'sun' as const, night: true, temp: 12, hour: 21 },
  ];
  const curve = buildForecastCurve(slots, 300, 64);

  assert.equal(curve.minTemp, 12);
  assert.equal(curve.maxTemp, 24);
  assert.equal(curve.points.length, 5);
  assert.deepEqual(
    curve.points.map((p) => p.x),
    [30, 90, 150, 210, 270]
  );

  // Warmest temperature sits highest (smallest Y), coolest sits lowest (largest Y)
  assert.ok(curve.points[1].y < curve.points[0].y);
  assert.ok(curve.points[0].y < curve.points[4].y);
  assert.ok(curve.linePath.startsWith('M 30.00'));
  assert.ok(curve.areaPath.endsWith('Z'));
});

test('buildForecastCurve handles single slot, flat temperatures, and empty slot arrays', () => {
  const flat = buildForecastCurve(
    [
      { label: 'Now', condition: 'fog', night: false, temp: 15 },
      { label: '03:00', condition: 'fog', night: true, temp: 15 },
    ],
    200,
    60
  );
  assert.equal(flat.points.length, 2);
  assert.equal(flat.points[0].y, flat.points[1].y);

  const single = buildForecastCurve([
    { label: 'Now', condition: 'sun', night: false, temp: 21, hour: 11 },
  ]);
  assert.equal(single.points.length, 1);
  assert.equal(single.points[0].x, 150);
  assert.ok(single.linePath.startsWith('M 150.00'));

  const empty = buildForecastCurve([]);
  assert.equal(empty.points.length, 0);
  assert.equal(empty.linePath, '');
  assert.equal(empty.areaPath, '');
});

test('resolveSlotHour and shortestHourDelta handle label parsing and midnight wrap', () => {
  assert.equal(resolveSlotHour({ label: '18:00', condition: 'sun', night: false, temp: 20 }), 18);
  assert.equal(
    resolveSlotHour({ label: 'Now', condition: 'sun', night: true, temp: 14, hour: 23.5 }),
    23.5
  );
  assert.equal(
    resolveSlotHour({ label: 'Now', condition: 'sun', night: true, temp: 14 }, 25),
    1
  );
  assert.ok(Math.abs(shortestHourDelta(23, 1) - 2) < 1e-9);
});
