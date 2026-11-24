import { animate, type PanInfo, type Transition, type Variants } from 'motion/react';

/**
 * Motion tokens from transitions.dev. Keep values here and in
 * `src/transitions.css` in sync — the CSS variables drive the plain CSS
 * transitions, these drive the spring-powered ones.
 */
export const EASE_SMOOTH_OUT = [0.22, 1, 0.36, 1] as const;
export const EASE_IN_OUT = [0.77, 0, 0.175, 1] as const;

/** Subtle press feedback for interactive controls (0.95–0.98 band). */
export const PRESS_SCALE = 0.96;

/**
 * Single compact-shell breakpoint (px), shared with the wide-landscape CSS
 * media query in `src/index.css` (`--cl-compact-max`). The JS `compact` flag
 * switches at `<= 700px`; the wide-landscape layout begins at `701px` so the
 * two never overlap. Keep both locations in sync with this token.
 */
export const COMPACT_BREAKPOINT_PX = 700;

/**
 * Single stacking ladder for every fixed overlay, from the scene outward.
 * Sheets and menus must sit above the HUD; transient toasts stay below sheets
 * so an open ruler/action sheet can never be obscured by a notification.
 * Use these numbers instead of ad-hoc `z-*` utilities on new overlays.
 */
export const Z = {
  /** Landmark card, top bar, compass. */
  hud: 10,
  /** Places / Globe shells, scale badge. */
  modeHud: 20,
  /** Toasts, offline pill, confetti — always below sheets. */
  transient: 30,
  /** Bottom sheets / side sheets (ruler, search, info). */
  sheet: 40,
  /** Full-screen dialogs (gallery, boot splash, postcard). */
  dialog: 50,
  /** Dropdown menus and their scrims — topmost interactive layer. */
  menu: 60,
} as const;

export const DURATION = {
  stagger: 0.04,
  micro: 0.08,
  quick: 0.15,
  fast: 0.25,
  medium: 0.35,
  slow: 0.4,
  emphasis: 0.5,
} as const;

/** A spring described by response time + damping ratio instead of raw numbers. */
export const springFromResponse = (response: number, dampingRatio: number, mass = 1) =>
  ({
    type: 'spring' as const,
    stiffness: Math.pow((2 * Math.PI) / response, 2) * mass,
    damping: (4 * Math.PI * dampingRatio * mass) / response,
    mass,
  }) satisfies Transition;

/** Critical damping: keeps velocity handoff, drops the bounce. */
export const noBounce = (spring: ReturnType<typeof springFromResponse>) =>
  ({
    ...spring,
    damping: Math.max(spring.damping, 2 * Math.sqrt(spring.stiffness * spring.mass)),
  }) satisfies Transition;

export const SPRING = {
  /** Surfaces, sheet + modal motion — quiet, no overshoot. */
  surface: springFromResponse(0.42, 1),
  /** Snappy controls and shared-layout indicators. */
  snappy: springFromResponse(0.3, 0.9),
  /** Gentle morphs, accordions, shared-element transitions. */
  morph: springFromResponse(0.45, 0.95),
  /** A little life for celebratory details. */
  pop: springFromResponse(0.4, 0.62),
} as const;

export const useSpringFor = (reduce: boolean, spring: ReturnType<typeof springFromResponse>) =>
  reduce ? noBounce(spring) : spring;

/* ── transitions.dev recipes, expressed as Motion variants ─────────────── */

/** 06-modal — scale 0.96 in, softer close; open 250ms, close 150ms. */
export const modalVariants: Variants = {
  initial: { opacity: 0, scale: 0.96, y: 8, filter: 'blur(2px)' },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: DURATION.fast, ease: EASE_SMOOTH_OUT },
  },
  exit: {
    opacity: 0,
    scale: 0.96,
    y: 4,
    filter: 'blur(0px)',
    transition: { duration: DURATION.quick, ease: EASE_SMOOTH_OUT },
  },
};

