import { CaretDown, CaretUp, Ruler, X } from '@phosphor-icons/react';
import { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import {
  formatMetres,
  REFERENCE_HEIGHTS,
  SCALE_FACTS,
} from '../data/scaleFacts';
import { LANDMARKS } from '../data/landmarks';
import { PRESS_SCALE } from '../lib/motion';
import type { ScaleReferenceKind } from '../types/citylit';
import { PillNavigation, type PillOption } from './ui/PillNavigation';
import { SettleModal } from './ui/SettleModal';
import { Sheet } from './ui/Sheet';
import { UnfoldAccordion } from './ui/UnfoldAccordion';
import { useIsPhone } from './ui/Menu';

type RulerSort = 'tallest' | 'province' | 'visited';
type RulerScale = 'log' | 'linear';

const SORT_OPTIONS: PillOption<RulerSort>[] = [
  { value: 'tallest', label: 'Tallest', ariaLabel: 'Sort by largest dimension' },
  { value: 'province', label: 'Province', ariaLabel: 'Sort by province' },
  { value: 'visited', label: 'Visited', ariaLabel: 'Sort by visited status' },
];

const SCALE_OPTIONS: PillOption<RulerScale>[] = [
  { value: 'log', label: 'Log', ariaLabel: 'Logarithmic scale' },
  { value: 'linear', label: 'Linear', ariaLabel: 'Linear scale' },
];

const REFERENCE_OPTIONS: PillOption<ScaleReferenceKind>[] = [
  { value: 'person', label: 'Person', ariaLabel: 'Compare with a person' },
  { value: 'springbok', label: 'Springbok', ariaLabel: 'Compare with a springbok' },
  { value: 'eiffel', label: 'Eiffel', ariaLabel: 'Compare with the Eiffel Tower' },
];

interface ScaleRulerModalProps {
  open: boolean;
  visited: ReadonlySet<number>;
  reference: ScaleReferenceKind;
  reducedMotion?: boolean;
  onChangeReference: (kind: ScaleReferenceKind) => void;
  onClose: () => void;
  onSelectLandmark: (index: number) => void;
}

interface RulerRow {
  index: number;
  name: string;
  province: string;
  magnitudeM: number;
  label: string;
  visited: boolean;
  width: number;
}

function barWidth(magnitudeM: number, min: number, max: number, scale: RulerScale): number {
  if (scale === 'linear') {
    // The Vredefort diameter is three orders of magnitude beyond every other
    // entry; clipping it keeps the rest of the ruler readable.
    const chartMax = Math.min(max, 2000);
    return Math.max(0.015, Math.min(1, magnitudeM / chartMax));
  }
  const lo = Math.log10(Math.max(1, min));
  const hi = Math.log10(Math.max(10, max));
  if (hi <= lo) return 1;
  const value = (Math.log10(Math.max(1, magnitudeM)) - lo) / (hi - lo);
  return Math.max(0.02, Math.min(1, value));
}

export function ScaleRulerModal({
  open,
  visited,
  reference,
  reducedMotion = false,
  onChangeReference,
  onClose,
  onSelectLandmark,
}: ScaleRulerModalProps) {
  const [sort, setSort] = useState<RulerSort>('tallest');
  const [scale, setScale] = useState<RulerScale>('log');
  const [expanded, setExpanded] = useState(false);
  const isPhone = useIsPhone();

  const rows = useMemo<RulerRow[]>(() => {
    const entries = LANDMARKS.map((lm, index) => {
      const fact = SCALE_FACTS[lm.k];
      return {
        index,
        name: lm.k,
        province: lm.c.split(' · ')[1] ?? '',
        magnitudeM: fact?.magnitudeM ?? 0,
        label: fact?.label ?? '',
        visited: visited.has(index),
      };
    }).filter((entry) => entry.magnitudeM > 0);
    const values = entries.map((e) => e.magnitudeM);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const sorted = [...entries].sort((a, b) => {
      if (sort === 'province') {
        const byProvince = a.province.localeCompare(b.province);
        return byProvince !== 0 ? byProvince : b.magnitudeM - a.magnitudeM;
      }
      if (sort === 'visited') {
        const byVisited = Number(b.visited) - Number(a.visited);
        return byVisited !== 0 ? byVisited : b.magnitudeM - a.magnitudeM;
      }
      return b.magnitudeM - a.magnitudeM;
    });
    return sorted.map((entry) => ({
      ...entry,
      width: barWidth(entry.magnitudeM, min, max, scale),
    }));
  }, [sort, scale, visited]);

  const refHeight = REFERENCE_HEIGHTS[reference];

  const content = (
    <div
      className={
        isPhone
          ? 'flex h-full min-h-0 flex-col gap-3 px-4 pb-[calc(12px+env(safe-area-inset-bottom,0px))] pt-1'
          : 'space-y-5'
      }
    >
      <div className="flex shrink-0 items-start justify-between gap-3">
        <div className="min-w-0">
          <small className="text-[#e8b04a] tracking-[0.12em] uppercase text-[11px]">
            Real-world scale
          </small>
          <h2 className="font-serif-display italic text-[26px] text-[#f3efe6] m-0">
            Height ruler
          </h2>
          <p className="text-[12px] text-[#a9a69e] mt-1.5 m-0 leading-relaxed">
            Every curated dimension, largest first. Tap a bar to open that landmark.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {isPhone && (
            <motion.button
              type="button"
              whileTap={reducedMotion ? undefined : { scale: PRESS_SCALE }}
              onClick={() => setExpanded((value) => !value)}
              aria-label={expanded ? 'Collapse ruler' : 'Expand ruler'}
              aria-expanded={expanded}
              title={expanded ? 'Collapse ruler' : 'Drag up or tap to expand'}
              className="w-9 h-9 rounded-full grid place-items-center bg-white/[0.06] border border-white/15 text-[#f3efe6] hover:border-[#e8b04a] cursor-pointer"
            >
              {expanded ? <CaretDown size={17} /> : <CaretUp size={17} />}
            </motion.button>
          )}
          <motion.button
            type="button"
            whileTap={reducedMotion ? undefined : { scale: PRESS_SCALE }}
            onClick={onClose}
            aria-label="Close height ruler"
            className="w-9 h-9 rounded-full grid place-items-center bg-white/[0.06] border border-white/15 text-[#f3efe6] hover:border-[#e8b04a] cursor-pointer shrink-0"
          >
            <X size={17} />
          </motion.button>
        </div>
      </div>

      <UnfoldAccordion
        className="shrink-0"
        reducedMotion={reducedMotion}
        items={[
          {
            id: 'options',
            title: 'Options',
            subtitle: 'Sort · scale · reference',
            content: (
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <PillNavigation
                    options={SORT_OPTIONS}
                    value={sort}
                    onChange={setSort}
                    layoutId="ruler-sort-pill"
                    reducedMotion={reducedMotion}
                    compact
                  />
                  <PillNavigation
                    options={SCALE_OPTIONS}
                    value={scale}
                    onChange={setScale}
                    layoutId="ruler-scale-pill"
                    reducedMotion={reducedMotion}
                    compact
                  />
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 text-[11px] text-[#a9a69e] mr-1">
                    <Ruler size={14} className="text-[#e8b04a]" />
                    Compare with
                  </span>
                  <PillNavigation
                    options={REFERENCE_OPTIONS}
                    value={reference}
                    onChange={onChangeReference}
                    layoutId="ruler-reference-pill"
                    reducedMotion={reducedMotion}
                    compact
                  />
                  <span className="text-[11px] text-[#a9a69e]">
                    1 {reference} = {formatMetres(refHeight)}
                  </span>
                </div>
              </div>
            ),
          },
        ]}
      />

      <div
        className={`rounded-2xl bg-white/[0.03] border border-white/10 p-3 overflow-y-auto overscroll-contain ${
          isPhone ? 'min-h-0 flex-1' : 'max-h-[46vh]'
        }`}
      >
        <ul className="m-0 p-0 list-none space-y-2.5" aria-label="Landmark dimensions">
          {rows.map((row) => (
            <li key={row.index}>
              <button
                type="button"
                onClick={() => onSelectLandmark(row.index)}
                className="w-full text-left bg-transparent border-0 p-0 cursor-pointer group"
                aria-label={`${row.name}, ${formatMetres(row.magnitudeM)}, ${row.label}${row.visited ? ', visited' : ''}`}
              >
                <div className="flex items-baseline justify-between gap-3 mb-1">
                  <span className="text-[12.5px] text-[#f3efe6] group-hover:text-[#e8b04a] transition-colors truncate">
                    {row.name}
                  </span>
                  <span className="text-[11.5px] font-mono tabular-nums text-[#a9a69e] shrink-0">
                    {formatMetres(row.magnitudeM)}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-white/[0.07] overflow-hidden">
                  <motion.div
                    className={`h-full rounded-full ${row.visited ? 'bg-[#7dffb0]' : 'bg-[#e8b04a]'}`}
                    initial={reducedMotion ? false : { width: 0 }}
                    animate={{ width: `${row.width * 100}%` }}
                    transition={reducedMotion ? { duration: 0 } : { duration: 0.55, ease: 'easeOut' }}
                  />
                </div>
                <div className="mt-1 text-[10.5px] text-[#a9a69e]/80">{row.label}</div>
              </button>
            </li>
          ))}
        </ul>
      </div>

      <p className="text-[11px] text-[#a9a69e]/80 leading-relaxed m-0 shrink-0">
        Dimensions are the headline number recorded for each site — a summit height, arch span,
        dam wall or crater diameter. The view uses a {scale} axis so both a 10 m pyramid and a
        300 km impact structure can be read at once.
      </p>
    </div>
  );

  if (isPhone) {
    return (
      <Sheet
        open={open}
        onClose={onClose}
        reducedMotion={reducedMotion}
        label="Height ruler"
        bottomHeightClass={expanded ? 'h-[88dvh]' : 'h-[50dvh]'}
        onExpand={() => setExpanded(true)}
        onCollapse={() => setExpanded(false)}
      >
        {content}
      </Sheet>
    );
  }

  return (
    <SettleModal
      open={open}
      onClose={onClose}
      reducedMotion={reducedMotion}
      title="Height ruler"
      className="max-w-2xl"
    >
      {content}
    </SettleModal>
  );
}
