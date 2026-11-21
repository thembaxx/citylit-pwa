# 002 — Gate component motion on reduced motion and pointer capability

- **Status**: DONE
- **Commit**: e444ba6
- **Severity**: HIGH
- **Category**: Accessibility (6)
- **Estimated scope**: 5 component files + 1 small hook, ~40 lines

## Problem

CSS cannot reach Motion's inline styles (see plan 001), and several components keep movement when `reducedMotion` is true or when the input is touch:

```tsx
// src/components/ui/Sheet.tsx:98 — reduced keeps the full y:'100%' slide
transition={reducedMotion ? { duration: 0.2 } : SHEET_SPRING}

// src/components/ui/UnfoldAccordion.tsx:68-71 — reduced keeps height layout animation
initial={{ height: 0, opacity: 0 }}
animate={{ height: 'auto', opacity: 1 }}
transition={reducedMotion ? { duration: 0.15 } : SPRING.morph}

// src/components/ui/LiquidToggle.tsx:62,91 — thumb spring never gated
const progressSpring = useSpring(progress, { stiffness: 280, damping: 24, mass: 0.55 });
const path = useTransform([progressSpring, stretchSpring], ([t, s]) => blobPath(width, height, t, s));

// src/components/WeatherWidget.tsx:180-183 — unconditional 4px y swap
initial={{ opacity: 0, y: 4, filter: 'blur(2px)' }}
animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
exit={{ opacity: 0, y: -4, filter: 'blur(2px)' }}
transition={swapTransition}

// src/components/SearchSheet.tsx:200-202 — ungated scale entrance
initial={{ opacity: 0, scale: 0.8, filter: 'blur(2px)' }}

// src/components/WeatherWidget.tsx:231 and LandmarkCard.tsx:841 — hover motion on touch
whileHover={reducedMotion ? undefined : { y: -2 }}
className="... group-hover:scale-110 transition-transform"
```

Reduced motion must drop position changes and keep opacity feedback (AUDIT.md §6); hover motion must be behind `@media (hover: hover) and (pointer: fine)` because touch fires false hovers.

## Target

- Reduced variants use opacity only (`{opacity:0} → {opacity:1} → {opacity:0}`), `transition: { duration: 0.2, ease: EASE_SMOOTH_OUT }` where a transition is still needed. `EASE_SMOOTH_OUT` and `SPRING.morph` already exist in `src/lib/motion.ts` — use them, do not invent values.
- `LiquidToggle`: feed the thumb path from `progress` directly when reduced, so the switch changes state without travel.
- Hover motion: gate on a fine pointer.

## Repo conventions to follow

- `src/components/Compass.tsx:467-471` is the exemplar: `reduce ? { opacity: 0 } : { opacity: 0, x: -6, scale: 0.96 }`.
- `src/components/Compass.tsx:2` imports `useReducedMotion` from `motion/react` — reuse that pattern if a component lacks a `reducedMotion` prop.
- `src/lib/motion.ts:8` exports `EASE_SMOOTH_OUT`; `src/lib/motion.ts:43` exports `SPRING.morph`.

## Steps

1. `src/components/ui/Sheet.tsx` — import `EASE_SMOOTH_OUT` from `../../lib/motion`; change the motion props to:
   ```tsx
   initial={reducedMotion ? { opacity: 0 } : from}
   animate={reducedMotion ? { opacity: 1 } : to}
   exit={reducedMotion ? { opacity: 0 } : from}
   transition={
     reducedMotion
       ? { duration: 0.2, ease: EASE_SMOOTH_OUT }
       : SHEET_SPRING
   }
   ```
   Drag/flick behaviour stays unchanged.
2. `src/components/ui/UnfoldAccordion.tsx` — import `EASE_SMOOTH_OUT`; replace the content block with opacity-only reduced variants:
   ```tsx
   initial={reducedMotion ? { opacity: 0 } : { height: 0, opacity: 0 }}
   animate={reducedMotion ? { opacity: 1 } : { height: 'auto', opacity: 1 }}
   exit={reducedMotion ? { opacity: 0 } : { height: 0, opacity: 0 }}
   transition={reducedMotion ? { duration: 0.2, ease: EASE_SMOOTH_OUT } : SPRING.morph}
   ```
3. `src/components/ui/LiquidToggle.tsx` — add `const track = reducedMotion ? progress : progressSpring;` and change `useTransform([progressSpring, stretchSpring], …)` to `useTransform([track, stretchSpring], …)`. Keep `stretch` gated as it already is (`src/components/ui/LiquidToggle.tsx:73`).
4. `src/components/WeatherWidget.tsx` — for both the label swap (`~180`) and time swap (`~204`), use:
   ```tsx
   initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 4, filter: 'blur(2px)' }}
   animate={reducedMotion ? { opacity: 1 } : { opacity: 1, y: 0, filter: 'blur(0px)' }}
   exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: -4, filter: 'blur(2px)' }}
   transition={reducedMotion ? { duration: 0 } : swapTransition}
   ```
   For the forecast hover lift (`~231`), add a fine-pointer check: `const finePointer = useFinePointer();` and `whileHover={reducedMotion || !finePointer ? undefined : { y: -2 }}`.
5. `src/components/SearchSheet.tsx:196-203` — the component already has a `reducedMotion` prop (`src/components/SearchSheet.tsx:30`); use opacity-only initial/animate/exit and `transition={reducedMotion ? { duration: 0 } : swapTransition}`.
6. `src/components/LandmarkCard.tsx:841,848,855` — change `group-hover:scale-110 transition-transform` to a media-guarded Tailwind arbitrary variant: `[@media(hover:hover)_and_(pointer:fine)]:group-hover:scale-110 transition-transform` on each of the three icons.
7. Create `src/hooks/useFinePointer.ts`:
   ```ts
   import { useEffect, useState } from 'react';

   export function useFinePointer(): boolean {
     const [fine, setFine] = useState(
       () => typeof window !== 'undefined' &&
         window.matchMedia('(hover: hover) and (pointer: fine)').matches
     );
     useEffect(() => {
       const mq = window.matchMedia('(hover: hover) and (pointer: fine)');
       const onChange = () => setFine(mq.matches);
       mq.addEventListener('change', onChange);
       return () => mq.removeEventListener('change', onChange);
     }, []);
     return fine;
   }
   ```
   Import it in `WeatherWidget.tsx`.

## Boundaries

- Do NOT change drag physics, spring configs used in normal motion, or `AnimatePresence` structure.
- Do NOT touch `src/index.css` (plan 001) or the scale values (plan 004).
- Do NOT add dependencies.
- If any cited line no longer matches, STOP and report drift.

## Verification

- **Mechanical**: `npm run lint` and `npm run build` must pass.
- **Feel check**: with `prefers-reduced-motion: reduce` and with the settings toggle:
  - Open/close a sheet: it should fade, not slide; `1` and `2` shortcuts still work.
  - Expand the accordion and toggle a LiquidToggle: state changes instantly with opacity feedback, no travel.
  - Switch weather label/time: text crossfades in place, no 4px rise.
  - On a touch device (or DevTools device emulation with coarse pointer), tapping forecast cells and note icons produces no hover lift/scale.
  - Back on desktop, hover feedback is present again.
- **Done when**: no reduced-motion path contains `x`, `y`, `scale`, or `height` animation, and no hover transform fires on coarse pointers.
