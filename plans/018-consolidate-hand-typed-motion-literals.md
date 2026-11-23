# 018 — Consolidate hand-typed motion literals into tokens

- **Status**: TODO
- **Commit**: e5b288e
- **Severity**: LOW
- **Category**: Cohesion & tokens (7)
- **Estimated scope**: 8 files, ~20 lines

## Problem

Since the earlier token-consolidation plan (009) was merged, new code has reintroduced
literals that duplicate tokens declared in this repo — including inside the token
module itself:

```ts
// src/lib/motion.ts:135 — current
    transition: { duration: 0.25, ease: EASE_SMOOTH_OUT },
// src/lib/motion.ts:142 — current
  animate: { transition: { staggerChildren: DURATION.stagger, delayChildren: 0.04 } },
```

```tsx
// src/components/HourlyForecast.tsx:149 / :160 — current
           transition={{ duration: reducedMotion ? 0 : 0.35 }}
           transition={reducedMotion ? { duration: 0 } : { duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
```

```tsx
// src/components/InfoDrawer.tsx:308 / :316 — current
                   transition={{ duration: 0.25, ease: EASE_SMOOTH_OUT }}
                   transition={{ duration: 0.4, ease: EASE_SMOOTH_OUT }}
```

```tsx
// src/components/ui/Menu.tsx:323 — current
                   ? { opacity: 0, transition: { duration: 0.15 } }
```

```tsx
// src/components/LandmarkCard.tsx:1084 — current
             transition={{ duration: 0.15 }}
```

```tsx
// src/components/PassportModal.tsx:313 — current
               transition={reducedMotion ? { duration: 0 } : { duration: 0.5 }}
```

```css
/* src/index.css:151 and :181 — current (same curve typed twice) */
  animation: stampGo 2.2s cubic-bezier(0.2, 0.9, 0.2, 1) both;
  animation: bootRise 0.7s cubic-bezier(0.2, 0.9, 0.2, 1) 0.1s forwards;
```

```tsx
// src/components/Compass.tsx:565 — current (bare ease on an entrance)
               style={{ opacity: 0, transition: 'opacity 120ms ease' }}
```

`0.25 = DURATION.fast`, `0.4 = DURATION.slow`, `0.15 = DURATION.quick`,
`0.35 = DURATION.medium`, `0.5 = DURATION.emphasis`, `0.04 = DURATION.stagger`,
and `[0.16, 1, 0.3, 1]` is a near-twin of `EASE_SMOOTH_OUT = [0.22, 1, 0.36, 1]`
(AUDIT.md §7: "five hand-typed cubic-beziers that almost match is a consolidation finding").

## Target

Replace every literal above with the matching token. All visible timings stay within
one token step (the chart draw moves 0.45s → 0.5s, imperceptible for a line reveal).

| Location | Current | Target |
|---|---|---|
| `src/lib/motion.ts:135` | `duration: 0.25` | `duration: DURATION.fast` |
| `src/lib/motion.ts:142` | `delayChildren: 0.04` | `delayChildren: DURATION.stagger` |
| `src/components/HourlyForecast.tsx:149` | `duration: … 0.35` | `duration: … DURATION.medium` |
| `src/components/HourlyForecast.tsx:160` | `duration: 0.45, ease: [0.16, 1, 0.3, 1]` | `duration: DURATION.emphasis, ease: EASE_SMOOTH_OUT` |
| `src/components/InfoDrawer.tsx:308` | `duration: 0.25` | `duration: DURATION.fast` |
| `src/components/InfoDrawer.tsx:316` | `duration: 0.4` | `duration: DURATION.slow` |
| `src/components/ui/Menu.tsx:323` | `duration: 0.15` | `duration: DURATION.quick` |
| `src/components/LandmarkCard.tsx:1084` | `duration: 0.15` | `duration: DURATION.quick` |
| `src/components/PassportModal.tsx:313` | `duration: 0.5` | `duration: DURATION.emphasis` |
| `src/components/Compass.tsx:565` | `opacity 120ms ease` | `opacity 120ms ease-out` |

