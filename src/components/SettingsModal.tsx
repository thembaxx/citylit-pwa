import {
  ArrowsCounterClockwise,
  Bird,
  Car,
  SlidersHorizontal,
  SpeakerHigh,
  Wind,
  X,
} from '@phosphor-icons/react';
import type {
  AmbientMixerSettings,
  CitylitSettings,
  MotionSetting,
  QualitySetting,
} from '../types/citylit';

interface SettingsModalProps {
  open: boolean;
  settings: CitylitSettings;
  onUpdate: (next: Partial<CitylitSettings>) => void;
  onRequestTilt: () => Promise<boolean>;
  onClose: () => void;
}

const DEFAULT_MIXER: AmbientMixerSettings = {
  wind: 80,
  birds: 75,
  traffic: 40,
};

const QUALITY_OPTIONS: Array<{ value: QualitySetting; label: string }> = [
  { value: 'auto', label: 'Auto' },
  { value: 'high', label: 'High' },
  { value: 'balanced', label: 'Medium' },
  { value: 'low', label: 'Low' },
];

const MOTION_OPTIONS: Array<{ value: MotionSetting; label: string }> = [
  { value: 'auto', label: 'System' },
  { value: 'reduce', label: 'Reduce' },
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
  onUpdate,
  onRequestTilt,
  onClose,
}: SettingsModalProps) {
  if (!open) return null;

  const mixer = settings.mixer ?? DEFAULT_MIXER;
  const isDefaultMixer =
    mixer.wind === DEFAULT_MIXER.wind &&
    mixer.birds === DEFAULT_MIXER.birds &&
    mixer.traffic === DEFAULT_MIXER.traffic;

  const updateMixerChannel = (channel: keyof AmbientMixerSettings, value: number) => {
    onUpdate({
      mixer: {
        ...mixer,
        [channel]: value,
      },
    });
  };

  return (
    <div
      role="dialog"
      aria-label="Settings"
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/70 grid place-items-center p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md max-h-[calc(100vh-32px)] overflow-y-auto bg-[#14161e] border border-white/15 rounded-3xl p-5 shadow-2xl space-y-5"
      >
        <div className="flex items-center justify-between">
          <h2 className="font-serif-display italic text-[24px] text-[#f3efe6] m-0">Settings</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close settings"
            className="w-9 h-9 rounded-full grid place-items-center bg-white/[0.06] border border-white/15 text-[#f3efe6] hover:border-[#e8b04a] cursor-pointer"
          >
            <X size={17} />
          </button>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <span className="text-[14px] text-[#f3efe6]">Graphics quality</span>
            <div className="flex bg-white/[0.05] p-1 rounded-xl border border-white/10">
              {QUALITY_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => onUpdate({ quality: opt.value })}
                  className={`px-2.5 py-1 rounded-lg text-[12px] cursor-pointer transition ${
                    settings.quality === opt.value
                      ? 'bg-[#e8b04a] text-[#1a1405] font-semibold'
                      : 'text-[#a9a69e] hover:text-[#f3efe6]'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between gap-3">
            <span className="text-[14px] text-[#f3efe6] inline-flex items-center gap-2">
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
              <span className="w-9 text-right text-[12px] text-[#a9a69e] tabular-nums">
                {settings.volume}%
              </span>
            </div>
          </div>

          <div className="pt-3.5 border-t border-white/10 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 text-[11px] tracking-[0.14em] uppercase text-[#e8b04a]">
                <SlidersHorizontal size={14} />
                <span>Ambient Mixer</span>
              </span>
              {!isDefaultMixer && (
                <button
                  type="button"
                  onClick={() => onUpdate({ mixer: { ...DEFAULT_MIXER } })}
                  aria-label="Reset ambient mixer levels"
                  className="inline-flex items-center gap-1 text-[11.5px] text-[#a9a69e] hover:text-[#e8b04a] transition-colors cursor-pointer"
                >
                  <ArrowsCounterClockwise size={12} />
                  <span>Reset</span>
                </button>
              )}
            </div>

            <div className="space-y-2.5">
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
                      <span>{label}</span>
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
                      <span className="w-9 text-right text-[12px] text-[#a9a69e] tabular-nums">
                        {value}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-3.5 border-t border-white/10 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <span className="text-[14px] text-[#f3efe6]">Haptic feedback</span>
              <button
                type="button"
                onClick={() => onUpdate({ haptics: !settings.haptics })}
                className={`px-3.5 py-1 rounded-full text-[12px] border cursor-pointer transition ${
                  settings.haptics
                    ? 'border-[#e8b04a] bg-[#e8b04a]/15 text-[#e8b04a]'
                    : 'border-white/15 text-[#a9a69e]'
                }`}
              >
                {settings.haptics ? 'On' : 'Off'}
              </button>
            </div>

            <div className="flex items-center justify-between gap-3">
              <span className="text-[14px] text-[#f3efe6]">Motion</span>
              <div className="flex bg-white/[0.05] p-1 rounded-xl border border-white/10">
                {MOTION_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => onUpdate({ motion: opt.value })}
                    className={`px-3 py-1 rounded-lg text-[12px] cursor-pointer transition ${
                      settings.motion === opt.value
                        ? 'bg-[#e8b04a] text-[#1a1405] font-semibold'
                        : 'text-[#a9a69e] hover:text-[#f3efe6]'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between gap-3">
              <span className="text-[14px] text-[#f3efe6]">Gyroscope tilt</span>
              <button
                type="button"
                onClick={async () => {
                  if (settings.tilt) {
                    onUpdate({ tilt: false });
                    return;
                  }
                  const granted = await onRequestTilt();
                  if (granted) onUpdate({ tilt: true });
                }}
                className={`px-3.5 py-1 rounded-full text-[12px] border cursor-pointer transition ${
                  settings.tilt
                    ? 'border-[#e8b04a] bg-[#e8b04a]/15 text-[#e8b04a]'
                    : 'border-white/15 text-[#a9a69e]'
                }`}
              >
                {settings.tilt ? 'On' : 'Off'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
