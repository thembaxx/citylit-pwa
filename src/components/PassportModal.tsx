import { X } from '@phosphor-icons/react';
import { LANDMARKS, PROVINCES } from '../data/landmarks';

interface PassportModalProps {
  open: boolean;
  visited: Set<number>;
  onClose: () => void;
  onResetPassport: () => void;
}

interface ProvinceRingProps {
  ratio: number;
  label: string;
  sub: string;
}

function ProvinceRing({ ratio, label, sub }: ProvinceRingProps) {
  const r = 24;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - ratio);
  return (
    <div className="flex flex-col items-center text-center p-2.5 rounded-xl bg-white/[0.04] border border-white/10">
      <svg viewBox="0 0 60 60" className="w-14 h-14 -rotate-90">
        <circle cx="30" cy="30" r={r} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="5" />
        <circle
          cx="30"
          cy="30"
          r={r}
          fill="none"
          stroke="#e8b04a"
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="text-[12px] font-medium text-[#f3efe6] mt-1.5 leading-tight">{label}</div>
      <div className="text-[11px] text-[#a9a69e] mt-0.5">{sub}</div>
    </div>
  );
}

export function PassportModal({ open, visited, onClose, onResetPassport }: PassportModalProps) {
  if (!open) return null;

  const provinces = PROVINCES.filter((p) => p !== 'All');
  const totalVisited = visited.size;
  const totalCount = LANDMARKS.length;
  const totalRatio = totalVisited / totalCount;

  return (
    <div
      role="dialog"
      aria-label="Explorer Passport"
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/70 grid place-items-center p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg max-h-[86vh] overflow-y-auto bg-[#14161e] border border-white/15 rounded-3xl p-5 shadow-2xl space-y-4"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <small className="text-[#e8b04a] tracking-[0.12em] uppercase text-[11px]">
              South Africa
            </small>
            <h2 className="font-serif-display italic text-[26px] text-[#f3efe6] m-0">
              Explorer Passport
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close passport"
            className="w-9 h-9 rounded-full grid place-items-center bg-white/[0.06] border border-white/15 text-[#f3efe6] hover:border-[#e8b04a] cursor-pointer"
          >
            <X size={17} />
          </button>
        </div>

        <div className="flex items-center justify-between px-4 py-3 rounded-2xl bg-[#e8b04a]/10 border border-[#e8b04a]/30">
          <div>
            <div className="text-[20px] font-semibold text-[#f3efe6]">
              {totalVisited} / {totalCount} Stamped
            </div>
            <div className="text-[12px] text-[#a9a69e]">
              {totalVisited === totalCount
                ? `All ${provinces.length} provinces completed!`
                : 'Spend 3 seconds at a landmark to stamp your passport.'}
            </div>
          </div>
          <div className="text-[22px] font-serif-display italic text-[#e8b04a]">
            {Math.round(totalRatio * 100)}%
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2.5">
          {provinces.map((pv) => {
            const list = LANDMARKS.map((lm, i) => ({ lm, i })).filter((x) => x.lm.c.endsWith(pv));
            const got = list.filter((x) => visited.has(x.i)).length;
            return (
              <ProvinceRing
                key={pv}
                ratio={got / Math.max(1, list.length)}
                label={pv}
                sub={`${got}/${list.length}`}
              />
            );
          })}
        </div>

        <div className="flex justify-end pt-1">
          <button
            type="button"
            onClick={onResetPassport}
            className="text-[12px] text-[#a9a69e] hover:text-[#ff6b81] cursor-pointer"
          >
            Reset passport stamps
          </button>
        </div>
      </div>
    </div>
  );
}
