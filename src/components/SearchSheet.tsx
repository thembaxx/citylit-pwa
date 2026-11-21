import {
  CheckCircle,
  Clock,
  DownloadSimple,
  GearSix,
  Heart,
  MapPin,
  ShareNetwork,
  Stamp,
  X,
} from '@phosphor-icons/react';
import { useEffect, useRef, useState } from 'react';
import {
  geocodePlace,
  parseCoordinateInput,
  type LatLon,
} from '../services/osmService';
import { AnimatePresence, motion } from 'motion/react';
import { LANDMARKS, PROVINCES } from '../data/landmarks';
import { SPRING, revealItem, revealVariants, swapTransition } from '../lib/motion';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Sheet } from './ui/Sheet';

interface SearchSheetProps {
  open: boolean;
  activeIndex: number;
  thumbnails: Record<number, string>;
  visited: Set<number>;
  favorites: Set<number>;
  reducedMotion: boolean;
  instantOpen?: boolean;
  onClose: () => void;
  onSelectLandmark: (index: number) => void;
  onSelectTime: (hour: number) => void;
  onToggleFavorite: (index: number) => void;
  onOpenPassport: () => void;
  onOpenSettings: () => void;
  onExploreCoordinates: (center: LatLon) => void;
  exploring?: boolean;
  onInstalledToast: (msg: string) => void;
}

// "night at Kruger" should pick Kruger and roll the clock to night.
const TIME_PHRASES: readonly { re: RegExp; hour: number; label: string }[] = [
  { re: /\b(?:night|midnight|after dark)\b/i, hour: 22, label: 'Night' },
  { re: /\b(?:sunrise|dawn|daybreak)\b/i, hour: 6, label: 'Sunrise' },
  { re: /\b(?:sunset|dusk|golden hour)\b/i, hour: 18.2, label: 'Sunset' },
  { re: /\b(?:noon|midday|mid-day)\b/i, hour: 12, label: 'Noon' },
  { re: /\bmorning\b/i, hour: 9, label: 'Morning' },
  { re: /\bafternoon\b/i, hour: 15, label: 'Afternoon' },
];

const SEARCH_FILLER = /\b(?:at|in|on|the|a|an|of|to|near|around|by|for|visit|see|view|show|me)\b/gi;

function parseSearch(raw: string): {
  place: string;
  tokens: string[];
  hour?: number;
  label?: string;
} {
  let text = ` ${raw} `;
  let hour: number | undefined;
  let label: string | undefined;
  for (const phrase of TIME_PHRASES) {
    if (hour === undefined && phrase.re.test(text)) {
      hour = phrase.hour;
      label = phrase.label;
      text = text.replace(phrase.re, ' ');
    }
  }
  const words = text.replace(SEARCH_FILLER, ' ').replace(/\s+/g, ' ').trim();
  const tokens = words
    .split(' ')
    .filter(Boolean)
    .map((word) => word.toLowerCase());
  return { place: words, tokens, hour, label };
}