/** 07-panel-reveal — cross-blur + rise, open 400ms / close 350ms. */
export const panelVariants: Variants = {
  initial: { opacity: 0, y: 24, filter: 'blur(2px)' },
  animate: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: DURATION.slow, ease: EASE_SMOOTH_OUT },
  },
  exit: {
    opacity: 0,
    y: 12,
    filter: 'blur(0px)',
    transition: { duration: DURATION.medium, ease: EASE_SMOOTH_OUT },
  },
};

/** 22-toast — rise 16px with a soft blur, slower in than out. */
export const toastVariants: Variants = {
  initial: { opacity: 0, y: 16, scale: 0.97, filter: 'blur(2px)' },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: 'blur(0px)',
    transition: { duration: DURATION.medium, ease: EASE_SMOOTH_OUT },
  },
  exit: {
    opacity: 0,
    y: 6,
    scale: 0.97,
    transition: { duration: 0.25, ease: EASE_SMOOTH_OUT },
  },
};

/** 18-texts-reveal — staggered blurred rise; total stagger stays under 300ms. */
export const revealVariants: Variants = {
  initial: {},
  animate: { transition: { staggerChildren: DURATION.stagger, delayChildren: 0.04 } },
};
export const revealItem: Variants = {
  initial: { opacity: 0, y: 12, filter: 'blur(3px)' },
  animate: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: DURATION.emphasis, ease: EASE_SMOOTH_OUT },
  },
};

/** 04-text-states-swap — 4px travel + 2px blur, symmetric 150ms. */
export const swapVariants: Variants = {
  initial: { opacity: 0, y: 4, filter: 'blur(2px)' },
  animate: { opacity: 1, y: 0, filter: 'blur(0px)' },
  exit: { opacity: 0, y: -4, filter: 'blur(2px)' },
};
export const swapTransition: Transition = {
  duration: DURATION.quick,
  ease: EASE_IN_OUT,
};

/**
 * 16-tabs — a quiet crossfade when swapping panel content (e.g. the
 * InfoDrawer's Info/History tabs). No travel, no blur: the pill's sliding
 * indicator already carries the motion, so the panel just fades in place.
 */
export const tabFadeVariants: Variants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: {
      duration: DURATION.fast,
      ease: EASE_SMOOTH_OUT,
      staggerChildren: DURATION.stagger,
      delayChildren: DURATION.micro,
    },
  },
  exit: { opacity: 0, transition: { duration: DURATION.quick, ease: EASE_SMOOTH_OUT } },
};
export const tabFadeTransition: Transition = {
  duration: DURATION.fast,
  ease: EASE_SMOOTH_OUT,
};

/* ── fluid-interactions helpers ────────────────────────────────────────── */

export const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const rubberBand = (x: number, d: number, c = 0.55) => (1 - 1 / ((c * x) / d + 1)) * d;

/** Resist beyond an edge instead of hard-stopping. */
export const applyRubberBand = (value: number, min: number, max: number, d: number) => {
  if (value < min) return min - rubberBand(min - value, d);
  if (value > max) return max + rubberBand(value - max, d);
  return value;
};

/** Where a release at `velocity` px/s would coast to. */
export const project = (velocity: number, rate = 0.998) => ((velocity / 1000) * rate) / (1 - rate);

export const nearest = (value: number, points: number[]) =>
  points.reduce((best, p) => (Math.abs(p - value) < Math.abs(best - value) ? p : best));

/** A drag should dismiss on distance *or* a decisive flick. */
export const shouldDismiss = (
  info: PanInfo,
  distance = 96,
  velocity = 500,
  axis: 'x' | 'y' = 'y'
) => {
  const offset = axis === 'y' ? info.offset.y : info.offset.x;
  const v = axis === 'y' ? info.velocity.y : info.velocity.x;
  return offset > distance || v > velocity;
};

export { animate };
