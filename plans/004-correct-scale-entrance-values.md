# 004 — Correct scale entrance values to 0.9–0.97

- **Status**: DONE
- **Commit**: e444ba6
- **Severity**: HIGH
- **Category**: Physicality & origin (3)
- **Estimated scope**: 5 component files, ~10 value changes

## Problem

Several frequent UI elements appear from a quarter or less of their final size, which reads as "materialising from nothing". AUDIT.md §3 requires `scale(0.9–0.97) + opacity: 0`, never smaller.

```tsx
// src/components/TopBar.tsx:69,72 — frequently tapped control
initial={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.25, filter: 'blur(2px)' }}
exit={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.25, filter: 'blur(2px)' }}

// src/components/WeatherWidget.tsx:158,163 — warning badges
initial={reducedMotion ? false : { opacity: 0, scale: 0.75 }}
exit={reducedMotion ? { opacity: 0, ... } : { opacity: 0, scale: 0.75 }}

// src/components/SearchSheet.tsx:200,202 — clear-search button
initial={{ opacity: 0, scale: 0.8, filter: 'blur(2px)' }}
exit={{ opacity: 0, scale: 0.8, filter: 'blur(2px)' }}

// src/components/PassportModal.tsx:263 — stamped-count readout
initial={reducedMotion ? false : { scale: 0.7, opacity: 0 }}

// src/components/LandmarkCard.tsx:969,971 — long-press radial actions
initial={{ opacity: 0, scale: 0.3, x: 0, y: 0 }}
exit={{ opacity: 0, scale: 0.4 }}
```

The radial actions also scale from their own centres instead of growing out of the long-press trigger point.

## Target

Use `scale: 0.94` for icon/text swaps and badges, `scale: 0.92` for the radial actions, and keep the existing `filter: blur(2px)` (within the ≤20px budget). Exit values should mirror entrance: `0.94` / `0.92`. Reduced-motion branches stay opacity-only.

For the radial menu, set `style={{ transformOrigin: 'bottom right' }}` on each action button so the scale grows from the trigger side; the menu is anchored by `radialPos` at `src/components/LandmarkCard.tsx:962` and the actions use `posClass` offsets.

## Repo conventions to follow

- `src/lib/motion.ts:55` `modalVariants` uses `scale: 0.96` — the existing exemplar of a correct, subtle entrance.
- `src/lib/motion.ts:91` `toastVariants` uses `scale: 0.97` — also correct.
- `src/transitions.css:79` `--dropdown-pre-scale: 0.97` is the CSS token for the same idea.

## Steps

1. `src/components/TopBar.tsx:69,72` — replace `scale: 0.25` with `scale: 0.94` in both initial and exit.
2. `src/components/WeatherWidget.tsx:158,163` — replace `scale: 0.75` with `scale: 0.94` in both branches.
3. `src/components/SearchSheet.tsx:200,202` — replace `scale: 0.8` with `scale: 0.94`.
4. `src/components/PassportModal.tsx:263` — replace `scale: 0.7` with `scale: 0.94`.
5. `src/components/LandmarkCard.tsx:969,971` — replace `scale: 0.3` and `scale: 0.4` with `scale: 0.92`; add `style={{ transformOrigin: 'bottom right' }}` to each `motion.button` at `:966`.
6. Change no durations, easings, springs, or structure.

## Boundaries

- Do NOT touch `src/components/App.tsx:1783` passport stamp scale 2.4 — that is a deliberate rare celebration and is out of scope.
- Do NOT change `scale: 0.96` in the shared variants (already correct).
- Do NOT remove blur or reduced-motion branches.
- If a cited scale value has changed since commit `e444ba6`, STOP and report drift.

## Verification

- **Mechanical**: `npm run lint` and `npm run build` must pass.
- **Feel check**: in the running app, trigger each control and watch at 10% playback in DevTools Animations:
  - Top-bar icon swap: icon starts near full size and fades in; it does not "grow from nothing".
  - Weather warning badge: subtle 0.94 rise, not a pop from 0.75.
  - Clear-search button and passport percentage: same subtle rise.
  - Long-press a landmark to open the radial menu: actions spread out from the trigger side, not from their own centres.
  - Reduced motion still gives opacity-only entries.
- **Done when**: no UI entrance uses a scale below 0.9, and the radial menu is trigger-anchored.