export function SearchSheet({
  open,
  activeIndex,
  thumbnails,
  visited,
  favorites,
  reducedMotion,
  instantOpen = false,
  onClose,
  onSelectLandmark,
  onSelectTime,
  onToggleFavorite,
  onOpenPassport,
  onOpenSettings,
  onExploreCoordinates,
  exploring = false,
  onInstalledToast,
}: SearchSheetProps) {
  const [query, setQuery] = useState('');
  const [locating, setLocating] = useState(false);
  const [locationHint, setLocationHint] = useState('');
  const [province, setProvince] = useState('All');
  const [installDismissed, setInstallDismissed] = useState(() => {
    try {
      return localStorage.getItem('cl-inst-dismissed') === '1';
    } catch {
      return false;
    }
  });
  const inputRef = useRef<HTMLInputElement>(null);

  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();

  useEffect(() => {
    if (!open) return undefined;
    const id = window.setTimeout(() => inputRef.current?.focus(), 220);
    return () => window.clearTimeout(id);
  }, [open]);

  const parsed = parseSearch(query);
  const filteredIndices = LANDMARKS.map((lm, i) => ({ lm, i })).filter(({ lm, i }) => {
    if (province === 'Saved' && !favorites.has(i)) return false;
    if (province !== 'All' && province !== 'Saved' && !lm.c.endsWith(province)) return false;
    if (parsed.tokens.length) {
      const hay = `${lm.k} ${lm.c}`.toLowerCase();
      if (!parsed.tokens.every((token) => hay.includes(token))) return false;
    }
    return true;
  });

  const pick = (i: number) => {
    onSelectLandmark(i);
    if (parsed.hour !== undefined) onSelectTime(parsed.hour);
    onClose();
  };

  const exploreQuery = async () => {
    const text = query.trim();
    if (!text || locating || exploring) return;
    const coords = parseCoordinateInput(text);
    if (coords) {
      setLocationHint('');
      onExploreCoordinates(coords);
      return;
    }
    setLocating(true);
    setLocationHint('');
    try {
      const found = await geocodePlace(text);
      if (found) onExploreCoordinates(found);
      else setLocationHint('No place found. Try “latitude, longitude”.');
    } catch {
      setLocationHint('Map search unavailable offline. Try coordinates.');
    } finally {
      setLocating(false);
    }
  };

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

  const iconButton =
    'w-10 h-10 rounded-full grid place-items-center bg-white/[0.06] border border-white/15 text-[#f3efe6] hover:border-[#e8b04a] hover:text-[#e8b04a] cursor-pointer shrink-0';

  return (
    <Sheet
      open={open}
      onClose={onClose}
      side="bottom"
      reducedMotion={reducedMotion}
      instant={instantOpen}
      label="Browse all landmarks"
      className="px-3.5 pt-1 pb-[calc(14px+env(safe-area-inset-bottom,0px))]"
    >
      <div className="flex items-center gap-2 mb-3">
        <div className="relative flex-1 min-w-0">
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setLocationHint('');
            }}
            placeholder={`Search ${LANDMARKS.length} landmarks · try “sunset at Table Mountain”`}
            className="w-full bg-white/[0.06] border border-white/15 rounded-xl px-3.5 py-2 text-[15px] text-[#f3efe6] placeholder:text-[#a9a69e]/70 focus-visible:outline-2 focus-visible:outline-[#e8b04a] [&::-webkit-search-cancel-button]:hidden"
          />
          <AnimatePresence>
            {query && (
              <motion.button
                type="button"
                onClick={() => setQuery('')}
                aria-label="Clear search"
                initial={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.94, filter: 'blur(2px)' }}
                animate={reducedMotion ? { opacity: 1 } : { opacity: 1, scale: 1, filter: 'blur(0px)' }}
                exit={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.94, filter: 'blur(2px)' }}
                transition={reducedMotion ? { duration: 0 } : swapTransition}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full grid place-items-center text-[#a9a69e] hover:text-[#f3efe6] cursor-pointer"
              >
                <X size={14} />
              </motion.button>
            )}
          </AnimatePresence>
        </div>
        {[
          {
            label: locating || exploring ? 'Exploring location…' : 'Explore coordinates or place',
            icon: MapPin,
            onClick: () => void exploreQuery(),
          },
          { label: 'Explorer Passport', icon: Stamp, onClick: onOpenPassport },
          { label: 'Settings', icon: GearSix, onClick: onOpenSettings },
          { label: 'Close search sheet', icon: X, onClick: onClose },
        ].map(({ label, icon: Icon, onClick }) => (
          <motion.button
            key={label}
            type="button"
            whileTap={reducedMotion ? undefined : { scale: 0.9 }}
            transition={SPRING.snappy}
            onClick={onClick}
            aria-label={label}
            title={label}
            className={iconButton}
          >
            <Icon size={18} />
          </motion.button>
        ))}
      </div>

      <AnimatePresence initial={false}>
        {parsed.label && (
          <motion.div
            initial={{ opacity: 0, y: 4, filter: 'blur(2px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -4, filter: 'blur(2px)' }}
            transition={swapTransition}
            aria-live="polite"
            className="mb-3 flex items-center gap-1.5 text-[12px] text-[#e8b04a]"
          >
            <Clock size={13} weight="fill" />
            <span>
              {parsed.label}
              {parsed.place ? ` at ${parsed.place}` : ' · pick a place'}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {locationHint && (
        <p role="status" className="mb-2 text-[11.5px] text-[#e8b04a]">
          {locationHint}
        </p>
      )}

      <AnimatePresence initial={false}>
        {!isInstalled && !installDismissed && (isInstallable || isIOS) && (
          <motion.div
            initial={reducedMotion ? { opacity: 0 } : { opacity: 0, clipPath: 'inset(0 0 100% 0)', y: -6 }}
            animate={reducedMotion ? { opacity: 1 } : { opacity: 1, clipPath: 'inset(0 0 0% 0)', y: 0 }}
            exit={reducedMotion ? { opacity: 0 } : { opacity: 0, clipPath: 'inset(0 0 100% 0)', y: -6 }}
            className="overflow-hidden"
          >
            <div className="mb-3 px-3.5 py-3 rounded-2xl bg-[#e8b04a]/10 border border-[#e8b04a]/30 flex items-center justify-between gap-2.5">
              <div className="min-w-0 space-y-1">
                <div className="text-[13px] font-medium text-[#f3efe6]">Install Citylit</div>
                <div className="text-[11.5px] leading-relaxed text-[#a9a69e] flex items-center gap-1 flex-wrap">
                  {isInstallable ? (
                    'Add to your home screen for offline 3D landmarks.'
                  ) : (
                    <>
                      Tap <ShareNetwork size={13} className="inline text-[#e8b04a]" /> Share then
                      “Add to Home Screen”.
                    </>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {isInstallable && (
                  <motion.button
                    type="button"
                    whileTap={reducedMotion ? undefined : { scale: 0.94 }}
                    onClick={handleInstallClick}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#e8b04a] text-[#1a1405] text-[12px] font-semibold cursor-pointer"
                  >
                    <DownloadSimple size={14} weight="bold" />
                    Install
                  </motion.button>
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
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2.5 shrink-0">
        {['All', 'Saved', ...PROVINCES.filter((p) => p !== 'All')].map((pv) => {
          const active = province === pv;
          return (
            <motion.button
              key={pv}
              type="button"
              whileTap={reducedMotion ? undefined : { scale: 0.94 }}
              onClick={() => setProvince(pv)}
              aria-pressed={active}
              transition={SPRING.snappy}
              className={`province-pill relative shrink-0 rounded-full px-3.5 py-1 text-[12.5px] border cursor-pointer ${
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
                    layoutId="province-pill"
                    className="absolute inset-0 rounded-full border border-[#e8b04a] bg-[#e8b04a]/15"
                    transition={SPRING.snappy}
                  />
                ))}
              <span className="relative z-10">{pv}</span>
            </motion.button>
          );
        })}
      </div>

      <div className="text-[12px] text-[#a9a69e] pb-2.5 shrink-0">
        {filteredIndices.length} of {LANDMARKS.length} landmarks · {visited.size} stamped
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain pr-0.5">
        <motion.div
          variants={reducedMotion ? undefined : revealVariants}
          initial={reducedMotion ? false : 'initial'}
          animate="animate"
          className="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-3 pb-3"
        >
          <AnimatePresence mode="popLayout">
            {filteredIndices.map(({ lm, i }) => {
              const isSelected = i === activeIndex;
              const isFav = favorites.has(i);
              const isVisited = visited.has(i);
              return (
                <motion.div
                  layout={!reducedMotion}
                  key={lm.k}
                  variants={
                    reducedMotion ? undefined : { ...revealItem, exit: { opacity: 0, scale: 0.94 } }
                  }
                  initial={reducedMotion ? false : 'initial'}
                  animate={reducedMotion ? { opacity: 1 } : 'animate'}
                  exit={reducedMotion ? { opacity: 0 } : 'exit'}
                  transition={SPRING.snappy}
                  className={`group relative flex flex-col rounded-xl overflow-hidden bg-white/[0.04] border text-left ${
                    isSelected ? 'border-[#e8b04a]' : 'border-white/10 hover:border-[#e8b04a]/70'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => pick(i)}
                    aria-label={`Visit ${lm.k}`}
                    className="absolute inset-0 z-10 cursor-pointer rounded-xl focus-visible:outline-2 focus-visible:outline-[#e8b04a]"
                  />
                  <div className="pointer-events-none relative">
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
                        <motion.span
                          initial={{ scale: 0.4, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={SPRING.pop}
                          title="Stamped in Passport"
                          className="absolute top-1.5 left-1.5 w-6 h-6 rounded-full bg-[#121319]/85 grid place-items-center text-emerald-400"
                        >
                          <CheckCircle size={15} weight="fill" />
                        </motion.span>
                      )}
                      <motion.button
                        type="button"
                        whileTap={reducedMotion ? undefined : { scale: 0.82 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleFavorite(i);
                        }}
                        aria-label={isFav ? 'Unsave landmark' : 'Save landmark'}
                        className={`pointer-events-auto absolute top-1.5 right-1.5 z-20 w-7 h-7 rounded-full bg-[#121319]/85 grid place-items-center cursor-pointer ${
                          isFav ? 'text-[#ff6b81]' : 'text-[#a9a69e] hover:text-[#f3efe6]'
                        }`}
                      >
                        <Heart size={14} weight={isFav ? 'fill' : 'regular'} />
                      </motion.button>
                    </div>
                    <div className="p-3">
                      <div className="text-[13px] font-medium text-[#f3efe6] leading-snug line-clamp-1">
                        {lm.k}
                      </div>
                      <div className="text-[11px] text-[#a9a69e] mt-1 line-clamp-1">{lm.c}</div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      </div>
    </Sheet>
  );
}
