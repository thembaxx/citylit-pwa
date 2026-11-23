import type { ForecastSlot } from '../types/citylit';

export interface ForecastPoint {
  x: number;
  y: number;
  temp: number;
  slot: ForecastSlot;
  index: number;
}

export interface ForecastCurveGeometry {
  width: number;
  height: number;
  minTemp: number;
  maxTemp: number;
  points: ForecastPoint[];
  linePath: string;
  areaPath: string;
}

const DEFAULT_WIDTH = 300;
const DEFAULT_HEIGHT = 64;
const TOP_PAD = 22;
const BOTTOM_PAD = 12;

export function resolveSlotHour(slot: ForecastSlot, fallbackHour = 12): number {
  if (typeof slot.hour === 'number' && Number.isFinite(slot.hour)) {
    return ((slot.hour % 24) + 24) % 24;
  }
  const match = /^(\d{1,2}):(\d{2})$/.exec(slot.label.trim());
  if (match) {
    const hh = Number(match[1]);
    const mm = Number(match[2]);
    if (Number.isFinite(hh) && Number.isFinite(mm)) {
      return (((hh + mm / 60) % 24) + 24) % 24;
    }
  }
  return ((fallbackHour % 24) + 24) % 24;
}

export function shortestHourDelta(a: number, b: number): number {
  const normA = ((a % 24) + 24) % 24;
  const normB = ((b % 24) + 24) % 24;
  const raw = Math.abs(normA - normB);
  return Math.min(raw, 24 - raw);
}

/**
 * Compute aligned SVG spline geometry for a series of forecast slots where
 * point `i` lands at the exact center of column `i` (`(i + 0.5) / count`).
 */
export function buildForecastCurve(
  slots: readonly ForecastSlot[],
  width = DEFAULT_WIDTH,
  height = DEFAULT_HEIGHT
): ForecastCurveGeometry {
  if (slots.length === 0) {
    return {
      width,
      height,
      minTemp: 0,
      maxTemp: 0,
      points: [],
      linePath: '',
      areaPath: '',
    };
  }

  let minTemp = Infinity;
  let maxTemp = -Infinity;
  for (let i = 0; i < slots.length; i++) {
    const t = slots[i].temp;
    if (t < minTemp) minTemp = t;
    if (t > maxTemp) maxTemp = t;
  }

  const span = Math.max(1, maxTemp - minTemp);
  const usableHeight = Math.max(8, height - TOP_PAD - BOTTOM_PAD);
  const count = slots.length;

  const points: ForecastPoint[] = slots.map((slot, i) => {
    const x = ((i + 0.5) / count) * width;
    const norm = maxTemp === minTemp ? 0.5 : (slot.temp - minTemp) / span;
    const y = TOP_PAD + (1 - norm) * usableHeight;
    return { x, y, temp: slot.temp, slot, index: i };
  });

  if (points.length === 1) {
    const p = points[0];
    const linePath = `M ${p.x.toFixed(2)} ${p.y.toFixed(2)}`;
    const areaPath = `M 0 ${height} L ${p.x.toFixed(2)} ${p.y.toFixed(2)} L ${width} ${height} Z`;
    return { width, height, minTemp, maxTemp, points, linePath, areaPath };
  }

  // Smooth cubic Bezier path passing cleanly through every slot temperature point.
  const tension = 0.22;
  let linePath = `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(points.length - 1, i + 2)];

    const cp1x = p1.x + (p2.x - p0.x) * tension;
    const cp1y = p1.y + (p2.y - p0.y) * tension;
    const cp2x = p2.x - (p3.x - p1.x) * tension;
    const cp2y = p2.y - (p3.y - p1.y) * tension;

    linePath += ` C ${cp1x.toFixed(2)} ${cp1y.toFixed(2)}, ${cp2x.toFixed(2)} ${cp2y.toFixed(2)}, ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`;
  }

  const first = points[0];
  const last = points[points.length - 1];
  const areaPath = `${linePath} L ${last.x.toFixed(2)} ${height} L ${first.x.toFixed(2)} ${height} Z`;

  return {
    width,
    height,
    minTemp,
    maxTemp,
    points,
    linePath,
    areaPath,
  };
}
