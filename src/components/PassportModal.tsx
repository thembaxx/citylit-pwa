import { X } from '@phosphor-icons/react';
import { motion } from 'motion/react';
import { LANDMARKS, PROVINCES } from '../data/landmarks';
import { SPRING, revealItem, revealVariants } from '../lib/motion';
import { SettleModal } from './ui/SettleModal';

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

export function PassportModal({
  open,
  visited,
  reducedMotion = false,
  onClose,
  onResetPassport,
}: PassportModalProps) {
  const provinces = PROVINCES.filter((p) => p !== 'All');
  const totalVisited = visited.size;
  const totalCount = LANDMARKS.length;

  return (
    <SettleModal
      open={open}
      onClose={onClose}
      reducedMotion={reducedMotion}
      title="Explorer Passport"
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

        <motion.div
          variants={reducedMotion ? undefined : revealVariants}
          initial={reducedMotion ? false : 'initial'}
          animate="animate"
          className="grid grid-cols-3 gap-3"
        >
          {provinces.map((pv, i) => {
            const list = LANDMARKS.map((lm, j) => ({ lm, j })).filter((x) => x.lm.c.endsWith(pv));
            const got = list.filter((x) => visited.has(x.j)).length;
            return (
              <ProvinceRing
                key={pv}
                ratio={got / Math.max(1, list.length)}
                label={pv}
                sub={`${got}/${list.length}`}
                reducedMotion={reducedMotion}
                index={i}
              />
            );
          })}
        </motion.div>

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
