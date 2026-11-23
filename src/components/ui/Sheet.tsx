import { X } from '@phosphor-icons/react';
import { useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, useDragControls, type PanInfo } from 'motion/react';
import { ambientAudio } from '../../audio/ambientAudio';
import { useFocusTrap } from '../../lib/focusTrap';
import { EASE_SMOOTH_OUT, PRESS_SCALE, SPRING, shouldDismiss, Z } from '../../lib/motion';

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
  instant?: boolean;
  className?: string;
  label: string;
  showClose?: boolean;
  /** Height utility for bottom sheets; defaults to h-[80%]. */
  bottomHeightClass?: string;
  /** Two-stage sheets: drag up past the threshold to expand. */
  onExpand?: () => void;
  /** Two-stage sheets: drag down past the threshold to collapse (before dismiss). */
  onCollapse?: () => void;
  children: ReactNode;
}

const SHEET_SPRING = SPRING.surface;

export function Sheet({
  open,
  onClose,
  side = 'bottom',
  reducedMotion = false,
  instant = false,
  className = '',
  label,
  showClose = false,
  bottomHeightClass = 'h-[80%]',
  onExpand,
  onCollapse,
  children,
}: SheetProps) {
  const controls = useDragControls();
  const panelRef = useRef<HTMLDivElement>(null);
  const returnTo = useRef<HTMLElement | null>(null);
  const wasOpen = useRef(false);
  useFocusTrap(panelRef, open);

  // One cue per surface change, regardless of whether the user used the X,
  // the backdrop, a drag gesture or Escape to dismiss it.
  useEffect(() => {
    if (open) ambientAudio.playUi('open');
    else if (wasOpen.current) ambientAudio.playUi('close');
    wasOpen.current = open;
  }, [open]);

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
    if (!horizontal && onExpand && info.offset.y < -48) {
      onExpand();
      return;
    }
    if (!horizontal && onCollapse && info.offset.y > 48) {
      onCollapse();
      return;
    }
    if (shouldDismiss(info, horizontal ? 96 : 110, 520, axis)) onClose();
  };

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0" style={{ zIndex: Z.sheet }}>
          <motion.div
            aria-hidden="true"
            className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reducedMotion ? 0 : 0.2 }}
            onClick={onClose}
          />
          {/* Keyboard inset wrapper: a bottom sheet with an auto-focused input
              is lifted by the visual-viewport delta so the caret stays visible.
              --cl-kbd-inset is maintained by App.tsx (0 when no keyboard). */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{ transform: 'translateY(calc(-1 * var(--cl-kbd-inset, 0px)))' }}
          >
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label={label}
            tabIndex={-1}
            className={`pointer-events-auto absolute flex flex-col overflow-hidden bg-[#121319] text-[#f3efe6] border-white/15 shadow-2xl outline-none ${
              horizontal
                ? 'inset-y-0 right-0 w-full sm:max-w-[460px] border-l'
                : `inset-x-0 bottom-0 mx-auto w-full rounded-t-[28px] border-x border-t ${bottomHeightClass}`
            } ${className}`}
            initial={instant ? { opacity: 0 } : reducedMotion ? { opacity: 0 } : from}
            animate={instant ? { opacity: 1 } : reducedMotion ? { opacity: 1 } : to}
            exit={instant ? { opacity: 0 } : reducedMotion ? { opacity: 0 } : from}
            transition={
              instant
                ? { duration: 0 }
                : reducedMotion
                  ? { duration: 0.2, ease: EASE_SMOOTH_OUT }
                  : SHEET_SPRING
            }
            drag={axis}
            dragControls={controls}
            dragListener={false}
            dragConstraints={{ top: 0, left: 0, right: 0, bottom: 0 }}
            dragElastic={
              horizontal
                ? { left: 0, right: 0.55 }
                : { top: onExpand ? 0.55 : 0, bottom: 0.55 }
            }
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
              <motion.button
                type="button"
                onClick={onClose}
                aria-label="Close"
                whileTap={reducedMotion ? undefined : { scale: PRESS_SCALE }}
                className="absolute right-3.5 top-3.5 z-10 grid size-9 place-items-center rounded-full bg-white/[0.06] border border-white/15 text-[#f3efe6] hover:border-[#e8b04a] hover:text-[#e8b04a] transition-colors cursor-pointer"
              >
                <X size={17} />
              </motion.button>
            )}
            {children}
          </motion.div>
          </div>
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
