import { X } from '@phosphor-icons/react';
import { PROVINCES } from '../data/landmarks';

interface GlobeOverlayProps {
  open: boolean;
  activeProvince: string;
  onSelectProvince: (province: string) => void;
  onClose: () => void;
}

export function GlobeOverlay({
  open,
  activeProvince,
  onSelectProvince,
  onClose,
}: GlobeOverlayProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-20 pointer-events-none">
      <div className="absolute left-4 top-[calc(18px+env(safe-area-inset-top,0px))] font-serif-display italic text-[22px] text-[#f3efe6]">
        South Africa
      </div>
      <button
        type="button"
        onClick={onClose}
        aria-label="Close 3D globe"
        className="absolute right-4 top-[calc(14px+env(safe-area-inset-top,0px))] w-10 h-10 rounded-full grid place-items-center bg-[#121319]/92 border border-white/15 text-[#f3efe6] hover:border-[#e8b04a] hover:text-[#e8b04a] pointer-events-auto cursor-pointer"
      >
        <X size={18} />
      </button>

      <div className="absolute inset-x-0 bottom-[calc(14px+env(safe-area-inset-bottom,0px))] px-3.5 flex items-center gap-2 overflow-x-auto no-scrollbar pointer-events-auto">
        {['All', ...PROVINCES].map((pv) => {
          const active = activeProvince === pv;
          return (
            <button
              key={pv}
              type="button"
              onClick={() => onSelectProvince(pv)}
              className={`shrink-0 whitespace-nowrap rounded-full px-3.5 py-1.5 text-[12.5px] bg-[#121319]/92 border transition cursor-pointer ${
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
