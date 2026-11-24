import { ArrowLeft, Compass, DotsThree, MapTrifold, X } from '@phosphor-icons/react';
import { motion } from 'motion/react';
import { LANDMARKS, PROVINCES } from '../data/landmarks';
import { PRESS_SCALE, SPRING } from '../lib/motion';
import { Menu, type MenuItem } from './ui/Menu';

interface GlobeOverlayProps {
  open: boolean;
  activeProvince: string;
  reducedMotion?: boolean;
  onSelectProvince: (province: string) => void;
  onSelectLandmark: (index: number) => void;
  onResetView: () => void;
  onOpenPlaces: () => void;
  onBackToLandmarks: () => void;
  onClose: () => void;
}

export function GlobeOverlay({
  open,
  activeProvince,
  reducedMotion = false,
  onSelectProvince,
  onSelectLandmark,
  onResetView,
  onOpenPlaces,
  onBackToLandmarks,
  onClose,
}: GlobeOverlayProps) {
  if (!open) return null;

  const menuItems: MenuItem[] = [
    { icon: ArrowLeft, label: 'Back to landmarks', onSelect: onBackToLandmarks },
    { icon: MapTrifold, label: 'Open 3D Places diorama', onSelect: onOpenPlaces },
    { icon: Compass, label: 'Reset globe view', onSelect: onResetView },
  ];

  return (
    <div className="fixed inset-0 z-20 pointer-events-none">
      <div className="absolute inset-x-4 top-[calc(14px+env(safe-area-inset-top,0px))] flex items-center justify-between gap-2">
        <div className="min-w-0 drop-shadow-[0_1px_8px_rgba(0,0,0,0.85)] font-serif-display italic text-[19px] sm:text-[22px] text-[#f3efe6] leading-tight truncate">
          South Africa
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 pointer-events-auto">
          <motion.button
            type="button"
            whileTap={reducedMotion ? undefined : { scale: PRESS_SCALE }}
            transition={SPRING.snappy}
            onClick={onBackToLandmarks}
            aria-label="Back to landmarks"
            title="Back to the landmark diorama"
            className="h-9 sm:h-10 px-2.5 sm:px-3.5 rounded-full inline-flex items-center gap-1.5 bg-[#121319]/92 border border-white/15 text-[12.5px] sm:text-[13px] font-medium text-[#f3efe6] hover:border-[#e8b04a] hover:text-[#e8b04a] transition-colors cursor-pointer shadow-lg"
          >
            <ArrowLeft size={16} weight="bold" />
            <span className="hidden sm:inline">Landmarks</span>
          </motion.button>

          <motion.button
            type="button"
            whileTap={reducedMotion ? undefined : { scale: PRESS_SCALE }}
            transition={SPRING.snappy}
            onClick={onOpenPlaces}
            aria-label="Open 3D Places diorama archipelago"
            title="Explore 3D Geological Places"
            className="h-9 sm:h-10 px-2.5 sm:px-3.5 rounded-full inline-flex items-center gap-1.5 bg-[#121319]/92 border border-white/15 text-[12.5px] sm:text-[13px] font-medium text-[#f3efe6] hover:border-[#e8b04a] hover:text-[#e8b04a] transition-colors cursor-pointer shadow-lg"
          >
            <MapTrifold size={16} weight="bold" />
            <span className="hidden sm:inline">Places</span>
          </motion.button>

          <motion.button
            type="button"
            whileTap={reducedMotion ? undefined : { scale: PRESS_SCALE }}
            transition={SPRING.snappy}
            onClick={onResetView}
            aria-label="Reset globe view"
            title="Reset globe view"
            className="hidden sm:grid w-10 h-10 rounded-full place-items-center bg-[#121319]/92 border border-white/15 text-[#f3efe6] hover:border-[#e8b04a] hover:text-[#e8b04a] transition-colors cursor-pointer shadow-lg"
          >
            <Compass size={18} />
          </motion.button>

          <motion.button
            type="button"
            whileTap={reducedMotion ? undefined : { scale: PRESS_SCALE }}
            transition={SPRING.snappy}
            onClick={onClose}
            aria-label="Close 3D globe"
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full grid place-items-center bg-[#121319]/92 border border-white/15 text-[#f3efe6] hover:border-[#e8b04a] hover:text-[#e8b04a] transition-colors cursor-pointer shadow-lg"
          >
            <X size={18} />
          </motion.button>

          <Menu
            ariaLabel="Globe actions"
            reducedMotion={reducedMotion}
            items={menuItems}
            trigger={
              <motion.button
                type="button"
                whileTap={reducedMotion ? undefined : { scale: PRESS_SCALE }}
                aria-label="More globe actions"
                title="More actions"
                className="sm:hidden w-9 h-9 rounded-full grid place-items-center bg-[#121319]/92 border border-white/15 text-[#f3efe6] hover:border-[#e8b04a] hover:text-[#e8b04a] transition-colors cursor-pointer shadow-lg"
              >
                <DotsThree size={17} weight="bold" />
              </motion.button>
            }
          />
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-[calc(14px+env(safe-area-inset-bottom,0px))] px-3.5 flex items-center gap-2 overflow-x-auto no-scrollbar pointer-events-auto">
        {['All', ...PROVINCES].map((pv) => {
          const active = activeProvince === pv;
          return (
            <motion.button
              key={pv}
              type="button"
              whileTap={reducedMotion ? undefined : { scale: 0.97 }}
              transition={SPRING.snappy}
              aria-pressed={active}
              onClick={() => onSelectProvince(pv)}
              className={`province-pill relative shrink-0 whitespace-nowrap rounded-full px-3.5 py-1.5 text-[12.5px] bg-[#121319]/92 border cursor-pointer ${
                active
                  ? 'border-[#e8b04a] text-[#e8b04a]'
                  : 'border-white/15 text-[#f3efe6] hover:border-[#e8b04a]'
              }`}
            >
              {active &&
                (reducedMotion ? (
                  <span className="absolute inset-0 rounded-full bg-[#e8b04a]/15" />
                ) : (
                  <motion.span
                    layoutId="globe-province-pill"
                    className="absolute inset-0 rounded-full border border-[#e8b04a] bg-[#e8b04a]/15"
                    transition={SPRING.snappy}
                  />
                ))}
              <span className="relative z-10">{pv}</span>
            </motion.button>
          );
        })}
      </div>

      {/* The canvas pins aren't reachable by keyboard or screen readers, so
          expose the same destinations as a visually hidden landmark list. */}
      <ul className="sr-only" aria-label="Landmarks on the globe">
        {LANDMARKS.map((lm, i) => (
          <li key={lm.k}>
            <button type="button" onClick={() => onSelectLandmark(i)}>
              Visit {lm.k} — {lm.c}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
