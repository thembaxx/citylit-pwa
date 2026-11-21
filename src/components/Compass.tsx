import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useMotionValue, useReducedMotion, useSpring } from 'motion/react';
import { ambientAudio } from '../audio/ambientAudio';
import { DURATION, EASE_SMOOTH_OUT, SPRING, useSpringFor } from '../lib/motion';
import type { CitylitEngine } from '../three/CitylitEngine';
import type { CompassState } from '../types/citylit';

interface CompassProps {
  /** Resolve the engine each frame; polled until it exists. */
  getEngine: () => CitylitEngine | null;
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
 * - Dragging the dial smoothly orbits the 3D scene camera around its active landmark.
 * - Tapping any cardinal sector (N/E/S/W) or the center hub aligns camera azimuth smoothly.
 * - Hovering or focusing reveals numeric degree telemetry and quick cardinal align triggers.
 */
export function Compass({
  getEngine,
  visible = true,
  directionActive = false,
  reducedMotion = false,
}: CompassProps) {
  const dialRef = useRef<HTMLDivElement>(null);
  const needleRef = useRef<SVGGElement>(null);
  const nextBearingRef = useRef<SVGGElement>(null);
  const osReduce = useReducedMotion();
  const reduce = reducedMotion || Boolean(osReduce);

  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [pinnedOpen, setPinnedOpen] = useState(false);
  const [telemetry, setTelemetry] = useState<{
    bearing: number;
    tilt: number;
    mode: CompassState['mode'];
    nextBearing: number | null;
  }>({
    bearing: 0,
    tilt: 22,
    mode: 'diorama',
    nextBearing: null,
  });

  const showReadout = hovered || focused || dragging || pinnedOpen;
  const showReadoutRef = useRef(showReadout);
  useEffect(() => {
    showReadoutRef.current = showReadout;
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
        heading.set(target);

        const pip = nextBearingRef.current;
        if (pip && state.nextBearingDeg !== null) {
          const pipRot = angle.get() + state.nextBearingDeg;
          const wanted = `rotate(${pipRot.toFixed(1)} ${C} ${C})`;
          if (pip.getAttribute('transform') !== wanted) pip.setAttribute('transform', wanted);
        }

        if (showReadoutRef.current && now - lastTelemetryPush >= 48) {
          lastTelemetryPush = now;
          const roundedBearing = ((Math.round(state.bearingDeg) % 360) + 360) % 360;
          setTelemetry((prev) => {
            if (
              prev.bearing === roundedBearing &&
              prev.tilt === state.tiltDeg &&
              prev.mode === state.mode &&
              prev.nextBearing === state.nextBearingDeg
            ) {
              return prev;
            }
            return {
              bearing: roundedBearing,
              tilt: state.tiltDeg,
              mode: state.mode,
              nextBearing: state.nextBearingDeg,
            };
          });
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
    if (!sess || sess.pointerId !== e.pointerId || !el) return;

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

    if (cancelled || sess.moved || !el) return;

    // Interpret a clean tap on the dial: center snaps North, outer ring snaps N/E/S/W!
    const rect = el.getBoundingClientRect();
    const rx = e.clientX - (rect.left + rect.width * 0.5);
    const ry = e.clientY - (rect.top + rect.height * 0.5);
    const radial = Math.hypot(rx, ry);
    if (radial <= 11) {
      if (telemetry.mode === 'globe') {
        snapToHeading(0);
      } else {
        setPinnedOpen((v) => !v);
        snapToHeading(0);
      }
      return;
    }

    if (Math.abs(rx) > Math.abs(ry)) {
      snapToHeading(rx > 0 ? 90 : 270);
    } else {
      snapToHeading(ry > 0 ? 180 : 0);
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
    } else if (e.key === 'Enter' || e.key === ' ' || e.key.toLowerCase() === 'n') {
      e.preventDefault();
      snapToHeading(0);
    } else if (e.key === 'Escape' && pinnedOpen) {
      e.preventDefault();
      setPinnedOpen(false);
    }
  };

  if (!visible) return null;

  const { padded, cardinal } = formatBearing(telemetry.bearing);

  return (
    <div
      className={`compass${reduce ? ' compass--reduced' : ''}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div
        ref={dialRef}
        className="compass__dial focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e8b04a]"
        role="slider"
        tabIndex={0}
        aria-label={`Compass heading ${padded}° ${cardinal}. Drag bezel or use Left/Right arrows to orbit, Enter or click N to align North.`}
        aria-valuemin={0}
        aria-valuemax={359}
        aria-valuenow={telemetry.bearing}
        aria-valuetext={`${padded}° ${cardinal}`}
        data-dragging={dragging ? 'true' : undefined}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={(e) => finishDrag(e, false)}
        onPointerCancel={(e) => finishDrag(e, true)}
        onFocus={() => setFocused(true)}
        onBlur={(e) => {
          if (!e.currentTarget.parentElement?.contains(e.relatedTarget as Node | null)) {
            setFocused(false);
          }
        }}
        onKeyDown={handleKeyDown}
        title="Drag to orbit · Tap N / E / S / W to align"
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

          {/* Next-landmark bearing marker on outer ring when Show Direction is active */}
          <g
            ref={nextBearingRef}
            style={{ opacity: directionActive && telemetry.mode === 'diorama' ? 1 : 0 }}
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
      </div>

      {/* Expandable numeric bearing & quick cardinal snap readout on hover/drag/focus */}
      <AnimatePresence>
        {showReadout && (
          <motion.div
            initial={reduce ? { opacity: 0 } : { opacity: 0, x: -6, scale: 0.96 }}
            animate={reduce ? { opacity: 1 } : { opacity: 1, x: 0, scale: 1 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, x: -6, scale: 0.96 }}
            transition={{ duration: DURATION.quick, ease: EASE_SMOOTH_OUT }}
            className="bg-[#121319]/95 border border-white/15 rounded-xl px-2.5 py-2 shadow-xl flex flex-col gap-1.5 min-w-[116px]"
          >
            <div className="flex items-baseline justify-between gap-2">
              <span className="font-mono tabular-nums text-[12.5px] font-semibold text-[#f3efe6]">
                {padded}° <span className="text-[#e8b04a]">{cardinal}</span>
              </span>
              <span className="font-mono tabular-nums text-[10px] text-[#a9a69e]">
                {telemetry.mode === 'globe' ? 'POLE' : `${telemetry.tilt}° TILT`}
              </span>
            </div>

            {telemetry.mode !== 'globe' ? (
              <div className="grid grid-cols-4 gap-1" role="group" aria-label="Snap camera heading">
                {CARDINAL_TARGETS.map((c) => {
                  const active = Math.abs(((telemetry.bearing - c.deg + 540) % 360) - 180) < 12;
                  return (
                    <button
                      key={c.label}
                      type="button"
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
                    </button>
                  );
                })}
              </div>
            ) : (
              <button
                type="button"
                onClick={(ev) => {
                  ev.stopPropagation();
                  snapToHeading(0);
                }}
                className="h-6 px-2 rounded-md text-[10.5px] font-medium bg-white/[0.05] border border-white/12 text-[#f3efe6] hover:border-[#e8b04a]/70 hover:text-[#e8b04a] transition-colors cursor-pointer"
              >
                Align North
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
