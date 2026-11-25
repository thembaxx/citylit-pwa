import type { ReactNode } from 'react';
import { useSideDrawerLayout } from '../../lib/useMediaQuery';
import { SettleModal } from './SettleModal';
import { Sheet } from './Sheet';

interface AdaptiveDialogProps {
  open: boolean;
  onClose: () => void;
  /** Accessible name for the surface. */
  label: string;
  /** Rendered as the visually hidden dialog title on the modal variant. */
  title?: string;
  reducedMotion?: boolean;
  /** Bottom-sheet height on phones. */
  bottomHeightClass?: string;
  /** Extra classes for the modal variant. */
  modalClassName?: string;
  /** Extra classes for the sheet variant. */
  sheetClassName?: string;
  /** Sheet variant only: allow dragging the panel open to a second stage. */
  onExpand?: () => void;
  children: ReactNode;
}

/**
 * One dialog surface for every screen size.
 *
 * Phones get a thumb-reachable bottom sheet; tablets and up get the calm
 * centered `SettleModal`. The content is identical in both, so a feature
 * never disappears on a small screen — only its shape changes.
 */
export function AdaptiveDialog({
  open,
  onClose,
  label,
  title,
  reducedMotion = false,
  bottomHeightClass = 'h-[86%]',
  modalClassName = '',
  sheetClassName = '',
  onExpand,
  children,
}: AdaptiveDialogProps) {
  const sideDrawer = useSideDrawerLayout(768);

  if (!sideDrawer) {
    return (
      <Sheet
        open={open}
        onClose={onClose}
        side="bottom"
        reducedMotion={reducedMotion}
        label={label}
        bottomHeightClass={bottomHeightClass}
        onExpand={onExpand}
        className={sheetClassName}
      >
        {children}
      </Sheet>
    );
  }

  return (
    <SettleModal
      open={open}
      onClose={onClose}
      reducedMotion={reducedMotion}
      title={title}
      className={modalClassName}
    >
      {children}
    </SettleModal>
  );
}
