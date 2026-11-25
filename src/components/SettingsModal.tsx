import {
  ArrowsCounterClockwise,
  Bird,
  BookmarkSimple,
  Car,
  Eye,
  PawPrint,
  Plus,
  Ruler,
  SlidersHorizontal,
  SpeakerHigh,
  Waveform,
  Wind,
  X,
} from '@phosphor-icons/react';
import { useState } from 'react';
import { motion } from 'motion/react';
import { ambientAudio } from '../audio/ambientAudio';
import { PRESS_SCALE } from '../lib/motion';
import { resolveTheme } from '../lib/theme';
import { detectNativeHost } from '../three/cinematic/nativeHost';
import type {
  AmbientMixerPreset,
  AmbientMixerSettings,
  CitylitSettings,
  FpsCapSetting,
  MotionSetting,
  QualitySetting,
  RendererSetting,
  ResolvedTheme,
  ScaleReferenceKind,
  ThemeSetting,
} from '../types/citylit';
import { AnimatedNumber } from './ui/AnimatedNumber';
import { LiquidToggle } from './ui/LiquidToggle';
import { PillNavigation } from './ui/PillNavigation';
import { AdaptiveDialog } from './ui/AdaptiveDialog';

interface SettingsModalProps {
  open: boolean;
  settings: CitylitSettings;
  effectiveTheme?: ResolvedTheme;
  reducedMotion?: boolean;
  tourActive?: boolean;
  onToggleTour?: () => void;
  onUpdate: (next: Partial<CitylitSettings>) => void;
  onRequestTilt: () => Promise<boolean>;
  onClose: () => void;
}

const DEFAULT_MIXER: AmbientMixerSettings = {
  wind: 80,
  birds: 75,
  traffic: 40,
};

const PRESETS_STORAGE_KEY = 'cl-mp';

const BUILTIN_MIXER_PRESETS: readonly AmbientMixerPreset[] = [
  {
    id: 'rainy-city',
    name: 'Rainy City',
    mixer: { wind: 65, birds: 15, traffic: 85 },
    builtIn: true,
  },
  {
    id: 'quiet-nature',
    name: 'Quiet Nature',
    mixer: { wind: 55, birds: 90, traffic: 0 },
    builtIn: true,
  },
  {
    id: 'coastal-gale',
    name: 'Coastal Gale',
    mixer: { wind: 100, birds: 45, traffic: 10 },
    builtIn: true,
  },
];

function readCustomPresets(): AmbientMixerPreset[] {
  try {
    const raw = localStorage.getItem(PRESETS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is AmbientMixerPreset =>
        Boolean(item) &&
        typeof item === 'object' &&
        typeof (item as AmbientMixerPreset).id === 'string' &&
        typeof (item as AmbientMixerPreset).name === 'string' &&
        typeof (item as AmbientMixerPreset).mixer?.wind === 'number' &&
        typeof (item as AmbientMixerPreset).mixer?.birds === 'number' &&
        typeof (item as AmbientMixerPreset).mixer?.traffic === 'number'
    );
  } catch {
    return [];
  }
}

function writeCustomPresets(presets: AmbientMixerPreset[]): void {
  try {
    localStorage.setItem(PRESETS_STORAGE_KEY, JSON.stringify(presets));
  } catch {
    // Ignore storage failures
  }
}

const QUALITY_OPTIONS = [
  { value: 'auto' as const, label: 'Auto' },
  { value: 'high' as const, label: 'High' },
  { value: 'balanced' as const, label: 'Medium' },
  { value: 'low' as const, label: 'Low' },
];

const FPS_OPTIONS = [
  { value: 'auto' as const, label: 'Auto' },
  { value: '60' as const, label: '60' },
  { value: '30' as const, label: '30' },
];

const RENDERER_OPTIONS = [
  { value: 'auto' as const, label: 'Auto' },
  { value: 'webgpu' as const, label: 'WebGPU' },
  { value: 'webgl' as const, label: 'WebGL' },
];

const MOTION_OPTIONS = [
  { value: 'auto' as const, label: 'System' },
  { value: 'reduce' as const, label: 'Reduce' },
];

