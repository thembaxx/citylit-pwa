import {
  ArrowDown,
  ArrowSquareOut,
  BookmarkSimple,
  Camera,
  CaretDown,
  CaretLeft,
  CaretRight,
  CaretUp,
  Check,
  Clock,
  Crosshair,
  Drone,
  Drop,
  Gauge,
  GlobeHemisphereEast,
  Heart,
  Images,
  Info,
  MagnifyingGlass,
  MapPin,
  NavigationArrow,
  NotePencil,
  Path,
  PencilSimple,
  ShareNetwork,
  Stack,
  Tag,
  Trash,
  X,
  type Icon,
} from '@phosphor-icons/react';
import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useMotionValue, type Variants } from 'motion/react';
import { LANDMARKS } from '../data/landmarks';
import { resolvePlaceEditorial } from '../lib/placeEditorial';
import { animate, DURATION, EASE_SMOOTH_OUT, PRESS_SCALE, project, SPRING } from '../lib/motion';
import { useDrag } from '../lib/useDrag';
import type {
  CameraPreset,
  HeritageRoute,
  LandmarkNote,
  NoteCategory,
  WeatherConditionKey,
  WeatherDisplayState,
} from '../types/citylit';
import { Menu, type MenuItem } from './ui/Menu';
import { AnimatedNumber } from './ui/AnimatedNumber';

interface SlideCustom {
  dir: number;
  reduced: boolean;
}

const cardItemVariants: Variants = {
  initial: ({ dir, reduced }: SlideCustom) =>
    reduced ? { opacity: 1 } : { opacity: 0, x: dir * 12, y: 6, filter: 'blur(3px)' },
  animate: ({ reduced }: SlideCustom) => ({
    opacity: 1,
    x: 0,
    y: 0,
    filter: 'blur(0px)',
    transition: reduced
      ? { duration: 0 }
      : {
          x: { ...SPRING.surface },
          y: { ...SPRING.surface },
          opacity: { duration: DURATION.medium, ease: EASE_SMOOTH_OUT },
          filter: { duration: DURATION.medium, ease: EASE_SMOOTH_OUT },
        },
  }),
  exit: ({ dir, reduced }: SlideCustom) =>
    reduced
      ? { opacity: 0, transition: { duration: 0 } }
      : {
          opacity: 0,
          x: -dir * 10,
          y: -4,
          filter: 'blur(2px)',
          transition: { duration: DURATION.quick, ease: EASE_SMOOTH_OUT },
        },
};

const cardContentVariants: Variants = {
  initial: { opacity: 0 },
  animate: ({ reduced }: SlideCustom) => ({
    opacity: 1,
    transition: {
      duration: reduced ? 0 : DURATION.medium,
      ease: EASE_SMOOTH_OUT,
      staggerChildren: reduced ? 0 : 0.05,
    },
  }),
  exit: ({ reduced }: SlideCustom) => ({
    opacity: 0,
    transition: { duration: reduced ? 0 : DURATION.quick, ease: EASE_SMOOTH_OUT },
  }),
};

const NOTE_CATEGORIES: ReadonlyArray<{
  id: NoteCategory;
  label: string;
  dotColor: string;
  textColor: string;
  activeClass: string;
}> = [
  {
    id: 'memory',
    label: 'Memory',
    dotColor: '#38c793',
    textColor: '#5cd6a9',
    activeClass: 'bg-[#38c793]/18 border-[#5cd6a9]/75 text-[#5cd6a9]',
  },
  {
    id: 'photo',
    label: 'Photo',
    dotColor: '#e8b04a',
    textColor: '#e8b04a',
    activeClass: 'bg-[#e8b04a]/18 border-[#e8b04a]/75 text-[#e8b04a]',
  },
  {
    id: 'history',
    label: 'History',
    dotColor: '#ff7a8a',
    textColor: '#ff7a8a',
    activeClass: 'bg-[#ff7a8a]/18 border-[#ff7a8a]/75 text-[#ff7a8a]',
  },
];

const CAMERA_PRESETS: ReadonlyArray<{
  id: CameraPreset;
  label: string;
  icon: Icon;
  emoji: string;
  description: string;
}> = [
  {
    id: 'default',
    label: 'Default',
    icon: Crosshair,
    emoji: '👁️',
    description: 'Eye-level hero view of the whole site',
  },
  {
    id: 'aerial',
    label: 'Aerial',
    icon: Drone,
    emoji: '🚁',
    description: 'Look down from above the landmark',
  },
  {
    id: 'low',
    label: 'Low',
    icon: ArrowDown,
    emoji: '🔭',
    description: 'Ground-level detail and human scale',
  },
  {
    id: 'detail',
    label: 'Macro',
    icon: MagnifyingGlass,
    emoji: '📸',
    description: 'Close-up of textures and fine detail',
  },
];

interface LandmarkCardProps {
  index: number;
  isFavorite: boolean;
  compact: boolean;
  onToggleCompact: () => void;
  directionActive: boolean;
  cutawayActive?: boolean;
  /** Local clipping is unavailable on WebGPU; hide the Inspect control there. */
  cutawaySupported?: boolean;
  pinDropMode?: boolean;
  pendingDropPos?: readonly [number, number, number] | null;
  activeRoute?: HeritageRoute | null;
  notes: readonly LandmarkNote[];
  activeNoteId?: string | null;
  visible: boolean;
  reducedMotion?: boolean;
  onPrev: () => void;
  onNext: () => void;
  onToggleFavorite: () => void;
  onToggleDirection: () => void;
  onToggleCutaway?: () => void;
  onTogglePinDrop?: () => void;
  onClearPendingDrop?: () => void;
  onApplyCameraPreset?: (preset: CameraPreset) => void;
  onStepPin?: (dir: 1 | -1) => void;
  onNextRouteStop?: () => void;
  onClearRoute?: () => void;
  onAddNote: (
    text: string,
    category: NoteCategory,
    position?: readonly [number, number, number]
  ) => void;
  onUpdateNote: (noteId: string, text: string) => void;
  onDeleteNote: (noteId: string) => void;
  onFocusNote: (noteId: string) => void;
  onOpenInfo: () => void;
  onOpenGallery: () => void;
  onOpenPostcard: () => void;
  onOpenGlobe: () => void;
  onShare: () => void;
  onVibrate: () => void;
  onDragParallax?: (dx: number) => void;
  /** Current weather for the landmark, used by the Weather Insight panel. */
  weather?: WeatherDisplayState;
}

const CARDINALS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'] as const;

