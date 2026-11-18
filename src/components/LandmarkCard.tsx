import {
  ArrowLeft,
  ArrowRight,
  BookmarkSimple,
  Camera,
  GlobeHemisphereEast,
  Heart,
  Images,
  Info,
  Pause,
  Play,
  ShareNetwork,
} from '@phosphor-icons/react';
import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useMotionValue } from 'motion/react';
import { LANDMARKS } from '../data/landmarks';
import { animate, DURATION, EASE_SMOOTH_OUT, project, SPRING } from '../lib/motion';
import { useDrag } from '../lib/useDrag';

interface LandmarkCardProps {
  index: number;
  isFavorite: boolean;
  tourActive: boolean;
  visible: boolean;
  thumbnail?: string;
  reducedMotion?: boolean;
  onPrev: () => void;
  onNext: () => void;
  onToggleFavorite: () => void;
  onToggleTour: () => void;
  onOpenInfo: () => void;
  onOpenGallery: () => void;
  onOpenPostcard: () => void;
  onOpenGlobe: () => void;
  onShare: () => void;
  onVibrate: () => void;
}

export function LandmarkCard({
  index,
  isFavorite,
  tourActive,
  visible,
  thumbnail,
  reducedMotion = false,
  onPrev,
  onNext,
  onToggleFavorite,
  onToggleTour,
  onOpenInfo,
  onOpenGallery,
  onOpenPostcard,
  onOpenGlobe,
  onShare,
  onVibrate,
}: LandmarkCardProps) {
  const [radialPos, setRadialPos] = useState<{ x: number; y: number } | null>(null);
  const cardWrapRef = useRef<HTMLDivElement>(null);
  const holdTimer = useRef<number | null>(null);
  const dragX = useMotionValue(0);
  const dragOrigin = useRef(0);

  // Publish the card height so fixed overlays can stack above it instead of guessing.
  useEffect(() => {
    if (!visible) return;
    const el = cardWrapRef.current;
    const root = document.documentElement;
    if (!el) {
      root.style.removeProperty('--cl-card-h');
      return;
    }
    const sync = () => root.style.setProperty('--cl-card-h', `${el.offsetHeight}px`);
    sync();
    const ro = new ResizeObserver(sync);
    ro.observe(el);
    return () => {
      ro.disconnect();
      root.style.removeProperty('--cl-card-h');
    };
  }, [visible]);

  // Drag the title strip to change landmark; velocity decides a flick.
  const headerDrag = useDrag({
    lockAxis: 'x',
    onStart: () => {
      dragX.stop();
      dragOrigin.current = dragX.get();
    },
    onMove: (delta) => dragX.set(dragOrigin.current + delta.x * 0.7),
    onEnd: (velocity) => {
      const landing = dragX.get() + project(velocity.x * 0.5);
      animate(dragX, 0, { ...SPRING.surface, velocity: velocity.x });
      if (landing < -64) onNext();
      else if (landing > 64) onPrev();
    },
  });

  if (!visible) return null;

  const lm = LANDMARKS[index];
  const progressPct = ((index + 1) / LANDMARKS.length) * 100;

  const clearHold = () => {
    if (holdTimer.current !== null) {
      window.clearTimeout(holdTimer.current);
      holdTimer.current = null;
    }
  };

  const openRadial = (x: number, y: number) => {
    onVibrate();
    setRadialPos({
      x: Math.min(window.innerWidth - 95, Math.max(95, x)),
      y: Math.min(window.innerHeight - 95, Math.max(95, y)),
    });
  };

  const radialActions = [
    {
      label: isFavorite ? 'Saved' : 'Save',
      icon: isFavorite ? BookmarkSimple : Heart,
      onClick: onToggleFavorite,
      posClass: '-translate-x-1/2 -translate-y-[84px]',
    },
    {
      label: 'Details',
      icon: Info,
      onClick: onOpenInfo,
      posClass: 'translate-x-[50px] -translate-y-[66px]',
    },
    {
      label: 'Photos',
      icon: Images,
      onClick: onOpenGallery,
      posClass: 'translate-x-[68px] -translate-y-1/2',
    },
    {
      label: 'Postcard',
      icon: Camera,
      onClick: onOpenPostcard,
      posClass: 'translate-x-[38px] translate-y-[42px]',
    },
    {
      label: 'Globe',
      icon: GlobeHemisphereEast,
      onClick: onOpenGlobe,
      posClass: '-translate-x-[108px] -translate-y-1/2',
    },
    {
      label: 'Share',
      icon: ShareNetwork,
      onClick: onShare,
      posClass: '-translate-x-[86px] -translate-y-[66px]',
    },
  ];

  const smallBtn =
    'w-9 h-9 rounded-full grid place-items-center bg-white/[0.06] border border-white/15 text-[#f3efe6] hover:border-[#e8b04a] hover:text-[#e8b04a] transition-colors cursor-pointer';

  return (
    <>
      <div
        ref={cardWrapRef}
        className="fixed left-0 bottom-0 z-10 w-full max-w-[560px] landscape:max-w-[380px] px-3.5 pb-[calc(14px+env(safe-area-inset-bottom,0px))] pointer-events-none"
      >
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 10, scale: 0.985 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: reducedMotion ? 0 : DURATION.slow, ease: EASE_SMOOTH_OUT }}
          onContextMenu={(e) => {
            e.preventDefault();
            openRadial(e.clientX, e.clientY);
          }}
          className="relative bg-[#121319]/92 border border-white/15 squircle-card p-4 landscape:p-3 [@media(max-height:700px)]:p-3 pointer-events-auto shadow-2xl max-h-[calc(100dvh-104px)] overflow-y-auto overscroll-contain no-scrollbar"
        >
          <div className="flex items-start justify-between gap-3">
            <motion.div
              {...headerDrag}
              style={{ x: dragX }}
              className="min-w-0 flex-1 cursor-grab touch-none active:cursor-grabbing"
              onTouchStart={(e) => {
                clearHold();
                const t = e.touches[0];
                holdTimer.current = window.setTimeout(() => openRadial(t.clientX, t.clientY), 450);
              }}
              onTouchEnd={clearHold}
              onTouchMove={() => clearHold()}
            >
              <small className="block text-[#e8b04a] tracking-[0.12em] uppercase text-[11px] [@media(max-width:374px)]:text-[10px] [@media(max-width:374px)]:tracking-[0.08em]">
                {lm.c}
              </small>
              <motion.h1
                layoutId="landmark-title"
                transition={reducedMotion ? { duration: 0 } : SPRING.morph}
                className="mt-0.5 mb-1.5 font-serif-display italic text-[27px] landscape:text-[21px] [@media(max-height:700px)]:text-[23px] leading-[1.1] text-[#f3efe6] pr-2"
              >
                {lm.k}
              </motion.h1>
            </motion.div>
            <div className="flex items-center gap-1.5 shrink-0">
              {thumbnail && (
                <motion.img
                  layoutId={`landmark-thumb-${index}`}
                  src={thumbnail}
                  alt=""
                  transition={reducedMotion ? { duration: 0 } : SPRING.morph}
                  className="w-12 h-12 rounded-xl object-cover border border-white/15 hidden sm:block"
                />
              )}
              {[
                {
                  label: 'Create 3D postcard',
                  icon: Camera,
                  onClick: onOpenPostcard,
                  active: false,
                },
                {
                  label: 'Landmark photo gallery',
                  icon: Images,
                  onClick: onOpenGallery,
                  active: false,
                },
                {
                  label: isFavorite ? 'Remove from favorites' : 'Save favorite',
                  icon: Heart,
                  onClick: onToggleFavorite,
                  active: isFavorite,
                },
              ].map(({ label, icon: Icon, onClick, active }) => (
                <motion.button
                  key={label}
                  type="button"
                  whileTap={reducedMotion ? undefined : { scale: 0.88 }}
                  transition={SPRING.snappy}
                  onClick={onClick}
                  aria-label={label}
                  title={label}
                  className={`${smallBtn} ${active ? 'border-[#ff6b81] text-[#ff6b81]' : ''}`}
                >
                  <Icon size={16} weight={active ? 'fill' : 'regular'} />
                </motion.button>
              ))}
            </div>
          </div>

          <p className="text-[13.5px] landscape:text-[12.5px] leading-relaxed text-[#a9a69e] m-0 landscape:line-clamp-2 [@media(max-height:700px)]:line-clamp-2">
            {lm.f}
          </p>

          <div className="flex items-center gap-2.5 mt-3 landscape:mt-2">
            <motion.button
              type="button"
              whileTap={reducedMotion ? undefined : { scale: 0.96 }}
              onClick={onOpenInfo}
              aria-label="Landmark historical and architectural details"
              className="h-9 px-3 rounded-full inline-flex items-center gap-1.5 bg-white/[0.06] border border-white/15 text-[12px] font-medium text-[#f3efe6] hover:border-[#e8b04a] hover:text-[#e8b04a] transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <Info size={15} />
              Details
            </motion.button>
            <motion.button
              type="button"
              whileTap={reducedMotion ? undefined : { scale: 0.88 }}
              onClick={onPrev}
              aria-label="Previous landmark"
              className={smallBtn}
            >
              <ArrowLeft size={16} />
            </motion.button>
            <div className="flex-1 h-[3px] rounded-full bg-white/15 overflow-hidden">
              <motion.div
                className="h-full bg-[#e8b04a]"
                initial={false}
                animate={{ width: `${progressPct}%` }}
                transition={{ duration: reducedMotion ? 0 : 0.5, ease: EASE_SMOOTH_OUT }}
              />
            </div>
            <span className="text-[11px] font-mono tabular-nums text-[#a9a69e]">
              {index + 1}/{LANDMARKS.length}
            </span>
            <motion.button
              type="button"
              whileTap={reducedMotion ? undefined : { scale: 0.88 }}
              onClick={onNext}
              aria-label="Next landmark"
              className={smallBtn}
            >
              <ArrowRight size={16} />
            </motion.button>
            <motion.button
              type="button"
              whileTap={reducedMotion ? undefined : { scale: 0.88 }}
              onClick={onToggleTour}
              aria-label={tourActive ? 'Pause auto tour' : 'Start auto tour'}
              title={tourActive ? 'Pause tour' : 'Auto tour'}
              className={`${smallBtn} ${tourActive ? 'border-[#e8b04a] text-[#e8b04a]' : ''}`}
            >
              {tourActive ? <Pause size={15} weight="fill" /> : <Play size={15} weight="fill" />}
            </motion.button>
          </div>
        </motion.div>
      </div>

      <AnimatePresence>
        {radialPos && (
          <motion.div
            key="radial-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={() => setRadialPos(null)}
            className="fixed inset-0 z-40 bg-black/50"
          >
            <div className="fixed w-0 h-0" style={{ left: radialPos.x, top: radialPos.y }}>
              {radialActions.map((act, idx) => {
                const Icon = act.icon;
                return (
                  <motion.button
                    key={act.label}
                    type="button"
                    initial={{ opacity: 0, scale: 0.3, x: 0, y: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.4 }}
                    transition={{ ...SPRING.pop, delay: reducedMotion ? 0 : idx * 0.03 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setRadialPos(null);
                      act.onClick();
                    }}
                    title={act.label}
                    aria-label={act.label}
                    className={`absolute left-0 top-0 w-11 h-11 rounded-full grid place-items-center bg-[#181a22] border border-[#e8b04a]/60 text-[#f3efe6] hover:bg-[#e8b04a] hover:text-[#1a1405] shadow-xl cursor-pointer ${act.posClass}`}
                  >
                    <Icon size={18} />
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
