import { CaretDown } from '@phosphor-icons/react';
import { useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ambientAudio } from '../../audio/ambientAudio';
import { EASE_SMOOTH_OUT, SPRING } from '../../lib/motion';

/** UnfoldAccordion, adapted from EasyUI — chevron and height move as one. */
export interface UnfoldItem {
  id: string;
  title: ReactNode;
  subtitle?: string;
  content: ReactNode;
}

interface UnfoldAccordionProps {
  items: UnfoldItem[];
  defaultOpen?: string[];
  reducedMotion?: boolean;
  className?: string;
}

export function UnfoldAccordion({
  items,
  defaultOpen = [],
  reducedMotion = false,
  className = '',
}: UnfoldAccordionProps) {
  const [open, setOpen] = useState<string[]>(defaultOpen);
  const toggle = (id: string) => {
    ambientAudio.playUi(open.includes(id) ? 'collapse' : 'expand');
    setOpen((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]));
  };

  return (
    <div
      className={`divide-y divide-white/10 overflow-hidden rounded-xl border border-white/10 bg-white/[0.02] ${className}`}
    >
      {items.map((item) => {
        const isOpen = open.includes(item.id);
        return (
          <div key={item.id}>
            <button
              type="button"
              onClick={() => toggle(item.id)}
              aria-expanded={isOpen}
              className="flex w-full cursor-pointer items-center justify-between px-4 py-3 text-left transition-colors hover:bg-white/[0.04]"
            >
              <span className="min-w-0">
                <span className="block text-[11px] tracking-[0.14em] uppercase text-[#e8b04a]">
                  {item.title}
                </span>
                {item.subtitle && (
                  <span className="mt-0.5 block text-[12px] text-[#a9a69e]">{item.subtitle}</span>
                )}
              </span>
              <motion.span
                animate={{ rotate: isOpen ? 180 : 0 }}
                transition={reducedMotion ? { duration: 0 } : SPRING.snappy}
                className="ml-2 shrink-0 text-[#a9a69e]"
              >
                <CaretDown size={15} />
              </motion.span>
            </button>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  key="content"
                  initial={reducedMotion ? { opacity: 0 } : { height: 0, opacity: 0 }}
                  animate={reducedMotion ? { opacity: 1 } : { height: 'auto', opacity: 1 }}
                  exit={reducedMotion ? { opacity: 0 } : { height: 0, opacity: 0 }}
                  transition={reducedMotion ? { duration: 0.2, ease: EASE_SMOOTH_OUT } : SPRING.morph}
                  className="overflow-hidden"
                >
                  <motion.div
                    initial={{ y: -4, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -4, opacity: 0 }}
                    transition={{ duration: reducedMotion ? 0 : 0.28, ease: EASE_SMOOTH_OUT }}
                    className="px-4 pb-4 text-[13.5px] leading-relaxed text-[#a9a69e]"
                  >
                    {item.content}
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
