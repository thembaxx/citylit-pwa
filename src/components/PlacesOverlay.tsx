import {
  ArrowLeft,
  ArrowSquareOut,
  ArrowUpRight,
  BookmarkSimple,
  CaretLeft,
  CaretRight,
  CheckCircle,
  Clock,
  CloudFog,
  CloudRain,
  CloudSnow,
  CloudSun,
  Compass,
  DotsThree,
  GlobeHemisphereEast,
  MapPin,
  SpeakerHigh,
  SpeakerSlash,
  Stack,
  Tag,
  X,
  type Icon,
} from '@phosphor-icons/react';
import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { LANDMARKS, PROVINCES } from '../data/landmarks';
import { getMonthCondition } from '../data/weatherData';
import {
  HIGHLIGHT_COLORS,
  resolveExplorerEditorial,
  resolvePlaceEditorial,
  type PlaceEditorial,
} from '../lib/placeEditorial';
import { DURATION, EASE_SMOOTH_OUT, PRESS_SCALE, SPRING } from '../lib/motion';
import { TIME_PRESETS } from '../lib/timePresets';
import type { PlacesSelectionInfo, PlacesWeatherMode } from '../three/placesScene';
import { PLACE_SLICE_SPECS } from '../three/placesSliceBuilders';
import type { SavedCustomPlace, WeatherDisplayState } from '../types/citylit';
import { WeatherIcon, type WeatherIconCondition } from './WeatherIcon';
import { Menu, type MenuItem } from './ui/Menu';

interface PlacesOverlayProps {
  open: boolean;
  activeProvince: string;
  selectedPlace: PlacesSelectionInfo | null;
  visited: Set<number>;
  weather: WeatherDisplayState;
  weatherMode: PlacesWeatherMode;
  activeTimeHour: number;
  soundOn: boolean;
  activeExplorerCoords?: { lat: number; lon: number } | null;
  savedPlaces?: readonly SavedCustomPlace[];
  reducedMotion?: boolean;
  onSelectProvince: (province: string) => void;
  onStepSlice: (dir: 1 | -1) => void;
  onOpenLandmark: (landmarkIndex: number) => void;
  onBackToLandmarks: () => void;
  onResetView: () => void;
  onSwitchToGlobe: () => void;
  onToggleSound: () => void;
  onFocusHighlight: (index: number) => void;
  onToggleSection: (active: boolean) => void;
  onSelectTimePreset: (hour: number) => void;
  onSelectWeatherMode: (mode: PlacesWeatherMode) => void;
  onToggleSavePlace?: (place: { lat: number; lon: number; label: string; detail: string }) => void;
  onOpenSavedPlace?: (place: SavedCustomPlace) => void;
  onRemoveSavedPlace?: (id: string) => void;
  onClose: () => void;
}

const QUICK_TIMES = TIME_PRESETS.map(({ label, hour }) => ({ label, hour }));

const WEATHER_MODES: ReadonlyArray<{ id: PlacesWeatherMode; label: string }> = [
  { id: 'auto', label: 'Auto' },
  { id: 'rain', label: 'Rain' },
  { id: 'snow', label: 'Snow' },
  { id: 'fog', label: 'Mist' },
];

const MOBILE_WEATHER_ICONS: Record<PlacesWeatherMode, Icon> = {
  auto: CloudSun,
  rain: CloudRain,
  snow: CloudSnow,
  fog: CloudFog,
};

/**
 * The condition the selected slice's info card should mirror. When the user
 * forces an atmosphere mode (rain / snow / mist) it wins, so the glyph always
 * matches what is actually falling in the diorama; otherwise it reflects the
 * landmark's typical condition for the current month and time of day.
 */
function placeCardCondition(
  weatherMode: PlacesWeatherMode,
  index: number,
  hour: number
): WeatherIconCondition {
  if (weatherMode === 'rain') return 'rain';
  if (weatherMode === 'snow') return 'snow';
  if (weatherMode === 'fog') return 'fog';
  return getMonthCondition(index, Math.min(12, Math.max(1, new Date().getMonth() + 1)), hour).k;
}

