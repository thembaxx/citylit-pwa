import { useCallback, useEffect, useId } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'motion/react';
import { ambientAudio } from '../../audio/ambientAudio';

/**
 * LiquidToggle, adapted from EasyUI. The thumb deforms into a blob while it
 * travels instead of translating as a rigid circle.
 */
interface LiquidToggleProps {
  value: boolean;
  onChange: (value: boolean) => void;
  label: string;
  accent?: string;
  reducedMotion?: boolean;
  width?: number;
  height?: number;
}

const POINTS = 12;

function blobPath(width: number, height: number, t: number, stretch: number) {
  const padding = 4;
  const leftX = padding + (height - padding * 2) / 2;
  const rightX = width - padding - (height - padding * 2) / 2;
  const cy = height / 2;
  const base = (height - padding * 2) / 2;
  const rx = base * (1 + stretch * 0.35);
  const ry = base * (1 - stretch * 0.12);
  const cx = leftX + (rightX - leftX) * t;

  const points: Array<[number, number]> = [];
  for (let i = 0; i < POINTS; i++) {
    const angle = (Math.PI * 2 * i) / POINTS - Math.PI / 2;
    const wobble = 1 + stretch * 0.18 * Math.sin(angle * 3 + t * Math.PI * 2);
    points.push([cx + Math.cos(angle) * rx * wobble, cy + Math.sin(angle) * ry * wobble]);
  }
  const mid = (a: [number, number], b: [number, number]): [number, number] => [
    (a[0] + b[0]) / 2,
    (a[1] + b[1]) / 2,
  ];
  const start = mid(points[POINTS - 1], points[0]);
  let d = `M ${start[0].toFixed(2)} ${start[1].toFixed(2)}`;
  for (let i = 0; i < POINTS; i++) {
    const ctrl = points[i];
    const end = mid(ctrl, points[(i + 1) % POINTS]);
    d += ` Q ${ctrl[0].toFixed(2)} ${ctrl[1].toFixed(2)} ${end[0].toFixed(2)} ${end[1].toFixed(2)}`;
  }
  return `${d} Z`;
}

export function LiquidToggle({
  value,
  onChange,
  label,
  accent = '#e8b04a',
  reducedMotion = false,
  width = 52,
  height = 30,
}: LiquidToggleProps) {
  const id = useId();
  const progress = useMotionValue(value ? 1 : 0);
  const progressSpring = useSpring(progress, {
    stiffness: 280,
    damping: 24,
    mass: 0.55,
  });
  const stretch = useMotionValue(0);
  const stretchSpring = useSpring(stretch, { stiffness: 240, damping: 18, mass: 0.4 });

  useEffect(() => progress.set(value ? 1 : 0), [value, progress]);

  useEffect(() => {
    if (reducedMotion) return;
    let prev = progressSpring.get();
    const stop = progressSpring.on('change', (latest) => {
      stretch.set(Math.min(1, Math.abs(latest - prev) * 6));
      prev = latest;
    });
    return stop;
  }, [progressSpring, stretch, reducedMotion]);

  useEffect(() => {
    if (reducedMotion) return;
    const timer = window.setInterval(() => {
      const current = stretch.get();
      stretch.set(current > 0.01 ? current * 0.85 : 0);
    }, 32);
    return () => window.clearInterval(timer);
  }, [stretch, reducedMotion]);

  const path = useTransform([progressSpring, stretchSpring], ([t, s]) =>
    blobPath(width, height, t as number, s as number)
  );

  const toggle = useCallback(() => {
    ambientAudio.playUi('toggle');
    onChange(!value);
  }, [onChange, value]);

  return (
    <button
      type="button"
      role="switch"
      aria-checked={value}
      aria-label={label}
      onClick={toggle}
      onKeyDown={(e) => {
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
          e.preventDefault();
          if (!value) {
            ambientAudio.playUi('toggle');
            onChange(true);
          }
        } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
          e.preventDefault();
          if (value) {
            ambientAudio.playUi('toggle');
            onChange(false);
          }
        }
      }}
      className="relative inline-flex shrink-0 cursor-pointer items-center rounded-full border border-white/15 bg-white/[0.06] select-none focus-visible:outline-2 focus-visible:outline-[#e8b04a]"
      style={{ width, height }}
    >
      <svg
        className="pointer-events-none absolute inset-0"
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        aria-hidden="true"
      >
        <defs>
          <radialGradient id={`liquid-${id}`} cx="0.35" cy="0.35" r="0.85">
            <stop offset="0%" stopColor={value ? accent : '#f3efe6'} />
            <stop offset="100%" stopColor={value ? accent : '#f3efe6'} stopOpacity="0.75" />
          </radialGradient>
        </defs>
        <motion.path d={path} fill={`url(#liquid-${id})`} />
      </svg>
    </button>
  );
}
