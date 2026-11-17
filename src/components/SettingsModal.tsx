import { X } from '@phosphor-icons/react';
import type { CitylitSettings, MotionSetting, QualitySetting } from '../types/citylit';

interface SettingsModalProps {
  open: boolean;
  settings: CitylitSettings;
  onUpdate: (next: Partial<CitylitSettings>) => void;
  onRequestTilt: () => Promise<boolean>;
  onClose: () => void;
}

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

export function SettingsModal({
  open,
  settings,
  onUpdate,
  onRequestTilt,
  onClose,
}: SettingsModalProps) {
  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-label="Settings"
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/70 grid place-items-center p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-[#14161e] border border-white/15 rounded-3xl p-5 shadow-2xl space-y-5"
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
            <span className="text-[14px] text-[#f3efe6]">Sound volume</span>
            <input
              type="range"
              min={0}
              max={100}
              value={settings.volume}
              onChange={(e) => onUpdate({ volume: Number(e.target.value) })}
              aria-label="Sound volume"
              className="w-36 accent-[#e8b04a] cursor-pointer"
            />
          </div>

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
  );
}
