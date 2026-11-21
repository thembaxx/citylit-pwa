import {
  BookmarkSimple,
  Camera,
  CaretLeft,
  CaretRight,
  Check,
  Clock,
  Crosshair,
  GlobeHemisphereEast,
  Heart,
  Images,
  Info,
  MapPin,
  NavigationArrow,
  NotePencil,
  Path,
  Pause,
  PencilSimple,
  Play,
  ShareNetwork,
  Stack,
  Trash,
  X,
} from '@phosphor-icons/react';
import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useMotionValue, type Variants } from 'motion/react';
import { LANDMARKS } from '../data/landmarks';
import { animate, DURATION, EASE_SMOOTH_OUT, PRESS_SCALE, project, SPRING } from '../lib/motion';
import { useDrag } from '../lib/useDrag';
import type { CameraPreset, HeritageRoute, LandmarkNote, NoteCategory } from '../types/citylit';

interface SlideCustom {
  dir: number;
  reduced: boolean;
}

const headerSlideVariants: Variants = {
  initial: ({ dir, reduced }: SlideCustom) =>
    reduced ? { opacity: 1, x: 0, y: 0 } : { opacity: 0, x: dir * 20, y: 4 },
  animate: ({ reduced }: SlideCustom) => ({
    opacity: 1,
    x: 0,
    y: 0,
    transition: reduced
      ? { duration: 0 }
      : {
          x: { ...SPRING.surface },
          y: { ...SPRING.surface },
          opacity: { duration: DURATION.medium, ease: EASE_SMOOTH_OUT },
        },
  }),
  exit: ({ dir, reduced }: SlideCustom) =>
    reduced
      ? { opacity: 0, transition: { duration: 0 } }
      : {
          opacity: 0,
          x: -dir * 14,
          y: -2,
          transition: { duration: DURATION.quick, ease: EASE_SMOOTH_OUT },
        },
};

