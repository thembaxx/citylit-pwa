import { useId, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { ambientAudio } from '../audio/ambientAudio';
import { getForecastSlots, WEATHER_CONDITIONS } from '../data/weatherData';
import { buildForecastCurve, resolveSlotHour, shortestHourDelta } from '../lib/forecastChart';
import { SPRING } from '../lib/motion';
import type { ForecastSlot } from '../types/citylit';
import { WeatherIcon } from './WeatherIcon';

export interface HourlyForecastProps {
  /** Active landmark index used when deriving seasonal forecast slots. */
  landmarkIndex?: number;
  /** Active calendar month [1..12]. */
  month: number;
  /** Optional precomputed/live forecast slots; falls back to getForecastSlots(). */
  forecast?: ForecastSlot[];
  /** Current 3D scene time of day [0..24) for highlighting matching slot. */
  activeTimeHour?: number;
  reducedMotion?: boolean;
  /** Invoked when the user clicks an upcoming hour to preview that sky state. */
  onSelectHour?: (hour: number) => void;
}

const CHART_W = 300;
const CHART_H = 64;

export function HourlyForecast({
  landmarkIndex = 0,
  month,
  forecast,
  activeTimeHour,
  reducedMotion = false,
  onSelectHour,
}: HourlyForecastProps) {
  const gradId = useId();
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const slots = useMemo(
    () => (forecast && forecast.length > 0 ? forecast : getForecastSlots(landmarkIndex, month)),
    [forecast, landmarkIndex, month]
  );

  const curve = useMemo(() => buildForecastCurve(slots, CHART_W, CHART_H), [slots]);

  const activeSlotIndex = useMemo(() => {
    if (hoveredIndex !== null && hoveredIndex < slots.length) return hoveredIndex;
    if (typeof activeTimeHour !== 'number' || !Number.isFinite(activeTimeHour)) return 0;
    let bestIdx = 0;
    let bestDelta = Infinity;
    for (let i = 0; i < slots.length; i++) {
      const h = resolveSlotHour(slots[i], activeTimeHour);
      const d = shortestHourDelta(h, activeTimeHour);
      if (d < bestDelta) {
        bestDelta = d;
        bestIdx = i;
      }
    }
    return bestDelta <= 1.5 ? bestIdx : -1;
  }, [hoveredIndex, slots, activeTimeHour]);

  if (slots.length === 0) {
    return (
      <div className="rounded-lg border border-white/10 bg-white/[0.025] px-3 py-2.5 text-[11px] text-[#7f7d77]">
        Hourly forecast unavailable.
      </div>
    );
  }

  const focusedSlot = hoveredIndex !== null ? slots[hoveredIndex] : undefined;
  const focusedLabel = focusedSlot
    ? `${focusedSlot.night && focusedSlot.condition === 'sun' ? 'Clear night' : WEATHER_CONDITIONS[focusedSlot.condition].label}`
    : null;
  const colWidth = CHART_W / slots.length;

  return (
    <section
      aria-label="Upcoming hourly weather forecast"
      className="weather-forecast rounded-lg border border-white/10 bg-white/[0.025] px-2 pt-2.5 pb-1.5"
    >
      <div className="flex items-baseline justify-between gap-2 px-1.5 mb-1">
        <span className="text-[11px] font-medium text-[#d6d1c6] whitespace-nowrap">
          Hourly outlook
        </span>
        {focusedSlot && focusedLabel ? (
          <span className="text-[10.5px] font-mono tabular-nums text-[#e8b04a] truncate">
            {focusedSlot.label} · {focusedLabel} · {focusedSlot.temp}°
          </span>
        ) : (
          <span className="text-[10.5px] font-mono tabular-nums text-[#a9a69e] whitespace-nowrap">
            <span>{curve.minTemp}°</span>
            <span className="mx-1 text-white/30">–</span>
            <span className="text-[#e8b04a]">{curve.maxTemp}°C</span>
          </span>
        )}
      </div>

      {/* Smooth temperature curve aligned 1:1 above slot columns */}
      <svg
        viewBox={`0 0 ${CHART_W} ${CHART_H}`}
        className="w-full h-16 overflow-visible block"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id={`area-${gradId}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#e8b04a" stopOpacity="0.28" />
            <stop offset="72%" stopColor="#e8b04a" stopOpacity="0.06" />
            <stop offset="100%" stopColor="#e8b04a" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Subtle night-hour atmospheric band */}
        {slots.map((slot, i) =>
          slot.night ? (
            <rect
              key={`night-${slot.label}-${i}`}
              x={i * colWidth}
              y={4}
              width={colWidth}
              height={CHART_H - 6}
              rx={4}
              fill="rgba(126, 156, 214, 0.06)"
            />
          ) : null
        )}

        {/* Vertical guide ticks from curve point to slot axis */}
        {curve.points.map((pt, i) => {
          const isFocus = i === activeSlotIndex;
          return (
            <line
              key={`guide-${pt.slot.label}-${i}`}
              x1={pt.x}
              y1={pt.y + 4}
              x2={pt.x}
              y2={CHART_H - 2}
              stroke={isFocus ? 'rgba(232, 176, 74, 0.45)' : 'rgba(255, 255, 255, 0.08)'}
              strokeWidth={isFocus ? 1.2 : 0.8}
              strokeDasharray={isFocus ? undefined : '2 2'}
            />
          );
        })}

        {/* Area & temperature trend spline */}
        <motion.path
          d={curve.areaPath}
          fill={`url(#area-${gradId})`}
          initial={reducedMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: reducedMotion ? 0 : 0.35 }}
        />
        <motion.path
          d={curve.linePath}
          fill="none"
          stroke="#e8b04a"
          strokeWidth={1.75}
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={reducedMotion ? false : { pathLength: 0.15, opacity: 0.4 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={reducedMotion ? { duration: 0 } : { duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        />

        {/* Vertex points & tabular temperature labels */}
        {curve.points.map((pt, i) => {
          const isFocus = i === activeSlotIndex;
          const isHot = pt.temp === curve.maxTemp && curve.maxTemp > curve.minTemp;
          return (
            <g key={`pt-${pt.slot.label}-${i}`}>
              <circle
                cx={pt.x}
                cy={pt.y}
                r={isFocus ? 4 : 2.8}
                fill={isFocus ? '#f3efe6' : '#121319'}
                stroke="#e8b04a"
                strokeWidth={isFocus ? 2 : 1.5}
              />
              <text
                x={pt.x}
                y={Math.max(11, pt.y - 8)}
                textAnchor="middle"
                fill={isFocus || isHot ? '#f3efe6' : '#d6d1c6'}
                fontSize={10.5}
                fontWeight={isFocus || isHot ? 600 : 500}
                className="font-mono tabular-nums"
              >
                {pt.temp}°
              </text>
            </g>
          );
        })}
      </svg>

      {/* Interactive column buttons aligned beneath curve points */}
      <div
        className="grid gap-0.5 mt-0.5"
        style={{ gridTemplateColumns: `repeat(${slots.length}, minmax(0, 1fr))` }}
      >
        {slots.map((slot, i) => {
          const isFocus = i === activeSlotIndex;
          const condText =
            slot.night && slot.condition === 'sun'
              ? 'Clear night'
              : WEATHER_CONDITIONS[slot.condition].label;
          return (
            <motion.button
              key={`${slot.label}-${i}`}
              type="button"
              whileTap={reducedMotion ? undefined : { scale: 0.96 }}
              transition={SPRING.snappy}
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
              onFocus={() => setHoveredIndex(i)}
              onBlur={() => setHoveredIndex(null)}
              onClick={() => {
                ambientAudio.playUi('tick');
                const targetHour = resolveSlotHour(slot, activeTimeHour ?? 12);
                onSelectHour?.(targetHour);
              }}
              aria-label={`${slot.label}, ${condText}, ${slot.temp} degrees Celsius`}
              className={`flex flex-col items-center justify-center min-h-[44px] py-1 rounded-lg transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#e8b04a] ${
                isFocus ? 'bg-white/[0.07]' : 'hover:bg-white/[0.04]'
              }`}
            >
              <WeatherIcon
                condition={slot.condition}
                night={slot.night}
                size={17}
                className="mb-1"
              />
              <span
                className={`text-[10px] font-mono tabular-nums leading-none whitespace-nowrap ${
                  isFocus ? 'text-[#e8b04a] font-medium' : 'text-[#a9a69e]'
                }`}
              >
                {slot.label}
              </span>
            </motion.button>
          );
        })}
      </div>
    </section>
  );
}
