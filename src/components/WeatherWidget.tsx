import { GlobeHemisphereEast, Moon, Sun, SunDim, SunHorizon } from '@phosphor-icons/react';
import { getSeasonName, MONTHS } from '../data/weatherData';
import type { ForecastSlot, WeatherDisplayState } from '../types/citylit';
import { WeatherIcon } from './WeatherIcon';

interface WeatherWidgetProps {
  weather: WeatherDisplayState;
  expanded: boolean;
  month: number;
  bestMonths: string;
  forecast: ForecastSlot[];
  activeTimeHour: number;
  visible: boolean;
  globeOpen: boolean;
  onToggleExpand: () => void;
  onSelectTimePreset: (hour: number) => void;
  onChangeMonth: (month: number) => void;
  onTriggerRainbow: () => void;
  onToggleGlobe: () => void;
}

const TIME_PRESETS = [
  { label: 'Dawn', hour: 6.3, icon: SunHorizon },
  { label: 'Noon', hour: 13, icon: Sun },
  { label: 'Dusk', hour: 17.8, icon: SunDim },
  { label: 'Night', hour: 22, icon: Moon },
] as const;

export function WeatherWidget({
  weather,
  expanded,
  month,
  bestMonths,
  forecast,
  activeTimeHour,
  visible,
  globeOpen,
  onToggleExpand,
  onSelectTimePreset,
  onChangeMonth,
  onTriggerRainbow,
  onToggleGlobe,
}: WeatherWidgetProps) {
  if (!visible || globeOpen) return null;

  return (
    <div className={`weather-island ${expanded ? 'weather-island--expanded' : ''}`}>
      {!globeOpen && (
        <div
          className={`weather-panel bg-[#121319]/92 border border-white/15 squircle-card px-3 py-1.5 shadow-lg transition-all duration-300 ${
            expanded
              ? 'w-[min(350px,calc(100vw-72px))] py-3 px-4 overflow-y-auto overscroll-contain no-scrollbar'
              : 'max-w-[calc(100vw-78px)]'
          }`}
        >
          <button
            type="button"
            onClick={() => {
              onToggleExpand();
              onTriggerRainbow();
            }}
            aria-expanded={expanded}
            className="flex items-center gap-2.5 w-full text-left cursor-pointer"
          >
            <WeatherIcon
              condition={weather.condition}
              night={weather.night}
              size={28}
              className="shrink-0"
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline gap-1.5">
                <strong className="text-[15px] font-semibold text-[#f3efe6]">
                  {weather.temp}°C
                </strong>
                <span className="text-[12px] text-[#e8b04a] truncate">{weather.label}</span>
              </div>
              <div className="text-[11px] text-[#a9a69e] truncate">
                {weather.timeText} · {weather.city}
              </div>
            </div>
          </button>

          {expanded && (
            <div className="mt-3 pt-2.5 border-t border-white/10 space-y-2.5">
              <div className="weather-forecast grid grid-cols-5 gap-1 text-center">
                {forecast.map((slot) => (
                  <div
                    key={slot.label}
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
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-4 gap-1 bg-white/[0.04] p-1 rounded-xl border border-white/10">
                {TIME_PRESETS.map((preset) => {
                  const Icon = preset.icon;
                  const active = Math.abs(activeTimeHour - preset.hour) < 1.5;
                  return (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => onSelectTimePreset(preset.hour)}
                      className={`flex items-center justify-center gap-1 py-1.5 rounded-lg text-[11px] font-medium transition cursor-pointer ${
                        active
                          ? 'bg-[#e8b04a]/20 text-[#e8b04a] border border-[#e8b04a]/40'
                          : 'text-[#a9a69e] hover:text-[#f3efe6]'
                      }`}
                    >
                      <Icon size={13} />
                      <span>{preset.label}</span>
                    </button>
                  );
                })}
              </div>

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
                <div className="flex justify-between text-[10px] text-[#a9a69e]/75 mt-0.5">
                  <span>Jan</span>
                  <span>Apr</span>
                  <span>Jul</span>
                  <span>Oct</span>
                  <span>Dec</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <button
        type="button"
        onClick={onToggleGlobe}
        aria-label="Open 3D South Africa globe"
        title="3D South Africa Globe"
        className={`w-10 h-10 rounded-full grid place-items-center bg-[#121319]/92 border transition-colors cursor-pointer shrink-0 ${
          globeOpen
            ? 'border-[#e8b04a] text-[#e8b04a]'
            : 'border-white/15 text-[#f3efe6] hover:border-[#e8b04a] hover:text-[#e8b04a]'
        }`}
      >
        <GlobeHemisphereEast size={19} />
      </button>
    </div>
  );
}