const bodySlideVariants: Variants = {
  initial: ({ dir, reduced }: SlideCustom) =>
    reduced ? { opacity: 1, x: 0, y: 0 } : { opacity: 0, x: dir * 18, y: 4 },
  animate: ({ reduced }: SlideCustom) => ({
    opacity: 1,
    x: 0,
    y: 0,
    transition: reduced
      ? { duration: 0 }
      : {
          x: { ...SPRING.surface, delay: 0.03 },
          y: { ...SPRING.surface, delay: 0.03 },
          opacity: { duration: DURATION.medium, ease: EASE_SMOOTH_OUT, delay: 0.03 },
        },
  }),
  exit: ({ dir, reduced }: SlideCustom) =>
    reduced
      ? { opacity: 0, transition: { duration: 0 } }
      : {
          opacity: 0,
          x: -dir * 12,
          y: -2,
          transition: { duration: DURATION.quick, ease: EASE_SMOOTH_OUT },
        },
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

const CAMERA_PRESETS: ReadonlyArray<{ id: CameraPreset; label: string }> = [
  { id: 'default', label: 'Default' },
  { id: 'aerial', label: 'Aerial' },
  { id: 'low', label: 'Low' },
  { id: 'detail', label: 'Macro' },
];

interface LandmarkCardProps {
  index: number;
  isFavorite: boolean;
  tourActive: boolean;
  directionActive: boolean;
  cutawayActive?: boolean;
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
  onToggleTour: () => void;
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

export function LandmarkCard({
  index,
  isFavorite,
  tourActive,
  directionActive,
  cutawayActive = false,
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
  onToggleTour,
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
}: LandmarkCardProps) {
  const [radialPos, setRadialPos] = useState<{ x: number; y: number } | null>(null);
  const [notesOpen, setNotesOpen] = useState(false);
  const [draftNote, setDraftNote] = useState('');
  const [noteCategory, setNoteCategory] = useState<NoteCategory>('memory');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingDraft, setEditingDraft] = useState('');
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
  const noteInputRef = useRef<HTMLTextAreaElement>(null);
  const holdTimer = useRef<number | null>(null);
  const dragX = useMotionValue(0);
  const dragOrigin = useRef(0);

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

  // Drag the title strip to change landmark; velocity decides a flick.
  const headerDrag = useDrag({
    lockAxis: 'x',
    onStart: () => {
      dragX.stop();
      dragOrigin.current = dragX.get();
    },
    onMove: (delta) => {
      const nextX = dragOrigin.current + delta.x * 0.7;
      dragX.set(nextX);
      onDragParallax?.(nextX);
    },
    onEnd: (velocity) => {
      const landing = dragX.get() + project(velocity.x * 0.5);
      animate(dragX, 0, { ...SPRING.surface, velocity: velocity.x });
      onDragParallax?.(0);
      if (landing < -64) onNext();
      else if (landing > 64) onPrev();
    },
  });

  if (!visible) return null;

  const lm = LANDMARKS[index];
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
    'w-9 h-9 rounded-full grid place-items-center bg-white/[0.06] border border-white/15 text-[#f3efe6] hover:border-[#e8b04a] hover:text-[#e8b04a] transition-colors cursor-pointer';

  const submitDraftNote = () => {
    const clean = draftNote.trim();
    if (!clean) return;
    onAddNote(clean, noteCategory, pendingDropPos ?? undefined);
    setDraftNote('');
    onClearPendingDrop?.();
  };

  return (
    <>
      <div
        ref={cardWrapRef}
        className="fixed left-0 bottom-0 z-10 w-full max-w-[560px] landscape:max-w-[380px] md:max-w-[490px] md:landscape:max-w-[490px] lg:max-w-[560px] lg:landscape:max-w-[560px] px-3.5 pb-[calc(14px+env(safe-area-inset-bottom,0px))] pointer-events-none"
      >
        <motion.div
          initial={reducedMotion ? false : { opacity: 0, y: 12, scale: 0.985 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={
            reducedMotion ? { duration: 0 } : { duration: DURATION.slow, ease: EASE_SMOOTH_OUT }
          }
          onContextMenu={(e) => {
            e.preventDefault();
            openRadial(e.clientX, e.clientY);
          }}
          className="relative bg-[#121319]/92 border border-white/15 squircle-card px-4 py-[18px] landscape:px-3.5 landscape:py-3.5 md:landscape:px-4 md:landscape:py-[18px] [@media(max-height:700px)]:px-3.5 [@media(max-height:700px)]:py-3.5 pointer-events-auto shadow-2xl max-h-[calc(100dvh-104px)] overflow-y-auto overscroll-contain no-scrollbar"
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
            <motion.div
              {...headerDrag}
              style={{ x: dragX }}
              className="min-w-0 flex-1 overflow-hidden cursor-grab touch-none active:cursor-grabbing"
              onTouchStart={(e) => {
                clearHold();
                const t = e.touches[0];
                holdTimer.current = window.setTimeout(() => openRadial(t.clientX, t.clientY), 450);
              }}
              onTouchEnd={clearHold}
              onTouchMove={() => clearHold()}
            >
              <AnimatePresence mode="wait" initial={false} custom={slideCustom}>
                <motion.div
                  key={index}
                  custom={slideCustom}
                  variants={headerSlideVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
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
              </AnimatePresence>
            </motion.div>
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

          <div className="overflow-hidden">
            <AnimatePresence mode="wait" initial={false} custom={slideCustom}>
              <motion.p
                key={index}
                custom={slideCustom}
                variants={bodySlideVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="text-[13.5px] landscape:text-[12.5px] leading-relaxed text-[#a9a69e] m-0 landscape:line-clamp-2 [@media(max-height:700px)]:line-clamp-2"
              >
                {lm.f}
              </motion.p>
            </AnimatePresence>
          </div>

          <div className="mt-2.5 flex flex-wrap items-center gap-2">
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
              <NotePencil size={13} weight={notesOpen || notes.length > 0 ? 'fill' : 'regular'} />
              {notes.length > 0 ? `Add Note (${notes.length})` : 'Add Note'}
            </motion.button>
            {onToggleCutaway && (
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
            <span className="text-[11px] text-[#a9a69e] truncate">
              {directionActive
                ? `${cardinal} · ${km.toLocaleString()} km → ${nextLm.k}`
                : `Next: ${nextLm.k}`}
            </span>
          </div>

          {(onApplyCameraPreset || onStepPin) && (
            <div className="mt-2 flex flex-wrap items-center justify-between gap-1.5">
              {onApplyCameraPreset && (
                <div
                  className="inline-flex items-center gap-1"
                  role="group"
                  aria-label="3D camera views"
                >
                  {CAMERA_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => onApplyCameraPreset(preset.id)}
                      className="h-6 px-2 rounded-full bg-white/[0.04] border border-white/10 text-[10.5px] text-[#c8c4bc] hover:border-[#e8b04a]/65 hover:text-[#e8b04a] transition-colors cursor-pointer"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
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
            </div>
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
                <div className="mt-2.5 pt-2.5 border-t border-white/12 space-y-2">
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

          <div className="flex items-center gap-2.5 mt-3 landscape:mt-2 [@media(max-height:700px)]:mt-2">
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
              onClick={onToggleTour}
              aria-label={tourActive ? 'Pause auto tour' : 'Start auto tour'}
              title={tourActive ? 'Pause tour' : 'Auto tour'}
              className={`${smallBtn} ${tourActive ? 'border-[#e8b04a] text-[#e8b04a]' : ''}`}
            >
              {tourActive ? <Pause size={15} weight="fill" /> : <Play size={15} weight="fill" />}
            </motion.button>
          </div>
        </motion.div>
      </div>

      <AnimatePresence>
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
    </>
  );
}