/** Compact marker chips: the same editorial grammar the diorama card ships. */
function EditorialMarkers({
  editorial,
  onFocusHighlight,
  reducedMotion,
}: {
  editorial: PlaceEditorial | null;
  onFocusHighlight: (index: number) => void;
  reducedMotion: boolean;
}) {
  if (!editorial || editorial.highlights.length === 0) return null;
  return (
    <div
      role="group"
      aria-label="Editorial field markers"
      className="mt-2 flex flex-wrap gap-1.5"
    >
      {editorial.highlights.map((highlight, index) => (
        <motion.button
          key={highlight.id}
          type="button"
          whileTap={reducedMotion ? undefined : { scale: PRESS_SCALE }}
          transition={SPRING.snappy}
          onClick={() => onFocusHighlight(index)}
          title={`${highlight.label}: ${highlight.text} — tap to focus the camera`}
          className="inline-flex items-center gap-1.5 max-w-[160px] px-2 py-1 rounded-full border border-white/15 bg-white/[0.05] text-[10.5px] text-[#f3efe6] hover:border-[#e8b04a] hover:text-[#e8b04a] transition-colors cursor-pointer"
        >
          <span
            aria-hidden="true"
            className="size-1.5 rounded-full shrink-0"
            style={{ backgroundColor: HIGHLIGHT_COLORS[highlight.category] }}
          />
          <span className="truncate">{highlight.label}</span>
        </motion.button>
      ))}
    </div>
  );
}

