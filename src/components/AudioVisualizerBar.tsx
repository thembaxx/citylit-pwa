import { useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ambientAudio } from '../audio/ambientAudio';
import { DURATION, EASE_SMOOTH_OUT } from '../lib/motion';
import type { ThemeSetting } from '../types/citylit';

interface AudioVisualizerBarProps {
  active: boolean;
  theme: ThemeSetting;
  reducedMotion?: boolean;
}

const BAND_COUNT = 16;
const BAR_COUNT = BAND_COUNT * 2 - 1; // 31 symmetric bars radiating from center bass to high wings

export function AudioVisualizerBar({
  active,
  theme,
  reducedMotion = false,
}: AudioVisualizerBarProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!active) return undefined;
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const ctx = canvas.getContext('2d');
    if (!ctx) return undefined;

    const rawBands = new Float32Array(BAND_COUNT);
    const smoothBands = new Float32Array(BAND_COUNT);

    let cssW = canvas.clientWidth || 186;
    let cssH = canvas.clientHeight || 11;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      cssW = canvas.clientWidth || 186;
      cssH = canvas.clientHeight || 11;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.round(cssW * dpr));
      canvas.height = Math.max(1, Math.round(cssH * dpr));
    };

    resize();
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(resize) : null;
    ro?.observe(canvas);

    let rafId = 0;
    let lastTime = performance.now();
    let lastDrawTime = 0;

    const draw = (now: number) => {
      rafId = window.requestAnimationFrame(draw);

      const dt = Math.min(0.1, Math.max(0.001, (now - lastTime) / 1000));
      lastTime = now;

      // Throttle visual cadence under reduced motion while still reflecting active levels
      if (reducedMotion && now - lastDrawTime < 140) return;
      lastDrawTime = now;

      ambientAudio.sampleFrequencyBars(rawBands);

      const attack = 1 - Math.exp(-dt * (reducedMotion ? 6 : 22));
      const decay = 1 - Math.exp(-dt * (reducedMotion ? 4 : 9));

      for (let i = 0; i < BAND_COUNT; i++) {
        const target = rawBands[i];
        const k = target > smoothBands[i] ? attack : decay;
        smoothBands[i] += (target - smoothBands[i]) * k;
      }

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, cssW, cssH);

      const isLight = theme !== 'dark';
      const baselineColor = isLight ? 'rgba(28, 35, 48, 0.14)' : 'rgba(243, 239, 230, 0.14)';

      // Ultra-subtle hairline baseline across the visualizer span
      ctx.fillStyle = baselineColor;
      ctx.fillRect(0, cssH - 1, cssW, 1);

      const barWidth = 2;
      const step = (cssW - barWidth) / Math.max(1, BAR_COUNT - 1);
      const centerIdx = BAND_COUNT - 1;
      const minH = 1.5;
      const maxH = Math.max(minH, cssH - 1.5);

      for (let i = 0; i < BAR_COUNT; i++) {
        const bandIdx = Math.abs(i - centerIdx);
        const energy = smoothBands[bandIdx];
        const h = minH + energy * (maxH - minH);
        const x = i * step;
        const y = cssH - h;
        const alpha = 0.28 + energy * 0.62;

        if (isLight) {
          // Deep slate-ink shifting to warm amber on acoustic peaks
          const r = Math.round(28 + energy * 164);
          const g = Math.round(35 + energy * 88);
          const b = Math.round(48 - energy * 24);
          ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha.toFixed(3)})`;
        } else {
          // Warm gold shifting softly toward cream on peaks
          const r = Math.round(232 + energy * 14);
          const g = Math.round(176 + energy * 52);
          const b = Math.round(74 + energy * 102);
          ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha.toFixed(3)})`;
        }

        const radius = 1;
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, h, radius);
        ctx.fill();
      }
    };

    rafId = window.requestAnimationFrame(draw);

    return () => {
      window.cancelAnimationFrame(rafId);
      ro?.disconnect();
    };
  }, [active, theme, reducedMotion]);

  return (
    <AnimatePresence>
      {active && (
        <motion.div
          key="audio-visualizer"
          aria-hidden="true"
          initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 4 }}
          transition={{ duration: reducedMotion ? 0 : DURATION.fast, ease: EASE_SMOOTH_OUT }}
          className="fixed left-1/2 -translate-x-1/2 bottom-[calc(3px+env(safe-area-inset-bottom,0px))] z-20 pointer-events-none select-none"
        >
          <canvas ref={canvasRef} className="block w-[164px] sm:w-[208px] h-[11px]" />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
