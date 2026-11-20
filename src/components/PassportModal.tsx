import { ChartBar, Compass, X } from '@phosphor-icons/react';
import { motion } from 'motion/react';
import { useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { LANDMARKS, PROVINCES } from '../data/landmarks';
import { SPRING, revealItem, revealVariants } from '../lib/motion';
import { PillNavigation, type PillOption } from './ui/PillNavigation';
import { SettleModal } from './ui/SettleModal';

type PassportTab = 'stamps' | 'stats';

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
];

interface PassportModalProps {
  open: boolean;
  visited: Set<number>;
  reducedMotion?: boolean;
  onClose: () => void;
  onResetPassport: () => void;
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
  reducedMotion = false,
  onClose,
  onResetPassport,
}: PassportModalProps) {
  const [activeTab, setActiveTab] = useState<PassportTab>('stamps');

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
            whileTap={reducedMotion ? undefined : { scale: 0.9 }}
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
            initial={reducedMotion ? false : { scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={SPRING.pop}
            className="text-[22px] font-serif-display italic text-[#e8b04a]"
          >
            {Math.round((totalVisited / totalCount) * 100)}%
          </motion.div>
        </div>

        <div className="flex items-center justify-between gap-3">
          <PillNavigation
            options={PASSPORT_TABS}
            value={activeTab}
            onChange={setActiveTab}
            layoutId="passport-tab-pill"
            reducedMotion={reducedMotion}
          />
          <span className="text-[11px] font-mono tabular-nums text-[#a9a69e]">
            {provinces.length - unexploredProvinces.length}/{provinces.length} provinces
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
        ) : (
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
