import {
  ArrowsCounterClockwise,
  Bird,
  Car,
  SlidersHorizontal,
  SpeakerHigh,
  Wind,
  X,
} from '@phosphor-icons/react';
import { motion } from 'motion/react';
import type {
  AmbientMixerSettings,
  CitylitSettings,
  MotionSetting,
  QualitySetting,
  ThemeSetting,
} from '../types/citylit';
import { AnimatedNumber } from './ui/AnimatedNumber';
import { LiquidToggle } from './ui/LiquidToggle';
import { PillNavigation } from './ui/PillNavigation';
import { SettleModal } from './ui/SettleModal';

interface SettingsModalProps {
  open: boolean;
  settings: CitylitSettings;
  reducedMotion?: boolean;
  onUpdate: (next: Partial<CitylitSettings>) => void;
  onRequestTilt: () => Promise<boolean>;
  onClose: () => void;
}

const DEFAULT_MIXER: AmbientMixerSettings = {
  wind: 80,
  birds: 75,
  traffic: 40,
};

const QUALITY_OPTIONS = [
  { value: 'auto' as const, label: 'Auto' },
  { value: 'high' as const, label: 'High' },
  { value: 'balanced' as const, label: 'Medium' },
  { value: 'low' as const, label: 'Low' },
];

const MOTION_OPTIONS = [
  { value: 'auto' as const, label: 'System' },
  { value: 'reduce' as const, label: 'Reduce' },
];

const THEME_OPTIONS = [
  { value: 'dark' as const, label: 'Dark' },
  { value: 'daylight' as const, label: 'Daylight' },
  { value: 'studio' as const, label: 'Studio' },
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
  reducedMotion = false,
  onUpdate,
  onRequestTilt,
  onClose,
}: SettingsModalProps) {
  const mixer = settings.mixer ?? DEFAULT_MIXER;
  const isDefaultMixer =
    mixer.wind === DEFAULT_MIXER.wind &&
    mixer.birds === DEFAULT_MIXER.birds &&
    mixer.traffic === DEFAULT_MIXER.traffic;

  const updateMixerChannel = (channel: keyof AmbientMixerSettings, value: number) => {
    onUpdate({ mixer: { ...mixer, [channel]: value } });
  };

  return (
    <SettleModal open={open} onClose={onClose} reducedMotion={reducedMotion} title="Settings">
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-serif-display italic text-[24px] text-[#f3efe6] m-0">Settings</h2>
        <motion.button
          type="button"
          whileTap={reducedMotion ? undefined : { scale: 0.9 }}
          onClick={onClose}
          aria-label="Close settings"
          className="w-9 h-9 rounded-full grid place-items-center bg-white/[0.06] border border-white/15 text-[#f3efe6] hover:border-[#e8b04a] cursor-pointer"
        >
          <X size={17} />
        </motion.button>
      </div>

      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
          <span className="text-[14px] whitespace-nowrap text-[#f3efe6]">Scene backdrop</span>
          <PillNavigation<ThemeSetting>
            layoutId="settings-theme"
            reducedMotion={reducedMotion}
            value={settings.theme ?? 'dark'}
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
              onChange={(e) => onUpdate({ volume: Number(e.target.value) })}
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
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 text-[11px] tracking-[0.14em] uppercase text-[#e8b04a]">
              <SlidersHorizontal size={14} />
              Ambient Mixer
            </span>
            {!isDefaultMixer && (
              <motion.button
                type="button"
                whileTap={reducedMotion ? undefined : { scale: 0.94 }}
                onClick={() => onUpdate({ mixer: { ...DEFAULT_MIXER } })}
                aria-label="Reset ambient mixer levels"
                className="inline-flex items-center gap-1 text-[11.5px] text-[#a9a69e] hover:text-[#e8b04a] transition-colors cursor-pointer"
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
                      onChange={(e) => updateMixerChannel(key, Number(e.target.value))}
                      aria-label={`${label} ambient volume`}
                      className="w-32 sm:w-36 accent-[#e8b04a] cursor-pointer"
                    />
                    <span className="w-9 text-right text-[12px] font-mono tabular-nums text-[#a9a69e]">
                      {value}%
                    </span>
                  </div>
                </div>
              );
            })}
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
    </SettleModal>
  );
}
