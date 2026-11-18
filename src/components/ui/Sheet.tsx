import { X } from '@phosphor-icons/react';
import { useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, useDragControls, type PanInfo } from 'motion/react';
import { SPRING, shouldDismiss } from '../../lib/motion';

/**
 * Draggable sheet, adapted from EasyUI's Sheet component.
 * Bottom sheets move only from the grab handle; horizontal sheets can be
 * swiped anywhere on touch. Both carry the release velocity into the spring.
 */
export type SheetSide = 'bottom' | 'right';

interface SheetProps {
  open: boolean;
  onClose: () => void;
  side?: SheetSide;
  reducedMotion?: boolean;
  className?: string;
  label: string;
  showClose?: boolean;
  children: ReactNode;
}

const SHEET_SPRING = SPRING.surface;

export function Sheet({
  open,
  onClose,
  side = 'bottom',
  reducedMotion = false,
  className = '',
  label,
  showClose = false,
  children,
}: SheetProps) {
  const controls = useDragControls();
  const panelRef = useRef<HTMLDivElement>(null);
  const returnTo = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    returnTo.current = document.activeElement as HTMLElement | null;
    const focusId = window.setTimeout(() => panelRef.current?.focus({ preventScroll: true }), 60);
    return () => {
      window.clearTimeout(focusId);
      returnTo.current?.focus({ preventScroll: true });
    };
  }, [open]);

  const horizontal = side === 'right';
  const from = horizontal ? { x: '100%' } : { y: '100%' };
  const to = { x: 0, y: 0 };
  const axis: 'x' | 'y' = horizontal ? 'x' : 'y';
  const end = (_: unknown, info: PanInfo) => {
    if (shouldDismiss(info, horizontal ? 96 : 110, 520, axis)) onClose();
  };

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-40">
          <motion.div
            aria-hidden="true"
            className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reducedMotion ? 0 : 0.2 }}
            onClick={onClose}
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label={label}
            tabIndex={-1}
            className={`absolute flex flex-col overflow-hidden bg-[#121319] text-[#f3efe6] border-white/15 shadow-2xl outline-none ${
              horizontal
                ? 'inset-y-0 right-0 w-full sm:max-w-[460px] border-l'
                : 'inset-x-0 bottom-0 mx-auto h-[80%] w-full rounded-t-[28px] border-x border-t'
            } ${className}`}
            initial={from}
            animate={to}
            exit={from}
            transition={reducedMotion ? { duration: 0.2 } : SHEET_SPRING}
            drag={axis}
            dragControls={controls}
            dragListener={false}
            dragConstraints={{ top: 0, left: 0, right: 0, bottom: 0 }}
            dragElastic={horizontal ? { left: 0, right: 0.55 } : { top: 0, bottom: 0.55 }}
            dragMomentum={false}
            dragTransition={{ bounceStiffness: 700, bounceDamping: 45 }}
            onDragEnd={end}
            onPointerDown={
              horizontal
                ? (e) => {
                    if (e.pointerType !== 'mouse') controls.start(e);
                  }
                : undefined
            }
            style={horizontal ? { touchAction: 'pan-y' } : undefined}
          >
            {!horizontal && (
              <div
                onPointerDown={(e) => controls.start(e)}
                className="flex h-7 shrink-0 cursor-grab touch-none items-center justify-center active:cursor-grabbing"
                aria-hidden="true"
              >
                <span className="h-1 w-10 rounded-full bg-white/25" />
              </div>
            )}
            {showClose && (
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="absolute right-3.5 top-3.5 z-10 grid size-9 place-items-center rounded-full bg-white/[0.06] border border-white/15 text-[#f3efe6] hover:border-[#e8b04a] hover:text-[#e8b04a] transition-colors cursor-pointer"
              >
                <X size={17} />
              </button>
            )}
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}

/** Full-width drag target for a bottom sheet, with a generous hit area. */
export function SheetHandle({ controls }: { controls: ReturnType<typeof useDragControls> }) {
  return (
    <div
      onPointerDown={(e) => controls.start(e)}
      className="flex h-7 shrink-0 cursor-grab touch-none items-center justify-center active:cursor-grabbing"
      aria-hidden="true"
    >
      <span className="h-1 w-10 rounded-full bg-white/25" />
    </div>
  );
}
