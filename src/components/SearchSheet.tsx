import {
  CheckCircle,
  Clock,
  DotsThree,
  DownloadSimple,
  GearSix,
  Heart,
  MapPin,
  Ruler,
  ShareNetwork,
  Stamp,
  Tag,
  X,
} from '@phosphor-icons/react';
import { useEffect, useRef, useState } from 'react';
import { geocodePlace, parseCoordinateInput, type LatLon } from '../services/osmService';
import { AnimatePresence, motion } from 'motion/react';
import { LANDMARK_TAGS, LANDMARKS, PROVINCES } from '../data/landmarks';
import { countLandmarksByTag, filterLandmarks, parseSearch } from '../lib/landmarkSearch';
import { PRESS_SCALE, SPRING, revealItem, revealVariants, swapTransition } from '../lib/motion';
import { useSideDrawerLayout } from '../lib/useMediaQuery';
import { usePWAInstall } from '../hooks/usePWAInstall';
import type { LandmarkTag } from '../types/citylit';
import { Menu, type MenuItem } from './ui/Menu';
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
  onOpenRuler?: () => void;
  onExploreCoordinates: (center: LatLon) => void;
  exploring?: boolean;
  onInstalledToast: (msg: string) => void;
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
  onOpenRuler,
  onExploreCoordinates,
  exploring = false,
  onInstalledToast,
}: SearchSheetProps) {
  const [query, setQuery] = useState('');
  const [locating, setLocating] = useState(false);
  const [locationHint, setLocationHint] = useState('');
  const [province, setProvince] = useState('All');
  const [selectedTag, setSelectedTag] = useState<LandmarkTag | 'All'>('All');
  const [installDismissed, setInstallDismissed] = useState(() => {
    try {
      return localStorage.getItem('cl-inst-dismissed') === '1';
    } catch {
      return false;
    }
  });
  const inputRef = useRef<HTMLInputElement>(null);
  // Phones browse in a bottom sheet; larger screens get a right-hand drawer
  // so the diorama stays visible beside the list.
  const sideDrawer = useSideDrawerLayout(1024);

  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();

  useEffect(() => {
    if (!open) return undefined;
    const id = window.setTimeout(() => inputRef.current?.focus(), 220);
    return () => window.clearTimeout(id);
  }, [open]);

  const parsed = parseSearch(query);
  const tagCounts = countLandmarksByTag(LANDMARKS, LANDMARK_TAGS, {
    province,
    favorites,
    tokens: parsed.tokens,
  });
  const filteredIndices = filterLandmarks(LANDMARKS, {
    province,
    tag: selectedTag,
    favorites,
    tokens: parsed.tokens,
  });
  const hasActiveFilters = province !== 'All' || selectedTag !== 'All' || query.trim() !== '';

  const resetFilters = () => {
    setQuery('');
    setProvince('All');
    setSelectedTag('All');
    setLocationHint('');
  };

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

  const menuItems: MenuItem[] = [
    {
      label: locating || exploring ? 'Exploring location…' : 'Explore coordinates or place',
      icon: MapPin,
      onSelect: () => void exploreQuery(),
    },
    { label: 'Explorer Passport', icon: Stamp, onSelect: onOpenPassport },
    ...(onOpenRuler
      ? [{ label: 'Compare heights on a ruler', icon: Ruler, onSelect: onOpenRuler }]
      : []),
    { label: 'Settings', icon: GearSix, onSelect: onOpenSettings },
  ];

  return (
    <Sheet
      open={open}
      onClose={onClose}
      side={sideDrawer ? 'right' : 'bottom'}
      reducedMotion={reducedMotion}
      instant={instantOpen}
      label="Browse all landmarks"
      safeAreaKey={sideDrawer ? 'search-drawer' : undefined}
      safeAreaSide={sideDrawer ? 'right' : undefined}
      panelClassName={sideDrawer ? 'lg:max-w-[680px]' : ''}
      bottomHeightClass="h-[80%]"
      className={
        sideDrawer
          ? 'px-4 pt-4 pb-[env(safe-area-inset-bottom,0px)]'
          : 'px-3.5 pt-1 pb-[calc(14px+env(safe-area-inset-bottom,0px))]'
      }
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
            onFocus={() => {
              // The Sheet wrapper lifts by --cl-kbd-inset; nudge the caret into
              // view too for browsers that scroll the visual viewport instead.
              window.requestAnimationFrame(() =>
                inputRef.current?.scrollIntoView({ block: 'nearest' })
              );
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
                initial={
                  reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.94, filter: 'blur(2px)' }
                }
                animate={
                  reducedMotion ? { opacity: 1 } : { opacity: 1, scale: 1, filter: 'blur(0px)' }
                }
                exit={
                  reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.94, filter: 'blur(2px)' }
                }
                transition={reducedMotion ? { duration: 0 } : swapTransition}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full grid place-items-center text-[#a9a69e] hover:text-[#f3efe6] cursor-pointer"
              >
                <X size={14} />
              </motion.button>
            )}
          </AnimatePresence>
        </div>
        <Menu
          ariaLabel="Search actions"
          reducedMotion={reducedMotion}
          items={menuItems}
          trigger={
            <motion.button
              type="button"
              whileTap={reducedMotion ? undefined : { scale: PRESS_SCALE }}
              aria-label="More search actions"
              title="More actions"
              className={iconButton}
            >
              <DotsThree size={19} weight="bold" />
            </motion.button>
          }
        />
        <motion.button
          type="button"
          whileTap={reducedMotion ? undefined : { scale: PRESS_SCALE }}
          transition={SPRING.snappy}
          onClick={onClose}
          aria-label="Close search sheet"
          title="Close search"
          className={iconButton}
        >
          <X size={18} />
        </motion.button>
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
            initial={
              reducedMotion ? { opacity: 0 } : { opacity: 0, clipPath: 'inset(0 0 100% 0)', y: -6 }
            }
            animate={
              reducedMotion ? { opacity: 1 } : { opacity: 1, clipPath: 'inset(0 0 0% 0)', y: 0 }
            }
            exit={
              reducedMotion ? { opacity: 0 } : { opacity: 0, clipPath: 'inset(0 0 100% 0)', y: -6 }
            }
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
                    whileTap={reducedMotion ? undefined : { scale: PRESS_SCALE }}
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

      <div
        role="group"
        aria-label="Filter by region"
        className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2 shrink-0"
      >
        {['All', 'Saved', ...PROVINCES.filter((p) => p !== 'All')].map((pv) => {
          const active = province === pv;
          return (
            <motion.button
              key={pv}
              type="button"
              whileTap={reducedMotion ? undefined : { scale: PRESS_SCALE }}
              onClick={() => setProvince(pv)}
              aria-pressed={active}
              transition={SPRING.snappy}
              className={`province-pill relative shrink-0 rounded-full px-3.5 py-1 text-[12.5px] border whitespace-nowrap cursor-pointer ${
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

      <div
        role="group"
        aria-label="Filter by interest"
        className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-2.5 shrink-0"
      >
        <span
          aria-hidden="true"
          className="inline-flex items-center gap-1 text-[11px] uppercase tracking-[0.12em] text-[#a9a69e] pr-1 shrink-0"
        >
          <Tag size={12} className="text-[#e8b04a]" />
          Interest
        </span>
        {(['All', ...LANDMARK_TAGS] as const).map((tag) => {
          const active = selectedTag === tag;
          const count = tag === 'All' ? null : tagCounts[tag];
          return (
            <motion.button
              key={tag}
              type="button"
              whileTap={reducedMotion ? undefined : { scale: PRESS_SCALE }}
              onClick={() => setSelectedTag(active && tag !== 'All' ? 'All' : tag)}
              aria-pressed={active}
              transition={SPRING.snappy}
              className={`relative shrink-0 inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[12px] border whitespace-nowrap cursor-pointer transition-colors ${
                active
                  ? 'border-[#e8b04a] text-[#e8b04a]'
                  : count === 0
                    ? 'border-white/10 text-[#a9a69e]/55 hover:border-white/25 hover:text-[#a9a69e]'
                    : 'border-white/12 bg-white/[0.03] text-[#f3efe6]/85 hover:border-[#e8b04a]/70 hover:text-[#f3efe6]'
              }`}
            >
              {active &&
                (reducedMotion ? (
                  <span className="absolute inset-0 rounded-lg bg-[#e8b04a]/15" />
                ) : (
                  <motion.span
                    layoutId="interest-tag-pill"
                    className="absolute inset-0 rounded-lg border border-[#e8b04a] bg-[#e8b04a]/15"
                    transition={SPRING.snappy}
                  />
                ))}
              <span className="relative z-10">{tag}</span>
              {count !== null && (
                <span
                  className={`relative z-10 text-[10.5px] tabular-nums ${
                    active ? 'text-[#e8b04a]/90' : 'text-[#a9a69e]/75'
                  }`}
                >
                  {count}
                </span>
              )}
            </motion.button>
          );
        })}
      </div>

      <div className="flex items-center justify-between gap-2 text-[12px] text-[#a9a69e] pb-2.5 shrink-0 tabular-nums">
        <span>
          {filteredIndices.length} of {LANDMARKS.length} landmarks · {visited.size} stamped
        </span>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={resetFilters}
            className="text-[11.5px] text-[#e8b04a] hover:underline cursor-pointer shrink-0"
          >
            Reset filters
          </button>
        )}
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain pr-0.5">
        {filteredIndices.length === 0 ? (
          <div className="py-10 px-4 text-center space-y-3">
            <p className="text-[13px] text-[#a9a69e] m-0">
              No landmarks match
              {selectedTag !== 'All' ? ` “${selectedTag}”` : ''}
              {province !== 'All' ? ` in ${province}` : ''}
              {query.trim() ? ` for “${query.trim()}”` : ''}.
            </p>
            <div className="flex items-center justify-center gap-2.5 flex-wrap">
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="px-3.5 py-1.5 rounded-lg border border-white/15 bg-white/[0.05] text-[12px] text-[#f3efe6] hover:border-[#e8b04a] hover:text-[#e8b04a] transition-colors cursor-pointer"
                >
                  Reset filters
                </button>
              )}
              {query.trim() && (
                <button
                  type="button"
                  onClick={() => void exploreQuery()}
                  className="px-3.5 py-1.5 rounded-lg border border-[#e8b04a]/40 bg-[#e8b04a]/10 text-[12px] text-[#e8b04a] hover:bg-[#e8b04a]/20 transition-colors cursor-pointer"
                >
                  Explore place on map
                </button>
              )}
            </div>
          </div>
        ) : (
          <motion.div
            variants={reducedMotion ? undefined : revealVariants}
            initial={reducedMotion ? false : 'initial'}
            animate="animate"
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 pb-3"
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
                      reducedMotion
                        ? undefined
                        : { ...revealItem, exit: { opacity: 0, scale: 0.94 } }
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
                          whileTap={reducedMotion ? undefined : { scale: PRESS_SCALE }}
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
                        <div className="text-[10.5px] text-[#a9a69e]/75 mt-1 line-clamp-1">
                          {lm.tags.map((tag, idx) => (
                            <span key={tag}>
                              {idx > 0 && <span aria-hidden="true"> · </span>}
                              <span className={selectedTag === tag ? 'text-[#e8b04a]' : undefined}>
                                {tag}
                              </span>
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </Sheet>
  );
}
