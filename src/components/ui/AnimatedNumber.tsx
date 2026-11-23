import { AnimatePresence, motion } from 'motion/react';
import { DURATION, EASE_SMOOTH_OUT } from '../../lib/motion';

/**
 * Animated number morph.
 *
 * The canonical value is always real text in the DOM. The old implementation
 * rendered a ten-digit rolling column (0-9) inside an overflow-hidden box,
 * which meant the accessible/text content was literally "0123456789" and the
 * full strip became visible whenever CSS or the motion transform was absent
 * (the "0123456789°C" weather bug). The value now crossfades in place instead,
 * so what is rendered is always the number itself.
 */
interface AnimatedNumberProps {
  value: number;
  decimals?: number;
  suffix?: string;
  className?: string;
  reducedMotion?: boolean;
}

export function AnimatedNumber({
  value,
  decimals = 0,
  suffix = '',
  className = '',
  reducedMotion = false,
}: AnimatedNumberProps) {
  const text = Number.isFinite(value) ? value.toFixed(decimals) : '0';

  return (
    <span
      className={`inline-flex items-baseline font-mono tabular-nums tracking-tight select-none ${className}`}
      aria-label={`${text}${suffix}`}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={text}
          initial={reducedMotion ? false : { opacity: 0, y: 4, filter: 'blur(2px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: -4, filter: 'blur(2px)' }}
          transition={{ duration: reducedMotion ? 0 : DURATION.quick, ease: EASE_SMOOTH_OUT }}
        >
          {text}
        </motion.span>
      </AnimatePresence>
      {suffix && (
        <span aria-hidden="true" className="ml-0.5">
          {suffix}
        </span>
      )}
    </span>
  );
}
