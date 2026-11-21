# 008 — Promote a strong ease-in-out token for on-screen movement

- **Status**: DONE
- **Commit**: e444ba6
- **Severity**: MEDIUM
- **Category**: Easing & duration (2), Cohesion (7)
- **Estimated scope**: 3 files, ~15 lines

## Problem

On-screen swaps and reveals use the weak built-in `easeInOut` / `ease-in-out` (cubic-bezier(0.42,0,0.58,1)). AUDIT.md §2 requires the strong on-screen-movement curve `cubic-bezier(0.77, 0, 0.175, 1)`; weak built-ins make transitions feel sluggish at their midpoint.

```ts
// src/lib/motion.ts:9
export const EASE_IN_OUT = 'easeInOut' as const;
```

```css
/* src/transitions.css:24,75,107,157 — one curve, six aliases */
--ease-in-out: ease-in-out;
--text-swap-ease: ease-in-out;
--icon-swap-ease: ease-in-out;
--reveal-ease: ease-in-out;
/* also --think-ease (:279) and --matrix-ease (:295) */
```

`EASE_IN_OUT` feeds `swapTransition` (`src/lib/motion.ts:128-131`), used by the weather label/time swaps and many text swaps.

## Target

One strong curve, exposed both as a TS token and a CSS var, with all movement aliases pointing at it:

```ts
// src/lib/motion.ts:9
export const EASE_IN_OUT = [0.77, 0, 0.175, 1] as const;
```

```css
/* src/transitions.css:24 */
--ease-in-out: cubic-bezier(0.77, 0, 0.175, 1);
```

Then repoint the semantic aliases that mean on-screen movement to `--ease-in-out`:

```css
--text-swap-ease: var(--ease-in-out);
--icon-swap-ease: var(--ease-in-out);
--reveal-ease: var(--ease-in-out);
--think-ease: var(--ease-in-out);
--matrix-ease: var(--ease-in-out);
```

Do NOT repoint `--shimmer-ease: linear` or any pause/delay token. Keep `EASE_SMOOTH_OUT` unchanged.

## Repo conventions to follow

- `src/lib/motion.ts:4-7` states the TS and CSS token files must be kept in sync — this plan changes both halves together.
- `src/lib/motion.ts:8` `EASE_SMOOTH_OUT = [0.22, 1, 0.36, 1]` is the exemplar tuple form for TS.
- `src/transitions.css:18-23` declares `--ease-smooth-out` as the CSS counterpart.

## Steps

1. `src/lib/motion.ts:9` — replace `'easeInOut'` with `[0.77, 0, 0.175, 1] as const`. Confirm `swapTransition` at `:128-131` still typechecks (Motion accepts a 4-number bezier tuple).
2. `src/transitions.css:24` — replace `ease-in-out` with `cubic-bezier(0.77, 0, 0.175, 1)`.
3. `src/transitions.css:75,107,157,279,295` — replace each `ease-in-out` value with `var(--ease-in-out)`.
4. Leave all other tokens and component code unchanged.

## Boundaries

- Do NOT change `ease-out` / `--ease-out` semantics (tooltip opens use a different curve).
- Do NOT change any durations or distances.
- Do NOT touch built-in `ease-in-out` in `src/index.css` looping weather effects — those are constant ambient motion (`linear`-like) and are documented deliberate.
- If either token file has drifted, STOP and report drift.

## Verification

- **Mechanical**: `npm run lint` and `npm run build` must pass.
- **Feel check**: run the app and:
  - Change the weather label/time: text swaps should accelerate decisively through the middle instead of drifting; 150ms total still feels quick.
  - Trigger an icon swap in the top bar and a revealed list: same snappier midpoint.
  - In DevTools Animations at 10% playback, inspect the timing function and confirm `cubic-bezier(0.77, 0, 0.175, 1)`; confirm nothing else changed easing.
- **Done when**: no weak `ease-in-out` remains in the swap/reveal token paths, and TS/CSS tokens still match.
