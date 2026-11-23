# 016 — Shorten the weather-details disclosure to 250ms

- **Status**: TODO
- **Commit**: e5b288e
- **Severity**: MEDIUM
- **Category**: Easing & duration (2)
- **Estimated scope**: 1 file, ~2 lines

## Problem

The expandable weather details panel uses a hand-typed 400ms reveal:

```tsx
// src/components/WeatherWidget.tsx:268 — current
              transition={{ duration: reducedMotion ? 0 : 0.4, ease: EASE_SMOOTH_OUT }}
```

It is a small disclosure sitting inside the weather island (`y: -6`, a 2px blur and a
clip-path wipe at `:265-267`), so its budget is 150–250ms, not the 200–500ms reserved
for modals and drawers (AUDIT.md §2). 400ms makes expanding the details feel slow
relative to the 150ms pill and 250ms chart animations next to it.

## Target

```tsx
// target — src/components/WeatherWidget.tsx:268
              transition={{ duration: reducedMotion ? 0 : DURATION.fast, ease: EASE_SMOOTH_OUT }}
```

`DURATION.fast = 0.25` (250ms, `src/lib/motion.ts:47`). Keep the `clipPath`, `y: -6`,
`filter: blur(2px)` → `blur(0px)` values and the reduced-motion opacity-only branches
at `:265-267` exactly as they are — the 2px blur was deliberately restored after review
of the earlier audit (see `plans/README.md`, review adjustments for commit `b379a1e`).

## Repo conventions to follow

- `src/components/WeatherWidget.tsx:37` already imports from `../lib/motion`; add
  `DURATION` to that import:
  `import { DURATION, EASE_SMOOTH_OUT, PRESS_SCALE, SPRING, swapTransition } from '../lib/motion';`
- `src/components/InfoDrawer.tsx:303-316` uses `AnimatePresence` + a 250ms blurred
  crossfade for a comparable disclosure — the exemplar.
- `src/lib/motion.ts:43-51` is the duration scale; always use a token, never a literal.

## Steps

1. In `src/components/WeatherWidget.tsx:37`, add `DURATION` to the existing
   `../lib/motion` import.
2. In `src/components/WeatherWidget.tsx:268`, replace `0.4` with `DURATION.fast`.
3. Change nothing else.

## Boundaries

- Do NOT change the 2px blur, the clip-path reveal, or the `y` distance.
- Do NOT touch `HourlyForecast`, the weather presets, or any shared token definition.
- Do NOT add dependencies.
- If the transition at `src/components/WeatherWidget.tsx:268` no longer matches
  verbatim, STOP and report drift.

## Verification

- **Mechanical**: `npm run lint` and `npm run build` must pass.
- **Feel check**:
  - Tap the weather island to expand and collapse the details: the wipe + blur settles
    in ~250ms and feels in the same family as the pill press, not a slow drawer.
  - DevTools → Animations → 10% playback: confirm the clip-path reaches
    `inset(0 0 0% 0)` and blur reaches 0 at the same time, in 250ms.
  - Spam expand/collapse: `AnimatePresence` retargets without doubling the panel.
  - Toggle `prefers-reduced-motion` and the app's reduced-motion setting: the panel
    still fades opacity, with no clip-path or vertical travel.
- **Done when**: the disclosure uses `DURATION.fast` and no hand-typed 400ms remains here.
