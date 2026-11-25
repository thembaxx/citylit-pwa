import {
  ArrowSquareOut,
  Buildings,
  ClockCounterClockwise,
  Compass,
  Eye,
  Images,
  Info,
  MapPin,
  PawPrint,
  Tag,
  X,
} from '@phosphor-icons/react';
import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  EASE_SMOOTH_OUT,
  PRESS_SCALE,
  SPRING,
  revealItem,
  revealVariants,
  tabFadeTransition,
  tabFadeVariants,
} from '../lib/motion';
import { EASTER_EGGS } from '../data/easterEggs';
import { LANDMARK_DETAILS } from '../data/landmarkDetails';
import { LANDMARKS } from '../data/landmarks';
import { WILDLIFE } from '../data/wildlife';
import { isAnimalActive } from '../three/builders/animalKit';
import { loadHistorySummary, type HistorySummary } from '../services/historyService';
import { loadWikipediaSummary, type WikiSummary } from '../services/mediaService';
import { PillNavigation, type PillOption } from './ui/PillNavigation';
import { useMediaQuery, useSideDrawerLayout } from '../lib/useMediaQuery';
import { COMPACT_BREAKPOINT_PX } from '../lib/motion';
import { Sheet } from './ui/Sheet';
import { UnfoldAccordion } from './ui/UnfoldAccordion';

interface InfoDrawerProps {
  open: boolean;
  index: number;
  bestMonths: string;
  month?: number;
  reducedMotion?: boolean;
  onWildlifeFact?: (fact: string) => void;
  onClose: () => void;
  onOpenGallery: () => void;
}

type InfoDrawerTab = 'info' | 'history';

const INFO_TABS: PillOption<InfoDrawerTab>[] = [
  {
    value: 'info',
    label: (
      <span className="inline-flex items-center gap-1">
        <Info size={13} /> Info
      </span>
    ),
  },
  {
    value: 'history',
    label: (
      <span className="inline-flex items-center gap-1">
        <ClockCounterClockwise size={13} /> History
      </span>
    ),
  },
];

function formatCoords([lat, lon]: readonly [number, number]): string {
  const latStr = `${Math.abs(lat).toFixed(2)}°${lat < 0 ? 'S' : 'N'}`;
  const lonStr = `${Math.abs(lon).toFixed(2)}°${lon < 0 ? 'W' : 'E'}`;
  return `${latStr}, ${lonStr}`;
}

