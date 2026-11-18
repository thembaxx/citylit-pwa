import { useEffect } from 'react';
import { motion, useSpring, useTransform } from 'motion/react';

/** Animated Number Morph, adapted from EasyUI. Digits roll on a spring. */
interface AnimatedNumberProps {
  value: number;
  decimals?: number;
  suffix?: string;
  className?: string;
  reducedMotion?: boolean;
}

function Digit({ digit, reducedMotion }: { digit: string; reducedMotion: boolean }) {
  const isNumber = /\d/.test(digit);
  const n = isNumber ? Number(digit) : 0;
  const spring = useSpring(n, { stiffness: 170, damping: 22, mass: 0.6 });
  const y = useTransform(spring, (current) => `-${current * 10}%`);

  useEffect(() => {
    if (isNumber) spring.set(n);
  }, [spring, n, isNumber]);

  if (!isNumber || reducedMotion) return <span className="inline-block">{digit}</span>;

  return (
    <span
      aria-hidden="true"
      className="relative inline-block h-[1.1em] w-[0.56em] overflow-hidden text-center leading-[1.1em]"
    >
      <motion.span style={{ y }} className="flex flex-col">
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => (
          <span key={d} className="flex h-[1.1em] items-center justify-center">
            {d}
          </span>
        ))}
      </motion.span>
    </span>
  );
}

export function AnimatedNumber({
  value,
  decimals = 0,
  suffix = '',
  className = '',
  reducedMotion = false,
}: AnimatedNumberProps) {
  const text = value.toFixed(decimals);
  return (
    <span
      className={`inline-flex items-baseline font-mono tabular-nums tracking-tight select-none ${className}`}
      aria-label={`${text}${suffix}`}
    >
      {text.split('').map((char, i) => (
        <Digit
          key={`${i}-${char === '.' ? 'dot' : 'num'}`}
          digit={char}
          reducedMotion={reducedMotion}
        />
      ))}
      {suffix && (
        <span aria-hidden="true" className="ml-0.5">
          {suffix}
        </span>
      )}
    </span>
  );
}
