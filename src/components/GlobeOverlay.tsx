import { MapTrifold, X } from '@phosphor-icons/react';
import { motion } from 'motion/react';
import { PROVINCES } from '../data/landmarks';
import { SPRING } from '../lib/motion';

interface GlobeOverlayProps {
  open: boolean;
  activeProvince: string;
  reducedMotion?: boolean;
  onSelectProvince: (province: string) => void;
  onOpenPlaces: () => void;
  onClose: () => void;
}

export function GlobeOverlay({
  open,
  activeProvince,
  reducedMotion = false,
  onSelectProvince,
  onOpenPlaces,
  onClose,
}: GlobeOverlayProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-20 pointer-events-none">
      <div className="absolute left-4 top-[calc(18px+env(safe-area-inset-top,0px))] font-serif-display italic text-[22px] text-[#f3efe6]">
        South Africa
      </div>

      <div className="absolute right-4 top-[calc(14px+env(safe-area-inset-top,0px))] flex items-center gap-2 pointer-events-auto">
        <motion.button
          type="button"
          whileTap={reducedMotion ? undefined : { scale: 0.94 }}
          transition={SPRING.snappy}
          onClick={onOpenPlaces}
          aria-label="Open 3D Places diorama archipelago"
          title="Explore 3D Geological Places"
          className="h-10 px-3.5 rounded-full inline-flex items-center gap-1.5 bg-[#121319]/92 border border-white/15 text-[13px] font-medium text-[#f3efe6] hover:border-[#e8b04a] hover:text-[#e8b04a] transition-colors cursor-pointer shadow-lg"
        >
          <MapTrifold size={16} weight="bold" />
          <span>Places</span>
        </motion.button>

        <motion.button
          type="button"
          whileTap={reducedMotion ? undefined : { scale: 0.92 }}
          transition={SPRING.snappy}
          onClick={onClose}
          aria-label="Close 3D globe"
          className="w-10 h-10 rounded-full grid place-items-center bg-[#121319]/92 border border-white/15 text-[#f3efe6] hover:border-[#e8b04a] hover:text-[#e8b04a] transition-colors cursor-pointer shadow-lg"
        >
          <X size={18} />
        </motion.button>
      </div>

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
