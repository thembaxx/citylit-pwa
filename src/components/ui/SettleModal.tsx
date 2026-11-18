import { motion, AnimatePresence } from 'motion/react';
import type { ReactNode } from 'react';
import { modalVariants } from '../../lib/motion';

/**
 * SettleModal, adapted from EasyUI. The panel scales 0.96 → 1 with a short
 * settle, and the inner content follows one layer behind (transitions.dev
 * 06-modal).
 */
interface SettleModalProps {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  className?: string;
  reducedMotion?: boolean;
  children: ReactNode;
}

const inner = {
  initial: { opacity: 0, scale: 0.98, y: 4 },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] as const, delay: 0.05 },
  },
};

export function SettleModal({
  open,
  onClose,
  title,
  className = '',
  reducedMotion = false,
  children,
}: SettleModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center p-4">
          <motion.div
            aria-hidden="true"
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reducedMotion ? 0 : 0.2 }}
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={typeof title === 'string' ? title : undefined}
            variants={reducedMotion ? undefined : modalVariants}
            initial={reducedMotion ? { opacity: 0 } : 'initial'}
            animate={reducedMotion ? { opacity: 1 } : 'animate'}
            exit={reducedMotion ? { opacity: 0 } : 'exit'}
            className={`relative w-full max-w-md max-h-[calc(100dvh-32px)] overflow-y-auto bg-[#14161e] border border-white/15 rounded-3xl p-5 shadow-2xl no-scrollbar ${className}`}
          >
            <motion.div
              initial={reducedMotion ? false : inner.initial}
              animate={reducedMotion ? { opacity: 1, scale: 1, y: 0 } : inner.animate}
              transition={reducedMotion ? { duration: 0 } : undefined}
            >
              {children}
            </motion.div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
