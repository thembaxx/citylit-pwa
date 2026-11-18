import { ArrowLeft, ArrowRight, Play, ShareNetwork, X } from '@phosphor-icons/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { LANDMARKS } from '../data/landmarks';
import { loadLandmarkMedia } from '../services/mediaService';
import type { MediaItem } from '../types/citylit';

interface GalleryModalProps {
  open: boolean;
  index: number;
  captureFallbackShots: (index: number) => MediaItem[];
  onClose: () => void;
  onShare: () => void;
}

export function GalleryModal({
  open,
  index,
  captureFallbackShots,
  onClose,
  onShare,
}: GalleryModalProps) {
  if (!open) return null;
  return (
    <GalleryDialog
      key={index}
      index={index}
      captureFallbackShots={captureFallbackShots}
      onClose={onClose}
      onShare={onShare}
    />
  );
}

function GalleryDialog({
  index,
  captureFallbackShots,
  onClose,
  onShare,
}: Omit<GalleryModalProps, 'open'>) {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [cur, setCur] = useState(0);
  const [loading, setLoading] = useState(true);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewIndex, setViewIndex] = useState(0);
  const [usingFallback, setUsingFallback] = useState(false);

  const stageRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ x: number; dx: number } | null>(null);
  const swipeViewerRef = useRef<{ x: number; y: number } | null>(null);

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
        const fallback = captureFallbackShots(index);
        setItems(fallback);
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

  const lm = LANDMARKS[index];
  const activeItem = items[cur];
  const fullItem = items[viewIndex];

  return (
    <div
      role="dialog"
      aria-label={`${lm.k} photo gallery`}
      className="fixed inset-0 z-50 bg-[#08090d]/98 backdrop-blur-sm flex flex-col justify-between p-4 pt-[calc(14px+env(safe-area-inset-top,0px))] pb-[calc(18px+env(safe-area-inset-bottom,0px))]"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-serif-display italic text-[26px] leading-tight text-[#f3efe6] m-0">
            {lm.k}
          </h2>
          <p className="text-[12.5px] text-[#a9a69e] mt-1">
            {loading
              ? 'Loading photos from Wikimedia Commons…'
              : usingFallback
                ? `${lm.c} · Offline 3D views`
                : `${lm.c} · ${items.length} media items`}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close gallery"
          className="w-10 h-10 rounded-full grid place-items-center bg-[#181a22] border border-white/15 text-[#f3efe6] hover:border-[#e8b04a] hover:text-[#e8b04a] cursor-pointer shrink-0"
        >
          <X size={18} />
        </button>
      </div>

      <div
        ref={stageRef}
        onPointerDown={(e) => {
          dragRef.current = { x: e.clientX, dx: 0 };
        }}
        onPointerMove={(e) => {
          if (dragRef.current) dragRef.current.dx = e.clientX - dragRef.current.x;
        }}
        onPointerUp={() => {
          if (dragRef.current && Math.abs(dragRef.current.dx) > 40) {
            clampCur(cur + (dragRef.current.dx < 0 ? 1 : -1));
          }
          dragRef.current = null;
        }}
        className="relative flex-1 min-h-0 flex items-center justify-center overflow-hidden select-none touch-pan-y"
        style={{ perspective: '1200px' }}
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
              <div
                key={`${item.src}-${idx}`}
                onClick={() => {
                  if (d === 0) {
                    setViewIndex(idx);
                    setViewerOpen(true);
                  } else {
                    clampCur(idx);
                  }
                }}
                className="absolute w-[min(74vw,410px)] aspect-[4/3] rounded-2xl overflow-hidden bg-[#141721] border border-white/15 shadow-2xl transition-all duration-300 ease-out cursor-pointer"
                style={{
                  transform: `translate3d(${translateX}px, 0, ${translateZ}px) rotateY(${rotateY}deg) scale(${scale})`,
                  opacity,
                  zIndex: 20 - Math.abs(d),
                }}
              >
                <img
                  src={item.src}
                  alt={item.cap}
                  className="w-full h-full object-cover pointer-events-none"
                />
                {item.v && (
                  <span className="absolute inset-0 grid place-items-center bg-black/25">
                    <span className="w-14 h-14 rounded-full bg-black/75 border border-white/25 grid place-items-center text-white">
                      <Play size={22} weight="fill" />
                    </span>
                  </span>
                )}
              </div>
            );
          })}
      </div>

      {!loading && activeItem && (
        <div className="max-w-xl mx-auto w-full text-center space-y-2.5">
          <div className="flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => clampCur(cur - 1)}
              disabled={cur === 0}
              aria-label="Previous photo"
              className="w-9 h-9 rounded-full grid place-items-center bg-[#181a22] border border-white/15 text-[#f3efe6] disabled:opacity-35 hover:border-[#e8b04a] cursor-pointer"
            >
              <ArrowLeft size={16} />
            </button>
            <div className="flex items-center gap-1.5">
              {items.map((item, idx) => (
                <button
                  key={`dot-${item.src}-${idx}`}
                  type="button"
                  onClick={() => setCur(idx)}
                  aria-label={`Photo ${idx + 1}`}
                  className={`h-2 rounded-full transition-all cursor-pointer ${
                    idx === cur ? 'w-5 bg-[#e8b04a]' : 'w-2 bg-white/30'
                  }`}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={() => clampCur(cur + 1)}
              disabled={cur === items.length - 1}
              aria-label="Next photo"
              className="w-9 h-9 rounded-full grid place-items-center bg-[#181a22] border border-white/15 text-[#f3efe6] disabled:opacity-35 hover:border-[#e8b04a] cursor-pointer"
            >
              <ArrowRight size={16} />
            </button>
          </div>
          <p className="text-[12.5px] text-[#f3efe6]/90 line-clamp-2 m-0">{activeItem.cap}</p>
          <p className="text-[11px] text-[#a9a69e] m-0">
            {activeItem.cr ? `${activeItem.cr} · ` : ''}
            {activeItem.lic || 'Wikimedia Commons'}
          </p>
        </div>
      )}

      {viewerOpen && fullItem && (
        <div
          onTouchStart={(e) => {
            swipeViewerRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
          }}
          onTouchEnd={(e) => {
            if (!swipeViewerRef.current) return;
            const dx = e.changedTouches[0].clientX - swipeViewerRef.current.x;
            const dy = e.changedTouches[0].clientY - swipeViewerRef.current.y;
            swipeViewerRef.current = null;
            if (Math.abs(dx) > 48 && Math.abs(dy) < 60) {
              clampView(viewIndex + (dx < 0 ? 1 : -1));
            }
          }}
          className="fixed inset-0 z-60 bg-[#050609] flex flex-col justify-between p-4 pt-[calc(14px+env(safe-area-inset-top,0px))] pb-[calc(18px+env(safe-area-inset-bottom,0px))]"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-[13px] text-[#a9a69e] tabular-nums">
              {viewIndex + 1} / {items.length}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onShare}
                aria-label="Share landmark"
                className="w-10 h-10 rounded-full grid place-items-center bg-[#181a22] border border-white/15 text-[#f3efe6] hover:border-[#e8b04a] cursor-pointer"
              >
                <ShareNetwork size={18} />
              </button>
              <button
                type="button"
                onClick={() => setViewerOpen(false)}
                aria-label="Close fullscreen photo"
                className="w-10 h-10 rounded-full grid place-items-center bg-[#181a22] border border-white/15 text-[#f3efe6] hover:border-[#e8b04a] cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          <div className="relative flex-1 min-h-0 flex items-center justify-center my-2">
            {fullItem.v ? (
              <video
                src={fullItem.full}
                controls
                autoPlay
                playsInline
                className="max-w-full max-h-full rounded-xl"
              />
            ) : (
              <img
                src={fullItem.full || fullItem.src}
                alt={fullItem.cap}
                className="max-w-full max-h-full object-contain rounded-xl"
              />
            )}
          </div>

          <div className="flex items-center justify-between gap-3 max-w-2xl mx-auto w-full">
            <button
              type="button"
              onClick={() => clampView(viewIndex - 1)}
              disabled={viewIndex === 0}
              aria-label="Previous image"
              className="w-10 h-10 rounded-full grid place-items-center bg-[#181a22] border border-white/15 text-[#f3efe6] disabled:opacity-35 cursor-pointer shrink-0"
            >
              <ArrowLeft size={18} />
            </button>
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
            <button
              type="button"
              onClick={() => clampView(viewIndex + 1)}
              disabled={viewIndex === items.length - 1}
              aria-label="Next image"
              className="w-10 h-10 rounded-full grid place-items-center bg-[#181a22] border border-white/15 text-[#f3efe6] disabled:opacity-35 cursor-pointer shrink-0"
            >
              <ArrowRight size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
