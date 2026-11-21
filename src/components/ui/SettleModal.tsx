import {
  Dialog,
  DialogBackdrop,
  DialogContent,
  DialogTitle,
} from '@ui-sdk/react/dialog';
import { motion } from 'motion/react';
import { useEffect, useRef, type ReactNode } from 'react';
import { ambientAudio } from '../../audio/ambientAudio';
import { EASE_SMOOTH_OUT } from '../../lib/motion';

/**
 * SettleModal, adapted from EasyUI. The panel scales 0.96 → 1 with a short
 * settle, and the inner content follows one layer behind (transitions.dev
 * 06-modal).
 *
 * Focus trapping, Escape, outside-press dismissal, inert background and
 * focus restoration are handled by the UI SDK dialog primitive.
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
    transition: { duration: 0.3, ease: EASE_SMOOTH_OUT, delay: 0.05 },
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
  const wasOpen = useRef(false);
  useEffect(() => {
    if (open) ambientAudio.playUi('open');
    else if (wasOpen.current) ambientAudio.playUi('close');
    wasOpen.current = open;
  }, [open]);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
      modal
    >
      <DialogBackdrop aria-hidden="true" />
      <DialogContent
        className={`w-[calc(100%-32px)] max-w-md max-h-[calc(100dvh-32px)] overflow-y-auto bg-[#14161e] border border-white/15 rounded-3xl px-5 py-6 shadow-2xl no-scrollbar ${className}`}
      >
        {typeof title === 'string' && <DialogTitle className="sr-only">{title}</DialogTitle>}
        <motion.div
          initial={reducedMotion ? false : inner.initial}
          animate={reducedMotion ? { opacity: 1, scale: 1, y: 0 } : inner.animate}
          transition={reducedMotion ? { duration: 0 } : undefined}
        >
          {children}
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