export function InfoDrawer({
  open,
  index,
  bestMonths,
  month,
  reducedMotion = false,
  onWildlifeFact,
  onClose,
  onOpenGallery,
}: InfoDrawerProps) {
  const [tabState, setTabState] = useState<{ index: number; tab: InfoDrawerTab }>({
    index,
    tab: 'info',
  });
  const [wikiSummary, setWikiSummary] = useState<WikiSummary | null>(null);
  const [historyState, setHistoryState] = useState<{
    index: number;
    data: HistorySummary | null;
    loading: boolean;
  }>({ index, data: null, loading: false });
  const [hintForIndex, setHintForIndex] = useState<number | null>(null);

  // Keying both slices by landmark index means a new landmark naturally lands
  // on Info with no stale history, without writing state from an effect.
  const activeTab = tabState.index === index ? tabState.tab : 'info';
  // Phones browse the details in a two-stage bottom sheet; wider screens get
  // the calm right-hand drawer.
  const compactShell = useMediaQuery(`(max-width: ${COMPACT_BREAKPOINT_PX}px)`);
  const [sheetExpanded, setSheetExpanded] = useState(false);
  // Only a narrow drawer leaves room for the stage to compose around; on
  // phones the panel covers the viewport and shifting the diorama is moot.
  const sideDrawer = useSideDrawerLayout(768);

  // The two-stage sheet always reopens at the peek height: adjust the state
  // while rendering instead of in an effect, so the reset happens in the
  // same commit as the close.
  const [lastOpen, setLastOpen] = useState(open);
  if (open !== lastOpen) {
    setLastOpen(open);
    if (!open) setSheetExpanded(false);
  }
  const history = historyState.index === index ? historyState.data : null;
  const historyLoading = historyState.index === index && historyState.loading;

  const selectTab = (tab: InfoDrawerTab) => {
    setTabState({ index, tab });
    if (tab === 'history' && (historyState.index !== index || !historyState.data)) {
      setHistoryState({ index, data: null, loading: true });
    }
  };

  // Shared Wikipedia lookup: powers the article link in the Info tab and is
  // reused (from cache) by the history service when History is opened.
  useEffect(() => {
    if (!open) return undefined;
    let cancelled = false;
    loadWikipediaSummary(index)
      .then((res) => {
        if (!cancelled) setWikiSummary(res);
      })
      .catch(() => {
        // History falls back to curated context when the article is unavailable.
      });
    return () => {
      cancelled = true;
    };
  }, [index, open]);

  // Load the history blurb only when the tab is actually shown. The shimmer is
  // started by selectTab, so this effect only synchronises the async result.
  useEffect(() => {
    if (!open || activeTab !== 'history') return undefined;
    let cancelled = false;
    loadHistorySummary(index)
      .then((res) => {
        if (!cancelled) setHistoryState({ index, data: res, loading: false });
      })
      .catch(() => {
        if (!cancelled) setHistoryState({ index, data: null, loading: false });
      });
    return () => {
      cancelled = true;
    };
  }, [index, open, activeTab]);

  const showEggHint = hintForIndex === index;

  const lm = LANDMARKS[index];
  const detail = LANDMARK_DETAILS[lm.k];
  const wildlifeHere = WILDLIFE.filter((spot) => spot.siteKey === lm.k);
  const eggHere = EASTER_EGGS[lm.k];

  return (
    <Sheet
      open={open}
      onClose={onClose}
      side={compactShell ? 'bottom' : 'right'}
      reducedMotion={reducedMotion}
      label={`${lm.k} historical and architectural info`}
      safeAreaKey={sideDrawer ? 'info-drawer' : undefined}
      safeAreaSide={sideDrawer ? 'right' : undefined}
      bottomHeightClass={sheetExpanded ? 'h-[88%]' : 'h-[64%]'}
      onExpand={() => setSheetExpanded(true)}
      onCollapse={() => setSheetExpanded(false)}
      className={
        compactShell
          ? 'pt-1 pb-[env(safe-area-inset-bottom,0px)]'
          : 'pt-[env(safe-area-inset-top,0px)] pb-[env(safe-area-inset-bottom,0px)] md:max-w-[540px] lg:max-w-[580px]'
      }
    >
      <header className="px-5 pt-5 pb-4 border-b border-white/12 flex items-start justify-between gap-3 shrink-0">
        <div className="min-w-0">
          <small className="block text-[#e8b04a] tracking-[0.14em] uppercase text-[11px]">
            {lm.c} · Landmark
          </small>
          <motion.h2
            layoutId="landmark-title"
            transition={reducedMotion ? { duration: 0 } : SPRING.morph}
            className="font-serif-display italic text-[28px] leading-[1.15] text-[#f3efe6] mt-1 mb-0"
          >
            {lm.k}
          </motion.h2>
          <div className="mt-2.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[12px] text-[#a9a69e]">
            <span className="inline-flex items-center gap-1 tabular-nums">
              <MapPin size={13} className="text-[#e8b04a]" />
              {formatCoords(lm.coords)}
            </span>
            <span aria-hidden="true">·</span>
            <span className="inline-flex items-center gap-1">
              <Compass size={13} className="text-[#e8b04a]" />
              Best {bestMonths}
            </span>
            <span aria-hidden="true">·</span>
            <span className="inline-flex items-center gap-1">
              <Tag size={13} className="text-[#e8b04a]" />
              {lm.tags.join(' · ')}
            </span>
          </div>
        </div>
        <motion.button
          type="button"
          whileTap={reducedMotion ? undefined : { scale: PRESS_SCALE }}
          whileHover={{ borderColor: '#e8b04a', color: '#e8b04a' }}
          onClick={onClose}
          aria-label="Close info drawer"
          className="w-9 h-9 rounded-full grid place-items-center bg-white/[0.06] border border-white/15 text-[#f3efe6] cursor-pointer shrink-0"
        >
          <X size={17} />
        </motion.button>
      </header>

      <div className="px-5 pt-4 pb-3 border-b border-white/10 shrink-0">
        <PillNavigation
          options={INFO_TABS}
          value={activeTab}
          onChange={selectTab}
          layoutId="info-drawer-tab"
          reducedMotion={reducedMotion}
          compact
          className="w-full justify-start"
        />
      </div>

      <motion.div
        variants={reducedMotion ? undefined : revealVariants}
        initial={reducedMotion ? false : 'initial'}
        animate="animate"
        className="flex-1 min-h-0 overflow-y-auto px-5 py-5 overscroll-contain"
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={activeTab}
            role="tabpanel"
            aria-label={activeTab === 'info' ? 'Info' : 'History'}
            variants={reducedMotion ? undefined : tabFadeVariants}
            initial={reducedMotion ? false : 'initial'}
            animate="animate"
            exit="exit"
            transition={reducedMotion ? { duration: 0 } : tabFadeTransition}
            className="space-y-5"
          >
            {activeTab === 'info' ? (
              <>
                <motion.div variants={reducedMotion ? undefined : revealItem}>
                  <div className="flex items-center justify-between gap-2">
                    <motion.button
                      type="button"
                      whileTap={reducedMotion ? undefined : { scale: PRESS_SCALE }}
                      onClick={onOpenGallery}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.06] border border-white/15 text-[12px] text-[#f3efe6] hover:border-[#e8b04a] hover:text-[#e8b04a] transition-colors cursor-pointer whitespace-nowrap"
                    >
                      <Images size={14} />
                      Open Photos
                    </motion.button>
                    {wikiSummary?.pageUrl && (
                      <a
                        href={wikiSummary.pageUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-[12px] text-[#e8b04a] hover:underline whitespace-nowrap"
                      >
                        Wikipedia
                        <ArrowSquareOut size={13} />
                      </a>
                    )}
                  </div>
                </motion.div>

                <motion.p
                  variants={reducedMotion ? undefined : revealItem}
                  className="text-[14px] leading-relaxed text-[#f3efe6]/90 m-0"
                >
                  {lm.f}
                </motion.p>

                {wildlifeHere.length > 0 && (
                  <motion.section variants={reducedMotion ? undefined : revealItem}>
                    <h3 className="flex items-center gap-2 text-[11px] tracking-[0.14em] uppercase text-[#e8b04a] m-0 mb-2">
                      <PawPrint size={13} /> Wildlife here
                    </h3>
                    <ul className="m-0 p-0 list-none divide-y divide-white/10 rounded-xl border border-white/10 bg-white/[0.02]">
                      {wildlifeHere.map((spot) => {
                        const active = isAnimalActive(month, spot.months, spot.seasons);
                        return (
                          <li key={spot.id} className="px-3 py-2.5">
                            <button
                              type="button"
                              onClick={() => onWildlifeFact?.(spot.fact)}
                              disabled={!active}
                              className="w-full text-left bg-transparent border-0 p-0 cursor-pointer disabled:cursor-default disabled:opacity-60"
                            >
                              <div className="text-[12.5px] text-[#f3efe6]">{spot.label}</div>
                              <div className="text-[11px] text-[#a9a69e] mt-0.5">
                                {active
                                  ? 'Tap to read its fact'
                                  : 'Out of season at this time of year'}
                              </div>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </motion.section>
                )}

                {eggHere && (
                  <motion.section variants={reducedMotion ? undefined : revealItem}>
                    <button
                      type="button"
                      onClick={() => setHintForIndex((v) => (v === index ? null : index))}
                      className="inline-flex items-center gap-2 text-[12px] text-[#a9a69e] hover:text-[#e8b04a] transition-colors cursor-pointer bg-transparent border-0 p-0"
                    >
                      <Eye size={14} className="text-[#e8b04a]" />
                      {showEggHint
                        ? 'Hide the hidden-detail clue'
                        : 'Look closer (hidden detail clue)'}
                    </button>
                    {showEggHint && (
                      <p className="text-[12px] text-[#f3efe6]/85 leading-relaxed mt-2 mb-0">
                        {eggHere.hint}
                      </p>
                    )}
                  </motion.section>
                )}

                {detail && (
                  <motion.div variants={reducedMotion ? undefined : revealItem}>
                    <UnfoldAccordion
                      reducedMotion={reducedMotion}
                      defaultOpen={['architecture']}
                      items={[
                        {
                          id: 'architecture',
                          title: (
                            <span className="inline-flex items-center gap-2">
                              <Buildings size={13} /> Architecture & Form
                            </span>
                          ),
                          content: (
                            <div className="space-y-3">
                              <dl className="m-0 divide-y divide-white/10 text-[13px]">
                                <div className="py-2.5 flex justify-between gap-4">
                                  <dt className="text-[#a9a69e] shrink-0">Style / Form</dt>
                                  <dd className="m-0 text-right text-[#f3efe6]">
                                    {detail.styleOrType}
                                  </dd>
                                </div>
                                <div className="py-2.5 flex justify-between gap-4">
                                  <dt className="text-[#a9a69e] shrink-0">Origin / Architect</dt>
                                  <dd className="m-0 text-right text-[#f3efe6]">
                                    {detail.architectOrOrigin}
                                  </dd>
                                </div>
                                <div className="py-2.5 flex justify-between gap-4">
                                  <dt className="text-[#a9a69e] shrink-0">Scale</dt>
                                  <dd className="m-0 text-right text-[#f3efe6] tabular-nums">
                                    {detail.scale}
                                  </dd>
                                </div>
                              </dl>
                              <p className="m-0">{detail.architecture}</p>
                            </div>
                          ),
                        },
                        ...(lm.dots.length
                          ? [
                              {
                                id: 'pins',
                                title: '3D Pin Field Notes',
                                content: (
                                  <ul className="m-0 p-0 list-none divide-y divide-white/10">
                                    {lm.dots.map((dot, idx) => (
                                      <li
                                        key={`${lm.k}-dot-${idx}`}
                                        className="py-2.5 text-[#f3efe6]/85"
                                      >
                                        {dot[3]}
                                      </li>
                                    ))}
                                  </ul>
                                ),
                              },
                            ]
                          : []),
                      ]}
                    />
                  </motion.div>
                )}
              </>
            ) : (
              <>
                <motion.section
                  variants={reducedMotion ? undefined : revealItem}
                  className="space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="flex items-center gap-2 text-[11px] tracking-[0.14em] uppercase text-[#e8b04a] m-0">
                      <ClockCounterClockwise size={13} /> Historical significance
                    </h3>
                    {history?.source === 'wikipedia' && (
                      <span className="text-[10px] tracking-[0.08em] uppercase text-[#a9a69e]">
                        Wikipedia
                      </span>
                    )}
                  </div>
                  <AnimatePresence mode="wait" initial={false}>
                    {historyLoading ? (
                      <motion.div
                        key="history-loading"
                        exit={{ opacity: 0, filter: 'blur(2px)' }}
                        transition={{ duration: 0.25, ease: EASE_SMOOTH_OUT }}
                        className="h-20 rounded-lg shimmer-bg border border-white/10"
                      />
                    ) : (
                      <motion.p
                        key="history-summary"
                        initial={reducedMotion ? false : { opacity: 0, filter: 'blur(2px)' }}
                        animate={{ opacity: 1, filter: 'blur(0px)' }}
                        transition={
                          reducedMotion ? { duration: 0 } : { duration: 0.4, ease: EASE_SMOOTH_OUT }
                        }
                        className="text-[14px] leading-relaxed text-[#f3efe6]/90 m-0"
                      >
                        {history?.text || 'No historical summary is available for this landmark.'}
                      </motion.p>
                    )}
                  </AnimatePresence>
                  {history?.pageUrl && (
                    <a
                      href={history.pageUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-[12px] text-[#e8b04a] hover:underline"
                    >
                      Read the full article
                      <ArrowSquareOut size={12} />
                    </a>
                  )}
                </motion.section>

                {detail && (
                  <motion.section
                    variants={reducedMotion ? undefined : revealItem}
                    className="rounded-xl border border-white/10 bg-white/[0.02] p-3.5 space-y-2"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                      <h4 className="text-[11px] tracking-[0.14em] uppercase text-[#a9a69e] m-0">
                        Curated context
                      </h4>
                      {detail.era && (
                        <span className="text-[11px] text-[#e8b04a] tabular-nums">
                          {detail.era}
                        </span>
                      )}
                    </div>
                    <p className="text-[12.5px] leading-relaxed text-[#a9a69e]/90 m-0">
                      {detail.history}
                    </p>
                    <p className="text-[10.5px] leading-relaxed text-[#a9a69e]/70 m-0">
                      {history?.source === 'wikipedia'
                        ? 'The summary above is condensed from Wikipedia; this note is our own editorial context.'
                        : 'Showing curated context while the live summary is unavailable.'}
                    </p>
                  </motion.section>
                )}
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </Sheet>
  );
}
