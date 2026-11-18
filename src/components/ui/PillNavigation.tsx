import type { ReactNode } from 'react';
import { motion } from 'motion/react';
import { SPRING } from '../../lib/motion';

/**
 * Pill Navigation, adapted from EasyUI — one shared indicator physically
 * travels between the active options (transitions.dev 16-tabs-sliding).
 */
export interface PillOption<T extends string> {
  value: T;
  label: ReactNode;
  ariaLabel?: string;
}

interface PillNavigationProps<T extends string> {
  options: PillOption<T>[];
  value: T;
  onChange: (value: T) => void;
  layoutId: string;
  reducedMotion?: boolean;
  className?: string;
  compact?: boolean;
}

export function PillNavigation<T extends string>({
  options,
  value,
  onChange,
  layoutId,
  reducedMotion = false,
  className = '',
  compact = false,
}: PillNavigationProps<T>) {
  return (
    <div
      role="tablist"
      className={`inline-flex items-center gap-0.5 rounded-xl border border-white/10 bg-white/[0.04] p-1 ${className}`}
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <motion.button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={active}
            aria-label={option.ariaLabel}
            onClick={() => onChange(option.value)}
            whileTap={reducedMotion ? undefined : { scale: 0.95 }}
            className={`relative flex items-center justify-center gap-1 rounded-lg font-medium transition-colors cursor-pointer ${
              compact ? 'min-h-7 px-2.5 text-[11px]' : 'min-h-8 px-3 text-[12px]'
            } ${active ? 'text-[#1a1405]' : 'text-[#a9a69e] hover:text-[#f3efe6]'}`}
          >
            {active &&
              (reducedMotion ? (
                <span className="absolute inset-0 rounded-lg bg-[#e8b04a]" />
              ) : (
                <motion.span
                  layoutId={layoutId}
                  className="absolute inset-0 rounded-lg bg-[#e8b04a] shadow-[0_2px_8px_rgba(0,0,0,0.35)]"
                  transition={SPRING.snappy}
                />
              ))}
            <span className="relative z-10 inline-flex items-center gap-1">{option.label}</span>
          </motion.button>
        );
      })}
    </div>
  );
}
