import { GlobeHemisphereEast, Moon, Sun, SunDim, SunHorizon } from '@phosphor-icons/react';
import { AnimatePresence, motion } from 'motion/react';
import { getSeasonName, MONTHS } from '../data/weatherData';
import type { ForecastSlot, WeatherDisplayState } from '../types/citylit';
import { EASE_SMOOTH_OUT, SPRING, swapTransition } from '../lib/motion';
import { WeatherIcon } from './WeatherIcon';
import { AnimatedNumber } from './ui/AnimatedNumber';
import { PillNavigation } from './ui/PillNavigation';

interface WeatherWidgetProps {
  weather: WeatherDisplayState;
  expanded: boolean;
  month: number;
  bestMonths: string;
  forecast: ForecastSlot[];
  activeTimeHour: number;
  visible: boolean;
  globeOpen: boolean;
  reducedMotion?: boolean;
  onToggleExpand: () => void;
  onSelectTimePreset: (hour: number) => void;
  onChangeMonth: (month: number) => void;
  onTriggerRainbow: () => void;
  onToggleGlobe: () => void;
}

type PresetKey = 'dawn' | 'noon' | 'dusk' | 'night';

const TIME_PRESETS: ReadonlyArray<{
  value: PresetKey;
  label: string;
  hour: number;
  icon: typeof Sun;
}> = [
  { value: 'dawn', label: 'Dawn', hour: 6.3, icon: SunHorizon },
  { value: 'noon', label: 'Noon', hour: 13, icon: Sun },
  { value: 'dusk', label: 'Dusk', hour: 17.8, icon: SunDim },
  { value: 'night', label: 'Night', hour: 22, icon: Moon },
];

export function WeatherWidget({
  weather,
  expanded,
  month,
  bestMonths,
  forecast,
  activeTimeHour,
  visible,
  globeOpen,
  reducedMotion = false,
  onToggleExpand,
  onSelectTimePreset,
  onChangeMonth,
  onTriggerRainbow,
  onToggleGlobe,
}: WeatherWidgetProps) {
  if (!visible || globeOpen) return null;

  const activePreset = TIME_PRESETS.find((p) => Math.abs(activeTimeHour - p.hour) < 1.5)?.value;

  return (
    <div className={`weather-island ${expanded ? 'weather-island--expanded' : ''}`}>
      <motion.div
        layout={!reducedMotion}
        transition={reducedMotion ? { duration: 0 } : SPRING.surface}
        className={`weather-panel bg-[#121319]/92 border border-white/15 squircle-card shadow-lg ${
          expanded
            ? 'w-[min(350px,calc(100vw-72px))] py-3 px-4 overflow-y-auto overscroll-contain no-scrollbar'
            : 'max-w-[calc(100vw-78px)] px-3 py-1.5'
        }`}
      >
        <motion.button
          type="button"
          whileTap={reducedMotion ? undefined : { scale: 0.985 }}
          onClick={() => {
            onToggleExpand();
            onTriggerRainbow();
          }}
          aria-expanded={expanded}
          className="flex items-center gap-2.5 w-full text-left cursor-pointer"
        >
          <motion.span layout={!reducedMotion} className="shrink-0">
            <WeatherIcon condition={weather.condition} night={weather.night} size={28} />
          </motion.span>
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline gap-1.5">
              <AnimatedNumber
                value={weather.temp}
                suffix="°C"
                className="text-[15px] font-semibold text-[#f3efe6]"
                reducedMotion={reducedMotion}
              />
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={weather.label}
                  initial={{ opacity: 0, y: 4, filter: 'blur(2px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, y: -4, filter: 'blur(2px)' }}
                  transition={swapTransition}
                  className="text-[12px] text-[#e8b04a] truncate"
                >
                  {weather.label}
                </motion.span>
              </AnimatePresence>
            </div>
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={weather.timeText}
                initial={{ opacity: 0, filter: 'blur(2px)' }}
                animate={{ opacity: 1, filter: 'blur(0px)' }}
                exit={{ opacity: 0, filter: 'blur(2px)' }}
                transition={swapTransition}
                className="text-[11px] font-mono tabular-nums text-[#a9a69e] truncate"
              >
                {weather.timeText} · {weather.city}
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.button>

        <AnimatePresence initial={false}>
          {expanded && (
            <motion.div
              key="weather-details"
              initial={{ opacity: 0, height: 0, filter: 'blur(2px)' }}
              animate={{ opacity: 1, height: 'auto', filter: 'blur(0px)' }}
              exit={{ opacity: 0, height: 0, filter: 'blur(0px)' }}
              transition={{ duration: reducedMotion ? 0 : 0.4, ease: EASE_SMOOTH_OUT }}
              className="overflow-hidden"
            >
              <div className="mt-3 pt-2.5 border-t border-white/10 space-y-2.5">
                <div className="weather-forecast grid grid-cols-5 gap-1 text-center">
                  {forecast.map((slot) => (
                    <motion.div
                      key={slot.label}
                      whileHover={reducedMotion ? undefined : { y: -2 }}
                      className="flex flex-col items-center py-1 rounded-lg bg-white/[0.03]"
                    >
                      <span className="text-[10px] text-[#a9a69e]">{slot.label}</span>
                      <WeatherIcon
                        condition={slot.condition}
                        night={slot.night}
                        size={18}
                        className="my-1"
                      />
                      <span className="text-[11px] font-medium text-[#f3efe6]">{slot.temp}°</span>
                    </motion.div>
                  ))}
                </div>

                <PillNavigation
                  layoutId="weather-time-preset"
                  reducedMotion={reducedMotion}
                  className="w-full justify-between"
                  value={(activePreset ?? 'noon') as PresetKey}
                  onChange={(key) =>
                    onSelectTimePreset(TIME_PRESETS.find((p) => p.value === key)!.hour)
                  }
                  options={TIME_PRESETS.map((preset) => {
                    const Icon = preset.icon;
                    return {
                      value: preset.value,
                      label: (
                        <>
                          <Icon size={13} />
                          <span>{preset.label}</span>
                        </>
                      ),
                      ariaLabel: `Set time to ${preset.label}`,
                    };
                  })}
                />

                <div>
                  <div className="flex items-center justify-between text-[11px] text-[#a9a69e] mb-1">
                    <span>
                      {getSeasonName(month)} · {MONTHS[month - 1]}
                    </span>
                    <span className="text-[#e8b04a]">Best: {bestMonths}</span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={12}
                    step={1}
                    value={month}
                    onChange={(e) => onChangeMonth(Number(e.target.value))}
                    aria-label="Select month"
                    className="w-full accent-[#e8b04a] cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] font-mono text-[#a9a69e]/75 mt-0.5">
                    <span>Jan</span>
                    <span>Apr</span>
                    <span>Jul</span>
                    <span>Oct</span>
                    <span>Dec</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <motion.button
        type="button"
        whileTap={reducedMotion ? undefined : { scale: 0.9 }}
        transition={SPRING.snappy}
        onClick={onToggleGlobe}
        aria-label="Open 3D South Africa globe"
        title="3D South Africa Globe"
        className={`w-10 h-10 rounded-full grid place-items-center bg-[#121319]/92 border cursor-pointer shrink-0 ${
          globeOpen
            ? 'border-[#e8b04a] text-[#e8b04a]'
            : 'border-white/15 text-[#f3efe6] hover:border-[#e8b04a] hover:text-[#e8b04a]'
        }`}
      >
        <GlobeHemisphereEast size={19} />
      </motion.button>
    </div>
  );
}