function EditorialSources({ editorial }: { editorial: PlaceEditorial | null }) {
  if (!editorial) return null;
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-[10px] text-[#a9a69e]">
      <span className="inline-flex items-center gap-1">
        <Tag size={10} /> Marker positions are illustrative, not survey-accurate
      </span>
      {editorial.sources.map((source) => (
        <a
          key={source.label}
          href={source.url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-[#e8b04a] hover:underline"
        >
          {source.label}
          <ArrowSquareOut size={10} />
        </a>
      ))}
    </div>
  );
}

export function PlacesOverlay({
  open,
  activeProvince,
  selectedPlace,
  visited,
  weather,
  weatherMode,
  activeTimeHour,
  soundOn,
  activeExplorerCoords = null,
  savedPlaces = [],
  reducedMotion = false,
  onSelectProvince,
  onStepSlice,
  onOpenLandmark,
  onBackToLandmarks,
  onResetView,
  onSwitchToGlobe,
  onToggleSound,
  onFocusHighlight,
  onToggleSection,
  onSelectTimePreset,
  onSelectWeatherMode,
  onToggleSavePlace,
  onOpenSavedPlace,
  onRemoveSavedPlace,
  onClose,
}: PlacesOverlayProps) {
  // Remounted on every open via a key in App, so this never shows a stale
  // pressed state after the engine clears the section camera on close.
  const [sectionActive, setSectionActive] = useState(false);
  const handleToggleSection = () => {
    const next = !sectionActive;
    setSectionActive(next);
    onToggleSection(next);
  };
  if (!open) return null;

  const matchingSpecs =
    activeProvince === 'All'
      ? PLACE_SLICE_SPECS
      : PLACE_SLICE_SPECS.filter((s) => s.province === activeProvince);
  const currentPosInFilter = selectedPlace
    ? Math.max(
        0,
        matchingSpecs.findIndex((s) => s.landmarkIndex === selectedPlace.landmarkIndex)
      )
    : 0;
  const activeLandmark = selectedPlace ? LANDMARKS[selectedPlace.landmarkIndex] : null;
  const isVisited = selectedPlace ? visited.has(selectedPlace.landmarkIndex) : false;
  const editorial = selectedPlace
    ? selectedPlace.landmarkIndex >= 0
      ? resolvePlaceEditorial(selectedPlace.landmarkIndex)
      : resolveExplorerEditorial({
          label: selectedPlace.explorer?.label ?? 'Coordinate explorer',
          detail: selectedPlace.explorer?.detail ?? '',
          stats: selectedPlace.explorer?.stats ?? {
            buildings: 0,
            roads: 0,
            water: 0,
            green: 0,
            elevation: 0,
          },
          coords: activeExplorerCoords ?? { lat: 0, lon: 0 },
        })
    : null;
  const cardCondition =
    selectedPlace && selectedPlace.landmarkIndex >= 0
      ? placeCardCondition(weatherMode, selectedPlace.landmarkIndex, activeTimeHour)
      : weather.condition;

  const isExplorerSaved =
    activeExplorerCoords !== null &&
    savedPlaces.some(
      (p) =>
        Math.abs(p.lat - activeExplorerCoords.lat) < 0.0002 &&
        Math.abs(p.lon - activeExplorerCoords.lon) < 0.0002
    );

  const headerMenuItems: MenuItem[] = [
    { icon: Compass, label: 'Reset camera view', onSelect: onResetView },
    {
      icon: soundOn ? SpeakerHigh : SpeakerSlash,
      label: soundOn ? 'Mute ambient sound' : 'Unmute ambient sound',
      onSelect: onToggleSound,
    },
    { icon: ArrowLeft, label: 'Back to landmarks', onSelect: onBackToLandmarks },
    {
      icon: GlobeHemisphereEast,
      label: 'Open 3D South Africa globe',
      onSelect: onSwitchToGlobe,
    },
  ];

  const timeWeatherMenuItems: MenuItem[] = [
    ...QUICK_TIMES.map((preset) => ({
      icon: Clock,
      label: preset.label,
      selected: Math.abs(activeTimeHour - preset.hour) < 1.5,
      onSelect: () => onSelectTimePreset(preset.hour),
    })),
    ...WEATHER_MODES.map((mode) => ({
      icon: MOBILE_WEATHER_ICONS[mode.id],
      label: mode.label,
      selected: weatherMode === mode.id,
      onSelect: () => onSelectWeatherMode(mode.id),
    })),
  ];

  return (
    <div className="fixed inset-0 z-20 pointer-events-none">
      {/* Top Header Row */}
      <div className="absolute left-3.5 sm:left-4 top-[calc(14px+env(safe-area-inset-top,0px))] right-3.5 sm:right-4 flex items-center justify-between gap-2">
        <div className="min-w-0 drop-shadow-[0_1px_8px_rgba(0,0,0,0.85)]">
          <div className="font-serif-display italic text-[19px] sm:text-[22px] text-[#f3efe6] leading-tight whitespace-nowrap">
            South Africa
          </div>
          <div className="text-[10.5px] sm:text-[11px] uppercase tracking-[0.12em] text-[#e8b04a] mt-0.5 truncate">
            {activeProvince === 'All'
              ? `Places · ${PLACE_SLICE_SPECS.length} Slices`
              : `${activeProvince} · ${matchingSpecs.length}`}
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 pointer-events-auto">
          <motion.button
            type="button"
            whileTap={reducedMotion ? undefined : { scale: PRESS_SCALE }}
            transition={SPRING.snappy}
            onClick={onToggleSound}
            aria-label={soundOn ? 'Mute ambient sound' : 'Unmute ambient sound'}
            title="Ambient sound"
            className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full grid place-items-center bg-[#121319]/92 border transition-colors cursor-pointer shadow-lg ${
              soundOn
                ? 'border-[#e8b04a] text-[#e8b04a]'
                : 'border-white/15 text-[#f3efe6] hover:border-[#e8b04a] hover:text-[#e8b04a]'
            }`}
          >
            {soundOn ? <SpeakerHigh size={16} /> : <SpeakerSlash size={16} />}
          </motion.button>

          <motion.button
            type="button"
            whileTap={reducedMotion ? undefined : { scale: PRESS_SCALE }}
            transition={SPRING.snappy}
            onClick={onResetView}
            aria-label="Reset camera view"
            title="Reset camera view"
            className="hidden sm:grid w-10 h-10 rounded-full place-items-center bg-[#121319]/92 border border-white/15 text-[#f3efe6] hover:border-[#e8b04a] hover:text-[#e8b04a] transition-colors cursor-pointer shadow-lg"
          >
            <Compass size={17} />
          </motion.button>

          <motion.button
            type="button"
            whileTap={reducedMotion ? undefined : { scale: PRESS_SCALE }}
            transition={SPRING.snappy}
            onClick={onBackToLandmarks}
            aria-label="Back to landmarks"
            title="Back to the landmark diorama"
            className="h-9 sm:h-10 px-3 sm:px-3.5 rounded-full inline-flex items-center gap-1.5 bg-[#121319]/92 border border-white/15 text-[12.5px] sm:text-[13px] font-medium text-[#f3efe6] hover:border-[#e8b04a] hover:text-[#e8b04a] transition-colors cursor-pointer shadow-lg"
          >
            <ArrowLeft size={15} weight="bold" />
            <span className="hidden sm:inline">Landmarks</span>
          </motion.button>

          <motion.button
            type="button"
            whileTap={reducedMotion ? undefined : { scale: PRESS_SCALE }}
            transition={SPRING.snappy}
            onClick={onSwitchToGlobe}
            aria-label="Switch to 3D South Africa globe"
            title="Switch to 3D Globe"
            className="h-9 sm:h-10 px-3 sm:px-3.5 rounded-full inline-flex items-center gap-1.5 bg-[#121319]/92 border border-white/15 text-[12.5px] sm:text-[13px] font-medium text-[#f3efe6] hover:border-[#e8b04a] hover:text-[#e8b04a] transition-colors cursor-pointer shadow-lg"
          >
            <GlobeHemisphereEast size={15} weight="bold" />
            <span className="hidden sm:inline">Globe</span>
          </motion.button>

          <motion.button
            type="button"
            whileTap={reducedMotion ? undefined : { scale: PRESS_SCALE }}
            transition={SPRING.snappy}
            onClick={onClose}
            aria-label="Close Places archipelago"
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full grid place-items-center bg-[#121319]/92 border border-white/15 text-[#f3efe6] hover:border-[#e8b04a] hover:text-[#e8b04a] transition-colors cursor-pointer shadow-lg"
          >
            <X size={17} />
          </motion.button>

          <Menu
            ariaLabel="Places view actions"
            reducedMotion={reducedMotion}
            items={headerMenuItems}
            trigger={
              <motion.button
                type="button"
                whileTap={reducedMotion ? undefined : { scale: PRESS_SCALE }}
                aria-label="More Places actions"
                title="More actions"
                className="sm:hidden w-9 h-9 rounded-full grid place-items-center bg-[#121319]/92 border border-white/15 text-[#f3efe6] hover:border-[#e8b04a] hover:text-[#e8b04a] transition-colors cursor-pointer shadow-lg"
              >
                <DotsThree size={17} weight="bold" />
              </motion.button>
            }
          />
        </div>
      </div>

      {/* Live Engine Weather, Time-of-Day & Bookmarked Coordinates Strip */}
      <div className="absolute left-3.5 sm:left-4 top-[calc(62px+env(safe-area-inset-top,0px))] max-w-[calc(100vw-28px)] space-y-1.5 pointer-events-auto">
        <div className="flex flex-wrap items-center gap-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#121319]/90 border border-white/15 text-[11.5px] text-[#f3efe6] shadow-md">
            <WeatherIcon condition={weather.condition} night={weather.night} size={16} />
            <span className="font-semibold tabular-nums">{weather.temp}°C</span>
            <span className="text-[#a9a69e] hidden sm:inline">· {weather.label}</span>
          </div>

          <Menu
            ariaLabel="Time and weather controls"
            reducedMotion={reducedMotion}
            items={timeWeatherMenuItems}
            trigger={
              <motion.button
                type="button"
                whileTap={reducedMotion ? undefined : { scale: PRESS_SCALE }}
                aria-label="Time and weather controls"
                className="sm:hidden inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#121319]/90 border border-white/15 text-[11px] text-[#f3efe6] shadow-md cursor-pointer"
              >
                <Clock size={13} className="text-[#e8b04a]" />
                <span>Time &amp; weather</span>
              </motion.button>
            }
          />

          <div className="hidden sm:inline-flex items-center p-0.5 rounded-full bg-[#121319]/90 border border-white/15 shadow-md">
            {QUICK_TIMES.map((preset) => {
              const active = Math.abs(activeTimeHour - preset.hour) < 1.5;
              return (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => onSelectTimePreset(preset.hour)}
                  className={`px-2.5 py-0.5 rounded-full text-[11px] transition-colors cursor-pointer ${
                    active
                      ? 'bg-[#e8b04a] text-[#1a1405] font-semibold'
                      : 'text-[#a9a69e] hover:text-[#f3efe6]'
                  }`}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>

          <div
            role="group"
            aria-label="Atmosphere shader mode"
            className="hidden sm:inline-flex items-center p-0.5 rounded-full bg-[#121319]/90 border border-white/15 shadow-md"
          >
            {WEATHER_MODES.map((wm) => {
              const active = weatherMode === wm.id;
              return (
                <button
                  key={wm.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => onSelectWeatherMode(wm.id)}
                  className={`px-2.5 py-0.5 rounded-full text-[11px] transition-colors cursor-pointer ${
                    active
                      ? 'bg-[#e8b04a] text-[#1a1405] font-semibold'
                      : 'text-[#a9a69e] hover:text-[#f3efe6]'
                  }`}
                >
                  {wm.label}
                </button>
              );
            })}
          </div>
        </div>

        {savedPlaces.length > 0 && onOpenSavedPlace && (
          <div className="flex flex-wrap items-center gap-1.5">
            {savedPlaces.map((sp) => (
              <div
                key={sp.id}
                className="inline-flex items-center rounded-full bg-[#121319]/90 border border-[#5cd6a9]/40 shadow-md overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => onOpenSavedPlace(sp)}
                  className="inline-flex items-center gap-1 pl-2.5 pr-1.5 py-1 text-[11px] text-[#d9f7eb] hover:text-[#5cd6a9] cursor-pointer"
                >
                  <MapPin size={11} weight="fill" className="text-[#5cd6a9]" />
                  <span>{sp.label}</span>
                </button>
                {onRemoveSavedPlace && (
                  <button
                    type="button"
                    onClick={() => onRemoveSavedPlace(sp.id)}
                    aria-label={`Remove saved place ${sp.label}`}
                    className="pr-2 pl-0.5 py-1 text-[#a9a69e] hover:text-[#ff7a8a] cursor-pointer"
                  >
                    <X size={11} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Selected Geological Slice Card */}
      <AnimatePresence mode="wait">
        {selectedPlace && activeLandmark && (
          <motion.div
            key={selectedPlace.sliceIndex}
            initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 6, scale: 0.985 }}
            transition={{ duration: reducedMotion ? 0 : DURATION.fast, ease: EASE_SMOOTH_OUT }}
            className="absolute left-3.5 bottom-[calc(58px+env(safe-area-inset-bottom,0px))] w-[min(420px,calc(100vw-28px))] md:w-[min(490px,calc(100vw-28px))] lg:w-[min(540px,calc(100vw-28px))] max-h-[70vh] overflow-y-auto overscroll-contain bg-[#121319]/92 border border-white/15 squircle-card px-4 py-3.5 shadow-2xl pointer-events-auto"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 min-w-0 text-[10.5px] uppercase tracking-[0.12em] text-[#e8b04a] truncate">
                <span
                  className="shrink-0 inline-flex items-center justify-center"
                  aria-hidden="true"
                >
                  <WeatherIcon
                    condition={cardCondition}
                    night={weather.night}
                    size={15}
                    animated={!reducedMotion}
                  />
                </span>
                <span className="truncate">{activeLandmark.c}</span>
              </span>
              {isVisited && (
                <span className="inline-flex items-center gap-1 text-[10.5px] text-[#7dffb0] shrink-0">
                  <CheckCircle size={13} weight="fill" />
                  <span>Visited</span>
                </span>
              )}
            </div>

            <div className="font-serif-display italic text-[22px] leading-tight text-[#f3efe6] mt-1">
              {activeLandmark.k}
            </div>
            <div className="text-[12px] text-[#a9a69e] mt-1 truncate">{selectedPlace.subtitle}</div>

            {editorial && (
              <>
                <p className="text-[11.5px] leading-snug text-[#d9d5cc]/90 mt-2 mb-0 line-clamp-2">
                  {editorial.narrative}
                </p>
                {editorial.tags.length > 0 && (
                  <div className="text-[10px] text-[#a9a69e] mt-1.5 truncate">
                    {editorial.tags.join(' · ')}
                  </div>
                )}
                <EditorialMarkers
                  editorial={editorial}
                  onFocusHighlight={onFocusHighlight}
                  reducedMotion={reducedMotion}
                />
              </>
            )}

            <div className="flex items-center justify-between gap-2 mt-3 pt-2.5 border-t border-white/10">
              <div className="flex items-center gap-1.5">
                <motion.button
                  type="button"
                  whileTap={reducedMotion ? undefined : { scale: PRESS_SCALE }}
                  onClick={() => onStepSlice(-1)}
                  aria-label="Previous slice"
                  className="w-8 h-8 rounded-full grid place-items-center bg-white/[0.06] border border-white/15 text-[#f3efe6] hover:border-[#e8b04a] hover:text-[#e8b04a] cursor-pointer"
                >
                  <CaretLeft size={14} weight="bold" />
                </motion.button>
                <span className="text-[11px] font-mono tabular-nums text-[#a9a69e] min-w-[42px] text-center">
                  {currentPosInFilter + 1}/{matchingSpecs.length}
                </span>
                <motion.button
                  type="button"
                  whileTap={reducedMotion ? undefined : { scale: PRESS_SCALE }}
                  onClick={() => onStepSlice(1)}
                  aria-label="Next slice"
                  className="w-8 h-8 rounded-full grid place-items-center bg-white/[0.06] border border-white/15 text-[#f3efe6] hover:border-[#e8b04a] hover:text-[#e8b04a] cursor-pointer"
                >
                  <CaretRight size={14} weight="bold" />
                </motion.button>
              </div>

              <div className="flex items-center gap-1.5">
                <motion.button
                  type="button"
                  whileTap={reducedMotion ? undefined : { scale: PRESS_SCALE }}
                  transition={SPRING.snappy}
                  onClick={handleToggleSection}
                  aria-pressed={sectionActive}
                  aria-label="Section view of the cutaway layers"
                  title="Section view of the cutaway layers"
                  className={`h-8 px-2.5 rounded-full inline-flex items-center gap-1.5 border text-[12px] transition-colors cursor-pointer ${
                    sectionActive
                      ? 'bg-[#5cd6a9]/18 border-[#5cd6a9] text-[#5cd6a9]'
                      : 'bg-white/[0.06] border-white/15 text-[#f3efe6] hover:border-[#e8b04a] hover:text-[#e8b04a]'
                  }`}
                >
                  <Stack size={13} weight={sectionActive ? 'fill' : 'regular'} />
                  <span className="hidden sm:inline">Section</span>
                </motion.button>
                <motion.button
                  type="button"
                  whileTap={reducedMotion ? undefined : { scale: PRESS_SCALE }}
                  transition={SPRING.snappy}
                  onClick={() => onOpenLandmark(selectedPlace.landmarkIndex)}
                  className="h-8 px-3.5 rounded-full inline-flex items-center gap-1.5 bg-[#e8b04a] text-[#1a1405] text-[12px] font-semibold hover:bg-[#f2be5d] transition-colors cursor-pointer"
                >
                  <span>Open diorama</span>
                  <ArrowUpRight size={14} weight="bold" />
                </motion.button>
              </div>
            </div>

            <EditorialSources editorial={editorial} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* On-demand coordinate explorer card */}
      <AnimatePresence mode="wait">
        {selectedPlace?.explorer && (
          <motion.div
            key={`explorer-${selectedPlace.sliceIndex}`}
            initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 6, scale: 0.985 }}
            className="absolute left-3.5 bottom-[calc(58px+env(safe-area-inset-bottom,0px))] w-[min(420px,calc(100vw-28px))] md:w-[min(490px,calc(100vw-28px))] max-h-[70vh] overflow-y-auto overscroll-contain bg-[#121319]/92 border border-white/15 squircle-card px-4 py-3.5 shadow-2xl pointer-events-auto"
          >
            <div className="text-[10.5px] uppercase tracking-[0.12em] text-[#e8b04a]">
              Coordinate Explorer
            </div>
            <div className="font-serif-display italic text-[20px] leading-tight text-[#f3efe6] mt-1">
              {selectedPlace.explorer.label}
            </div>
            <div className="text-[12px] text-[#a9a69e] mt-1">{selectedPlace.explorer.detail}</div>
            <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 text-[11px] text-[#c8c4bc] tabular-nums">
              <span>{selectedPlace.explorer.stats.buildings} buildings</span>
              <span>{selectedPlace.explorer.stats.roads} roads</span>
              <span>{selectedPlace.explorer.stats.elevation} m elevation</span>
            </div>
            {editorial && (
              <>
                <p className="text-[11px] leading-snug text-[#d9d5cc]/80 mt-2 mb-0 line-clamp-2">
                  {editorial.narrative}
                </p>
                <EditorialMarkers
                  editorial={editorial}
                  onFocusHighlight={onFocusHighlight}
                  reducedMotion={reducedMotion}
                />
              </>
            )}
            <div className="flex flex-wrap items-center justify-between gap-2 mt-3 pt-2.5 border-t border-white/10">
              <span className="text-[10px] text-[#a9a69e]">© OpenStreetMap contributors</span>
              <div className="flex items-center gap-1.5">
                {activeExplorerCoords && onToggleSavePlace && selectedPlace.explorer && (
                  <button
                    type="button"
                    onClick={() =>
                      onToggleSavePlace({
                        lat: activeExplorerCoords.lat,
                        lon: activeExplorerCoords.lon,
                        label: selectedPlace.explorer!.label,
                        detail: selectedPlace.explorer!.detail,
                      })
                    }
                    className={`h-8 px-3 rounded-full inline-flex items-center gap-1.5 border text-[12px] transition-colors cursor-pointer ${
                      isExplorerSaved
                        ? 'bg-[#38c793]/18 border-[#5cd6a9] text-[#5cd6a9]'
                        : 'border-white/15 bg-white/[0.06] text-[#f3efe6] hover:border-[#5cd6a9] hover:text-[#5cd6a9]'
                    }`}
                  >
                    <BookmarkSimple size={14} weight={isExplorerSaved ? 'fill' : 'regular'} />
                    <span>{isExplorerSaved ? 'Saved' : 'Bookmark'}</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => void navigator.clipboard?.writeText(window.location.href)}
                  className="h-8 px-3.5 rounded-full inline-flex items-center gap-1.5 border border-white/15 bg-white/[0.06] text-[12px] text-[#f3efe6] hover:border-[#e8b04a] hover:text-[#e8b04a] cursor-pointer"
                >
                  Copy link
                </button>
              </div>
            </div>
            <EditorialSources editorial={editorial} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Desktop Gesture Hint */}
      <div className="hidden md:block fixed right-4 bottom-[calc(64px+env(safe-area-inset-bottom,0px))] text-[11.5px] text-[#c8c4bc] drop-shadow-[0_1px_6px_rgba(0,0,0,0.9)] pointer-events-none">
        Drag to orbit · Tap a marker to focus · Double-tap slice to open · ← / → switch places
      </div>

      {/* Province Filter Pills */}
      <div className="absolute inset-x-0 bottom-[calc(14px+env(safe-area-inset-bottom,0px))] px-3.5 flex items-center gap-2 overflow-x-auto no-scrollbar pointer-events-auto">
        {['All', ...PROVINCES].map((pv) => {
          const active = activeProvince === pv;
          return (
            <button
              key={pv}
              type="button"
              aria-pressed={active}
              onClick={() => onSelectProvince(pv)}
              className={`province-pill shrink-0 whitespace-nowrap rounded-full px-3.5 py-1.5 text-[12.5px] bg-[#121319]/92 border transition cursor-pointer ${
                active
                  ? 'border-[#e8b04a] text-[#e8b04a]'
                  : 'border-white/15 text-[#f3efe6] hover:border-[#e8b04a]'
              }`}
            >
              {pv}
            </button>
          );
        })}
      </div>
    </div>
  );
}
