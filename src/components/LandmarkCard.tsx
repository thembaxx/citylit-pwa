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
import { LANDMARKS } from '../data/landmarks';

interface LandmarkCardProps {
  index: number;
  isFavorite: boolean;
  tourActive: boolean;
  visible: boolean;
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
  const swipeStart = useRef<{ x: number; y: number } | null>(null);
  const holdTimer = useRef<number | null>(null);

  // Publish the card height so fixed overlays can stack above it instead of guessing.
  // Observe the un-keyed wrapper: the card itself remounts on every landmark change.
  useEffect(() => {
    if (!visible) return;
    const el = cardWrapRef.current;
    const root = document.documentElement;
    if (!el) {
      root.style.removeProperty('--cl-card-h');
      return;
    }
    const sync = () => {
      root.style.setProperty('--cl-card-h', `${el.offsetHeight}px`);
    };
    sync();
    const ro = new ResizeObserver(sync);
    ro.observe(el);
    return () => {
      ro.disconnect();
      root.style.removeProperty('--cl-card-h');
    };
  }, [visible]);

  if (!visible) return null;

  const lm = LANDMARKS[index];
  const progressPct = ((index + 1) / LANDMARKS.length) * 100;

  const clearHold = () => {
    if (holdTimer.current !== null) {
      window.clearTimeout(holdTimer.current);
      holdTimer.current = null;
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    swipeStart.current = { x: t.clientX, y: t.clientY };
    clearHold();
    holdTimer.current = window.setTimeout(() => {
      onVibrate();
      setRadialPos({
        x: Math.min(window.innerWidth - 95, Math.max(95, t.clientX)),
        y: Math.min(window.innerHeight - 95, Math.max(95, t.clientY)),
      });
    }, 450);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!swipeStart.current) return;
    const t = e.touches[0];
    if (Math.hypot(t.clientX - swipeStart.current.x, t.clientY - swipeStart.current.y) > 12) {
      clearHold();
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    clearHold();
    if (!swipeStart.current) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - swipeStart.current.x;
    const dy = t.clientY - swipeStart.current.y;
    swipeStart.current = null;
    if (Math.abs(dx) > 48 && Math.abs(dy) < 50) {
      if (dx < 0) onNext();
      else onPrev();
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setRadialPos({
      x: Math.min(window.innerWidth - 95, Math.max(95, e.clientX)),
      y: Math.min(window.innerHeight - 95, Math.max(95, e.clientY)),
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
        <div
          key={index}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onContextMenu={handleContextMenu}
          className="relative bg-[#121319]/92 border border-white/15 squircle-card p-4 landscape:p-3 [@media(max-height:700px)]:p-3 pointer-events-auto animate-card-in touch-pan-y shadow-2xl max-h-[calc(100dvh-104px)] overflow-y-auto overscroll-contain no-scrollbar"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <small className="block text-[#e8b04a] tracking-[0.12em] uppercase text-[11px] [@media(max-width:374px)]:text-[10px] [@media(max-width:374px)]:tracking-[0.08em]">
                {lm.c}
              </small>
              <h1 className="mt-0.5 mb-1.5 font-serif-display italic font-normal text-[27px] landscape:text-[21px] [@media(max-height:700px)]:text-[23px] leading-[1.1] text-[#f3efe6] pr-2">
                {lm.k}
              </h1>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={onOpenPostcard}
                aria-label="Create 3D postcard"
                title="Save 3D postcard"
                className={smallBtn}
              >
                <Camera size={16} />
              </button>
              <button
                type="button"
                onClick={onOpenGallery}
                aria-label="Landmark photo gallery"
                title="Photos"
                className={smallBtn}
              >
                <Images size={16} />
              </button>
              <button
                type="button"
                onClick={onToggleFavorite}
                aria-label={isFavorite ? 'Remove from favorites' : 'Save favorite'}
                title="Save favorite"
                className={`${smallBtn} ${isFavorite ? 'border-[#ff6b81] text-[#ff6b81]' : ''}`}
              >
                <Heart size={16} weight={isFavorite ? 'fill' : 'regular'} />
              </button>
            </div>
          </div>

          <p className="text-[13.5px] landscape:text-[12.5px] leading-relaxed text-[#a9a69e] m-0 landscape:line-clamp-2 [@media(max-height:700px)]:line-clamp-2">
            {lm.f}
          </p>

          <div className="flex items-center gap-2.5 mt-3 landscape:mt-2">
            <button
              type="button"
              onClick={onOpenInfo}
              aria-label="Landmark historical and architectural details"
              className="h-9 px-3 rounded-full inline-flex items-center gap-1.5 bg-white/[0.06] border border-white/15 text-[12px] font-medium text-[#f3efe6] hover:border-[#e8b04a] hover:text-[#e8b04a] transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <Info size={15} />
              <span>Details</span>
            </button>
            <button
              type="button"
              onClick={onPrev}
              aria-label="Previous landmark"
              className={smallBtn}
            >
              <ArrowLeft size={16} />
            </button>
            <div className="flex-1 h-[3px] rounded-full bg-white/15 overflow-hidden">
              <div
                className="h-full bg-[#e8b04a] transition-all duration-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <span className="text-[11px] tabular-nums text-[#a9a69e]">
              {index + 1}/{LANDMARKS.length}
            </span>
            <button type="button" onClick={onNext} aria-label="Next landmark" className={smallBtn}>
              <ArrowRight size={16} />
            </button>
            <button
              type="button"
              onClick={onToggleTour}
              aria-label={tourActive ? 'Pause auto tour' : 'Start auto tour'}
              title={tourActive ? 'Pause tour' : 'Auto tour'}
              className={`${smallBtn} ${tourActive ? 'border-[#e8b04a] text-[#e8b04a]' : ''}`}
            >
              {tourActive ? <Pause size={15} weight="fill" /> : <Play size={15} weight="fill" />}
            </button>
          </div>
        </div>
      </div>

      {radialPos && (
        <div onClick={() => setRadialPos(null)} className="fixed inset-0 z-40 bg-black/50">
          <div
            className="fixed w-0 h-0"
            style={{ left: `${radialPos.x}px`, top: `${radialPos.y}px` }}
          >
            {radialActions.map((act) => {
              const Icon = act.icon;
              return (
                <button
                  key={act.label}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setRadialPos(null);
                    act.onClick();
                  }}
                  title={act.label}
                  aria-label={act.label}
                  className={`absolute left-0 top-0 w-11 h-11 rounded-full grid place-items-center bg-[#181a22] border border-[#e8b04a]/60 text-[#f3efe6] hover:bg-[#e8b04a] hover:text-[#1a1405] shadow-xl transition cursor-pointer ${act.posClass}`}
                >
                  <Icon size={18} />
                </button>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}
