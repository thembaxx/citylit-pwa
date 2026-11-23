# 017 — Animate the scale-ruler bar with transform, not width

- **Status**: TODO
- **Commit**: e5b288e
- **Severity**: LOW
- **Category**: Performance (5)
- **Estimated scope**: 1 file, ~5 lines

## Problem

Each row's comparison bar in the scale ruler animates `width` from zero to a percentage
over 550ms with a bare `easeOut`:

```tsx
// src/components/ScaleRulerModal.tsx:239-245 — current
                <div className="h-2 rounded-full bg-white/[0.07] overflow-hidden">
                  <motion.div
                    className={`h-full rounded-full ${row.visited ? 'bg-[#7dffb0]' : 'bg-[#e8b04a]'}`}
                    initial={reducedMotion ? false : { width: 0 }}
                    animate={{ width: `${row.width * 100}%` }}
                    transition={reducedMotion ? { duration: 0 } : { duration: 0.55, ease: 'easeOut' }}
                  />
                </div>
```

`width` triggers layout + paint + composite every frame, for ~43 rows, inside a dialog
rendered over the continuously running WebGL canvas. The equivalent compositor-only
animation is `scaleX` from a left origin. The literal `0.55` and built-in `easeOut` also
ignore the repo's shared tokens (`DURATION.fast = 0.25`, `EASE_SMOOTH_OUT`).

## Target

Keep the bar's final length identical (`row.width` is the same 0–1 fraction the current
code multiplies by 100):

```tsx
// target — src/components/ScaleRulerModal.tsx:239-245
                <div className="h-2 rounded-full bg-white/[0.07] overflow-hidden">
                  <motion.div
                    className={`h-full w-full rounded-full ${row.visited ? 'bg-[#7dffb0]' : 'bg-[#e8b04a]'}`}
                    style={{ transformOrigin: 'left center' }}
                    initial={reducedMotion ? false : { scaleX: 0 }}
                    animate={{ scaleX: row.width }}
                    transition={reducedMotion ? { duration: 0 } : { duration: DURATION.fast, ease: EASE_SMOOTH_OUT }}
                  />
                </div>
```

`w-full` is required on the bar now that its width is no longer animated — without it
the div would have no intrinsic width. `transform-origin: left center` makes the fill
grow from the same edge the old `width` animation grew from.

## Repo conventions to follow

- `src/App.tsx:2109-2120` is the exemplar: `scaleY` + explicit `transformOrigin` for a
  compositable reveal, with a reduced-motion opacity-only branch.
- `src/components/ScaleRulerModal.tsx:10` already imports from `../lib/motion`; extend
  it to `import { DURATION, EASE_SMOOTH_OUT, PRESS_SCALE } from '../lib/motion';`
- `src/lib/motion.ts:43-51` (`DURATION`) and `:8` (`EASE_SMOOTH_OUT`) are the tokens.

## Steps

1. In `src/components/ScaleRulerModal.tsx:10`, add `DURATION` and `EASE_SMOOTH_OUT`
   to the existing `../lib/motion` import.
2. In the bar `motion.div` at `:240-245`:
   - add `w-full` to `className`;
   - add `style={{ transformOrigin: 'left center' }}`;
   - change `initial` to `{ scaleX: 0 }` (keeping the `reducedMotion ? false : …` guard);
   - change `animate` to `{ scaleX: row.width }`;
   - change the transition to `reducedMotion ? { duration: 0 } : { duration: DURATION.fast, ease: EASE_SMOOTH_OUT }`.
3. Change nothing else.

## Boundaries

- Do NOT change `barWidth()` or the `rows` data — `row.width` stays the same 0–1 fraction.
- Do NOT remove the `reducedMotion` branches.
- Do NOT touch the sort pills, `PillNavigation`, or the list `<li>` rows (those belong
  to plan 020).
- Do NOT add dependencies.
- If the excerpt at `src/components/ScaleRulerModal.tsx:239` no longer matches verbatim,
  STOP and report drift.

## Verification

- **Mechanical**: `npm run lint` and `npm run build` must pass.
- **Feel check**:
  - Open the scale ruler from a landmark: bars grow from the left in ~250ms and end at
    exactly the same lengths as before (compare with the screenshot in `plans/000` if
    available, or check the tallest row reaches the same fraction of its track).
  - DevTools → Performance: record the opening and confirm no per-frame layout/paint
    from the bars; only transform changes appear in the compositor track.
  - DevTools → Animations → 10% playback: confirm each bar starts at scaleX 0 and the
    origin marker is at the left edge.
  - Toggle `prefers-reduced-motion` and the app setting: bars appear at full length
    immediately with no growth.
  - Change `Sort` and confirm the finished bars still reflect the new order.
- **Done when**: no `width` animation remains in this file and bars settle in 250ms.
