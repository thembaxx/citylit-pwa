import { useEffect, useRef } from 'react';
import type { CitylitEngine } from '../three/CitylitEngine';

interface CompassProps {
  /** Resolve the engine each frame; polled until it exists. */
  getEngine: () => CitylitEngine | null;
}

/** Dial centre in SVG units (52x52 viewBox). */
const C = 26;

/** Sixteen tick marks around the bezel; i=0 is due north, advancing clockwise. */
const TICKS = Array.from({ length: 16 }, (_, i) => {
  const angle = ((i * 22.5 - 90) * Math.PI) / 180;
  const major = i % 4 === 0;
  const medium = !major && i % 2 === 0;
  const inner = major ? 18 : medium ? 19 : 20;
  return {
    x1: C + Math.cos(angle) * inner,
    y1: C + Math.sin(angle) * inner,
    x2: C + Math.cos(angle) * 22,
    y2: C + Math.sin(angle) * 22,
    major,
    medium,
  };
});

/**
 * Compact instrument-style compass on the left edge, vertically centered.
 * The bezel, ticks and cardinal letters stay fixed while the two-tone needle
 * rotates to point toward world north (+Y, the pole axis in latLonToVec3) as
 * seen from the current camera — in both the diorama and globe views.
 */
export function Compass({ getEngine }: CompassProps) {
  const needle = useRef<SVGGElement>(null);

  useEffect(() => {
    let raf = 0;
    const loop = () => {
      const e = getEngine();
      const dial = needle.current;
      if (e && dial) {
        // Camera axes in world space (THREE matrices are column-major):
        // columns 0/1 are screen right/up, column 2 points behind the camera.
        const m = e.camera.matrixWorld.elements;
        const fx = -m[8];
        const fy = -m[9];
        const fz = -m[10];
        const rx = m[0];
        const ry = m[1];
        const rz = m[2];
        const ux = m[4];
        const uy = m[5];
        const uz = m[6];

        // Project world north (+Y) onto the view plane, then read its
        // screen-space angle. CSS rotate(θ) maps the dial's top vector to
        // (sinθ, −cosθ), so θ = atan2(x, y) points it at the projection.
        const alongF = fy; // (0,1,0) · f
        const nx = -fx * alongF;
        const ny = 1 - fy * alongF;
        const nz = -fz * alongF;
        if (nx * nx + ny * ny + nz * nz > 1e-6) {
          const deg =
            (Math.atan2(nx * rx + ny * ry + nz * rz, nx * ux + ny * uy + nz * uz) * 180) /
            Math.PI;
          const wanted = `rotate(${deg.toFixed(1)} ${C} ${C})`;
          if (dial.getAttribute('transform') !== wanted) dial.setAttribute('transform', wanted);
        }
      }
      raf = requestAnimationFrame(loop);
    };
    loop();
    return () => cancelAnimationFrame(raf);
  }, [getEngine]);

  return (
    <div
      className="compass"
      role="img"
      aria-label="Compass — the amber needle points toward world north"
    >
      <svg width="52" height="52" viewBox="0 0 52 52" fill="none" aria-hidden="true">
        {/* Fixed bezel and compass card */}
        <circle cx={C} cy={C} r="23" stroke="rgba(255,255,255,0.22)" strokeWidth="1" />
        <circle cx={C} cy={C} r="18.5" stroke="rgba(255,255,255,0.07)" strokeWidth="1" />
        {TICKS.map((t, i) => (
          <line
            key={i}
            x1={t.x1}
            y1={t.y1}
            x2={t.x2}
            y2={t.y2}
            stroke={
              t.major
                ? 'rgba(255,255,255,0.5)'
                : t.medium
                  ? 'rgba(255,255,255,0.3)'
                  : 'rgba(255,255,255,0.14)'
            }
            strokeWidth={t.major ? 1.4 : 0.8}
            strokeLinecap="round"
          />
        ))}
        <text
          x={C}
          y="12"
          textAnchor="middle"
          dominantBaseline="central"
          fontSize="7.5"
          fontWeight="700"
          fill="#e8b04a"
        >
          N
        </text>
        <text
          x="40"
          y={C}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize="7"
          fontWeight="600"
          fill="rgba(255,255,255,0.55)"
        >
          E
        </text>
        <text
          x={C}
          y="40"
          textAnchor="middle"
          dominantBaseline="central"
          fontSize="7"
          fontWeight="600"
          fill="rgba(255,255,255,0.55)"
        >
          S
        </text>
        <text
          x="12"
          y={C}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize="7"
          fontWeight="600"
          fill="rgba(255,255,255,0.55)"
        >
          W
        </text>

        {/* Rotating needle: amber north half, muted south half */}
        <g ref={needle} className="compass__needle" transform={`rotate(0 ${C} ${C})`}>
          <polygon points={`${C},16 23.2,${C} 28.8,${C}`} fill="#e8b04a" />
          <polygon points={`${C},36 23.2,${C} 28.8,${C}`} fill="#8790a4" />
          <circle cx={C} cy={C} r="2.2" fill="#121319" stroke="#e8b04a" strokeWidth="0.9" />
        </g>
      </svg>
    </div>
  );
}
