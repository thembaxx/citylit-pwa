import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useMotionValue, useReducedMotion, useSpring } from 'motion/react';
import { ambientAudio } from '../audio/ambientAudio';
import { DURATION, EASE_SMOOTH_OUT, PRESS_SCALE, SPRING, useSpringFor } from '../lib/motion';
import type { CitylitEngine } from '../three/CitylitEngine';
import type { CompassState } from '../types/citylit';

interface CompassProps {
  /** Resolve the engine each frame; polled until it exists. */
  getEngine: () => CitylitEngine | null;
  /** Active landmark index; triggers a subtle one-shot pulse on switch. */
  landmarkIndex?: number;
  /** Optional callback fired when the user clicks the compass to reset camera orientation. */
  onResetCamera?: () => void;
  /** Whether compass HUD is visible (hidden during idle fullscreen). */
  visible?: boolean;
  /** Highlights next-landmark bearing pip on the rotating compass ring. */
  directionActive?: boolean;
  /** App-level motion preference (combined with the OS preference). */
  reducedMotion?: boolean;
}

/** Dial centre in SVG units (60x60 viewBox). */
const C = 30;

const CARDINALS_8 = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'] as const;
const CARDINAL_TARGETS: ReadonlyArray<{ label: 'N' | 'E' | 'S' | 'W'; deg: number }> = [
  { label: 'N', deg: 0 },
  { label: 'E', deg: 90 },
  { label: 'S', deg: 180 },
  { label: 'W', deg: 270 },
];

/** 36 engraved ticks around the bezel (every 10°). */
const TICKS = Array.from({ length: 36 }, (_, i) => {
  const deg = i * 10;
  const angle = ((deg - 90) * Math.PI) / 180;
  const cardinal = deg % 90 === 0;
  const intercardinal = !cardinal && deg % 45 === 0;
  const inner = cardinal ? 21.5 : intercardinal ? 22.8 : 24.2;
  return {
    x1: C + Math.cos(angle) * inner,
    y1: C + Math.sin(angle) * inner,
    x2: C + Math.cos(angle) * 26.2,
    y2: C + Math.sin(angle) * 26.2,
    cardinal,
    intercardinal,
  };
});

function formatBearing(deg: number): { padded: string; cardinal: string } {
  const norm = ((Math.round(deg) % 360) + 360) % 360;
  const padded = String(norm).padStart(3, '0');
  const cardinal = CARDINALS_8[Math.round(norm / 45) % 8];
  return { padded, cardinal };
}

/**
 * Interactive architectural compass on the left edge.
 * - Live needle & rose spring smoothly toward True North (-Z in diorama/places, +Y pole in globe).
 * - Clicking the compass resets the 3D scene camera back to its default landmark orientation.
 * - Dragging the dial smoothly orbits the 3D scene camera around its active landmark.
 * - Emits a brief one-shot pulse ring whenever a new landmark is loaded.
 * - Hovering or focusing reveals numeric degree telemetry and cardinal/reset triggers.
 */
