# 009 — Consolidate hand-typed motion values onto existing tokens

- **Status**: DONE
- **Commit**: e444ba6
- **Severity**: LOW
- **Category**: Cohesion & tokens (7), Easing & duration (2)
- **Estimated scope**: 6 files, ~15 value replacements

## Problem

The repo already centralises curves and durations in `src/lib/motion.ts` and `src/transitions.css`, but several call sites retype near-identical values, and a few CSS entrances use the weakest built-in `ease`:

```tsx
// src/components/TopBar.tsx:105
transition={{ duration: reducedMotion ? 0 : 0.4, ease: [0.22, 1, 0.36, 1] }}

// src/components/ui/SettleModal.tsx:34
transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] as const, delay: 0.05 },

// src/App.tsx:1786 — near-identical to SPRING.pop
transition={{ type: 'spring', stiffness: 260, damping: 18, mass: 0.7 }}
```

```css
/* src/index.css:74-75 — global theme crossfade exceeds the 300ms UI budget */
background-color 650ms cubic-bezier(0.22, 1, 0.36, 1),
color 450ms cubic-bezier(0.22, 1, 0.36, 1);

/* src/index.css:119,568,579 — bare built-in ease on entrances */
animation: titleCine 2.2s ease both;
transition: opacity 200ms ease;
```

AUDIT.md §7 calls duplicated near-identical easings/durations a consolidation finding; §2 requires `ease-out` (or the strong curve) for entrances rather than bare `ease`.

## Target

Replace duplicates with existing tokens. Do not invent new values.

| Location | Replace with |
| --- | --- |
| `TopBar.tsx:105` | `EASE_SMOOTH_OUT`, `DURATION.slow` |
| `SettleModal.tsx:34` | `EASE_SMOOTH_OUT` (keep `0.3` and `delay: 0.05` — no matching token) |
| `App.tsx:1786` | `SPRING.pop` |
| `index.css:74-75` | `var(--ease-smooth-out)` and `var(--duration-slow)` (400ms), bringing 650/450ms into the existing scale |
| `index.css:119` | `var(--ease-out)` (keep the 2.2s cinematic duration — deliberate, like marketing/explanatory motion) |
| `index.css:568,579` | `var(--ease-out)` |
| `index.css:147,177` (stampGo/bootRise), `:166` (bootDraw), `:234` (bootBar), `:456,580` | `var(--ease-smooth-out)` for the 0.22/1/0.36/1 cases; leave genuinely different curves (e.g. `0.34,1.35,0.64,1`) alone |

## Repo conventions to follow

- `src/lib/motion.ts:8-19` exports `EASE_SMOOTH_OUT` and `DURATION.slow`.
- `src/lib/motion.ts:45` exports `SPRING.pop` — the intended token for the passport stamp.
- `src/transitions.css:18` `--ease-smooth-out`, `:25` `--ease-out`, `:15` `--duration-slow` are the CSS counterparts.
- `src/components/TopBar.tsx:103-105` is the exemplar of reduced-motion-aware token use; keep that structure.

## Steps

1. `src/components/TopBar.tsx` — import `DURATION` and `EASE_SMOOTH_OUT` from `../../lib/motion`; change line 105 to `transition={reducedMotion ? { duration: 0 } : { duration: DURATION.slow, ease: EASE_SMOOTH_OUT }}`.
2. `src/components/ui/SettleModal.tsx` — import `EASE_SMOOTH_OUT`; at line 34 use `ease: EASE_SMOOTH_OUT`, keep `duration: 0.3, delay: 0.05`.
3. `src/App.tsx:1786` — import `SPRING` from `./lib/motion` if needed; use `transition={SPRING.pop}` (keep the reduced-motion branches at `:1783-1784`).
4. `src/index.css` — apply the CSS replacements in the table above, one at a time; preserve all keyframe percentages and durations except the 650/450ms pair.
5. Leave `src/lib/motion.ts` and `src/transitions.css` token declarations unchanged in this plan (plan 008 handles the ease-in-out token).

## Boundaries

- Do NOT change the cinematic title's 2.2s duration or the stamp's 2.2s duration — those are deliberate rare moments.
- Do NOT change `EASE_IN_OUT` (plan 008).
- Do NOT alter any keyframe percentages or layout.
- If a hand-typed value has a documented reason in a comment, leave it and report it instead.

## Verification

- **Mechanical**: `npm run lint` and `npm run build` must pass.
- **Feel check**:
  - Trigger the top-bar entrance, the settle modal and the passport stamp: motion should feel unchanged (same curve family, same shape), not faster or bouncier.
  - Change theme: the global background crossfade is now 400ms with the same curve; confirm it still feels smooth and does not linger.
  - Start the cinematic tour: the title still takes 2.2s but eases out instead of starting weakly.
  - Grep the touched files for `0.22, 1, 0.36, 1` and bare `ease` — only token declarations should remain.
- **Done when**: no duplicated curve/duration literals remain in the listed call sites.
