import {
  ArrowUpRight,
  ChartBar,
  CheckCircle,
  Compass,
  GlobeHemisphereEast,
  MagnifyingGlass,
  MapPin,
  NotePencil,
  Path,
  X,
} from '@phosphor-icons/react';
import { motion } from 'motion/react';
import { useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { LANDMARKS, PROVINCES } from '../data/landmarks';
import { HERITAGE_ROUTES, routeDistanceKm } from '../data/routes';
import { PRESS_SCALE, SPRING, revealItem, revealVariants } from '../lib/motion';
import type { LandmarkNote, NoteCategory } from '../types/citylit';
import { PillNavigation, type PillOption } from './ui/PillNavigation';
import { SettleModal } from './ui/SettleModal';

type PassportTab = 'stamps' | 'stats' | 'notes' | 'routes';

const PASSPORT_TABS: PillOption<PassportTab>[] = [
  {
    value: 'stamps',
    label: (
      <>
        <Compass size={14} weight="bold" />
        <span>Stamps</span>
      </>
    ),
    ariaLabel: 'Stamps view',
  },
  {
    value: 'stats',
    label: (
      <>
        <ChartBar size={14} weight="bold" />
        <span>Stats</span>
      </>
    ),
    ariaLabel: 'Discovery stats chart',
  },
  {
    value: 'notes',
    label: (
      <>
        <NotePencil size={14} weight="bold" />
        <span>Notes</span>
      </>
    ),
    ariaLabel: 'Field notes journal',
  },
  {
    value: 'routes',
    label: (
      <>
        <Path size={14} weight="bold" />
        <span>Routes</span>
      </>
    ),
    ariaLabel: 'Heritage exploration routes',
  },
];

const CATEGORY_COLORS: Record<NoteCategory, { label: string; color: string }> = {
  memory: { label: 'Memory', color: '#5cd6a9' },
  photo: { label: 'Photo', color: '#e8b04a' },
  history: { label: 'History', color: '#ff7a8a' },
};

interface PassportModalProps {
  open: boolean;
  visited: Set<number>;
  notesByLandmark?: Record<number, LandmarkNote[]>;
  activeRouteId?: string | null;
  reducedMotion?: boolean;
  onClose: () => void;
  onResetPassport: () => void;
  onJumpToNote?: (landmarkIndex: number, noteId: string) => void;
  onSelectRoute?: (routeId: string | null) => void;
  onViewRouteOnGlobe?: (routeId: string) => void;
}

interface ProvinceRingProps {
  ratio: number;
  label: string;
  sub: string;
  reducedMotion: boolean;
  index: number;
}

interface ProvinceStatRow {
  province: string;
  visited: number;
  remaining: number;
  total: number;
}

function ProvinceRing({ ratio, label, sub, reducedMotion, index }: ProvinceRingProps) {
  const r = 24;
  const circ = 2 * Math.PI * r;
  return (
    <motion.div
      variants={reducedMotion ? undefined : revealItem}
      className="flex flex-col items-center text-center p-3 rounded-xl bg-white/[0.04] border border-white/10"
    >
      <svg viewBox="0 0 60 60" className="w-14 h-14 -rotate-90">
        <circle cx="30" cy="30" r={r} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="5" />
        <motion.circle
          cx="30"
          cy="30"
          r={r}
          fill="none"
          stroke="#e8b04a"
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: circ * (1 - ratio) }}
          transition={
            reducedMotion
              ? { duration: 0 }
              : { ...SPRING.morph, delay: Math.min(index * 0.04, 0.28) }
          }
        />
      </svg>
      <div className="text-[12px] font-medium text-[#f3efe6] mt-2 leading-tight">{label}</div>
      <div className="text-[11px] font-mono tabular-nums text-[#a9a69e] mt-1">{sub}</div>
    </motion.div>
  );
}

interface StatsTooltipProps {
  active?: boolean;
  payload?: Array<{ payload?: ProvinceStatRow }>;
}