const THEME_OPTIONS = [
  { value: 'auto' as const, label: 'Auto' },
  { value: 'daylight' as const, label: 'Daylight' },
  { value: 'dark' as const, label: 'Dark' },
  { value: 'studio' as const, label: 'Studio' },
];

const SCALE_REFERENCE_OPTIONS: Array<{
  value: ScaleReferenceKind;
  label: string;
}> = [
  { value: 'person', label: 'Person' },
  { value: 'springbok', label: 'Springbok' },
  { value: 'eiffel', label: 'Eiffel' },
];

const MIXER_CHANNELS: Array<{
  key: keyof AmbientMixerSettings;
  label: string;
  icon: typeof Wind;
}> = [
  { key: 'wind', label: 'Wind', icon: Wind },
  { key: 'birds', label: 'Birds', icon: Bird },
  { key: 'traffic', label: 'Traffic', icon: Car },
];

export function SettingsModal({
  open,
  settings,
  effectiveTheme,
  reducedMotion = false,
  tourActive = false,
  onToggleTour,
  onUpdate,
  onRequestTilt,
  onClose,
}: SettingsModalProps) {
  const [customPresets, setCustomPresets] = useState<AmbientMixerPreset[]>(readCustomPresets);
  const [presetName, setPresetName] = useState('');
  const mixer = settings.mixer ?? DEFAULT_MIXER;
  const nativeHost = detectNativeHost();
  const resolvedTheme = effectiveTheme ?? resolveTheme(settings.theme);
  const isDefaultMixer =
    mixer.wind === DEFAULT_MIXER.wind &&
    mixer.birds === DEFAULT_MIXER.birds &&
    mixer.traffic === DEFAULT_MIXER.traffic;

  const allPresets = [...BUILTIN_MIXER_PRESETS, ...customPresets];

  const updateMixerChannel = (channel: keyof AmbientMixerSettings, value: number) => {
    onUpdate({ mixer: { ...mixer, [channel]: value } });
  };

  const applyPreset = (preset: AmbientMixerPreset) => {
    ambientAudio.playUi('toggle');
    onUpdate({ mixer: { ...preset.mixer } });
  };

  const saveCurrentPreset = () => {
    const trimmed = presetName.trim();
    if (!trimmed) return;
    const lower = trimmed.toLowerCase();
    const existingIdx = customPresets.findIndex((p) => p.name.toLowerCase() === lower);
    let next: AmbientMixerPreset[];
    if (existingIdx >= 0) {
      next = customPresets.map((p, idx) =>
        idx === existingIdx ? { ...p, name: trimmed, mixer: { ...mixer } } : p
      );
    } else {
      const created: AmbientMixerPreset = {
        id: `custom-${Date.now()}`,
        name: trimmed,
        mixer: { ...mixer },
      };
      next = [...customPresets, created];
    }
    setCustomPresets(next);
    writeCustomPresets(next);
    setPresetName('');
    ambientAudio.playUi('success', { intensity: 0.75 });
  };

  const deleteCustomPreset = (id: string) => {
    const next = customPresets.filter((p) => p.id !== id);
    setCustomPresets(next);
    writeCustomPresets(next);
    ambientAudio.playUi('tick');
  };

  return (
    <AdaptiveDialog
      open={open}
      onClose={onClose}
      label="Settings"
      title="Settings"
      reducedMotion={reducedMotion}
      bottomHeightClass="h-[88%]"
      sheetClassName="px-4 pt-4 pb-[calc(16px+env(safe-area-inset-bottom,0px))] overflow-y-auto"
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-serif-display italic text-[24px] text-[#f3efe6] m-0">Settings</h2>
        <motion.button
          type="button"
          whileTap={reducedMotion ? undefined : { scale: PRESS_SCALE }}
          onClick={onClose}
          aria-label="Close settings"
          className="w-9 h-9 rounded-full grid place-items-center bg-white/[0.06] border border-white/15 text-[#f3efe6] hover:border-[#e8b04a] cursor-pointer"
        >
          <X size={17} />
        </motion.button>
      </div>

      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
          <div className="min-w-0">
            <span className="text-[14px] whitespace-nowrap text-[#f3efe6]">Scene backdrop</span>
            {settings.theme === 'auto' && (
              <p className="mt-0.5 m-0 text-[11.5px] text-[#a9a69e]/80">
                Follows local time ·{' '}
                {resolvedTheme === 'daylight' ? 'Daylight (06:00–19:00)' : 'Dark (19:00–06:00)'}
              </p>
            )}
          </div>
          <PillNavigation<ThemeSetting>
            layoutId="settings-theme"
            reducedMotion={reducedMotion}
            value={settings.theme ?? 'daylight'}
            onChange={(theme) => onUpdate({ theme })}
            options={THEME_OPTIONS}
            compact
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
          <span className="text-[14px] whitespace-nowrap text-[#f3efe6]">Graphics quality</span>
          <PillNavigation<QualitySetting>
            layoutId="settings-quality"
            reducedMotion={reducedMotion}
            value={settings.quality}
            onChange={(quality) => onUpdate({ quality })}
            options={QUALITY_OPTIONS}
            compact
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
          <div className="min-w-0">
            <span className="text-[14px] whitespace-nowrap text-[#f3efe6]">Frame rate</span>
            <p className="mt-0.5 m-0 text-[11.5px] text-[#a9a69e]/80">
              Cap continuous rendering · Auto adapts when idle
            </p>
          </div>
          <PillNavigation<FpsCapSetting>
            layoutId="settings-fps"
            reducedMotion={reducedMotion}
            value={settings.fpsCap ?? 'auto'}
            onChange={(fpsCap) => onUpdate({ fpsCap })}
            options={FPS_OPTIONS}
            compact
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
          <div className="min-w-0">
            <span className="text-[14px] whitespace-nowrap text-[#f3efe6]">Renderer</span>
            <p className="mt-0.5 m-0 text-[11.5px] text-[#a9a69e]/80">
              Switching restarts the 3D scene
            </p>
          </div>
          <PillNavigation<RendererSetting>
            layoutId="settings-renderer"
            reducedMotion={reducedMotion}
            value={settings.renderer ?? 'auto'}
            onChange={(renderer) => {
              if (renderer === (settings.renderer ?? 'auto')) return;
              onUpdate({ renderer });
              window.setTimeout(() => window.location.reload(), 200);
            }}
            options={RENDERER_OPTIONS}
            compact
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
          <div className="min-w-0">
            <span className="text-[14px] whitespace-nowrap text-[#f3efe6]">Auto tour</span>
            <p className="mt-0.5 m-0 text-[11.5px] text-[#a9a69e]/80">
              Step through landmarks automatically · Space
            </p>
          </div>
          <LiquidToggle
            label="Auto tour"
            value={!!tourActive}
            onChange={() => onToggleTour?.()}
            reducedMotion={reducedMotion}
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
          <div className="min-w-0">
            <span className="text-[14px] whitespace-nowrap text-[#f3efe6]">Cinematic lighting</span>
            <p className="mt-0.5 text-[11.5px] text-[#a9a69e]/80 m-0">
              {nativeHost
                ? `Path-traced by the ${nativeHost.name} host`
                : 'Richer WebGL lighting and shadows'}
            </p>
          </div>
          <LiquidToggle
            label="Cinematic lighting"
            value={settings.cinematic ?? false}
            onChange={(cinematic) => {
              onUpdate({ cinematic });
              nativeHost?.setCinematic?.(cinematic);
            }}
            reducedMotion={reducedMotion}
          />
        </div>

        <div className="pt-4.5 border-t border-white/10 space-y-3.5">
          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
            <div className="min-w-0">
              <span className="text-[14px] whitespace-nowrap text-[#f3efe6] inline-flex items-center gap-2">
                <Ruler size={15} className="text-[#e8b04a]" />
                Scale mode
              </span>
              <p className="mt-0.5 text-[11.5px] text-[#a9a69e]/80 m-0">
                Put a familiar silhouette beside the diorama
              </p>
            </div>
            <LiquidToggle
              label="Scale mode"
              value={settings.scaleMode ?? false}
              onChange={(scaleMode) => onUpdate({ scaleMode })}
              reducedMotion={reducedMotion}
            />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
            <span className="text-[13px] text-[#a9a69e]">Compare with</span>
            <PillNavigation<ScaleReferenceKind>
              layoutId="settings-scale-reference"
              reducedMotion={reducedMotion}
              value={settings.scaleReference ?? 'person'}
              onChange={(scaleReference) => onUpdate({ scaleReference })}
              options={SCALE_REFERENCE_OPTIONS}
              compact
            />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
            <span className="text-[14px] whitespace-nowrap text-[#f3efe6] inline-flex items-center gap-2">
              <PawPrint size={15} className="text-[#e8b04a]" />
              Wildlife layer
            </span>
            <LiquidToggle
              label="Wildlife layer"
              value={settings.wildlife ?? true}
              onChange={(wildlife) => onUpdate({ wildlife })}
              reducedMotion={reducedMotion}
            />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
            <span className="text-[14px] whitespace-nowrap text-[#f3efe6] inline-flex items-center gap-2">
              <Eye size={15} className="text-[#e8b04a]" />
              Hidden details
            </span>
            <LiquidToggle
              label="Hidden details"
              value={settings.hiddenDetails ?? true}
              onChange={(hiddenDetails) => onUpdate({ hiddenDetails })}
              reducedMotion={reducedMotion}
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
          <span className="text-[14px] text-[#f3efe6] inline-flex items-center gap-2 whitespace-nowrap">
            <SpeakerHigh size={15} className="text-[#e8b04a]" />
            <span>Master volume</span>
          </span>
          <div className="flex items-center gap-2.5">
            <input
              type="range"
              min={0}
              max={100}
              value={settings.volume}
              onChange={(e) => {
                onUpdate({ volume: Number(e.target.value) });
                ambientAudio.playUi('tick');
              }}
              aria-label="Master sound volume"
              className="w-32 accent-[#e8b04a] cursor-pointer"
            />
            <AnimatedNumber
              value={settings.volume}
              suffix="%"
              className="w-9 justify-end text-[12px] text-[#a9a69e]"
              reducedMotion={reducedMotion}
            />
          </div>
        </div>

        <div className="pt-4.5 border-t border-white/10 space-y-3.5">
          <div className="flex items-start justify-between gap-2">
            <div>
              <span className="inline-flex items-center gap-1.5 text-[11px] tracking-[0.14em] uppercase text-[#e8b04a]">
                <SlidersHorizontal size={14} />
                Ambient Atmosphere
              </span>
              <p className="mt-0.5 text-[11.5px] text-[#a9a69e]/80 m-0">
                Adjust environmental layers independently
              </p>
            </div>
            {!isDefaultMixer && (
              <motion.button
                type="button"
                whileTap={reducedMotion ? undefined : { scale: PRESS_SCALE }}
                onClick={() => onUpdate({ mixer: { ...DEFAULT_MIXER } })}
                aria-label="Reset ambient atmosphere levels"
                className="inline-flex items-center gap-1 text-[11.5px] text-[#a9a69e] hover:text-[#e8b04a] transition-colors cursor-pointer shrink-0"
              >
                <ArrowsCounterClockwise size={12} />
                Reset
              </motion.button>
            )}
          </div>

          <div className="space-y-3">
            {MIXER_CHANNELS.map(({ key, label, icon: Icon }) => {
              const value = mixer[key];
              const muted = value === 0;
              return (
                <div key={key} className="flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => updateMixerChannel(key, muted ? DEFAULT_MIXER[key] : 0)}
                    aria-label={muted ? `Unmute ${label}` : `Mute ${label}`}
                    className={`inline-flex items-center gap-2 text-[13.5px] min-w-[82px] text-left transition-colors cursor-pointer ${
                      muted
                        ? 'text-[#a9a69e]/60 hover:text-[#f3efe6]'
                        : 'text-[#f3efe6] hover:text-[#e8b04a]'
                    }`}
                  >
                    <Icon size={15} className={muted ? 'text-[#a9a69e]/50' : 'text-[#e8b04a]'} />
                    {label}
                  </button>
                  <div className="flex items-center gap-2.5 flex-1 justify-end">
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={value}
                      onChange={(e) => {
                        updateMixerChannel(key, Number(e.target.value));
                        ambientAudio.playUi('tick');
                      }}
                      aria-label={`${label} ambient volume`}
                      className="w-32 sm:w-36 accent-[#e8b04a] cursor-pointer"
                    />
                    <AnimatedNumber
                      value={value}
                      suffix="%"
                      className="w-9 justify-end text-[12px] text-[#a9a69e]"
                      reducedMotion={reducedMotion}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-3 border-t border-white/8 space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 text-[11px] tracking-[0.12em] uppercase text-[#a9a69e]">
                <BookmarkSimple size={13} className="text-[#e8b04a]" />
                Presets
              </span>
              <span className="text-[11px] text-[#a9a69e]/70">Tap to load</span>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {allPresets.map((preset) => {
                const isActive =
                  preset.mixer.wind === mixer.wind &&
                  preset.mixer.birds === mixer.birds &&
                  preset.mixer.traffic === mixer.traffic;
                return (
                  <div
                    key={preset.id}
                    className={`inline-flex items-center rounded-full border text-[11.5px] transition-colors ${
                      isActive
                        ? 'bg-[#e8b04a]/16 border-[#e8b04a]/70 text-[#e8b04a]'
                        : 'bg-white/[0.04] border-white/12 text-[#f3efe6] hover:border-[#e8b04a]/50'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => applyPreset(preset)}
                      title={`Wind ${preset.mixer.wind}% · Birds ${preset.mixer.birds}% · Traffic ${preset.mixer.traffic}%`}
                      className="px-2.5 py-1 cursor-pointer leading-none"
                    >
                      {preset.name}
                    </button>
                    {!preset.builtIn && (
                      <button
                        type="button"
                        onClick={() => deleteCustomPreset(preset.id)}
                        aria-label={`Remove preset ${preset.name}`}
                        className="pr-2 pl-0.5 py-1 text-[#a9a69e] hover:text-[#f3efe6] cursor-pointer leading-none"
                      >
                        <X size={11} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                saveCurrentPreset();
              }}
              className="flex items-center gap-2 pt-0.5"
            >
              <input
                type="text"
                value={presetName}
                onChange={(e) => setPresetName(e.target.value)}
                placeholder="Name custom mix…"
                maxLength={24}
                aria-label="Custom sound preset name"
                className="flex-1 min-w-0 h-8 px-3 rounded-xl bg-white/[0.05] border border-white/12 text-[12px] text-[#f3efe6] placeholder:text-[#a9a69e]/55 focus:outline-none focus:border-[#e8b04a]/70"
              />
              <button
                type="submit"
                disabled={!presetName.trim()}
                className="h-8 px-3 rounded-xl inline-flex items-center gap-1 bg-[#e8b04a]/16 border border-[#e8b04a]/45 text-[11.5px] font-medium text-[#e8b04a] hover:bg-[#e8b04a]/25 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shrink-0 transition-colors"
              >
                <Plus size={13} />
                Save
              </button>
            </form>
          </div>
        </div>

        <div className="pt-4.5 border-t border-white/10 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
            <span className="text-[14px] whitespace-nowrap text-[#f3efe6]">Haptic feedback</span>
            <LiquidToggle
              label="Haptic feedback"
              value={settings.haptics}
              onChange={(haptics) => onUpdate({ haptics })}
              reducedMotion={reducedMotion}
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
            <span className="text-[14px] whitespace-nowrap text-[#f3efe6] inline-flex items-center gap-2">
              <Waveform size={15} className="text-[#e8b04a]" />
              Interface sounds
            </span>
            <LiquidToggle
              label="Interface sounds"
              value={settings.uiSounds}
              onChange={(uiSounds) => onUpdate({ uiSounds })}
              reducedMotion={reducedMotion}
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
            <span className="text-[14px] whitespace-nowrap text-[#f3efe6]">Motion</span>
            <PillNavigation<MotionSetting>
              layoutId="settings-motion"
              reducedMotion={reducedMotion}
              value={settings.motion}
              onChange={(motionSetting) => onUpdate({ motion: motionSetting })}
              options={MOTION_OPTIONS}
              compact
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
            <span className="text-[14px] whitespace-nowrap text-[#f3efe6]">Gyroscope tilt</span>
            <LiquidToggle
              label="Gyroscope tilt"
              value={settings.tilt}
              reducedMotion={reducedMotion}
              onChange={async (tilt) => {
                if (!tilt) {
                  onUpdate({ tilt: false });
                  return;
                }
                const granted = await onRequestTilt();
                if (granted) onUpdate({ tilt: true });
              }}
            />
          </div>
        </div>
      </div>
    </AdaptiveDialog>
  );
}
