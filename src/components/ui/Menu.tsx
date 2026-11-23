import { Check, type Icon } from '@phosphor-icons/react';
import { COMPACT_BREAKPOINT_PX } from '../../lib/motion';
import {
  cloneElement,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
  type ReactElement,
} from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'motion/react';
import { EASE_SMOOTH_OUT, PRESS_SCALE } from '../../lib/motion';

/**
 * Generic dropdown / bottom action menu.
 *
 * On phones (<= the shared compact breakpoint) the menu becomes a thumb-reachable bottom popover with a
 * scrim; it is deliberately NOT a nested Sheet, so it can be opened from
 * inside a Sheet without stacking two focus traps or two dark backdrops. On
 * larger screens it anchors to the trigger button.
 *
 * Entrance / exit motion reads the existing `--dropdown-*` tokens from
 * transitions.css, so the tokens remain the single source of truth.
 */

type TriggerElement = ReactElement<Record<string, unknown>>;

export interface MenuItem {
  icon: Icon;
  label: string;
  onSelect: () => void;
  disabled?: boolean;
  danger?: boolean;
  /** Draws a check mark; used for mutually-exclusive choices such as camera views. */
  selected?: boolean;
}

export interface MenuProps {
  /** The button that opens the menu. onClick / aria-* / ref are merged in. */
  trigger: TriggerElement;
  items: MenuItem[];
  /** Accessible name for the menu surface itself. */
  ariaLabel?: string;
  align?: 'start' | 'end';
  reducedMotion?: boolean;
  className?: string;
}

interface DropdownTokens {
  open: number;
  close: number;
  preScale: number;
  closingScale: number;
  ease: [number, number, number, number];
}

function readDropdownTokens(): DropdownTokens {
  const fallback: DropdownTokens = {
    open: 0.25,
    close: 0.15,
    preScale: 0.97,
    closingScale: 0.99,
    ease: [EASE_SMOOTH_OUT[0], EASE_SMOOTH_OUT[1], EASE_SMOOTH_OUT[2], EASE_SMOOTH_OUT[3]],
  };
  if (typeof window === 'undefined') return fallback;
  const cs = getComputedStyle(document.documentElement);
  const number = (name: string, base: number) => {
    const raw = cs.getPropertyValue(name).trim();
    const value = Number.parseFloat(raw);
    return Number.isFinite(value) ? value : base;
  };
  const rawEase = cs.getPropertyValue('--dropdown-ease').trim();
  const parts = rawEase.match(/-?\d*\.?\d+/g)?.map(Number);
  const ease: [number, number, number, number] =
    parts && parts.length === 4
      ? [parts[0], parts[1], parts[2], parts[3]]
      : [EASE_SMOOTH_OUT[0], EASE_SMOOTH_OUT[1], EASE_SMOOTH_OUT[2], EASE_SMOOTH_OUT[3]];
  return {
    open: number('--dropdown-open-dur', 250) / 1000,
    close: number('--dropdown-close-dur', 150) / 1000,
    preScale: number('--dropdown-pre-scale', 0.97),
    closingScale: number('--dropdown-closing-scale', 0.99),
    ease,
  };
}

/** Compact-shell matchMedia with live updates. Shared with the ruler. */
export function useIsPhone(query = `(max-width:${COMPACT_BREAKPOINT_PX}px)`): boolean {
  const [matches, setMatches] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(query).matches
  );
  useEffect(() => {
    const mq = window.matchMedia(query);
    const onChange = () => setMatches(mq.matches);
    onChange();
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [query]);
  return matches;
}