Add one CSS token for the twice-used dramatic curve, in `src/transitions.css` after
`--ease-bounce-strong`:

```css
  --ease-dramatic: cubic-bezier(0.2, 0.9, 0.2, 1); /* stamp, boot rise */
```

and use `var(--ease-dramatic)` at `src/index.css:151` and `:181`.

## Repo conventions to follow

- `src/lib/motion.ts:43-51` (`DURATION`) and `:8-9` (`EASE_SMOOTH_OUT`, `EASE_IN_OUT`)
  are the TS tokens; `src/transitions.css:9-49` is the CSS token block. Comment at
  `src/lib/motion.ts:3-6` requires the two files to stay in sync.
- `src/components/InfoDrawer.tsx:303-316` already uses `EASE_SMOOTH_OUT` with an
  `AnimatePresence` crossfade — the exemplar for a token-driven transition.
- Imports to extend (all already import from `../lib/motion`):
  - `src/components/HourlyForecast.tsx:6` → `import { DURATION, EASE_SMOOTH_OUT, SPRING } from '../lib/motion';`
  - `src/components/InfoDrawer.tsx:15` → add `DURATION`
  - `src/components/ui/Menu.tsx:16` → add `DURATION`
  - `src/components/PassportModal.tsx:21` → add `DURATION`
  - `src/components/LandmarkCard.tsx:32` and `src/components/Compass.tsx:4` already
    import `DURATION` — no change there.
- AUDIT.md §2: entering → `ease-out`; bare `ease` on an entrance is a finding.

## Steps

1. `src/lib/motion.ts` — replace the two literals at `:135` and `:142` with
   `DURATION.fast` and `DURATION.stagger`.
2. `src/transitions.css` — add `--ease-dramatic` as shown; then
   `src/index.css:151` and `:181` — replace the two literal curves with
   `var(--ease-dramatic)`. Do not alter either animation's duration or delay.
3. `src/components/HourlyForecast.tsx` — extend the import; replace `:149` and `:160`.
4. `src/components/InfoDrawer.tsx` — extend the import; replace `:308` and `:316`.
5. `src/components/ui/Menu.tsx` — extend the import; replace `:323`.
6. `src/components/LandmarkCard.tsx` — replace `:1084` (no import change).
7. `src/components/PassportModal.tsx` — extend the import; replace `:313`.
8. `src/components/Compass.tsx` — replace `ease` with `ease-out` in the inline
   transition at `:565` only.
9. Verify no other literal in the table remains (`grep` for the old values).

## Boundaries

- Do NOT change token **values** in `src/lib/motion.ts` or the existing token definitions
  in `src/transitions.css` (other components depend on them).
- Do NOT touch `src/App.tsx:2135` (`ease: 'easeOut'` on the 2.2s cinematic title) — that
  is a deliberate rare moment.
- Do NOT change any markup, `initial`/`animate`/`exit` values, reduced-motion branches,
  or component props other than the listed transition fields.
- Do NOT add dependencies.
- If any cited line no longer matches verbatim, STOP and report drift rather than
  guessing at a replacement.

## Verification

- **Mechanical**: `npm run lint` and `npm run build` must pass.
- **Feel check**:
  - DevTools → Animations → 10% playback: trigger a text swap, an info-drawer
    crossfade, a menu close, a passport tab change and the hourly chart reveal. Each
    still moves in the same direction with the same family of curve; the chart line
    now draws in 500ms instead of 450ms.
  - Boot the app and watch the stamp and boot-rise sequences: the new
    `--ease-dramatic` token resolves to exactly `cubic-bezier(0.2, 0.9, 0.2, 1)`, so
    their feel is unchanged.
  - Hover the compass ring: the gold bearing pip still fades in over 120ms, now with
    `ease-out`.
  - Toggle `prefers-reduced-motion`: every affected element still takes its
    reduced-motion branch.
- **Done when**: no hand-typed duplicate of a declared token remains in the table's
  locations, and no visible timing changed by more than 50ms.
