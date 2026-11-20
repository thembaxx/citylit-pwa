import { CaretLeft, CaretRight, Play, ShareNetwork, X } from '@phosphor-icons/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useMotionValue } from 'motion/react';
import { LANDMARKS } from '../data/landmarks';
import { loadLandmarkMedia } from '../services/mediaService';
import type { MediaItem } from '../types/citylit';
import { animate, applyRubberBand, EASE_SMOOTH_OUT, project, SPRING } from '../lib/motion';
import { useDrag } from '../lib/useDrag';

interface GalleryModalProps {
  open: boolean;
  index: number;
  captureFallbackShots: (index: number) => MediaItem[];
  reducedMotion?: boolean;
  onClose: () => void;
  onShare: () => void;
}

export function GalleryModal({
  open,
  index,
  captureFallbackShots,
  reducedMotion = false,
  onClose,
  onShare,
}: GalleryModalProps) {
  if (!open) return null;
  return (
    <GalleryDialog
      key={index}
      index={index}
      captureFallbackShots={captureFallbackShots}
      reducedMotion={reducedMotion}
      onClose={onClose}
      onShare={onShare}
    />
  );
}

function GalleryDialog({
  index,
  captureFallbackShots,
  reducedMotion,
  onClose,
  onShare,
}: Omit<GalleryModalProps, 'open'>) {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [cur, setCur] = useState(0);
  const [loading, setLoading] = useState(true);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewIndex, setViewIndex] = useState(0);
  const [usingFallback, setUsingFallback] = useState(false);
  const stageX = useMotionValue(0);
  const dragOrigin = useRef(0);
  const viewerY = useMotionValue(0);
  const viewerOrigin = useRef(0);

  useEffect(() => {
    let cancelled = false;
    loadLandmarkMedia(index)
      .then((media) => {
        if (cancelled) return;
        setItems(media);
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setItems(captureFallbackShots(index));
        setUsingFallback(true);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [index, captureFallbackShots]);

  const clampCur = useCallback(
    (next: number) => {
      if (!items.length) return;
      setCur(Math.max(0, Math.min(items.length - 1, next)));
    },
    [items.length]
  );
  const clampView = useCallback(
    (next: number) => {
      if (!items.length) return;
      setViewIndex(Math.max(0, Math.min(items.length - 1, next)));
    },
    [items.length]
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (viewerOpen) setViewerOpen(false);
        else onClose();
      } else if (e.key === 'ArrowRight') {
        if (viewerOpen) clampView(viewIndex + 1);
        else clampCur(cur + 1);
      } else if (e.key === 'ArrowLeft') {
        if (viewerOpen) clampView(viewIndex - 1);
        else clampCur(cur - 1);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [viewerOpen, viewIndex, cur, clampCur, clampView, onClose]);

  // Flick the deck horizontally; release velocity carries the motion.
  const deckDrag = useDrag({
    lockAxis: 'x',
    onStart: () => {
      stageX.stop();
      dragOrigin.current = stageX.get();
    },
    onMove: (delta) => stageX.set(dragOrigin.current + delta.x * 0.8),
    onEnd: (velocity) => {
      const landing = stageX.get() + project(velocity.x * 0.6);
      if (Math.abs(landing) > 60) clampCur(cur + (landing < 0 ? 1 : -1));
      animate(stageX, 0, { ...SPRING.surface, velocity: velocity.x });
    },
  });

  // Fullscreen viewer: down dismisses, other directions rubber-band.
  const viewerDrag = useDrag({
    lockAxis: 'y',
    onStart: () => {
      viewerY.stop();
      viewerOrigin.current = viewerY.get();
    },
    onMove: (delta) => {
      const y = viewerOrigin.current + delta.y;
      viewerY.set(y > 0 ? y : -applyRubberBand(-y, 0, 0, 240));
    },
    onEnd: (velocity) => {
      const landing = viewerY.get() + project(velocity.y * 0.7);
      if (landing > 120 && viewerOpen) {
        setViewerOpen(false);
      }
      animate(viewerY, 0, { ...SPRING.surface, velocity: velocity.y });
    },
  });

  const lm = LANDMARKS[index];
  const activeItem = items[cur];
  const fullItem = items[viewIndex];
  const thumbId = (i: number) => `gallery-${index}-${i}`;

  return (
    <motion.div
      role="dialog"
      aria-label={`${lm.k} photo gallery`}
      initial={reducedMotion ? { opacity: 0 } : { opacity: 0, filter: 'blur(3px)' }}
      animate={{ opacity: 1, filter: 'blur(0px)' }}
      exit={{ opacity: 0 }}
      transition={{ duration: reducedMotion ? 0 : 0.35, ease: EASE_SMOOTH_OUT }}
      className="fixed inset-0 z-50 bg-[#08090d]/98 backdrop-blur-sm flex flex-col justify-between p-4 pt-[calc(14px+env(safe-area-inset-top,0px))] pb-[calc(18px+env(safe-area-inset-bottom,0px))]"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-serif-display italic text-[26px] leading-tight text-[#f3efe6] m-0">
            {lm.k}
          </h2>
          <p className="text-[12.5px] text-[#a9a69e] mt-1.5">
            {loading
              ? 'Loading photos from Wikimedia Commons…'
              : usingFallback
                ? `${lm.c} · Offline 3D views`
                : `${lm.c} · ${items.length} media items`}
          </p>
        </div>
        <motion.button
          type="button"
          whileTap={reducedMotion ? undefined : { scale: 0.9 }}
          onClick={onClose}
          aria-label="Close gallery"
          className="w-10 h-10 rounded-full grid place-items-center bg-[#181a22] border border-white/15 text-[#f3efe6] hover:border-[#e8b04a] hover:text-[#e8b04a] cursor-pointer shrink-0"
        >
          <X size={18} />
        </motion.button>
      </div>

      <motion.div
        {...deckDrag}
        style={{ x: stageX, perspective: 1200 }}
        className="relative flex-1 min-h-0 flex items-center justify-center overflow-hidden select-none touch-none"
      >
        {loading && (
          <div className="w-[min(74vw,380px)] aspect-[4/3] rounded-2xl shimmer-bg border border-white/10" />
        )}

        {!loading &&
          items.map((item, idx) => {
            const d = idx - cur;
            if (Math.abs(d) > 3) return null;
            const translateX = d * 190 - Math.sign(d) * 32;
            const translateZ = -Math.abs(d) * 140;
            const rotateY = Math.max(-44, Math.min(44, -d * 24));
            const scale = d === 0 ? 1 : 0.86;
            const opacity = Math.max(0.2, 1 - Math.abs(d) * 0.34);

            return (
              <motion.div
                key={`${item.src}-${idx}`}
                animate={{ x: translateX, z: translateZ, rotateY, scale, opacity }}
                transition={reducedMotion ? { duration: 0 } : SPRING.morph}
                style={{ zIndex: 20 - Math.abs(d) }}
                className="absolute w-[min(74vw,410px)] aspect-[4/3]"
              >
                <motion.div
                  layoutId={thumbId(idx)}
                  transition={reducedMotion ? { duration: 0 } : SPRING.morph}
                  onClick={() => {
                    if (d === 0) {
                      setViewIndex(idx);
                      setViewerOpen(true);
                    } else {
                      clampCur(idx);
                    }
                  }}
                  className="relative h-full w-full cursor-pointer overflow-hidden rounded-2xl bg-[#141721] border border-white/15 shadow-2xl"
                >
                  <img
                    src={item.src}
                    alt={item.cap}
                    className="h-full w-full object-cover pointer-events-none"
                  />
                  {item.v && (
                    <span className="absolute inset-0 grid place-items-center bg-black/25">
                      <span className="w-14 h-14 rounded-full bg-black/75 border border-white/25 grid place-items-center text-white">
                        <Play size={22} weight="fill" />
                      </span>
                    </span>
                  )}
                </motion.div>
              </motion.div>
            );
          })}
      </motion.div>

      {!loading && activeItem && (
        <div className="max-w-xl mx-auto w-full text-center space-y-3">
          <div className="flex items-center justify-center gap-3">
            <motion.button
              type="button"
              whileTap={reducedMotion ? undefined : { scale: 0.9 }}
              onClick={() => clampCur(cur - 1)}
              disabled={cur === 0}
              aria-label="Previous photo"
              className="w-9 h-9 rounded-full grid place-items-center bg-[#181a22] border border-white/15 text-[#f3efe6] disabled:opacity-35 hover:border-[#e8b04a] cursor-pointer"
            >
              <CaretLeft size={16} />
            </motion.button>
            <div className="flex items-center gap-1.5">
              {items.map((item, idx) => (
                <motion.button
                  key={`dot-${item.src}-${idx}`}
                  type="button"
                  onClick={() => setCur(idx)}
                  aria-label={`Photo ${idx + 1}`}
                  className="relative h-2 w-2 rounded-full bg-white/30 cursor-pointer"
                >
                  {idx === cur && (
                    <motion.span
                      layoutId="gallery-dot"
                      className="absolute inset-0 w-5 rounded-full bg-[#e8b04a]"
                      transition={SPRING.snappy}
                    />
                  )}
                </motion.button>
              ))}
            </div>
            <motion.button
              type="button"
              whileTap={reducedMotion ? undefined : { scale: 0.9 }}
              onClick={() => clampCur(cur + 1)}
              disabled={cur === items.length - 1}
              aria-label="Next photo"
              className="w-9 h-9 rounded-full grid place-items-center bg-[#181a22] border border-white/15 text-[#f3efe6] disabled:opacity-35 hover:border-[#e8b04a] cursor-pointer"
            >
              <CaretRight size={16} />
            </motion.button>
          </div>
          <p className="text-[12.5px] text-[#f3efe6]/90 line-clamp-2 m-0">{activeItem.cap}</p>
          <p className="text-[11px] font-mono text-[#a9a69e] m-0">
            {activeItem.cr ? `${activeItem.cr} · ` : ''}
            {activeItem.lic || 'Wikimedia Commons'}
          </p>
        </div>
      )}

      <AnimatePresence>
        {viewerOpen && fullItem && (
          <motion.div
            key="viewer"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reducedMotion ? 0 : 0.25 }}
            className="fixed inset-0 z-60 bg-[#050609] flex flex-col justify-between p-4 pt-[calc(14px+env(safe-area-inset-top,0px))] pb-[calc(18px+env(safe-area-inset-bottom,0px))]"
          >
            <motion.div
              {...viewerDrag}
              style={{ y: viewerY }}
              className="flex items-center justify-between gap-2 touch-none"
            >
              <span className="text-[13px] font-mono tabular-nums text-[#a9a69e]">
                {viewIndex + 1} / {items.length}
              </span>
              <div className="flex items-center gap-2">
                <motion.button
                  type="button"
                  whileTap={reducedMotion ? undefined : { scale: 0.9 }}
                  onClick={onShare}
                  aria-label="Share landmark"
                  className="w-10 h-10 rounded-full grid place-items-center bg-[#181a22] border border-white/15 text-[#f3efe6] hover:border-[#e8b04a] cursor-pointer"
                >
                  <ShareNetwork size={18} />
                </motion.button>
                <motion.button
                  type="button"
                  whileTap={reducedMotion ? undefined : { scale: 0.9 }}
                  onClick={() => setViewerOpen(false)}
                  aria-label="Close fullscreen photo"
                  className="w-10 h-10 rounded-full grid place-items-center bg-[#181a22] border border-white/15 text-[#f3efe6] hover:border-[#e8b04a] cursor-pointer"
                >
                  <X size={18} />
                </motion.button>
              </div>
            </motion.div>

            <div className="flex items-center justify-center">
              <motion.div
                layoutId={thumbId(viewIndex)}
                transition={reducedMotion ? { duration: 0 } : SPRING.morph}
                className="max-w-full flex items-center justify-center"
              >
                {fullItem.v ? (
                  <video
                    src={fullItem.full}
                    controls
                    autoPlay
                    playsInline
                    className="max-w-full max-h-[70dvh] rounded-xl"
                  />
                ) : (
                  <img
                    src={fullItem.full || fullItem.src}
                    alt={fullItem.cap}
                    className="max-w-full max-h-[70dvh] object-contain rounded-xl"
                  />
                )}
              </motion.div>
            </div>

            <div className="flex items-center justify-between gap-3 max-w-2xl mx-auto w-full">
              <motion.button
                type="button"
                whileTap={reducedMotion ? undefined : { scale: 0.9 }}
                onClick={() => clampView(viewIndex - 1)}
                disabled={viewIndex === 0}
                aria-label="Previous image"
                className="w-10 h-10 rounded-full grid place-items-center bg-[#181a22] border border-white/15 text-[#f3efe6] disabled:opacity-35 cursor-pointer shrink-0"
              >
                <CaretLeft size={18} />
              </motion.button>
              <div className="text-center min-w-0">
                <p className="text-[13px] text-[#f3efe6] line-clamp-2 m-0">{fullItem.cap}</p>
                {fullItem.page && (
                  <a
                    href={fullItem.page}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-[#e8b04a] underline"
                  >
                    Source & license ({fullItem.lic || 'Commons'})
                  </a>
                )}
              </div>
              <motion.button
                type="button"
                whileTap={reducedMotion ? undefined : { scale: 0.9 }}
                onClick={() => clampView(viewIndex + 1)}
                disabled={viewIndex === items.length - 1}
                aria-label="Next image"
                className="w-10 h-10 rounded-full grid place-items-center bg-[#181a22] border border-white/15 text-[#f3efe6] disabled:opacity-35 cursor-pointer shrink-0"
              >
                <CaretRight size={18} />
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