export function Compass({
  getEngine,
  landmarkIndex = 0,
  onResetCamera,
  visible = true,
  directionActive = false,
  reducedMotion = false,
}: CompassProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const dialRef = useRef<HTMLDivElement>(null);
  const needleRef = useRef<SVGGElement>(null);
  const nextBearingRef = useRef<SVGGElement>(null);
  const hoverMarkerRef = useRef<SVGGElement>(null);
  const faceHintRef = useRef<HTMLSpanElement>(null);
  const hoverBearingRef = useRef<number | null>(null);
  const osReduce = useReducedMotion();
  const reduce = reducedMotion || Boolean(osReduce);

  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [pulseState, setPulseState] = useState({ lastIdx: landmarkIndex, seq: 0 });
  if (landmarkIndex !== pulseState.lastIdx) {
    setPulseState({ lastIdx: landmarkIndex, seq: pulseState.seq + 1 });
  }
  const [resetPulseSeq, setResetPulseSeq] = useState(0);
  // Live bearing/tilt are written straight to the DOM. Going through React
  // state here re-rendered the whole compass ~20x/second while the readout was
  // animating in on hover, which is what made the pointer-over motion stutter.
  const [mode, setMode] = useState<CompassState['mode']>('diorama');
  const [activeCardinal, setActiveCardinal] = useState<'N' | 'E' | 'S' | 'W' | null>(null);
  const bearingTextRef = useRef<HTMLSpanElement>(null);
  const cardinalTextRef = useRef<HTMLSpanElement>(null);
  const tiltTextRef = useRef<HTMLSpanElement>(null);
  const lastReadoutRef = useRef({ bearing: -1, tilt: Number.NaN, mode: '', active: '' });

  const showReadout = hovered || focused || dragging;
  // One 100ms press cue for every compass control; dropped entirely on reduced motion.
  const tapFeedback = reduce
    ? {}
    : {
        whileTap: {
          scale: PRESS_SCALE,
          transition: { duration: 0.1, ease: EASE_SMOOTH_OUT },
        },
      };
  const showReadoutRef = useRef(showReadout);
  useEffect(() => {
    showReadoutRef.current = showReadout;
    if (showReadout) {
      // The readout's DOM nodes are new on every mount; force a fresh write.
      lastReadoutRef.current.bearing = -1;
      lastReadoutRef.current.tilt = Number.NaN;
      lastReadoutRef.current.mode = '';
      lastReadoutRef.current.active = '';
    }
  }, [showReadout]);

  const dragSession = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    lastX: number;
    lastAngle: number | null;
    moved: boolean;
  } | null>(null);

  const heading = useMotionValue(0);
  const angle = useSpring(heading, useSpringFor(reduce, SPRING.snappy));
  const latestNextOffsetRef = useRef<number | null>(null);
  const didInitNeedleRef = useRef(false);

  useEffect(() => {
    return angle.on('change', (deg) => {
      const dial = needleRef.current;
      if (dial) {
        const wanted = `rotate(${deg.toFixed(1)} ${C} ${C})`;
        if (dial.getAttribute('transform') !== wanted) dial.setAttribute('transform', wanted);
      }
      const pip = nextBearingRef.current;
      const nextRel = latestNextOffsetRef.current;
      if (pip && nextRel !== null) {
        const pipRot = deg + nextRel;
        const wanted = `rotate(${pipRot.toFixed(1)} ${C} ${C})`;
        if (pip.getAttribute('transform') !== wanted) pip.setAttribute('transform', wanted);
      }
    });
  }, [angle]);

  useEffect(() => {
    if (!visible) return undefined;
    let raf = 0;
    let lastTelemetryPush = 0;

    const loop = (now: number) => {
      const e = getEngine();
      if (e) {
        const state = e.getCompassState();
        latestNextOffsetRef.current = state.nextBearingDeg;

        const current = heading.get();
        const target = state.needleDeg + Math.round((current - state.needleDeg) / 360) * 360;
        if (!didInitNeedleRef.current) {
          // Land on the real bearing immediately; otherwise a 0° default would
          // spring the needle through a whole turn on first paint.
          didInitNeedleRef.current = true;
          heading.jump(target);
          angle.jump(target);
          needleRef.current?.setAttribute(
            'transform',
            `rotate(${target.toFixed(1)} ${C} ${C})`
          );
        } else {
          heading.set(target);
        }

        const pip = nextBearingRef.current;
        if (pip && state.nextBearingDeg !== null) {
          const pipRot = angle.get() + state.nextBearingDeg;
          const wanted = `rotate(${pipRot.toFixed(1)} ${C} ${C})`;
          if (pip.getAttribute('transform') !== wanted) pip.setAttribute('transform', wanted);
        }

        if (showReadoutRef.current && now - lastTelemetryPush >= 48) {
          lastTelemetryPush = now;
          const roundedBearing = ((Math.round(state.bearingDeg) % 360) + 360) % 360;
          const last = lastReadoutRef.current;

          if (last.bearing !== roundedBearing) {
            last.bearing = roundedBearing;
            const { padded, cardinal } = formatBearing(roundedBearing);
            if (bearingTextRef.current) bearingTextRef.current.textContent = `${padded}°`;
            if (cardinalTextRef.current) cardinalTextRef.current.textContent = cardinal;
            dialRef.current?.setAttribute(
              'aria-label',
              `Reset camera to default landmark orientation. Current heading ${padded}° ${cardinal}. Drag bezel or use Left/Right arrows to orbit.`
            );
          }

          if (last.tilt !== state.tiltDeg || last.mode !== state.mode) {
            last.tilt = state.tiltDeg;
            last.mode = state.mode;
            if (tiltTextRef.current) {
              tiltTextRef.current.textContent =
                state.mode === 'globe' ? 'POLE' : `${state.tiltDeg}° TILT`;
            }
            // Mode only changes between diorama/globe: a rare, cheap re-render.
            setMode(state.mode);
          }

          const nextActive =
            state.mode === 'globe'
              ? null
              : (CARDINAL_TARGETS.find(
                  (c) => Math.abs(((roundedBearing - c.deg + 540) % 360) - 180) < 12
                )?.label ?? null);
          const nextActiveKey = nextActive ?? '';
          if (last.active !== nextActiveKey) {
            last.active = nextActiveKey;
            setActiveCardinal(nextActive);
          }
        }
      }
      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [visible, getEngine, heading, angle]);

  const snapToHeading = useCallback(
    (deg: number) => {
      const e = getEngine();
      if (!e) return;
      ambientAudio.playUi('tap', { intensity: 0.7 });
      ambientAudio.vibrate(8);
      e.snapCompassHeading(deg);
    },
    [getEngine]
  );

  const resetCameraOrientation = useCallback(() => {
    const e = getEngine();
    if (!e) return;
    ambientAudio.playUi('tap', { intensity: 0.78 });
    ambientAudio.vibrate(10);
    e.resetToDefaultOrientation();
    setResetPulseSeq((s) => s + 1);
    onResetCamera?.();
  }, [getEngine, onResetCamera]);

  /** Screen angle around the dial -> compass bearing (0° = north/up). */
  const bearingFromPointer = (
    e: React.PointerEvent<HTMLDivElement>
  ): { bearing: number; radial: number } | null => {
    const el = dialRef.current;
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    const rx = e.clientX - (rect.left + rect.width * 0.5);
    const ry = e.clientY - (rect.top + rect.height * 0.5);
    const deg = (Math.atan2(ry, rx) * 180) / Math.PI + 90;
    return {
      bearing: ((((deg % 360) + 360) % 360) * 10) / 10,
      radial: Math.hypot(rx, ry),
    };
  };

  /** Show the bearing currently under the pointer, written straight to the SVG. */
  const updateHoverMarker = (bearing: number | null) => {
    if (hoverBearingRef.current !== bearing) hoverBearingRef.current = bearing;
    const marker = hoverMarkerRef.current;
    if (marker) {
      if (bearing === null) {
        marker.style.opacity = '0';
      } else {
        marker.setAttribute('transform', `rotate(${bearing.toFixed(1)} ${C} ${C})`);
        marker.style.opacity = '1';
      }
    }
    const hint = faceHintRef.current;
    if (hint) {
      if (bearing === null) {
        hint.textContent = '';
        hint.classList.add('hidden');
      } else {
        const { padded, cardinal } = formatBearing(bearing);
        hint.textContent = `Face ${padded}° ${cardinal}`;
        hint.classList.remove('hidden');
      }
    }
  };

  // Wheel over the dial steps the camera heading in 10° increments. Attached
  // natively so preventDefault actually stops the page scrolling underneath.
  useEffect(() => {
    const el = rootRef.current;
    if (!el || !visible) return undefined;
    const onWheel = (e: WheelEvent) => {
      const engine = getEngine();
      const dir = Math.sign(e.deltaY);
      if (!engine || !dir) return;
      e.preventDefault();
      ambientAudio.playUi('tick');
      engine.rotateCameraAzimuth((dir * Math.PI) / 18);
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [getEngine, visible]);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = dialRef.current;
    if (!el) return;
    el.setPointerCapture(e.pointerId);
    const rect = el.getBoundingClientRect();
    const rx = e.clientX - (rect.left + rect.width * 0.5);
    const ry = e.clientY - (rect.top + rect.height * 0.5);
    const radial = Math.hypot(rx, ry);
    dragSession.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      lastX: e.clientX,
      lastAngle: radial > 10 ? Math.atan2(ry, rx) : null,
      moved: false,
    };
    setDragging(true);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const sess = dragSession.current;
    const el = dialRef.current;
    if (!el) return;
    if (!sess) {
      // Hover: preview the bearing under the pointer on the bezel.
      const info = bearingFromPointer(e);
      if (info) updateHoverMarker(info.radial > 11 ? info.bearing : null);
      return;
    }
    if (sess.pointerId !== e.pointerId) return;

    const totalMoved = Math.hypot(e.clientX - sess.startX, e.clientY - sess.startY);
    if (totalMoved >= 4) sess.moved = true;
    if (!sess.moved) return;

    const engine = getEngine();
    if (!engine) return;

    const rect = el.getBoundingClientRect();
    const rx = e.clientX - (rect.left + rect.width * 0.5);
    const ry = e.clientY - (rect.top + rect.height * 0.5);
    const radial = Math.hypot(rx, ry);

    let deltaRad = 0;
    if (radial > 11 && sess.lastAngle !== null) {
      const nextAngle = Math.atan2(ry, rx);
      const angularDelta = Math.atan2(
        Math.sin(nextAngle - sess.lastAngle),
        Math.cos(nextAngle - sess.lastAngle)
      );
      sess.lastAngle = nextAngle;
      deltaRad = angularDelta * 1.15;
    } else {
      const dx = e.clientX - sess.lastX;
      deltaRad = dx * 0.015;
      sess.lastAngle = radial > 11 ? Math.atan2(ry, rx) : null;
    }
    sess.lastX = e.clientX;

    if (Math.abs(deltaRad) > 1e-4) {
      engine.rotateCameraAzimuth(deltaRad);
    }
  };

  const finishDrag = (e: React.PointerEvent<HTMLDivElement>, cancelled = false) => {
    const sess = dragSession.current;
    const el = dialRef.current;
    if (!sess || sess.pointerId !== e.pointerId) return;
    if (el && el.hasPointerCapture(e.pointerId)) {
      el.releasePointerCapture(e.pointerId);
    }
    dragSession.current = null;
    setDragging(false);

    if (cancelled || sess.moved) return;

    // Clicking the bezel now faces that exact bearing; only a click on the
    // centre boss resets the camera to its default landmark orientation.
    const info = bearingFromPointer(e);
    if (info && info.radial > 11) {
      snapToHeading(info.bearing);
      updateHoverMarker(info.bearing);
    } else {
      resetCameraOrientation();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const engine = getEngine();
    if (!engine) return;
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      ambientAudio.playUi('tick');
      engine.rotateCameraAzimuth(-Math.PI / 12);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      ambientAudio.playUi('tick');
      engine.rotateCameraAzimuth(Math.PI / 12);
    } else if (e.key === 'Enter' || e.key === ' ' || e.key.toLowerCase() === 'r') {
      e.preventDefault();
      resetCameraOrientation();
    } else if (e.key.toLowerCase() === 'n') {
      e.preventDefault();
      snapToHeading(0);
    }
  };

  if (!visible) return null;

  return (
    <div
      ref={rootRef}
      className={`compass${reduce ? ' compass--reduced' : ''}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => {
        setHovered(false);
        updateHoverMarker(null);
      }}
    >
      <div className="relative flex items-center justify-center">
        {!reduce && pulseState.seq > 0 && (
          <motion.span
            key={`lm-pulse-${pulseState.seq}`}
            aria-hidden="true"
            initial={{ scale: 0.92, opacity: 0.72 }}
            animate={{ scale: 1.45, opacity: 0 }}
            transition={{ duration: 0.45, ease: EASE_SMOOTH_OUT }}
            className="pointer-events-none absolute inset-0 rounded-full border border-[#e8b04a]/80"
          />
        )}
        {!reduce && resetPulseSeq > 0 && (
          <motion.span
            key={`reset-pulse-${resetPulseSeq}`}
            aria-hidden="true"
            initial={{ scale: 0.94, opacity: 0.6 }}
            animate={{ scale: 1.32, opacity: 0 }}
            transition={{ duration: 0.32, ease: EASE_SMOOTH_OUT }}
            className="pointer-events-none absolute inset-0 rounded-full border border-white/70"
          />
        )}
        <motion.div
          ref={dialRef}
          key={`dial-settle-${pulseState.seq}`}
          {...tapFeedback}
          animate={reduce || pulseState.seq === 0 ? undefined : { scale: [1, 1.06, 1] }}
          transition={{ duration: 0.32, ease: EASE_SMOOTH_OUT }}
          className="compass__dial focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e8b04a]"
          role="button"
          tabIndex={0}
          aria-label="Reset camera to default landmark orientation. Current heading 000° N. Drag bezel or use Left/Right arrows to orbit."
          data-dragging={dragging ? 'true' : undefined}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={(e) => finishDrag(e, false)}
          onPointerCancel={(e) => finishDrag(e, true)}
          onFocus={() => setFocused(true)}
          onBlur={(e) => {
            if (
              !e.currentTarget.parentElement?.parentElement?.contains(
                e.relatedTarget as Node | null
              )
            ) {
              setFocused(false);
            }
          }}
          onKeyDown={handleKeyDown}
          title="Click a bearing to face it · centre click or R resets · drag to orbit · scroll to step"
        >
          <svg width="60" height="60" viewBox="0 0 60 60" fill="none" aria-hidden="true">
            {/* Outer brass hairline and inner track */}
            <circle cx={C} cy={C} r="27" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
            <circle
              cx={C}
              cy={C}
              r="20.5"
              stroke="rgba(255,255,255,0.08)"
              strokeWidth="0.9"
              strokeDasharray="2 2.4"
            />
            <circle cx={C} cy={C} r="13" stroke="rgba(232,176,74,0.14)" strokeWidth="0.8" />

            {/* Engraved degree ticks */}
            {TICKS.map((t, i) => (
              <line
                key={i}
                x1={t.x1}
                y1={t.y1}
                x2={t.x2}
                y2={t.y2}
                stroke={
                  t.cardinal
                    ? 'rgba(232,176,74,0.85)'
                    : t.intercardinal
                      ? 'rgba(255,255,255,0.34)'
                      : 'rgba(255,255,255,0.14)'
                }
                strokeWidth={t.cardinal ? 1.5 : t.intercardinal ? 1.0 : 0.7}
                strokeLinecap="round"
              />
            ))}

            {/* Fixed cardinal ring letters */}
            <text
              x={C}
              y="14"
              textAnchor="middle"
              dominantBaseline="central"
              fontSize="8"
              fontWeight="700"
              fill="#e8b04a"
            >
              N
            </text>
            <text
              x="46"
              y={C}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize="7"
              fontWeight="600"
              fill="rgba(255,255,255,0.58)"
            >
              E
            </text>
            <text
              x={C}
              y="46"
              textAnchor="middle"
              dominantBaseline="central"
              fontSize="7"
              fontWeight="600"
              fill="rgba(255,255,255,0.58)"
            >
              S
            </text>
            <text
              x="14"
              y={C}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize="7"
              fontWeight="600"
              fill="rgba(255,255,255,0.58)"
            >
              W
            </text>

            {/* Bearing under the pointer: gold pip + needle spark, click to face it */}
            <g
              ref={hoverMarkerRef}
              style={{ opacity: 0, transition: 'opacity 120ms ease' }}
              transform={`rotate(0 ${C} ${C})`}
              aria-hidden="true"
            >
              <line
                x1={C}
                y1={C - 26}
                x2={C}
                y2={C - 15}
                stroke="#ffd784"
                strokeWidth="1.3"
                strokeLinecap="round"
              />
              <polygon points={`${C},4.4 ${C - 2.2},8.4 ${C + 2.2},8.4`} fill="#ffd784" />
              <circle cx={C} cy={C - 20.5} r="1.05" fill="#ffd784" />
            </g>

            {/* Next-landmark bearing marker on outer ring when Show Direction is active */}
            <g
              ref={nextBearingRef}
              style={{ opacity: directionActive && mode === 'diorama' ? 1 : 0 }}
              transform={`rotate(0 ${C} ${C})`}
            >
              <polygon points={`${C},3.5 ${C - 2.6},7.5 ${C + 2.6},7.5`} fill="#5cd6a9" />
            </g>

            {/* Rotating two-tone compass needle pointing to True North */}
            <g ref={needleRef} transform={`rotate(0 ${C} ${C})`}>
              <line
                x1={C}
                y1="15.5"
                x2={C}
                y2="44.5"
                stroke="rgba(255,255,255,0.12)"
                strokeWidth="0.8"
              />
              <polygon points={`${C},15 26.8,${C} ${C},${C - 1.2}`} fill="#f6c768" />
              <polygon points={`${C},15 ${C},${C - 1.2} 33.2,${C}`} fill="#d8962c" />
              <polygon points={`${C},45 26.8,${C} 33.2,${C}`} fill="#798399" />
              <circle cx={C} cy={C} r="2.8" fill="#121319" stroke="#e8b04a" strokeWidth="1.1" />
              <circle cx={C} cy={C} r="1" fill="#f6efe6" />
            </g>
          </svg>
        </motion.div>
      </div>

      {/* Expandable numeric bearing & quick cardinal / reset readout on hover/drag/focus */}
      <AnimatePresence>
        {showReadout && (
          <motion.div
            initial={reduce ? { opacity: 0 } : { opacity: 0, x: -6, scale: 0.96 }}
            animate={reduce ? { opacity: 1 } : { opacity: 1, x: 0, scale: 1 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, x: -6, scale: 0.96 }}
            transition={{ duration: DURATION.quick, ease: EASE_SMOOTH_OUT }}
            style={{ transformOrigin: 'top left' }}
            className="bg-[#121319]/95 border border-white/15 rounded-xl px-2.5 py-2 shadow-xl flex flex-col gap-1.5 min-w-[122px]"
          >
            <div className="flex items-baseline justify-between gap-2">
              <span className="font-mono tabular-nums text-[12.5px] font-semibold text-[#f3efe6]">
                <span ref={bearingTextRef}>000°</span>{' '}
                <span className="text-[#e8b04a]" ref={cardinalTextRef}>
                  N
                </span>
              </span>
              <span
                ref={tiltTextRef}
                className="font-mono tabular-nums text-[10px] text-[#a9a69e]"
              >
                22° TILT
              </span>
            </div>
            <span
              ref={faceHintRef}
              className="hidden font-mono text-[10px] tracking-wide text-[#e8b04a]"
            />

            {mode !== 'globe' ? (
              <div className="space-y-1">
                <div
                  className="grid grid-cols-4 gap-1"
                  role="group"
                  aria-label="Snap camera heading"
                >
                  {CARDINAL_TARGETS.map((c) => {
                    const active = activeCardinal === c.label;
                    return (
                      <motion.button
                        key={c.label}
                        type="button"
                        {...tapFeedback}
                        onClick={(ev) => {
                          ev.stopPropagation();
                          snapToHeading(c.deg);
                        }}
                        className={`h-6 rounded-md text-[10.5px] font-mono font-semibold border transition-colors cursor-pointer ${
                          active
                            ? 'bg-[#e8b04a]/20 border-[#e8b04a]/75 text-[#e8b04a]'
                            : 'bg-white/[0.04] border-white/12 text-[#d6d1c6] hover:border-[#e8b04a]/60 hover:text-[#e8b04a]'
                        }`}
                      >
                        {c.label}
                      </motion.button>
                    );
                  })}
                </div>
                <motion.button
                  type="button"
                  {...tapFeedback}
                  onClick={(ev) => {
                    ev.stopPropagation();
                    resetCameraOrientation();
                  }}
                  className="w-full h-6 rounded-md text-[10.5px] font-medium bg-[#e8b04a]/12 border border-[#e8b04a]/45 text-[#e8b04a] hover:bg-[#e8b04a]/22 transition-colors cursor-pointer"
                >
                  Reset Camera
                </motion.button>
              </div>
            ) : (
              <motion.button
                type="button"
                {...tapFeedback}
                onClick={(ev) => {
                  ev.stopPropagation();
                  resetCameraOrientation();
                }}
                className="h-6 px-2 rounded-md text-[10.5px] font-medium bg-white/[0.05] border border-white/12 text-[#f3efe6] hover:border-[#e8b04a]/70 hover:text-[#e8b04a] transition-colors cursor-pointer"
              >
                Reset Globe View
              </motion.button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
