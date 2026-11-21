# 006 — Remove layout-property animations over the live WebGL canvas

- **Status**: DONE
- **Commit**: e444ba6
- **Severity**: MEDIUM
- **Category**: Performance (5)
- **Estimated scope**: 3 component files, ~25 lines

## Problem

A WebGL scene renders continuously beneath the UI, so main-thread layout work during a transition is especially costly. Several animations use layout properties (AUDIT.md §5: animate `transform` and `opacity` only):

```tsx
// src/components/WeatherWidget.tsx:220-222
initial={{ opacity: 0, height: 0, filter: 'blur(2px)' }}
animate={{ opacity: 1, height: 'auto', filter: 'blur(0px)' }}
exit={{ opacity: 0, height: 0, filter: 'blur(0px)' }}

// src/components/SearchSheet.tsx:264-266
initial={{ opacity: 0, height: 0 }}
animate={{ opacity: 1, height: 'auto' }}
exit={{ opacity: 0, height: 0 }}

// src/components/LandmarkCard.tsx:918-922 — progress bar reflows every tick
<motion.div
  className="h-full bg-[#e8b04a]"
  initial={false}
  animate={{ width: `${progressPct}%` }}
  transition={{ duration: reducedMotion ? 0 : 0.5, ease: EASE_SMOOTH_OUT }}
/>
```

`height: 0 → auto` is tolerated by AUDIT.md §5 only for accordions; the weather panel and install banner are expanded content, but the `width` progress bar has no such exemption and reflows on every update.

## Target

- Weather panel and install banner: replace `height` animation with a `clip-path: inset()` reveal plus opacity and a small y offset, keeping the content in layout the whole time so nothing reflows. `clip-path` is the sanctioned fourth animatable property in AUDIT.md §4.
- Progress bar: keep the track at full width and animate `scaleX(progressPct/100)` with `transform-origin: left`.

```tsx
// weather panel / install banner target
initial={reducedMotion ? { opacity: 0 } : { opacity: 0, clipPath: 'inset(0 0 100% 0)', y: -6 }}
animate={reducedMotion ? { opacity: 1 } : { opacity: 1, clipPath: 'inset(0 0 0% 0)', y: 0 }}
exit={reducedMotion ? { opacity: 0 } : { opacity: 0, clipPath: 'inset(0 0 100% 0)', y: -6 }}

// progress bar target
<motion.div
  className="h-full w-full origin-left bg-[#e8b04a]"
  initial={false}
  animate={{ scaleX: progressPct / 100 }}
  transition={{ duration: reducedMotion ? 0 : 0.25, ease: EASE_SMOOTH_OUT }}
/>
```

Keep the existing `overflow-hidden` wrappers; they contain the clipped content.

## Repo conventions to follow

- `src/components/WeatherWidget.tsx:223` already uses `EASE_SMOOTH_OUT` with `DURATION`-style values; keep that import.
- `src/lib/motion.ts:11-19` `DURATION.fast = 0.25` is the token for the progress bar; use `DURATION.fast` rather than a literal 0.25 if convenient.
- `src/lib/motion.ts:55-70` `modalVariants` is the exemplar of `opacity + transform` compositing.

## Steps

1. `src/components/WeatherWidget.tsx:218-224` — replace the `height` trio with the `clip-path`/opacity/y target above. Keep `key="weather-details"`, `AnimatePresence`, and `className="overflow-hidden"`.
2. `src/components/SearchSheet.tsx:263-267` — replace the `height` trio with the same clip-path target (reduced-motion branches already exist nearby; follow plan 002's opacity-only pattern).
3. `src/components/LandmarkCard.tsx:918-923` — change the progress fill to `w-full origin-left` and animate `scaleX: progressPct / 100` with `DURATION.fast` (or `0.25`) instead of `width` / `0.5`.
4. Change nothing else — no markup structure changes beyond the class names on the progress fill.

## Boundaries

- Do NOT touch `src/components/ui/UnfoldAccordion.tsx` — its `height` animation is the documented accordion exemption (plan 002 handles its reduced-motion branch only).
- Do NOT change the blur values (2px is within budget).
- Do NOT touch ResizeObserver work (plan 007).
- If a cited line no longer matches, STOP and report drift.

## Verification

- **Mechanical**: `npm run lint` and `npm run build` must pass.
- **Feel check**: run the app with the WebGL scene visible:
  - Expand/collapse the weather widget rapidly: content reveals from the top edge; the panel below does not jump between frames and no layout shift is visible in DevTools Performance (Layout counter stays flat during the transition).
  - Show/dismiss the PWA install banner in the search sheet: same clip reveal, no reflow.
  - Step through landmarks: the progress bar fills smoothly; use DevTools Rendering "Paint flashing" to confirm no repaint of the surrounding card on each tick.
  - At 10% playback, confirm only opacity/transform/clip-path properties animate.
- **Done when**: no `height` or `width` property is animated in these three components, and no layout events are recorded during their transitions.