function StatsTooltip({ active, payload }: StatsTooltipProps) {
  const row = payload?.[0]?.payload;
  if (!active || !row) return null;
  return (
    <div className="rounded-xl bg-[#181a24] border border-white/15 px-3 py-2 shadow-xl text-[12px]">
      <div className="font-medium text-[#f3efe6]">{row.province}</div>
      <div className="mt-1 flex items-center gap-3 font-mono tabular-nums text-[11px]">
        <span className="text-[#e8b04a]">{row.visited} visited</span>
        <span className="text-[#a9a69e]">{row.remaining} left</span>
      </div>
    </div>
  );
}

export function PassportModal({
  open,
  visited,
  notesByLandmark = {},
  activeRouteId = null,
  reducedMotion = false,
  onClose,
  onResetPassport,
  onJumpToNote,
  onSelectRoute,
  onViewRouteOnGlobe,
}: PassportModalProps) {
  const [activeTab, setActiveTab] = useState<PassportTab>('stamps');
  const [noteQuery, setNoteQuery] = useState('');
  const [noteCategoryFilter, setNoteCategoryFilter] = useState<'all' | NoteCategory>('all');

  const provinces = useMemo(() => PROVINCES.filter((p) => p !== 'All'), []);
  const totalVisited = visited.size;
  const totalCount = LANDMARKS.length;

  const provinceStats = useMemo<ProvinceStatRow[]>(() => {
    return provinces.map((pv) => {
      const list = LANDMARKS.map((lm, j) => ({ lm, j })).filter((x) => x.lm.c.endsWith(pv));
      const got = list.filter((x) => visited.has(x.j)).length;
      return {
        province: pv,
        visited: got,
        remaining: Math.max(0, list.length - got),
        total: list.length,
      };
    });
  }, [provinces, visited]);

  const unexploredProvinces = useMemo(
    () => provinceStats.filter((row) => row.visited === 0).map((row) => row.province),
    [provinceStats]
  );

  const flatNotes = useMemo(() => {
    const entries: Array<{ landmarkIndex: number; note: LandmarkNote }> = [];
    for (const [key, list] of Object.entries(notesByLandmark)) {
      const lmIdx = Number(key);
      if (!Number.isInteger(lmIdx) || !LANDMARKS[lmIdx]) continue;
      for (const note of list) {
        entries.push({ landmarkIndex: lmIdx, note });
      }
    }
    entries.sort((a, b) => b.note.createdAt - a.note.createdAt);
    return entries;
  }, [notesByLandmark]);

  const filteredNotes = useMemo(() => {
    const q = noteQuery.trim().toLowerCase();
    return flatNotes.filter(({ landmarkIndex, note }) => {
      const cat = note.category ?? 'memory';
      if (noteCategoryFilter !== 'all' && cat !== noteCategoryFilter) return false;
      if (!q) return true;
      const lm = LANDMARKS[landmarkIndex];
      return (
        note.text.toLowerCase().includes(q) ||
        lm.k.toLowerCase().includes(q) ||
        lm.c.toLowerCase().includes(q)
      );
    });
  }, [flatNotes, noteQuery, noteCategoryFilter]);

  return (
    <SettleModal
      open={open}
      onClose={onClose}
      reducedMotion={reducedMotion}
      title="Explorer Passport"
      className="max-w-lg"
    >
      <div className="space-y-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <small className="text-[#e8b04a] tracking-[0.12em] uppercase text-[11px]">
              South Africa
            </small>
            <h2 className="font-serif-display italic text-[26px] text-[#f3efe6] m-0">
              Explorer Passport
            </h2>
          </div>
          <motion.button
            type="button"
            whileTap={reducedMotion ? undefined : { scale: PRESS_SCALE }}
            onClick={onClose}
            aria-label="Close passport"
            className="w-9 h-9 rounded-full grid place-items-center bg-white/[0.06] border border-white/15 text-[#f3efe6] hover:border-[#e8b04a] cursor-pointer"
          >
            <X size={17} />
          </motion.button>
        </div>

        <div className="flex items-start justify-between gap-3 px-4 py-3.5 rounded-2xl bg-[#e8b04a]/10 border border-[#e8b04a]/30">
          <div>
            <div className="text-[20px] font-semibold text-[#f3efe6] font-mono tabular-nums">
              {totalVisited} / {totalCount} Stamped
            </div>
            <div className="text-[12px] text-[#a9a69e] mt-1 leading-relaxed">
              {totalVisited === totalCount
                ? `All ${provinces.length} provinces completed!`
                : 'Spend 3 seconds at a landmark to stamp your passport.'}
            </div>
          </div>
          <motion.div
            key={totalVisited}
            initial={reducedMotion ? false : { scale: 0.94, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={SPRING.pop}
            className="text-[22px] font-serif-display italic text-[#e8b04a]"
          >
            {Math.round((totalVisited / totalCount) * 100)}%
          </motion.div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <PillNavigation
            options={PASSPORT_TABS}
            value={activeTab}
            onChange={setActiveTab}
            layoutId="passport-tab-pill"
            reducedMotion={reducedMotion}
          />
          <span className="text-[11px] font-mono tabular-nums text-[#a9a69e]">
            {activeTab === 'notes'
              ? `${flatNotes.length} note${flatNotes.length === 1 ? '' : 's'}`
              : activeTab === 'routes'
                ? `${HERITAGE_ROUTES.length} curated trails`
                : `${provinces.length - unexploredProvinces.length}/${provinces.length} provinces`}
          </span>
        </div>

        {activeTab === 'stamps' ? (
          <motion.div
            key="stamps-tab"
            variants={reducedMotion ? undefined : revealVariants}
            initial={reducedMotion ? false : 'initial'}
            animate="animate"
            className="grid grid-cols-3 gap-3"
          >
            {provinceStats.map((row, i) => (
              <ProvinceRing
                key={row.province}
                ratio={row.visited / Math.max(1, row.total)}
                label={row.province}
                sub={`${row.visited}/${row.total}`}
                reducedMotion={reducedMotion}
                index={i}
              />
            ))}
          </motion.div>
        ) : activeTab === 'stats' ? (
          <div key="stats-tab" className="space-y-3">
            <div className="rounded-2xl bg-white/[0.03] border border-white/10 p-3.5">
              <div className="flex items-center justify-between text-[11px] text-[#a9a69e] mb-2">
                <span>Visited landmarks by province</span>
                <span className="inline-flex items-center gap-3">
                  <span className="inline-flex items-center gap-1.5 text-[#f3efe6]">
                    <span className="w-2 h-2 rounded-xs bg-[#e8b04a]" />
                    Visited
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-xs bg-white/15" />
                    Unexplored
                  </span>
                </span>
              </div>

              <div className="w-full h-[270px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={provinceStats}
                    layout="vertical"
                    margin={{ top: 4, right: 12, left: 0, bottom: 0 }}
                    barSize={14}
                  >
                    <CartesianGrid
                      stroke="rgba(255,255,255,0.07)"
                      strokeDasharray="3 3"
                      horizontal={false}
                    />
                    <XAxis
                      type="number"
                      allowDecimals={false}
                      tick={{ fill: '#a9a69e', fontSize: 11 }}
                      axisLine={{ stroke: 'rgba(255,255,255,0.12)' }}
                      tickLine={false}
                    />
                    <YAxis
                      type="category"
                      dataKey="province"
                      width={106}
                      tick={{ fill: '#f3efe6', fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                      content={<StatsTooltip />}
                    />
                    <Bar
                      dataKey="visited"
                      stackId="province"
                      fill="#e8b04a"
                      radius={[4, 0, 0, 4]}
                      isAnimationActive={!reducedMotion}
                    />
                    <Bar
                      dataKey="remaining"
                      stackId="province"
                      fill="rgba(255,255,255,0.12)"
                      radius={[0, 4, 4, 0]}
                      isAnimationActive={!reducedMotion}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-xl bg-white/[0.04] border border-white/10 px-3.5 py-2.5 text-[12px] text-[#a9a69e]">
              {unexploredProvinces.length > 0 ? (
                <>
                  <span className="text-[#f3efe6] font-medium">Yet to explore: </span>
                  {unexploredProvinces.join(', ')}
                </>
              ) : totalVisited < totalCount ? (
                <>
                  <span className="text-[#f3efe6] font-medium">All provinces unlocked! </span>
                  {totalCount - totalVisited} landmark
                  {totalCount - totalVisited === 1 ? '' : 's'} left to stamp.
                </>
              ) : (
                <span className="text-[#e8b04a] font-medium">
                  Every landmark across all {provinces.length} provinces has been stamped.
                </span>
              )}
            </div>
          </div>
        ) : activeTab === 'notes' ? (
          <div key="notes-tab" className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative flex-1 min-w-[160px]">
                <MagnifyingGlass
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a9a69e]"
                />
                <input
                  type="search"
                  value={noteQuery}
                  onChange={(e) => setNoteQuery(e.target.value)}
                  placeholder="Search notes or landmarks…"
                  aria-label="Search saved field notes"
                  className="w-full h-8 pl-8 pr-3 rounded-xl bg-white/[0.05] border border-white/12 text-[12px] text-[#f3efe6] placeholder:text-[#a9a69e]/70 focus:border-[#5cd6a9] focus:outline-none"
                />
              </div>
              <div className="inline-flex items-center gap-1">
                {(['all', 'memory', 'photo', 'history'] as const).map((cat) => {
                  const active = noteCategoryFilter === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setNoteCategoryFilter(cat)}
                      className={`h-7 px-2.5 rounded-full text-[11px] capitalize border transition-colors cursor-pointer ${
                        active
                          ? 'bg-white/14 border-[#e8b04a] text-[#e8b04a]'
                          : 'bg-white/[0.04] border-white/10 text-[#a9a69e] hover:text-[#f3efe6]'
                      }`}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>
            </div>

            {filteredNotes.length === 0 ? (
              <div className="rounded-2xl bg-white/[0.03] border border-white/10 px-4 py-8 text-center text-[12.5px] text-[#a9a69e]">
                {flatNotes.length === 0
                  ? 'No private field notes saved yet. Tap "Add Note" on any landmark to pin memories in 3D.'
                  : 'No field notes match your current search.'}
              </div>
            ) : (
              <ul className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {filteredNotes.map(({ landmarkIndex, note }) => {
                  const lm = LANDMARKS[landmarkIndex];
                  const cat = CATEGORY_COLORS[note.category ?? 'memory'];
                  return (
                    <li
                      key={note.id}
                      className="rounded-xl bg-white/[0.04] border border-white/10 hover:border-white/22 px-3 py-2.5 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2 text-[11px]">
                            <span
                              className="inline-flex items-center gap-1 font-medium"
                              style={{ color: cat.color }}
                            >
                              <MapPin size={12} weight="fill" />
                              {cat.label}
                            </span>
                            <span className="text-[#f3efe6] font-medium truncate">{lm.k}</span>
                            <span className="font-mono tabular-nums text-[#a9a69e]">
                              {new Date(note.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-[12.5px] text-[#dedad0] mt-1 mb-0 break-words leading-snug">
                            {note.text}
                          </p>
                        </div>
                        {onJumpToNote && (
                          <button
                            type="button"
                            onClick={() => {
                              onJumpToNote(landmarkIndex, note.id);
                              onClose();
                            }}
                            aria-label={`Jump to ${lm.k} note`}
                            className="shrink-0 h-7 px-2.5 rounded-full inline-flex items-center gap-1 bg-white/[0.06] border border-white/12 text-[11px] text-[#f3efe6] hover:border-[#5cd6a9] hover:text-[#5cd6a9] transition-colors cursor-pointer"
                          >
                            <span>Focus</span>
                            <ArrowUpRight size={12} weight="bold" />
                          </button>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        ) : (
          <div key="routes-tab" className="space-y-2.5 max-h-[340px] overflow-y-auto pr-1">
            {HERITAGE_ROUTES.map((route) => {
              const isActive = activeRouteId === route.id;
              const visitedCount = route.stopIndices.filter((s) => visited.has(s)).length;
              const distKm = routeDistanceKm(route.stopIndices);
              return (
                <div
                  key={route.id}
                  className={`rounded-2xl border p-3.5 transition-colors ${
                    isActive
                      ? 'bg-white/[0.08] border-[#e8b04a]/70'
                      : 'bg-white/[0.035] border-white/10 hover:border-white/22'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: route.color }}
                        />
                        <h3 className="text-[14px] font-semibold text-[#f3efe6] m-0 truncate">
                          {route.name}
                        </h3>
                      </div>
                      <p className="text-[12px] text-[#a9a69e] mt-1 mb-0 leading-snug">
                        {route.subtitle}
                      </p>
                    </div>
                    <div className="text-right shrink-0 font-mono tabular-nums">
                      <div className="text-[11.5px] text-[#f3efe6]">
                        {visitedCount}/{route.stopIndices.length} stops
                      </div>
                      <div className="text-[10.5px] text-[#a9a69e]">
                        {distKm.toLocaleString()} km
                      </div>
                    </div>
                  </div>

                  <div className="mt-2.5 flex flex-wrap gap-1">
                    {route.stopIndices.map((stopIdx) => {
                      const lm = LANDMARKS[stopIdx];
                      const done = visited.has(stopIdx);
                      return (
                        <span
                          key={stopIdx}
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] border ${
                            done
                              ? 'bg-[#e8b04a]/12 border-[#e8b04a]/45 text-[#f3efe6]'
                              : 'bg-white/[0.03] border-white/10 text-[#a9a69e]'
                          }`}
                        >
                          {done && (
                            <CheckCircle size={11} weight="fill" className="text-[#e8b04a]" />
                          )}
                          {lm?.k}
                        </span>
                      );
                    })}
                  </div>

                  <div className="mt-3 flex items-center gap-2">
                    {onSelectRoute && (
                      <button
                        type="button"
                        onClick={() => {
                          onSelectRoute(isActive ? null : route.id);
                          onClose();
                        }}
                        className={`h-7 px-3 rounded-full text-[11.5px] font-semibold transition-colors cursor-pointer ${
                          isActive
                            ? 'bg-white/15 border border-white/20 text-[#f3efe6]'
                            : 'bg-[#e8b04a] text-[#1a1405] hover:bg-[#f2be5d]'
                        }`}
                      >
                        {isActive ? 'Stop Route' : 'Follow Route'}
                      </button>
                    )}
                    {onViewRouteOnGlobe && (
                      <button
                        type="button"
                        onClick={() => {
                          onViewRouteOnGlobe(route.id);
                          onClose();
                        }}
                        className="h-7 px-3 rounded-full inline-flex items-center gap-1.5 bg-white/[0.06] border border-white/15 text-[11.5px] text-[#f3efe6] hover:border-[#e8b04a] hover:text-[#e8b04a] transition-colors cursor-pointer"
                      >
                        <GlobeHemisphereEast size={13} />
                        <span>View on Globe</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="flex justify-end pt-3.5 border-t border-white/10">
          <button
            type="button"
            onClick={onResetPassport}
            className="text-[12px] text-[#a9a69e] hover:text-[#ff6b81] cursor-pointer"
          >
            Reset passport stamps
          </button>
        </div>
      </div>
    </SettleModal>
  );
}
