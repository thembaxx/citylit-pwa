import {
  ArrowSquareOut,
  Buildings,
  ClockCounterClockwise,
  Compass,
  Eye,
  Images,
  MapPin,
  PawPrint,
  Tag,
  X,
} from '@phosphor-icons/react';
import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { EASE_SMOOTH_OUT, PRESS_SCALE, SPRING, revealItem, revealVariants } from '../lib/motion';
import { EASTER_EGGS } from '../data/easterEggs';
import { LANDMARK_DETAILS } from '../data/landmarkDetails';
import { LANDMARKS } from '../data/landmarks';
import { WILDLIFE } from '../data/wildlife';
import { isAnimalActive } from '../three/builders/animalKit';
import { loadWikipediaSummary, type WikiSummary } from '../services/mediaService';
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
  const [wikiSummary, setWikiSummary] = useState<WikiSummary | null>(null);
  const [wikiLoading, setWikiLoading] = useState(true);
  const [hintForIndex, setHintForIndex] = useState<number | null>(null);

  useEffect(() => {
    if (!open) return undefined;
    let cancelled = false;
    loadWikipediaSummary(index)
      .then((res) => {
        if (cancelled) return;
        setWikiSummary(res);
        setWikiLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setWikiLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [index, open]);

  const showEggHint = hintForIndex === index;

  const lm = LANDMARKS[index];
  const detail = LANDMARK_DETAILS[lm.k];
  const wildlifeHere = WILDLIFE.filter((spot) => spot.siteKey === lm.k);
  const eggHere = EASTER_EGGS[lm.k];

  return (
    <Sheet
      open={open}
      onClose={onClose}
      side="right"
      reducedMotion={reducedMotion}
      label={`${lm.k} historical and architectural info`}
      className="pt-[env(safe-area-inset-top,0px)] pb-[env(safe-area-inset-bottom,0px)] md:max-w-[540px] lg:max-w-[580px]"
    >
      <header className="px-5 pt-5 pb-4 border-b border-white/12 flex items-start justify-between gap-3 shrink-0">
        <div className="min-w-0">
          <small className="block text-[#e8b04a] tracking-[0.14em] uppercase text-[11px]">
            {lm.c} · Info
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

      <motion.div
        variants={reducedMotion ? undefined : revealVariants}
        initial={reducedMotion ? false : 'initial'}
        animate="animate"
        className="flex-1 min-h-0 overflow-y-auto px-5 py-5 space-y-5 overscroll-contain"
      >
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
                        {active ? 'Tap to read its fact' : 'Out of season at this time of year'}
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
              {showEggHint ? 'Hide the hidden-detail clue' : 'Look closer (hidden detail clue)'}
            </button>
            {showEggHint && (
              <p className="text-[12px] text-[#f3efe6]/85 leading-relaxed mt-2 mb-0">{eggHere.hint}</p>
            )}
          </motion.section>
        )}

        {detail && (
          <motion.div variants={reducedMotion ? undefined : revealItem}>
            <UnfoldAccordion
              reducedMotion={reducedMotion}
              defaultOpen={['architecture', 'history']}
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
                          <dd className="m-0 text-right text-[#f3efe6]">{detail.styleOrType}</dd>
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
                {
                  id: 'history',
                  title: (
                    <span className="inline-flex items-center gap-2">
                      <ClockCounterClockwise size={13} /> Historical Context
                    </span>
                  ),
                  subtitle: detail.era,
                  content: <p className="m-0">{detail.history}</p>,
                },
                ...(lm.dots.length
                  ? [
                      {
                        id: 'pins',
                        title: '3D Pin Field Notes',
                        content: (
                          <ul className="m-0 p-0 list-none divide-y divide-white/10">
                            {lm.dots.map((dot, idx) => (
                              <li key={`${lm.k}-dot-${idx}`} className="py-2.5 text-[#f3efe6]/85">
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

        {(wikiLoading || wikiSummary) && (
          <motion.section
            variants={reducedMotion ? undefined : revealItem}
            className="space-y-2 pt-1"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] tracking-[0.14em] uppercase text-[#a9a69e]">
                Encyclopedia Note
              </span>
              {wikiSummary?.pageUrl && (
                <a
                  href={wikiSummary.pageUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-[11.5px] text-[#e8b04a] hover:underline"
                >
                  Read more
                  <ArrowSquareOut size={12} />
                </a>
              )}
            </div>
            <AnimatePresence mode="wait" initial={false}>
              {wikiLoading ? (
                <motion.div
                  key="loading"
                  exit={{ opacity: 0, filter: 'blur(2px)' }}
                  transition={{ duration: 0.25, ease: EASE_SMOOTH_OUT }}
                  className="h-14 rounded-lg shimmer-bg border border-white/10"
                />
              ) : (
                <motion.p
                  key="summary"
                  initial={{ opacity: 0, filter: 'blur(2px)' }}
                  animate={{ opacity: 1, filter: 'blur(0px)' }}
                  transition={{ duration: 0.4, ease: EASE_SMOOTH_OUT }}
                  className="text-[13px] leading-relaxed text-[#a9a69e] m-0"
                >
                  {wikiSummary?.extract}
                </motion.p>
              )}
            </AnimatePresence>
          </motion.section>
        )}
      </motion.div>
    </Sheet>
  );
}
