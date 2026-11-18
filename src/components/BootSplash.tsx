import { useEffect, useRef, useState } from 'react';

interface BootSplashProps {
  done: boolean;
  reducedMotion: boolean;
}

const MIN_VISIBLE_MS = 850;
const FADE_MS = 450;

/**
 * The first frame of the app is a blank canvas while the engine builds, so hold
 * a sketched wireframe of the diorama until the real scene is ready.
 */
export function BootSplash({ done, reducedMotion }: BootSplashProps) {
  const [leaving, setLeaving] = useState(false);
  const [gone, setGone] = useState(false);
  const mountedAt = useRef(0);

  useEffect(() => {
    mountedAt.current = performance.now();
  }, []);

  useEffect(() => {
    if (!done) return undefined;
    const elapsed = mountedAt.current ? performance.now() - mountedAt.current : MIN_VISIBLE_MS;
    const wait = Math.max(0, MIN_VISIBLE_MS - elapsed);
    const startFade = window.setTimeout(() => setLeaving(true), wait);
    const remove = window.setTimeout(() => setGone(true), wait + FADE_MS);
    return () => {
      window.clearTimeout(startFade);
      window.clearTimeout(remove);
    };
  }, [done]);

  if (gone) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Sketching the 3D landmarks"
      data-static={reducedMotion ? 'true' : 'false'}
      className={`boot-splash fixed inset-0 z-50 bg-[#0e0f13] grid place-items-center px-6 transition-opacity duration-[450ms] ease-out ${
        leaving ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      <div className="w-full max-w-[340px] flex flex-col items-center text-center">
        <div className="boot-splash__rise">
          <div className="font-serif-display italic text-[40px] leading-none text-[#f3efe6]">
            cıtylit
          </div>
          <div className="text-[10.5px] tracking-[0.24em] uppercase text-[#e8b04a] mt-1.5">
            Landmarks in 3D
          </div>
        </div>

        <div className="relative w-[min(300px,76vw)] mt-7">
          <svg
            viewBox="0 0 320 200"
            fill="none"
            aria-hidden="true"
            className="w-full h-auto overflow-visible"
          >
            <defs>
              <radialGradient id="cl-boot-glow" cx="50%" cy="54%" r="52%">
                <stop offset="0%" stopColor="#e8b04a" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#e8b04a" stopOpacity="0" />
              </radialGradient>
            </defs>

            <ellipse cx="160" cy="116" rx="150" ry="82" fill="url(#cl-boot-glow)" />

            {/* Island slab */}
            <g stroke="#e8b04a" strokeWidth="1.1" strokeOpacity="0.55" strokeLinejoin="round">
              <path
                className="boot-splash__draw"
                style={{ animationDelay: '0.05s' }}
                pathLength={1}
                d="M160 44 278 104 160 164 42 104Z"
              />
              <path
                className="boot-splash__draw"
                style={{ animationDelay: '0.22s' }}
                pathLength={1}
                d="M42 104v14l118 60 118-60v-14"
              />
              <path
                className="boot-splash__draw"
                style={{ animationDelay: '0.32s' }}
                pathLength={1}
                d="M160 164v-60"
                strokeOpacity="0.28"
              />
            </g>

            {/* Ground grid */}
            <g stroke="#f3efe6" strokeWidth="0.7" strokeOpacity="0.16">
              {[0.25, 0.5, 0.75].map((t, i) => (
                <g key={t}>
                  <path
                    className="boot-splash__draw"
                    style={{ animationDelay: `${0.4 + i * 0.06}s` }}
                    pathLength={1}
                    d={`M${42 + 118 * t} ${104 - 56 * t}L${160 + 118 * t} ${160 - 56 * t}`}
                  />
                  <path
                    className="boot-splash__draw"
                    style={{ animationDelay: `${0.46 + i * 0.06}s` }}
                    pathLength={1}
                    d={`M${160 + 118 * t} ${48 + 56 * t}L${42 + 118 * t} ${104 + 56 * t}`}
                  />
                </g>
              ))}
            </g>

            {/* Table Mountain */}
            <g
              className="boot-splash__draw"
              style={{ animationDelay: '0.55s' }}
              stroke="#f3efe6"
              strokeWidth="1.3"
              strokeOpacity="0.9"
              strokeLinejoin="round"
            >
              <path pathLength={1} d="M62 112 80 66h52l18 46" />
              <path
                pathLength={1}
                d="M100 74c7 5 14 5 21 2"
                strokeOpacity="0.4"
                strokeDasharray="3 3"
              />
            </g>

            {/* Lighthouse with a beam */}
            <g stroke="#e8b04a" strokeWidth="1.2" strokeOpacity="0.9" strokeLinejoin="round">
              <g className="boot-splash__draw" style={{ animationDelay: '0.68s' }}>
                <path pathLength={1} d="M159 84 161 52h6l2 32" />
                <path pathLength={1} d="M158 84h12M160 58h8M160 66h8" strokeOpacity="0.55" />
                <path pathLength={1} d="M160 52v-5h8v5" />
              </g>
              <path
                className="boot-splash__draw"
                style={{ animationDelay: '0.9s' }}
                pathLength={1}
                d="M171 46 190 36M171 51l20 3"
                strokeOpacity="0.4"
                strokeDasharray="4 4"
              />
            </g>

            {/* Stadium bowl */}
            <g
              className="boot-splash__draw"
              style={{ animationDelay: '0.78s' }}
              stroke="#f3efe6"
              strokeWidth="1.2"
              strokeOpacity="0.6"
            >
              <ellipse pathLength={1} cx="232" cy="112" rx="25" ry="11" />
              <ellipse pathLength={1} cx="232" cy="110" rx="15" ry="5.5" strokeOpacity="0.4" />
              <path pathLength={1} d="M207 112c0 8 11 14 25 14s25-6 25-14" strokeOpacity="0.45" />
            </g>

            {/* Pins */}
            <g stroke="#7dffb0" strokeWidth="1.2" strokeOpacity="0.85">
              {[
                [86, 128],
                [150, 136],
                [246, 132],
              ].map(([x, y], i) => (
                <g
                  key={`${x}-${y}`}
                  className="boot-splash__pin"
                  style={{ animationDelay: `${1 + i * 0.12}s` }}
                >
                  <path d={`M${x} ${y}v-11`} />
                  <circle cx={x} cy={y - 14} r="3.2" fill="#0e0f13" />
                </g>
              ))}
            </g>
          </svg>

          <div className="boot-splash__scan pointer-events-none absolute left-[9%] right-[9%] h-px bg-gradient-to-r from-transparent via-[#e8b04a]/50 to-transparent" />
        </div>

        <div className="boot-splash__rise mt-7 w-full" style={{ animationDelay: '0.15s' }}>
          <div className="h-[3px] w-full rounded-full bg-white/10 overflow-hidden">
            <div className="boot-splash__bar h-full w-full rounded-full bg-[#e8b04a]" />
          </div>
          <div className="mt-3 text-[11.5px] text-[#a9a69e]">Sketching the diorama…</div>
        </div>
      </div>
    </div>
  );
}
