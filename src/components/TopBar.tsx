import {
  CornersIn,
  CornersOut,
  Crop,
  MagnifyingGlass,
  Ruler,
  SpeakerHigh,
  SpeakerSlash,
  SunHorizon,
} from '@phosphor-icons/react';
import type { ComponentType } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { DURATION, EASE_SMOOTH_OUT, PRESS_SCALE, SPRING, swapTransition } from '../lib/motion';
import type { ThemeSetting } from '../types/citylit';

interface TopBarProps {
  soundOn: boolean;
  todOpen: boolean;
  fullscreen: boolean;
  idleInFullscreen: boolean;
  globeOpen: boolean;
  theme?: ThemeSetting;
  scaleMode?: boolean;
  reducedMotion?: boolean;
  onToggleScale?: () => void;
  onToggleSound: () => void;
  onToggleTod: () => void;
  onToggleFullscreen: () => void;
  onHeroView: () => void;
  onOpenSearch: () => void;
}

interface IconButtonProps {
  label: string;
  title?: string;
  active?: boolean;
  icon: ComponentType<{ size?: number; weight?: 'bold' | 'fill' | 'regular' }>;
  accent?: boolean;
  onClick: () => void;
  reducedMotion: boolean;
}

function IconButton({
  label,
  title,
  active,
  icon: Icon,
  accent,
  onClick,
  reducedMotion,
}: IconButtonProps) {
  return (
    <motion.button
      type="button"
      whileTap={reducedMotion ? undefined : { scale: PRESS_SCALE }}
      transition={SPRING.snappy}
      onClick={onClick}
      aria-label={label}
      title={title ?? label}
      className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full grid place-items-center border cursor-pointer focus-visible:outline-2 focus-visible:outline-[#e8b04a] ${
        accent
          ? 'bg-[#e8b04a] border-[#e8b04a] text-[#1a1405]'
          : `bg-[#121319]/90 text-[#f3efe6] hover:border-[#e8b04a] hover:text-[#e8b04a] ${
              active ? 'border-[#e8b04a] text-[#e8b04a]' : 'border-white/15'
            }`
      }`}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={label + String(active)}
          initial={
            reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.94, filter: 'blur(2px)' }
          }
          animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
          exit={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.94, filter: 'blur(2px)' }}
          transition={reducedMotion ? { duration: 0 } : swapTransition}
          className="grid place-items-center"
        >
          <Icon size={18} weight={accent ? 'bold' : 'regular'} />
        </motion.span>
      </AnimatePresence>
    </motion.button>
  );
}

export function TopBar({
  soundOn,
  todOpen,
  fullscreen,
  idleInFullscreen,
  globeOpen,
  theme = 'dark',
  scaleMode = false,
  reducedMotion = false,
  onToggleScale,
  onToggleSound,
  onToggleTod,
  onToggleFullscreen,
  onHeroView,
  onOpenSearch,
}: TopBarProps) {
  if (globeOpen) return null;

  return (
    <>
      {!fullscreen && (
        <motion.header
          initial={reducedMotion ? false : { opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={reducedMotion ? { duration: 0 } : { duration: DURATION.slow, ease: EASE_SMOOTH_OUT }}
          className="fixed inset-x-0 top-0 z-10 flex items-center justify-between px-4 pt-[calc(14px+env(safe-area-inset-top,0px))] pointer-events-none"
        >
          <div
            className={`font-serif-display italic text-[22px] tracking-[0.01em] select-none transition-colors duration-300 ${
              theme === 'dark' ? 'text-[#f3efe6]' : 'text-[#16202e]'
            }`}
          >
            cıtylit
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 pointer-events-auto">
            <IconButton
              label={soundOn ? 'Mute ambient sound' : 'Unmute ambient sound'}
              title="Ambient sound"
              icon={soundOn ? SpeakerHigh : SpeakerSlash}
              active={soundOn}
              onClick={onToggleSound}
              reducedMotion={reducedMotion}
            />
            <IconButton
              label="Time of day"
              icon={SunHorizon}
              active={todOpen}
              onClick={onToggleTod}
              reducedMotion={reducedMotion}
            />
            {onToggleScale && (
              <IconButton
                label={scaleMode ? 'Turn off scale mode' : 'Turn on scale mode'}
                title="Scale mode (S)"
                icon={Ruler}
                active={scaleMode}
                onClick={onToggleScale}
                reducedMotion={reducedMotion}
              />
            )}
            <IconButton
              label="Toggle fullscreen view"
              icon={CornersOut}
              onClick={onToggleFullscreen}
              reducedMotion={reducedMotion}
            />
            <IconButton
              label="Reset to hero framing"
              title="Hero view (fit the landmark)"
              icon={Crop}
              onClick={onHeroView}
              reducedMotion={reducedMotion}
            />
            <IconButton
              label="Browse all landmarks"
              title="Browse landmarks (/)"
              icon={MagnifyingGlass}
              accent
              onClick={onOpenSearch}
              reducedMotion={reducedMotion}
            />
          </div>
        </motion.header>
      )}

      {fullscreen && (
        <motion.button
          type="button"
          whileTap={reducedMotion ? undefined : { scale: PRESS_SCALE }}
          onClick={onToggleFullscreen}
          aria-label="Exit fullscreen"
          title="Exit fullscreen"
          // Keep the control reachable when idle: fading it out with
          // pointer-events disabled left no way to leave fullscreen without
          // first waking the UI with a pointer move (impossible on touch).
          animate={{ opacity: idleInFullscreen ? 0.45 : 0.8 }}
          transition={{ duration: reducedMotion ? 0 : 0.3 }}
          className="fixed right-4 top-[calc(14px+env(safe-area-inset-top,0px))] z-20 w-10 h-10 rounded-full grid place-items-center bg-[#121319]/90 border border-white/15 text-[#f3efe6] hover:border-[#e8b04a] hover:text-[#e8b04a] cursor-pointer"
        >
          <CornersIn size={18} />
        </motion.button>
      )}
    </>
  );
}
