import {
  CheckCircle,
  DownloadSimple,
  GearSix,
  Heart,
  ShareNetwork,
  Stamp,
  X,
} from '@phosphor-icons/react';
import { useEffect, useRef, useState } from 'react';
import { LANDMARKS, PROVINCES } from '../data/landmarks';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface SearchSheetProps {
  open: boolean;
  activeIndex: number;
  thumbnails: Record<number, string>;
  visited: Set<number>;
  favorites: Set<number>;
  onClose: () => void;
  onSelectLandmark: (index: number) => void;
  onToggleFavorite: (index: number) => void;
  onOpenPassport: () => void;
  onOpenSettings: () => void;
  onInstalledToast: (msg: string) => void;
}

export function SearchSheet({
  open,
  activeIndex,
  thumbnails,
  visited,
  favorites,
  onClose,
  onSelectLandmark,
  onToggleFavorite,
  onOpenPassport,
  onOpenSettings,
  onInstalledToast,
}: SearchSheetProps) {
  const [query, setQuery] = useState('');
  const [province, setProvince] = useState('All');
  const [installDismissed, setInstallDismissed] = useState(() => {
    try {
      return localStorage.getItem('cl-inst-dismissed') === '1';
    } catch {
      return false;
    }
  });
  const [dragY, setDragY] = useState(0);
  const startY = useRef<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();

  useEffect(() => {
    if (!open) return undefined;
    const id = window.setTimeout(() => inputRef.current?.focus(), 220);
    return () => window.clearTimeout(id);
  }, [open]);

  const effectiveDragY = open ? dragY : 0;

  const normalizedQuery = query.trim().toLowerCase();
  const filteredIndices = LANDMARKS.map((lm, i) => ({ lm, i })).filter(({ lm, i }) => {
    if (province === 'Saved' && !favorites.has(i)) return false;
    if (province !== 'All' && province !== 'Saved' && !lm.c.endsWith(province)) return false;
    if (normalizedQuery && !(lm.k + ' ' + lm.c).toLowerCase().includes(normalizedQuery)) {
      return false;
    }
    return true;
  });

  const handleInstallClick = async () => {
    const ok = await install();
    if (ok) onInstalledToast('Citylit installed for offline use');
  };

  const dismissInstall = () => {
    setInstallDismissed(true);
    try {
      localStorage.setItem('cl-inst-dismissed', '1');
    } catch {
      // Ignore storage failures
    }
  };

  return (
    <>
      <div
        onClick={onClose}
        className={`fixed inset-0 z-30 bg-black/55 transition-opacity duration-300 ${
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      />

      <section
        aria-label="Browse all landmarks"
        className={`fixed inset-x-0 bottom-0 z-40 h-[80%] bg-[#121319] border-t border-x border-white/15 rounded-t-[28px] flex flex-col px-3.5 pt-2.5 pb-[calc(14px+env(safe-area-inset-bottom,0px))] transition-transform duration-400 ease-out ${
          open ? 'translate-y-0' : 'translate-y-[105%]'
        }`}
        style={effectiveDragY > 0 ? { transform: `translateY(${effectiveDragY}px)` } : undefined}
      >
        <div
          onPointerDown={(e) => {
            startY.current = e.clientY;
            (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
          }}
          onPointerMove={(e) => {
            if (startY.current === null) return;
            setDragY(Math.max(0, e.clientY - startY.current));
          }}
          onPointerUp={() => {
            if (dragY > 110) onClose();
            setDragY(0);
            startY.current = null;
          }}
          className="w-12 h-1.5 rounded-full bg-white/25 mx-auto mb-3 cursor-grab touch-none"
        />

        <div className="flex items-center gap-2 mb-2.5">
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search 43 landmarks or provinces…"
            className="flex-1 min-w-0 bg-white/[0.06] border border-white/15 rounded-xl px-3.5 py-2 text-[15px] text-[#f3efe6] placeholder:text-[#a9a69e]/70 focus-visible:outline-2 focus-visible:outline-[#e8b04a]"
          />
          <button
            type="button"
            onClick={onOpenPassport}
            aria-label="Explorer Passport"
            title="Explorer Passport"
            className="w-10 h-10 rounded-full grid place-items-center bg-white/[0.06] border border-white/15 text-[#f3efe6] hover:border-[#e8b04a] hover:text-[#e8b04a] cursor-pointer shrink-0"
          >
            <Stamp size={18} />
          </button>
          <button
            type="button"
            onClick={onOpenSettings}
            aria-label="Settings"
            title="Settings"
            className="w-10 h-10 rounded-full grid place-items-center bg-white/[0.06] border border-white/15 text-[#f3efe6] hover:border-[#e8b04a] hover:text-[#e8b04a] cursor-pointer shrink-0"
          >
            <GearSix size={18} />
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close search sheet"
            className="w-10 h-10 rounded-full grid place-items-center bg-white/[0.06] border border-white/15 text-[#f3efe6] hover:border-[#e8b04a] hover:text-[#e8b04a] cursor-pointer shrink-0"
          >
            <X size={18} />
          </button>
        </div>

        {!isInstalled && !installDismissed && (isInstallable || isIOS) && (
          <div className="mb-2.5 px-3 py-2.5 rounded-2xl bg-[#e8b04a]/10 border border-[#e8b04a]/30 flex items-center justify-between gap-2.5">
            <div className="min-w-0">
              <div className="text-[13px] font-medium text-[#f3efe6]">Install Citylit</div>
              <div className="text-[11.5px] text-[#a9a69e] flex items-center gap-1 flex-wrap">
                {isInstallable ? (
                  'Add to your home screen for offline 3D landmarks.'
                ) : (
                  <>
                    Tap <ShareNetwork size={13} className="inline text-[#e8b04a]" /> Share then “Add
                    to Home Screen”.
                  </>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              {isInstallable && (
                <button
                  type="button"
                  onClick={handleInstallClick}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#e8b04a] text-[#1a1405] text-[12px] font-semibold cursor-pointer hover:brightness-110"
                >
                  <DownloadSimple size={14} weight="bold" />
                  Install
                </button>
              )}
              <button
                type="button"
                onClick={dismissInstall}
                aria-label="Dismiss install banner"
                className="w-7 h-7 rounded-full grid place-items-center text-[#a9a69e] hover:text-[#f3efe6] cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2 shrink-0">
          {['All', 'Saved', ...PROVINCES.filter((p) => p !== 'All')].map((pv) => {
            const active = province === pv;
            return (
              <button
                key={pv}
                type="button"
                onClick={() => setProvince(pv)}
                className={`shrink-0 rounded-full px-3.5 py-1 text-[12.5px] border transition cursor-pointer ${
                  active
                    ? 'border-[#e8b04a] bg-[#e8b04a]/15 text-[#e8b04a]'
                    : 'border-white/15 bg-white/[0.04] text-[#f3efe6] hover:border-[#e8b04a]'
                }`}
              >
                {pv}
              </button>
            );
          })}
        </div>

        <div className="text-[12px] text-[#a9a69e] pb-2 shrink-0">
          {filteredIndices.length} of {LANDMARKS.length} landmarks · {visited.size} stamped
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain pr-0.5">
          <div className="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-2.5 pb-2">
            {filteredIndices.map(({ lm, i }) => {
              const isSelected = i === activeIndex;
              const isFav = favorites.has(i);
              const isVisited = visited.has(i);
              return (
                <div
                  key={lm.k}
                  onClick={() => {
                    onSelectLandmark(i);
                    onClose();
                  }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onSelectLandmark(i);
                      onClose();
                    }
                  }}
                  className={`group relative flex flex-col rounded-xl overflow-hidden bg-white/[0.04] border text-left cursor-pointer transition ${
                    isSelected ? 'border-[#e8b04a]' : 'border-white/10 hover:border-[#e8b04a]/70'
                  }`}
                >
                  <div className="relative w-full shrink-0 aspect-[3/2] bg-[#141721] overflow-hidden">
                    {thumbnails[i] ? (
                      <img
                        src={thumbnails[i]}
                        alt={lm.k}
                        loading="lazy"
                        className="w-full h-full object-cover block"
                      />
                    ) : (
                      <div className="w-full h-full shimmer-bg" />
                    )}
                    {isVisited && (
                      <span
                        title="Stamped in Passport"
                        className="absolute top-1.5 left-1.5 w-6 h-6 rounded-full bg-[#121319]/85 grid place-items-center text-emerald-400"
                      >
                        <CheckCircle size={15} weight="fill" />
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleFavorite(i);
                      }}
                      aria-label={isFav ? 'Unsave landmark' : 'Save landmark'}
                      className={`absolute top-1.5 right-1.5 w-7 h-7 rounded-full bg-[#121319]/85 grid place-items-center cursor-pointer transition ${
                        isFav ? 'text-[#ff6b81]' : 'text-[#a9a69e] hover:text-[#f3efe6]'
                      }`}
                    >
                      <Heart size={14} weight={isFav ? 'fill' : 'regular'} />
                    </button>
                  </div>
                  <div className="p-2.5">
                    <div className="text-[13px] font-medium text-[#f3efe6] leading-snug line-clamp-1">
                      {lm.k}
                    </div>
                    <div className="text-[11px] text-[#a9a69e] mt-0.5 line-clamp-1">{lm.c}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
}