function nextBearingSummary(
  from: readonly [number, number],
  to: readonly [number, number]
): { cardinal: string; km: number } {
  const rad = Math.PI / 180;
  const lat1 = from[0] * rad;
  const lat2 = to[0] * rad;
  const dLat = lat2 - lat1;
  const dLon = (to[1] - from[1]) * rad;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const km = Math.round(6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
  const y = Math.sin(dLon) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
  const deg = ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
  const cardinal = CARDINALS[Math.round(deg / 45) % 8];
  return { cardinal, km };
}

function getCategoryMeta(category: NoteCategory = 'memory') {
  return NOTE_CATEGORIES.find((c) => c.id === category) ?? NOTE_CATEGORIES[0];
}

/** Typical relative humidity by display condition, used when no live observation is available. */
function typicalHumidity(condition: WeatherConditionKey): number {
  return condition === 'rain'
    ? 88
    : condition === 'storm'
      ? 92
      : condition === 'fog'
        ? 95
        : condition === 'cloud'
          ? 78
          : condition === 'partly'
            ? 62
            : condition === 'wind'
              ? 58
              : 48;
}

/**
 * Air quality is estimated from the condition, wind, humidity and landmark
 * biome (no live AQI source is available offline). Lower is better.
 */
function airQualityInsight(
  weather: WeatherDisplayState,
  biome: string
): { score: number; band: string; color: string } {
  let score = 30;
  if (biome === 'urban') score += 12;
  else if (biome === 'coastal') score -= 6;
  switch (weather.condition) {
    case 'rain':
      score -= 14;
      break;
    case 'storm':
      score -= 16;
      break;
    case 'fog':
      score += 12;
      break;
    case 'cloud':
      score += 6;
      break;
    case 'wind':
      score -= 6;
      break;
  }
  const live = weather.live;
  if (live) {
    if (live.windSpeed >= 25) score -= 10;
    else if (live.windSpeed >= 15) score -= 4;
    if (live.humidity >= 90) score += 6;
  }
  const hr = typeof window !== 'undefined' ? new Date().getHours() : 12;
  if ((hr >= 7 && hr <= 9) || (hr >= 16 && hr <= 18)) score += 8;
  if (hr >= 21 || hr <= 5) score -= 4;
  score = Math.max(0, Math.min(100, score));
  if (score > 60) return { score, band: 'Poor', color: '#ff7a8a' };
  if (score > 30) return { score, band: 'Fair', color: '#e8b04a' };
  return { score, band: 'Good', color: '#38c793' };
}

export function LandmarkCard({
  index,
  isFavorite,
  compact,
  onToggleCompact,
  directionActive,
  cutawayActive = false,
  cutawaySupported = true,
  pinDropMode = false,
  pendingDropPos = null,
  activeRoute = null,
  notes,
  activeNoteId = null,
  visible,
  reducedMotion = false,
  onPrev,
  onNext,
  onToggleFavorite,
  onToggleDirection,
  onToggleCutaway,
  onTogglePinDrop,
  onClearPendingDrop,
  onApplyCameraPreset,
  onStepPin,
  onNextRouteStop,
  onClearRoute,
  onAddNote,
  onUpdateNote,
  onDeleteNote,
  onFocusNote,
  onOpenInfo,
  onOpenGallery,
  onOpenPostcard,
  onOpenGlobe,
  onShare,
  onVibrate,
  onDragParallax,
  weather,
}: LandmarkCardProps) {
  const editorial = resolvePlaceEditorial(index);
  const [radialPos, setRadialPos] = useState<{ x: number; y: number } | null>(null);
  const [activePreset, setActivePreset] = useState<CameraPreset>('default');
  const [notesOpen, setNotesOpen] = useState(false);
  const [draftNote, setDraftNote] = useState('');
  const [noteCategory, setNoteCategory] = useState<NoteCategory>('memory');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingDraft, setEditingDraft] = useState('');
  const [weatherInsightOpen, setWeatherInsightOpen] = useState(false);
  const [{ current: trackedIndex, dir: direction }, setNavState] = useState({
    current: index,
    dir: 1,
  });
  if (index !== trackedIndex) {
    const count = LANDMARKS.length;
    let nextDir = index > trackedIndex ? 1 : -1;
    if (trackedIndex === count - 1 && index === 0) nextDir = 1;
    else if (trackedIndex === 0 && index === count - 1) nextDir = -1;
    setNavState({ current: index, dir: nextDir });
    setDraftNote('');
    setNoteCategory('memory');
    setEditingNoteId(null);
    setEditingDraft('');
  }
  const slideCustom: SlideCustom = { dir: direction, reduced: reducedMotion };
  const cardWrapRef = useRef<HTMLDivElement>(null);
  const cardShellRef = useRef<HTMLDivElement>(null);
  const cardTitleRef = useRef<HTMLDivElement>(null);
  const noteInputRef = useRef<HTMLTextAreaElement>(null);
  const holdTimer = useRef<number | null>(null);
  const dragX = useMotionValue(0);
  const dragOrigin = useRef(0);
  // Vertical drag collapses the card to its title strip and back.
  const [peeked, setPeeked] = useState(false);
  const peekedRef = useRef(false);
  const [cardHeightReady, setCardHeightReady] = useState(false);
  const cardMaxHeight = useMotionValue(0);
  const cardHeightStart = useRef(0);
  const dragAxis = useRef<'x' | 'y' | null>(null);
  const naturalHeight = useRef(0);
  const peekHeight = useRef(0);
  const measuredKey = useRef('');

  useEffect(() => {
    if (notesOpen) {
      const id = window.requestAnimationFrame(() => noteInputRef.current?.focus());
      return () => window.cancelAnimationFrame(id);
    }
    return undefined;
  }, [notesOpen]);

  // Publish the card height so fixed overlays can stack above it instead of guessing.
  useEffect(() => {
    if (!visible) return;
    const el = cardWrapRef.current;
    const root = document.documentElement;
    if (!el) {
      root.style.removeProperty('--cl-card-h');
      return;
    }
    let frame = 0;
    let lastHeight = -1;
    const sync = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const h = el.offsetHeight; // read first
        if (h === lastHeight) return;
        lastHeight = h;
        root.style.setProperty('--cl-card-h', `${h}px`); // then write
      });
    };
    sync();
    const ro = new ResizeObserver(sync);
    ro.observe(el);
    return () => {
      ro.disconnect();
      cancelAnimationFrame(frame);
      root.style.removeProperty('--cl-card-h');
    };
  }, [visible]);

  // Content signature: the card has to be measured again whenever its
  // content changes height.
  const cardContentKey = `${index}|${notes.length}|${notesOpen ? 1 : 0}|${
    weatherInsightOpen ? 1 : 0
  }`;

  // Measure the card so a vertical drag can collapse it to its title strip.
  // The shell is the scroll container, so its scroll height is the content
  // height; the natural height is that value capped by the viewport.
  useEffect(() => {
    if (!visible) return undefined;
    const measure = () => {
      const shell = cardShellRef.current;
      const title = cardTitleRef.current;
      if (!shell) return;
      const viewportMax = Math.max(160, window.innerHeight - 104);
      naturalHeight.current = Math.min(shell.scrollHeight, viewportMax);
      peekHeight.current = title
        ? Math.min(viewportMax, title.offsetHeight + 40)
        : naturalHeight.current;
      const target = peekedRef.current ? peekHeight.current : naturalHeight.current;
      if (cardMaxHeight.get() === 0) cardMaxHeight.set(target);
      else animate(cardMaxHeight, target, SPRING.surface);
      setCardHeightReady(true);
    };
    measure();
    // Late pass: fonts, images and the WebGPU warm-up all change the height.
    const late = window.setTimeout(measure, 400);
    window.addEventListener('resize', measure);
    measuredKey.current = cardContentKey;
    return () => {
      window.clearTimeout(late);
      window.removeEventListener('resize', measure);
    };
  }, [visible, cardContentKey, cardMaxHeight]);

  // Drag the title strip: sideways switches landmark, vertically collapses
  // the card to its title strip. Velocity decides a flick.
  const headerDrag = useDrag({
    onStart: () => {
      dragX.stop();
      dragOrigin.current = dragX.get();
      dragAxis.current = null;
      cardHeightStart.current = cardMaxHeight.get();
    },
    onMove: (delta) => {
      if (delta.x !== 0) {
        dragAxis.current = 'x';
        const nextX = dragOrigin.current + delta.x * 0.7;
        dragX.set(nextX);
        onDragParallax?.(nextX);
        return;
      }
      if (delta.y === 0) return;
      dragAxis.current = 'y';
      const min = peekHeight.current;
      const max = naturalHeight.current;
      if (!min || !max || compact) return;
      // Dragging down shrinks the card towards its title strip.
      cardMaxHeight.set(Math.max(min, Math.min(max, cardHeightStart.current - delta.y)));
    },
    onEnd: (velocity) => {
      const landing = dragX.get() + project(velocity.x * 0.5);
      animate(dragX, 0, { ...SPRING.surface, velocity: velocity.x });
      onDragParallax?.(0);
      if (dragAxis.current === 'x') {
        if (landing < -64) onNext();
        else if (landing > 64) onPrev();
        return;
      }
      if (dragAxis.current !== 'y') return;
      const min = peekHeight.current;
      const max = naturalHeight.current;
      if (!min || !max || compact) {
        cardMaxHeight.set(max);
        return;
      }
      // Snap: down collapses to the title strip, up opens the card again.
      const current = cardMaxHeight.get();
      const mid = (min + max) / 2;
      const target = velocity.y > 0.3 ? min : velocity.y < -0.3 ? max : current > mid ? max : min;
      peekedRef.current = target === min;
      setPeeked(peekedRef.current);
      animate(cardMaxHeight, target, { ...SPRING.surface, velocity: velocity.y });
    },
  });

  if (!visible) return null;

  const lm = LANDMARKS[index];
  const insight = weather ? airQualityInsight(weather, lm.biome) : null;
  const humidityText = weather
    ? weather.live != null
      ? `${Math.round(weather.live.humidity)}%`
      : `${typicalHumidity(weather.condition)}%`
    : null;
  const nextLm = LANDMARKS[(index + 1) % LANDMARKS.length];
  const { cardinal, km } = nextBearingSummary(lm.coords, nextLm.coords);
  const progressPct = ((index + 1) / LANDMARKS.length) * 100;
  const totalInteractivePins = lm.dots.length + notes.length;
  const routeStopIdx = activeRoute ? activeRoute.stopIndices.indexOf(index) : -1;

  const clearHold = () => {
    if (holdTimer.current !== null) {
      window.clearTimeout(holdTimer.current);
      holdTimer.current = null;
    }
  };

  const openRadial = (x: number, y: number) => {
    onVibrate();
    setRadialPos({
      x: Math.min(window.innerWidth - 95, Math.max(95, x)),
      y: Math.min(window.innerHeight - 95, Math.max(95, y)),
    });
  };

  const radialActions = [
    {
      label: isFavorite ? 'Saved' : 'Save',
      icon: isFavorite ? BookmarkSimple : Heart,
      onClick: onToggleFavorite,
      posClass: '-translate-x-1/2 -translate-y-[84px]',
    },
    {
      label: 'Details',
      icon: Info,
      onClick: onOpenInfo,
      posClass: 'translate-x-[50px] -translate-y-[66px]',
    },
    {
      label: 'Photos',
      icon: Images,
      onClick: onOpenGallery,
      posClass: 'translate-x-[68px] -translate-y-1/2',
    },
    {
      label: 'Postcard',
      icon: Camera,
      onClick: onOpenPostcard,
      posClass: 'translate-x-[38px] translate-y-[42px]',
    },
    {
      label: 'Globe',
      icon: GlobeHemisphereEast,
      onClick: onOpenGlobe,
      posClass: '-translate-x-[108px] -translate-y-1/2',
    },
    {
      label: 'Share',
      icon: ShareNetwork,
      onClick: onShare,
      posClass: '-translate-x-[86px] -translate-y-[66px]',
    },
  ];

  const smallBtn =
    'min-w-11 min-h-11 rounded-full grid place-items-center bg-white/[0.06] border border-white/15 text-[#f3efe6] hover:border-[#e8b04a] hover:text-[#e8b04a] transition-colors cursor-pointer';

  const submitDraftNote = () => {
    const clean = draftNote.trim();
    if (!clean) return;
    onAddNote(clean, noteCategory, pendingDropPos ?? undefined);
    setDraftNote('');
    onClearPendingDrop?.();
  };

  if (compact) {
    // Same icon-only quick actions as the expanded card's top-right cluster,
    // with Details added as a fourth control.
    const compactActions = [
      {
        label: 'Create 3D postcard',
        ariaLabel: 'Create 3D postcard',
        icon: Camera,
        onClick: onOpenPostcard,
        active: false,
      },
      {
        label: 'Landmark photo gallery',
        ariaLabel: 'Landmark photo gallery',
        icon: Images,
        onClick: onOpenGallery,
        active: false,
      },
      {
        label: 'Save favorite',
        ariaLabel: isFavorite ? 'Remove from favorites' : 'Save favorite',
        icon: Heart,
        onClick: onToggleFavorite,
        active: isFavorite,
      },
      {
        label: 'Details',
        ariaLabel: 'Landmark historical and architectural details',
        icon: Info,
        onClick: onOpenInfo,
        active: false,
      },
    ];

    return (
      <AnimatePresence initial={false}>
        <motion.div
          key="card-compact"
          exit={
            reducedMotion
              ? { opacity: 0, transition: { duration: 0 } }
              : { opacity: 0, transition: { duration: DURATION.quick, ease: EASE_SMOOTH_OUT } }
          }
          className="fixed left-[var(--cl-stage-inset)] bottom-0 z-10 w-full max-w-[560px] landscape:max-w-[380px] md:max-w-[490px] lg:max-w-[560px] pl-[calc(0.875rem+env(safe-area-inset-left,0px))] pr-[calc(0.875rem+env(safe-area-inset-right,0px))] pb-[calc(14px+env(safe-area-inset-bottom,0px))] pointer-events-none"
        >
          <motion.div
            layoutId="landmark-card-shell"
            layout={!reducedMotion}
            initial={reducedMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={
              reducedMotion
                ? { opacity: 0, transition: { duration: 0 } }
                : { opacity: 0, transition: { duration: DURATION.quick, ease: EASE_SMOOTH_OUT } }
            }
            transition={
              reducedMotion
                ? { duration: 0 }
                : {
                    layout: SPRING.morph,
                    opacity: { duration: DURATION.quick, ease: EASE_SMOOTH_OUT },
                  }
            }
            className="flex flex-col gap-2 rounded-2xl bg-[#121319]/92 border border-white/15 squircle-card px-3 py-2.5 pointer-events-auto shadow-2xl max-h-[calc(100dvh-104px)] overflow-y-auto overscroll-contain no-scrollbar"
          >
            <div className="min-w-0">
              <small className="block text-[#e8b04a] tracking-[0.12em] uppercase text-[10.5px] truncate">
                {lm.c}
              </small>
              <motion.div
                layoutId="landmark-title"
                transition={reducedMotion ? { duration: 0 } : SPRING.morph}
                className="truncate font-serif-display italic text-[19px] leading-tight text-[#f3efe6]"
              >
                {lm.k}
              </motion.div>
            </div>

            <p className="m-0 text-[13px] leading-relaxed text-[#c2beb5]">{lm.f}</p>

            <div className="flex items-center justify-start gap-1.5">
              {compactActions.map(({ label, ariaLabel, icon: Icon, onClick, active }) => (
                <motion.button
                  key={label}
                  type="button"
                  whileTap={reducedMotion ? undefined : { scale: PRESS_SCALE }}
                  transition={SPRING.snappy}
                  onClick={onClick}
                  aria-label={ariaLabel}
                  title={ariaLabel}
                  className={`${smallBtn} ${active ? 'border-[#ff6b81] text-[#ff6b81]' : ''}`}
                >
                  <Icon size={16} weight={active ? 'fill' : 'regular'} />
                </motion.button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <motion.button
                type="button"
                whileTap={reducedMotion ? undefined : { scale: PRESS_SCALE }}
                onClick={onPrev}
                aria-label="Previous landmark"
                className={`${smallBtn} w-8 h-8`}
              >
                <CaretLeft size={14} />
              </motion.button>
              <div className="flex-1 h-[3px] rounded-full bg-white/15 overflow-hidden">
                <motion.div
                  className="h-full w-full origin-left bg-[#e8b04a]"
                  initial={false}
                  animate={{ scaleX: progressPct / 100 }}
                  transition={{ duration: reducedMotion ? 0 : 0.25, ease: EASE_SMOOTH_OUT }}
                />
              </div>
              <span className="text-[11.5px] font-mono tabular-nums text-[#c2beb5] shrink-0">
                {index + 1}/{LANDMARKS.length}
              </span>
              <motion.button
                type="button"
                whileTap={reducedMotion ? undefined : { scale: PRESS_SCALE }}
                onClick={onNext}
                aria-label="Next landmark"
                className={`${smallBtn} w-8 h-8`}
              >
                <CaretRight size={14} />
              </motion.button>
              <motion.button
                type="button"
                whileTap={reducedMotion ? undefined : { scale: PRESS_SCALE }}
                onClick={onToggleCompact}
                aria-label="Expand controls"
                title="Expand controls"
                className={`${smallBtn} w-8 h-8 border-[#e8b04a]/55 text-[#e8b04a] ml-auto`}
              >
                <CaretUp size={15} weight="bold" />
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  }

  const cameraMenuItems: MenuItem[] = CAMERA_PRESETS.map((preset) => ({
    icon: preset.icon,
    emoji: preset.emoji,
    label: preset.label,
    description: preset.description,
    selected: activePreset === preset.id,
    onSelect: () => {
      setActivePreset(preset.id);
      onApplyCameraPreset?.(preset.id);
    },
  }));

  return (
    <AnimatePresence initial={false}>
      <motion.div
        key="card-full"
        ref={cardWrapRef}
        exit={
          reducedMotion
            ? { opacity: 0, transition: { duration: 0 } }
            : { opacity: 0, transition: { duration: DURATION.quick, ease: EASE_SMOOTH_OUT } }
        }
        className="fixed left-[var(--cl-stage-inset)] bottom-0 z-10 w-full max-w-[560px] landscape:max-w-[380px] md:max-w-[490px] md:landscape:max-w-[490px] lg:max-w-[560px] lg:landscape:max-w-[560px] pl-[calc(0.875rem+env(safe-area-inset-left,0px))] pr-[calc(0.875rem+env(safe-area-inset-right,0px))] pb-[calc(14px+env(safe-area-inset-bottom,0px))] pointer-events-none"
      >
        <motion.div
          ref={cardShellRef}
          layoutId="landmark-card-shell"
          layout={!reducedMotion}
          initial={reducedMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={
            reducedMotion
              ? { opacity: 0, transition: { duration: 0 } }
              : { opacity: 0, transition: { duration: DURATION.quick, ease: EASE_SMOOTH_OUT } }
          }
          transition={
            reducedMotion
              ? { duration: 0 }
              : {
                  layout: SPRING.morph,
                  opacity: { duration: DURATION.quick, ease: EASE_SMOOTH_OUT },
                }
          }
          onContextMenu={(e) => {
            e.preventDefault();
            openRadial(e.clientX, e.clientY);
          }}
          className="relative bg-[#121319]/92 border border-white/15 squircle-card px-4 py-[18px] landscape:px-3.5 landscape:py-3.5 md:landscape:px-4 md:landscape:py-[18px] [@media(max-height:700px)]:px-3.5 [@media(max-height:700px)]:py-3.5 pointer-events-auto shadow-2xl max-h-[calc(100dvh-104px)] overflow-y-auto overscroll-contain no-scrollbar"
          data-peeked={peeked ? 'true' : undefined}
          style={cardHeightReady ? { maxHeight: cardMaxHeight } : undefined}
        >
          {activeRoute && (
            <div className="mb-2.5 flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-xl bg-white/[0.04] border border-white/10">
              <div className="min-w-0 flex items-center gap-2 text-[11px]">
                <Path
                  size={13}
                  weight="bold"
                  style={{ color: activeRoute.color }}
                  className="shrink-0"
                />
                <span className="font-medium text-[#f3efe6] truncate">{activeRoute.name}</span>
                <span className="font-mono tabular-nums text-[#a9a69e] shrink-0">
                  {routeStopIdx >= 0
                    ? `Stop ${routeStopIdx + 1}/${activeRoute.stopIndices.length}`
                    : `${activeRoute.stopIndices.length} stops`}
                </span>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {onNextRouteStop && (
                  <button
                    type="button"
                    onClick={onNextRouteStop}
                    className="h-6 px-2 rounded-full bg-[#e8b04a]/18 border border-[#e8b04a]/60 text-[10.5px] font-medium text-[#e8b04a] hover:bg-[#e8b04a]/28 transition-colors cursor-pointer whitespace-nowrap"
                  >
                    Next Stop →
                  </button>
                )}
                {onClearRoute && (
                  <button
                    type="button"
                    onClick={onClearRoute}
                    aria-label="Exit heritage route"
                    title="Exit route"
                    className="w-6 h-6 rounded-full grid place-items-center text-[#a9a69e] hover:text-[#f3efe6] hover:bg-white/[0.08] cursor-pointer"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
            </div>
          )}

          <div className="flex items-start justify-between gap-3">
            {/* Card contents re-animate with a staggered fade when the
                landmark switches (see cardContentVariants / cardItemVariants). */}
            <AnimatePresence mode="wait" initial={false} custom={slideCustom}>
              <motion.div
                key={index}
                custom={slideCustom}
                variants={cardContentVariants}
                initial="initial"
                animate="animate"
                exit="exit"
              >
                <motion.div
                  {...headerDrag}
                  ref={cardTitleRef}
                  style={{ x: dragX }}
                  variants={cardItemVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  custom={slideCustom}
                  className="min-w-0 flex-1 overflow-hidden cursor-grab touch-none active:cursor-grabbing"
                  onTouchStart={(e) => {
                    clearHold();
                    const t = e.touches[0];
                    holdTimer.current = window.setTimeout(
                      () => openRadial(t.clientX, t.clientY),
                      450
                    );
                  }}
                  onTouchEnd={clearHold}
                  onTouchMove={() => clearHold()}
                >
                  <small className="block text-[#e8b04a] tracking-[0.12em] uppercase text-[11px] [@media(max-width:374px)]:text-[10px] [@media(max-width:374px)]:tracking-[0.08em]">
                    {lm.c}
                  </small>
                  <motion.h1
                    layoutId="landmark-title"
                    transition={reducedMotion ? { duration: 0 } : SPRING.morph}
                    className="mt-1 mb-2.5 font-serif-display italic text-[27px] landscape:text-[21px] landscape:mb-2 [@media(max-height:700px)]:text-[23px] [@media(max-height:700px)]:mb-2 leading-[1.15] text-[#f3efe6] pr-2"
                  >
                    {lm.k}
                  </motion.h1>
                </motion.div>

                <div className="overflow-hidden">
                  <motion.p
                    custom={slideCustom}
                    variants={cardItemVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    className="text-[13.5px] landscape:text-[12.5px] leading-relaxed text-[#a9a69e] m-0 landscape:line-clamp-2 [@media(max-height:700px)]:line-clamp-2"
                  >
                    {lm.f}
                  </motion.p>
                </div>

                <motion.div
                  custom={slideCustom}
                  variants={cardItemVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  className="mt-2.5 flex flex-wrap items-center gap-2"
                >
                  <motion.button
                    type="button"
                    whileTap={reducedMotion ? undefined : { scale: PRESS_SCALE }}
                    onClick={onToggleDirection}
                    aria-pressed={directionActive}
                    aria-label={`Show direction toward ${nextLm.k}`}
                    title={`Point toward ${nextLm.k} (${cardinal}, ${km.toLocaleString()} km)`}
                    className={`h-7 px-2.5 rounded-full inline-flex items-center gap-1.5 border text-[11.5px] font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                      directionActive
                        ? 'bg-[#e8b04a]/16 border-[#e8b04a]/70 text-[#e8b04a]'
                        : 'bg-white/[0.04] border-white/12 text-[#d6d1c6] hover:border-[#e8b04a]/60 hover:text-[#e8b04a]'
                    }`}
                  >
                    <NavigationArrow size={13} weight={directionActive ? 'fill' : 'regular'} />
                    {directionActive ? 'Hide Direction' : 'Show Direction'}
                  </motion.button>
                  <motion.button
                    type="button"
                    whileTap={reducedMotion ? undefined : { scale: PRESS_SCALE }}
                    onClick={() => setNotesOpen((v) => !v)}
                    aria-expanded={notesOpen}
                    aria-label={
                      notes.length > 0
                        ? `Private notes for ${lm.k} (${notes.length})`
                        : `Add private note to ${lm.k}`
                    }
                    title="Save a private note pinned in 3D when you revisit"
                    className={`h-7 px-2.5 rounded-full inline-flex items-center gap-1.5 border text-[11.5px] font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0 tabular-nums ${
                      notesOpen
                        ? 'bg-[#38c793]/18 border-[#5cd6a9]/75 text-[#5cd6a9]'
                        : notes.length > 0
                          ? 'bg-[#38c793]/10 border-[#5cd6a9]/40 text-[#9cebd0] hover:border-[#5cd6a9]/75 hover:text-[#5cd6a9]'
                          : 'bg-white/[0.04] border-white/12 text-[#d6d1c6] hover:border-[#5cd6a9]/65 hover:text-[#5cd6a9]'
                    }`}
                  >
                    <NotePencil
                      size={13}
                      weight={notesOpen || notes.length > 0 ? 'fill' : 'regular'}
                    />
                    {notes.length > 0 ? `Add Note (${notes.length})` : 'Add Note'}
                  </motion.button>
                  {onToggleCutaway && cutawaySupported && (
                    <motion.button
                      type="button"
                      whileTap={reducedMotion ? undefined : { scale: PRESS_SCALE }}
                      onClick={onToggleCutaway}
                      aria-pressed={cutawayActive}
                      aria-label="Inspect architectural cutaway layers"
                      title="Smoothly separate upper roofs & spires to inspect structure"
                      className={`h-7 px-2.5 rounded-full inline-flex items-center gap-1.5 border text-[11.5px] font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                        cutawayActive
                          ? 'bg-[#e8b04a]/16 border-[#e8b04a]/70 text-[#e8b04a]'
                          : 'bg-white/[0.04] border-white/12 text-[#d6d1c6] hover:border-[#e8b04a]/60 hover:text-[#e8b04a]'
                      }`}
                    >
                      <Stack size={13} weight={cutawayActive ? 'fill' : 'regular'} />
                      Inspect
                    </motion.button>
                  )}
                  {weather && (
                    <motion.button
                      type="button"
                      whileTap={reducedMotion ? undefined : { scale: PRESS_SCALE }}
                      onClick={() => {
                        setWeatherInsightOpen((v) => !v);
                      }}
                      aria-expanded={weatherInsightOpen}
                      aria-label="Local weather insight: temperature, humidity and air quality"
                      className={`h-7 px-2.5 rounded-full inline-flex items-center gap-1.5 border text-[11.5px] font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                        weatherInsightOpen
                          ? 'bg-[#e8b04a]/16 border-[#e8b04a]/70 text-[#e8b04a]'
                          : 'bg-white/[0.04] border-white/12 text-[#d6d1c6] hover:border-[#e8b04a]/60 hover:text-[#e8b04a]'
                      }`}
                    >
                      <Gauge size={13} />
                      Weather Insight
                    </motion.button>
                  )}
                  <span className="text-[11px] text-[#a9a69e] truncate">
                    {directionActive
                      ? `${cardinal} · ${km.toLocaleString()} km → ${nextLm.k}`
                      : `Next: ${nextLm.k}`}
                  </span>
                </motion.div>
              </motion.div>
            </AnimatePresence>
            <div className="flex items-center gap-1.5 shrink-0">
              {[
                {
                  label: 'Create 3D postcard',
                  icon: Camera,
                  onClick: onOpenPostcard,
                  active: false,
                },
                {
                  label: 'Landmark photo gallery',
                  icon: Images,
                  onClick: onOpenGallery,
                  active: false,
                },
                {
                  label: isFavorite ? 'Remove from favorites' : 'Save favorite',
                  icon: Heart,
                  onClick: onToggleFavorite,
                  active: isFavorite,
                },
              ].map(({ label, icon: Icon, onClick, active }) => (
                <motion.button
                  key={label}
                  type="button"
                  whileTap={reducedMotion ? undefined : { scale: PRESS_SCALE }}
                  transition={SPRING.snappy}
                  onClick={onClick}
                  aria-label={label}
                  title={label}
                  className={`${smallBtn} ${active ? 'border-[#ff6b81] text-[#ff6b81]' : ''}`}
                >
                  <Icon size={16} weight={active ? 'fill' : 'regular'} />
                </motion.button>
              ))}
            </div>
          </div>

          {(onApplyCameraPreset || onStepPin) && (
            <AnimatePresence mode="wait" initial={false} custom={slideCustom}>
              <motion.div
                key={index}
                custom={slideCustom}
                variants={cardContentVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="mt-2 flex flex-wrap items-center justify-between gap-1.5"
              >
                {onApplyCameraPreset && (
                  <Menu
                    ariaLabel="3D camera views"
                    reducedMotion={reducedMotion}
                    items={cameraMenuItems}
                    trigger={
                      <button
                        type="button"
                        aria-label={`3D camera view: ${
                          CAMERA_PRESETS.find((p) => p.id === activePreset)?.label ?? 'Default'
                        }`}
                        title="Choose 3D camera view"
                        className="h-6 px-2 rounded-full inline-flex items-center gap-1 bg-white/[0.04] border border-white/10 text-[10.5px] text-[#c8c4bc] hover:border-[#e8b04a]/65 hover:text-[#e8b04a] transition-colors cursor-pointer"
                      >
                        <Camera size={11} />
                        <span>View</span>
                        <CaretDown size={9} />
                      </button>
                    }
                  />
                )}
                {onStepPin && totalInteractivePins > 0 && (
                  <button
                    type="button"
                    onClick={() => onStepPin(1)}
                    title="Cycle through 3D fact pins & personal notes (Shortcut: P)"
                    aria-label={`Cycle 3D pins (${totalInteractivePins} available)`}
                    className="h-6 px-2.5 rounded-full inline-flex items-center gap-1 bg-white/[0.04] border border-white/10 text-[10.5px] font-mono tabular-nums text-[#d6d1c6] hover:border-[#5cd6a9]/60 hover:text-[#5cd6a9] transition-colors cursor-pointer ml-auto"
                  >
                    <MapPin size={11} weight="fill" className="text-[#e8b04a]" />
                    <span>Pins ({totalInteractivePins})</span>
                  </button>
                )}
              </motion.div>
            </AnimatePresence>
          )}

          <AnimatePresence initial={false}>
            {notesOpen && (
              <motion.div
                key="notes-drawer"
                initial={reducedMotion ? { opacity: 0 } : { opacity: 0, height: 0 }}
                animate={reducedMotion ? { opacity: 1 } : { opacity: 1, height: 'auto' }}
                exit={reducedMotion ? { opacity: 0 } : { opacity: 0, height: 0 }}
                transition={{ duration: reducedMotion ? 0 : DURATION.quick, ease: EASE_SMOOTH_OUT }}
                className="overflow-hidden"
              >
                {/* Lift the note composer by the on-screen keyboard delta so the
                    focused textarea stays above the keyboard (see App.tsx). */}
                <div
                  className="mt-2.5 pt-2.5 border-t border-white/12 space-y-2"
                  style={{ transform: 'translateY(calc(-1 * var(--cl-kbd-inset, 0px)))' }}
                >
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      submitDraftNote();
                    }}
                    className="space-y-1.5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-1.5">
                      <div
                        className="inline-flex items-center gap-1"
                        role="radiogroup"
                        aria-label="Pin category"
                      >
                        {NOTE_CATEGORIES.map((cat) => {
                          const active = noteCategory === cat.id;
                          return (
                            <button
                              key={cat.id}
                              type="button"
                              role="radio"
                              aria-checked={active}
                              onClick={() => setNoteCategory(cat.id)}
                              className={`h-6 px-2 rounded-full inline-flex items-center gap-1 text-[11px] border transition-colors cursor-pointer ${
                                active
                                  ? cat.activeClass
                                  : 'bg-white/[0.04] border-white/10 text-[#a9a69e] hover:text-[#f3efe6]'
                              }`}
                            >
                              <span
                                className="w-1.5 h-1.5 rounded-full"
                                style={{ backgroundColor: cat.dotColor }}
                              />
                              {cat.label}
                            </button>
                          );
                        })}
                      </div>

                      {onTogglePinDrop && (
                        <button
                          type="button"
                          onClick={onTogglePinDrop}
                          aria-pressed={pinDropMode}
                          title="Tap any surface on the 3D landmark to anchor this note"
                          className={`h-6 px-2 rounded-full inline-flex items-center gap-1 text-[11px] border transition-colors cursor-pointer ${
                            pinDropMode
                              ? 'bg-[#e8b04a]/22 border-[#e8b04a] text-[#e8b04a]'
                              : pendingDropPos
                                ? 'bg-[#38c793]/16 border-[#5cd6a9]/60 text-[#5cd6a9]'
                                : 'bg-white/[0.04] border-white/12 text-[#d6d1c6] hover:border-[#e8b04a]/60 hover:text-[#e8b04a]'
                          }`}
                        >
                          <Crosshair size={12} />
                          <span>
                            {pinDropMode
                              ? 'Tap 3D model…'
                              : pendingDropPos
                                ? '3D Point Locked'
                                : 'Place on 3D'}
                          </span>
                        </button>
                      )}
                    </div>

                    {pendingDropPos && (
                      <div className="flex items-center justify-between gap-2 px-2.5 py-1 rounded-lg bg-[#38c793]/10 border border-[#5cd6a9]/35 text-[10.5px] font-mono tabular-nums text-[#9cebd0]">
                        <span>
                          Anchored at ({pendingDropPos[0]}, {pendingDropPos[1]}, {pendingDropPos[2]}
                          )
                        </span>
                        {onClearPendingDrop && (
                          <button
                            type="button"
                            onClick={onClearPendingDrop}
                            aria-label="Clear custom 3D pin position"
                            className="text-[#a9a69e] hover:text-[#f3efe6] cursor-pointer"
                          >
                            <X size={12} />
                          </button>
                        )}
                      </div>
                    )}

                    <textarea
                      ref={noteInputRef}
                      value={draftNote}
                      onChange={(e) => setDraftNote(e.target.value)}
                      onFocus={() => {
                        window.requestAnimationFrame(() =>
                          noteInputRef.current?.scrollIntoView({ block: 'nearest' })
                        );
                      }}
                      onKeyDown={(e) => {
                        if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                          e.preventDefault();
                          submitDraftNote();
                        } else if (e.key === 'Escape') {
                          e.stopPropagation();
                          setNotesOpen(false);
                        }
                      }}
                      rows={2}
                      maxLength={240}
                      placeholder={`Pin a private thought on ${lm.k}…`}
                      aria-label={`Private note for ${lm.k}`}
                      className="w-full rounded-xl bg-white/[0.05] border border-white/15 focus:border-[#5cd6a9] focus:outline-none px-3 py-2 text-[12.5px] leading-snug text-[#f3efe6] placeholder:text-[#a9a69e]/70 resize-none"
                    />
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10.5px] font-mono tabular-nums text-[#a9a69e]">
                        {draftNote.trim().length}/240 · Saved locally as 3D pin
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setDraftNote('');
                            onClearPendingDrop?.();
                            setNotesOpen(false);
                          }}
                          className="h-7 px-2.5 rounded-lg border border-white/12 bg-white/[0.04] text-[11.5px] text-[#a9a69e] hover:text-[#f3efe6] transition-colors cursor-pointer"
                        >
                          Close
                        </button>
                        <button
                          type="submit"
                          disabled={draftNote.trim().length === 0}
                          className="h-7 px-3 rounded-lg bg-[#38c793] text-[#0c1d16] text-[11.5px] font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#4cd5a3] transition-colors cursor-pointer"
                        >
                          Pin Note
                        </button>
                      </div>
                    </div>
                  </form>

                  {notes.length > 0 && (
                    <ul className="space-y-1.5 max-h-[136px] overflow-y-auto pr-0.5">
                      {notes.map((note) => {
                        const isEditing = editingNoteId === note.id;
                        const isHighlighted = activeNoteId === note.id;
                        const catMeta = getCategoryMeta(note.category);
                        return (
                          <li
                            key={note.id}
                            className={`rounded-xl border px-2.5 py-2 transition-colors ${
                              isHighlighted
                                ? 'bg-[#38c793]/14 border-[#5cd6a9]/65'
                                : 'bg-white/[0.035] border-white/10 hover:border-white/22'
                            }`}
                          >
                            {isEditing ? (
                              <div className="flex items-center gap-1.5">
                                <input
                                  type="text"
                                  value={editingDraft}
                                  maxLength={240}
                                  onChange={(e) => setEditingDraft(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault();
                                      const clean = editingDraft.trim();
                                      if (clean) {
                                        onUpdateNote(note.id, clean);
                                        setEditingNoteId(null);
                                      }
                                    } else if (e.key === 'Escape') {
                                      e.stopPropagation();
                                      setEditingNoteId(null);
                                    }
                                  }}
                                  className="flex-1 min-w-0 rounded-lg bg-black/35 border border-[#5cd6a9]/60 px-2 py-1 text-[12px] text-[#f3efe6] focus:outline-none"
                                  aria-label="Edit note text"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    const clean = editingDraft.trim();
                                    if (clean) {
                                      onUpdateNote(note.id, clean);
                                      setEditingNoteId(null);
                                    }
                                  }}
                                  aria-label="Save edited note"
                                  className="w-7 h-7 rounded-lg grid place-items-center bg-[#38c793]/20 text-[#5cd6a9] hover:bg-[#38c793]/35 cursor-pointer"
                                >
                                  <Check size={14} weight="bold" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingNoteId(null)}
                                  aria-label="Cancel edit"
                                  className="w-7 h-7 rounded-lg grid place-items-center bg-white/[0.06] text-[#a9a69e] hover:text-[#f3efe6] cursor-pointer"
                                >
                                  <X size={14} />
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-start gap-2">
                                <button
                                  type="button"
                                  onClick={() => onFocusNote(note.id)}
                                  className="flex-1 min-w-0 text-left flex items-start gap-2 cursor-pointer group"
                                  title="Focus camera on 3D User Pin"
                                >
                                  {note.category === 'photo' ? (
                                    <Camera
                                      size={14}
                                      weight="fill"
                                      style={{ color: catMeta.textColor }}
                                      className="shrink-0 mt-0.5 [@media(hover:hover)_and_(pointer:fine)]:group-hover:scale-110 transition-transform"
                                    />
                                  ) : note.category === 'history' ? (
                                    <Clock
                                      size={14}
                                      weight="fill"
                                      style={{ color: catMeta.textColor }}
                                      className="shrink-0 mt-0.5 [@media(hover:hover)_and_(pointer:fine)]:group-hover:scale-110 transition-transform"
                                    />
                                  ) : (
                                    <MapPin
                                      size={14}
                                      weight="fill"
                                      style={{ color: catMeta.textColor }}
                                      className="shrink-0 mt-0.5 [@media(hover:hover)_and_(pointer:fine)]:group-hover:scale-110 transition-transform"
                                    />
                                  )}
                                  <span className="text-[12px] leading-snug text-[#e9e4d9] break-words">
                                    {note.text}
                                  </span>
                                </button>
                                <div className="flex items-center gap-1 shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingNoteId(note.id);
                                      setEditingDraft(note.text);
                                    }}
                                    aria-label="Edit private note"
                                    title="Edit"
                                    className="w-6 h-6 rounded-md grid place-items-center text-[#a9a69e] hover:text-[#f3efe6] hover:bg-white/[0.08] cursor-pointer"
                                  >
                                    <PencilSimple size={13} />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => onDeleteNote(note.id)}
                                    aria-label="Delete private note"
                                    title="Delete"
                                    className="w-6 h-6 rounded-md grid place-items-center text-[#a9a69e] hover:text-[#ff7a8a] hover:bg-white/[0.08] cursor-pointer"
                                  >
                                    <Trash size={13} />
                                  </button>
                                </div>
                              </div>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait" initial={false} custom={slideCustom}>
            <motion.div
              key={index}
              custom={slideCustom}
              variants={cardContentVariants}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              {editorial && (
                <motion.div
                  custom={slideCustom}
                  variants={cardItemVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-2 text-[10px] text-[#a9a69e]"
                >
                  <span className="inline-flex items-center gap-1 min-w-0">
                    <Tag size={10} className="shrink-0" />
                    <span className="truncate">
                      Marker positions are illustrative, not survey-accurate
                    </span>
                  </span>
                  {editorial.sources.map((source) => (
                    <a
                      key={source.label}
                      href={source.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-[#e8b04a] hover:underline"
                    >
                      {source.label}
                      <ArrowSquareOut size={10} />
                    </a>
                  ))}
                </motion.div>
              )}

              <motion.div
                custom={slideCustom}
                variants={cardItemVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="flex items-center gap-2.5 mt-3 landscape:mt-2 [@media(max-height:700px)]:mt-2"
              >
                <motion.button
                  type="button"
                  whileTap={reducedMotion ? undefined : { scale: PRESS_SCALE }}
                  onClick={onOpenInfo}
                  aria-label="Landmark historical and architectural details"
                  className="h-9 px-3 rounded-full inline-flex items-center gap-1.5 bg-white/[0.06] border border-white/15 text-[12px] font-medium text-[#f3efe6] hover:border-[#e8b04a] hover:text-[#e8b04a] transition-colors cursor-pointer whitespace-nowrap shrink-0"
                >
                  <Info size={15} />
                  Details
                </motion.button>
                <motion.button
                  type="button"
                  whileTap={reducedMotion ? undefined : { scale: PRESS_SCALE }}
                  onClick={onPrev}
                  aria-label="Previous landmark"
                  className={smallBtn}
                >
                  <CaretLeft size={16} />
                </motion.button>
                <div className="flex-1 h-[3px] rounded-full bg-white/15 overflow-hidden">
                  <motion.div
                    className="h-full w-full origin-left bg-[#e8b04a]"
                    initial={false}
                    animate={{ scaleX: progressPct / 100 }}
                    transition={{ duration: reducedMotion ? 0 : 0.25, ease: EASE_SMOOTH_OUT }}
                  />
                </div>
                <span className="text-[11px] font-mono tabular-nums text-[#a9a69e]">
                  {index + 1}/{LANDMARKS.length}
                </span>
                <motion.button
                  type="button"
                  whileTap={reducedMotion ? undefined : { scale: PRESS_SCALE }}
                  onClick={onNext}
                  aria-label="Next landmark"
                  className={smallBtn}
                >
                  <CaretRight size={16} />
                </motion.button>
                <motion.button
                  type="button"
                  whileTap={reducedMotion ? undefined : { scale: PRESS_SCALE }}
                  onClick={onToggleCompact}
                  aria-label="Compact controls"
                  title="Compact controls"
                  className={`${smallBtn} border-[#e8b04a]/55 text-[#e8b04a]`}
                >
                  <CaretDown size={15} weight="bold" />
                </motion.button>
              </motion.div>

              {weather && (
                <AnimatePresence initial={false}>
                  {weatherInsightOpen && (
                    <motion.div
                      key="weather-insight"
                      initial={
                        reducedMotion ? false : { opacity: 0, clipPath: 'inset(0 0 100% 0)', y: -4 }
                      }
                      animate={
                        reducedMotion
                          ? { opacity: 1 }
                          : { opacity: 1, clipPath: 'inset(0 0 0% 0)', y: 0, filter: 'blur(0px)' }
                      }
                      exit={
                        reducedMotion
                          ? { opacity: 0 }
                          : {
                              opacity: 0,
                              clipPath: 'inset(0 0 100% 0)',
                              y: -4,
                              filter: 'blur(2px)',
                            }
                      }
                      transition={{ duration: reducedMotion ? 0 : 0.35, ease: EASE_SMOOTH_OUT }}
                      className="overflow-hidden"
                    >
                      <div className="mt-3 pt-3 border-t border-white/10 space-y-2">
                        <div className="flex items-center gap-2">
                          <AnimatedNumber
                            value={weather.temp}
                            suffix="°C"
                            className="text-[15px] font-semibold text-[#f3efe6]"
                            reducedMotion={reducedMotion}
                          />
                          <span className="text-[11px] text-[#e8b04a] truncate">
                            {weather.label}
                          </span>
                          <span className="ml-auto text-[10px] font-mono tabular-nums text-[#a9a69e]">
                            {weather.timeText} · {weather.city}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-1.5">
                          <div className="flex items-center justify-between px-2 py-1.5 rounded-lg bg-white/[0.03]">
                            <div className="inline-flex items-center gap-1.5">
                              <Drop size={12} className="text-[#a9a69e] shrink-0" />
                              <span className="text-[10px] text-[#a9a69e]">Humidity</span>
                            </div>
                            <span className="text-[11px] font-medium text-[#f3efe6]">
                              {humidityText!}
                            </span>
                          </div>
                          <div className="flex items-center justify-between px-2 py-1.5 rounded-lg bg-white/[0.03]">
                            <div className="inline-flex items-center gap-1.5">
                              <Gauge size={12} className="text-[#a9a69e] shrink-0" />
                              <span className="text-[10px] text-[#a9a69e]">Air quality</span>
                            </div>
                            <div className="flex items-center gap-1 text-[11px] font-medium">
                              <span
                                className="w-1.5 h-1.5 rounded-full shrink-0"
                                style={{ backgroundColor: insight!.color }}
                              />
                              <span className="text-[#f3efe6]">{insight!.band}</span>
                              <span className="ml-1 text-[10px] text-[#a9a69e]">
                                · {insight!.score}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="text-[10px] text-[#7f7d77]">
                          {weather.live
                            ? 'Live observation · Open-Meteo'
                            : 'Typical · climate model'}{' '}
                          · Air quality estimated
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              )}
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </motion.div>

      <AnimatePresence key="radial-actions">
        {radialPos && (
          <motion.div
            key="radial-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={() => setRadialPos(null)}
            className="fixed inset-0 z-40 bg-black/50"
          >
            <div className="fixed w-0 h-0" style={{ left: radialPos.x, top: radialPos.y }}>
              {radialActions.map((act, idx) => {
                const Icon = act.icon;
                return (
                  <motion.button
                    key={act.label}
                    type="button"
                    style={{ transformOrigin: 'bottom right' }}
                    initial={{ opacity: 0, scale: 0.92, x: 0, y: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.92 }}
                    transition={{ ...SPRING.pop, delay: reducedMotion ? 0 : idx * 0.03 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setRadialPos(null);
                      act.onClick();
                    }}
                    title={act.label}
                    aria-label={act.label}
                    className={`absolute left-0 top-0 w-11 h-11 rounded-full grid place-items-center bg-[#181a22] border border-[#e8b04a]/60 text-[#f3efe6] hover:bg-[#e8b04a] hover:text-[#1a1405] shadow-xl cursor-pointer ${act.posClass}`}
                  >
                    <Icon size={18} />
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </AnimatePresence>
  );
}
