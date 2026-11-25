import { DownloadSimple, MapPin, ShareNetwork, X } from '@phosphor-icons/react';
import { motion } from 'motion/react';
import { PRESS_SCALE, SPRING } from '../lib/motion';
import type { LandmarkNote } from '../types/citylit';
import { AdaptiveDialog } from './ui/AdaptiveDialog';

const SKY_PRESETS = [
  { label: 'Dawn', hour: 6.3 },
  { label: 'Noon', hour: 13 },
  { label: 'Dusk', hour: 17.8 },
  { label: 'Night', hour: 22 },
] as const;

interface PostcardModalProps {
  open: boolean;
  dataUrl: string;
  landmarkName: string;
  notes?: readonly LandmarkNote[];
  selectedNoteId?: string | null;
  previewHour?: number;
  reducedMotion?: boolean;
  onRegeneratePostcard?: (opts: { noteId?: string | null; hour?: number }) => void;
  onShare: () => void;
  onDownload: () => void;
  onClose: () => void;
}

export function PostcardModal({
  open,
  dataUrl,
  landmarkName,
  notes = [],
  selectedNoteId = null,
  previewHour = 13,
  reducedMotion = false,
  onRegeneratePostcard,
  onShare,
  onDownload,
  onClose,
}: PostcardModalProps) {
  return (
    <AdaptiveDialog
      open={open}
      onClose={onClose}
      label="3D Landmark Postcard"
      title="3D Landmark Postcard"
      reducedMotion={reducedMotion}
      bottomHeightClass="h-[86%]"
      sheetClassName="px-4 pt-4 pb-[calc(16px+env(safe-area-inset-bottom,0px))] overflow-y-auto"
    >
      <div className="flex items-center justify-between">
        <span className="font-serif-display italic text-[18px] text-[#f3efe6]">{landmarkName}</span>
        <motion.button
          type="button"
          whileTap={reducedMotion ? undefined : { scale: PRESS_SCALE }}
          onClick={onClose}
          aria-label="Close postcard"
          className="w-8 h-8 rounded-full grid place-items-center bg-white/[0.06] border border-white/15 text-[#f3efe6] hover:border-[#e8b04a] cursor-pointer"
        >
          <X size={16} />
        </motion.button>
      </div>

      <motion.div
        initial={reducedMotion ? false : { opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={SPRING.morph}
        className="mt-3 rounded-2xl overflow-hidden border border-white/10 bg-[#0e0f13]"
      >
        {dataUrl && (
          <img src={dataUrl} alt={`${landmarkName} 3D postcard`} className="w-full h-auto block" />
        )}
      </motion.div>

      {onRegeneratePostcard && (
        <div className="mt-3 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] uppercase tracking-[0.1em] text-[#a9a69e]">Sky Time</span>
            <div className="inline-flex items-center gap-1 p-0.5 rounded-full bg-white/[0.05] border border-white/12">
              {SKY_PRESETS.map((preset) => {
                const active = Math.abs(previewHour - preset.hour) < 1.5;
                return (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => onRegeneratePostcard({ hour: preset.hour })}
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
          </div>

          {notes.length > 0 && (
            <div className="space-y-1">
              <div className="text-[11px] uppercase tracking-[0.1em] text-[#a9a69e]">
                Stamp Personal Note
              </div>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => onRegeneratePostcard({ noteId: null })}
                  className={`h-6 px-2.5 rounded-full text-[11px] border transition-colors cursor-pointer ${
                    selectedNoteId === null
                      ? 'bg-[#e8b04a]/20 border-[#e8b04a] text-[#e8b04a]'
                      : 'bg-white/[0.04] border-white/10 text-[#a9a69e] hover:text-[#f3efe6]'
                  }`}
                >
                  None
                </button>
                {notes.map((n) => {
                  const active = selectedNoteId === n.id;
                  const snippet = n.text.length > 26 ? `${n.text.slice(0, 24)}…` : n.text;
                  return (
                    <button
                      key={n.id}
                      type="button"
                      onClick={() => onRegeneratePostcard({ noteId: n.id })}
                      className={`h-6 px-2.5 rounded-full inline-flex items-center gap-1 text-[11px] border transition-colors cursor-pointer ${
                        active
                          ? 'bg-[#38c793]/20 border-[#5cd6a9] text-[#7de3bc]'
                          : 'bg-white/[0.04] border-white/10 text-[#d6d1c6] hover:border-white/25'
                      }`}
                    >
                      <MapPin size={10} weight="fill" />
                      <span>{snippet}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="mt-3 flex items-center gap-2">
        {[
          { label: 'Share', icon: ShareNetwork, onClick: onShare, accent: false },
          { label: 'Save PNG', icon: DownloadSimple, onClick: onDownload, accent: true },
        ].map(({ label, icon: Icon, onClick, accent }) => (
          <motion.button
            key={label}
            type="button"
            whileTap={reducedMotion ? undefined : { scale: PRESS_SCALE }}
            onClick={onClick}
            className={`flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 rounded-full text-[13px] cursor-pointer ${
              accent
                ? 'bg-[#e8b04a] text-[#1a1405] font-semibold'
                : 'bg-white/[0.06] border border-white/15 text-[#f3efe6] hover:border-[#e8b04a]'
            }`}
          >
            <Icon size={16} weight={accent ? 'bold' : 'regular'} />
            {label}
          </motion.button>
        ))}
      </div>
    </AdaptiveDialog>
  );
}