export function Menu({
  trigger,
  items,
  ariaLabel = 'Actions',
  align = 'end',
  reducedMotion = false,
  className = '',
}: MenuProps) {
  const isPhone = useIsPhone();
  const tokens = useMemo(readDropdownTokens, []);
  const menuId = useId();
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [anchorPos, setAnchorPos] = useState<{ top: number; left: number; width: number } | null>(
    null
  );
  const anchorRef = useRef<HTMLElement | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const returnTo = useRef<HTMLElement | null>(null);

  const enabledIndices = items.flatMap((item, i) => (item.disabled ? [] : [i]));

  const close = () => setOpen(false);

  // Focus the first enabled item on open, return focus to the trigger on close.
  useEffect(() => {
    if (!open) return undefined;
    returnTo.current = document.activeElement as HTMLElement | null;
    const id = window.setTimeout(() => {
      const buttons = menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]');
      const first = enabledIndices.includes(activeIndex) ? activeIndex : enabledIndices[0];
      if (first !== undefined) buttons?.[first]?.focus({ preventScroll: true });
      else menuRef.current?.focus({ preventScroll: true });
    }, reducedMotion ? 0 : 40);
    return () => {
      window.clearTimeout(id);
      (returnTo.current ?? anchorRef.current)?.focus({ preventScroll: true });
    };
    // enabledIndices is derived from items; re-running on every item identity
    // would steal focus while the menu is open.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, reducedMotion]);

  // Anchor the desktop popover to the trigger button.
  useEffect(() => {
    if (!open || isPhone) {
      setAnchorPos(null);
      return undefined;
    }
    const place = () => {
      const anchor = anchorRef.current;
      if (!anchor) return;
      const rect = anchor.getBoundingClientRect();
      const width = Math.max(210, Math.min(280, rect.width));
      const margin = 8;
      const rawLeft = align === 'end' ? rect.right - width : rect.left;
      const left = Math.max(margin, Math.min(rawLeft, window.innerWidth - width - margin));
      const maxTop = Math.max(margin, window.innerHeight - items.length * 46 - 32);
      setAnchorPos({ top: Math.min(rect.bottom + 6, maxTop), left, width });
    };
    place();
    window.addEventListener('scroll', place, true);
    window.addEventListener('resize', place);
    return () => {
      window.removeEventListener('scroll', place, true);
      window.removeEventListener('resize', place);
    };
  }, [open, isPhone, align, items.length]);

  // Outside press / Escape (document level also covers the scrim).
  useEffect(() => {
    if (!open) return undefined;
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (menuRef.current?.contains(target) || anchorRef.current?.contains(target)) return;
      close();
    };
    // A Menu can live inside a Sheet or modal, so claim Escape/Tab in the
    // capture phase: only the topmost layer should react, and focus must
    // return to the trigger rather than to the parent surface.
    const onKeyCapture = (event: globalThis.KeyboardEvent) => {
      if (event.key !== 'Tab' && event.key !== 'Escape') return;
      event.preventDefault();
      event.stopPropagation();
      close();
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyCapture, true);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyCapture, true);
    };
  }, [open]);

  const move = (delta: number) => {
    if (!enabledIndices.length) return;
    const position = enabledIndices.indexOf(activeIndex);
    const next = position === -1 ? 0 : (position + delta + enabledIndices.length) % enabledIndices.length;
    const index = enabledIndices[next];
    setActiveIndex(index);
    const buttons = menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]');
    buttons?.[index]?.focus({ preventScroll: true });
  };

  const onMenuKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        move(1);
        break;
      case 'ArrowUp':
        event.preventDefault();
        move(-1);
        break;
      case 'Home':
        event.preventDefault();
        setActiveIndex(enabledIndices[0] ?? 0);
        break;
      case 'End':
        event.preventDefault();
        setActiveIndex(enabledIndices[enabledIndices.length - 1] ?? 0);
        break;
      case 'Tab':
        event.preventDefault();
        close();
        break;
      default:
        break;
    }
  };

  const select = (item: MenuItem) => {
    if (item.disabled) return;
    close();
    item.onSelect();
  };

  const previousOnClick = trigger.props.onClick as
    | ((event: MouseEvent<HTMLElement>) => void)
    | undefined;
  const previousOnKeyDown = trigger.props.onKeyDown as
    | ((event: KeyboardEvent<HTMLElement>) => void)
    | undefined;

  const triggerElement = cloneElement(trigger, {
    onClick: (event: MouseEvent<HTMLElement>) => {
      previousOnClick?.(event);
      if (event.defaultPrevented) return;
      setActiveIndex(enabledIndices[0] ?? 0);
      setOpen((value) => !value);
    },
    onKeyDown: (event: KeyboardEvent<HTMLElement>) => {
      previousOnKeyDown?.(event);
      if (event.defaultPrevented) return;
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault();
        setActiveIndex(enabledIndices[0] ?? 0);
        setOpen(true);
      }
    },
    'aria-haspopup': 'menu',
    'aria-expanded': open,
    'aria-controls': open ? menuId : undefined,
    ref: (node: HTMLElement | null) => {
      anchorRef.current = node;
    },
  });

  return (
    <>
      {triggerElement}
      {createPortal(
        <AnimatePresence>
          {open && (
            <motion.div
              key="menu-scrim"
              aria-hidden="true"
              className={`fixed inset-0 z-[59] ${isPhone ? 'bg-black/45' : 'bg-transparent'}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: reducedMotion ? 0.2 : tokens.close, ease: tokens.ease }}
            />
          )}
          {open && (
            <motion.div
              key="menu-panel"
              ref={menuRef}
              role="menu"
              id={menuId}
              aria-label={ariaLabel}
              tabIndex={-1}
              onKeyDown={onMenuKeyDown}
              style={
                isPhone
                  ? undefined
                  : {
                      top: anchorPos?.top ?? 0,
                      left: anchorPos?.left ?? 0,
                      minWidth: anchorPos?.width,
                    }
              }
              className={`pointer-events-auto fixed z-[60] overflow-y-auto overscroll-contain border border-white/15 bg-[#181a22] p-1.5 text-[#f3efe6] shadow-2xl outline-none no-scrollbar ${
                isPhone
                  ? 'inset-x-2 bottom-[calc(8px+env(safe-area-inset-bottom,0px))] max-h-[70dvh] rounded-2xl'
                  : 'max-w-[calc(100vw-16px)] rounded-xl'
              } ${className}`}
              initial={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: tokens.preScale, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={
                reducedMotion
                  ? { opacity: 0, transition: { duration: 0.15 } }
                  : {
                      opacity: 0,
                      scale: tokens.closingScale,
                      y: -2,
                      transition: { duration: tokens.close, ease: tokens.ease },
                    }
              }
              transition={
                reducedMotion
                  ? { duration: 0.2, ease: EASE_SMOOTH_OUT }
                  : { duration: tokens.open, ease: tokens.ease }
              }
            >
              {items.map((item, index) => {
                const IconComponent = item.icon;
                return (
                  <motion.button
                    key={item.label}
                    type="button"
                    role="menuitem"
                    disabled={item.disabled}
                    aria-disabled={item.disabled}
                    aria-checked={item.selected}
                    data-selected={item.selected ? 'true' : undefined}
                    onClick={() => select(item)}
                    onMouseEnter={() => !item.disabled && setActiveIndex(index)}
                    whileTap={reducedMotion || item.disabled ? undefined : { scale: PRESS_SCALE }}
                    className={`flex min-h-11 w-full items-center gap-3 rounded-lg px-3 text-left text-[13px] transition-colors sm:min-h-9 cursor-pointer ${
                      item.disabled
                        ? 'cursor-not-allowed text-[#a9a69e]/45'
                        : item.danger
                          ? 'text-[#ff7a8a] hover:bg-[#ff7a8a]/12'
                          : 'text-[#f3efe6] hover:bg-white/[0.07]'
                    } ${index === activeIndex && !item.disabled ? 'bg-white/[0.05]' : ''}`}
                  >
                    <IconComponent
                      size={17}
                      className={item.danger ? 'text-[#ff7a8a]' : 'text-[#e8b04a]'}
                      aria-hidden="true"
                    />
                    <span className="min-w-0 flex-1 truncate">{item.label}</span>
                    {item.selected && (
                      <Check size={15} weight="bold" className="shrink-0 text-[#7dffb0]" />
                    )}
                  </motion.button>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}
