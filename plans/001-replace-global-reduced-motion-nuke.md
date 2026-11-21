# 001 — Replace the global reduced-motion nuke with scoped compose rules

- **Status**: DONE
- **Commit**: e444ba6
- **Severity**: HIGH
- **Category**: Accessibility (6)
- **Estimated scope**: 1 file, ~20 lines

## Problem

`src/index.css:595-605` disables every animation and transition globally:

```css
/* src/index.css:595 — current */
body.rm * {
  animation: none !important;
  transition: none !important;
}

@media (prefers-reduced-motion: reduce) {
  * {
    animation: none !important;
    transition: none !important;
  }
}
```

Two problems. First, the `!important` universal selector beats the scoped "keep the fade" rules at `src/index.css:486-497`, so the compass's opacity-only `compass-enter-reduced` animation never runs — reduced-motion users lose *all* feedback instead of getting a gentler version. Second, it cannot touch Motion's inline `transform`/`opacity` styles, so it gives a false impression that reduced motion is handled globally while JS-driven motion continues (plans 002 covers those components).

## Target

Keep opacity/colour transitions (they aid comprehension), drop transform-based and keyframe movement. Preserve the existing opacity-only compass fade explicitly.

```css
/* target — replaces the block at src/index.css:595 */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-property: opacity, color, background-color, border-color, fill, stroke !important;
    transition-duration: 200ms !important;
    scroll-behavior: auto !important;
  }

  /* Keep the comprehension fade; the higher-specificity selector wins over `*`. */
  .compass,
  .compass--reduced {
    animation: compass-enter-reduced 200ms ease-out both !important;
  }
}

/* Settings-driven "reduced motion" must behave identically. */
body.rm *,
body.rm *::before,
body.rm *::after {
  animation-duration: 0.01ms !important;
  animation-iteration-count: 1 !important;
  transition-property: opacity, color, background-color, border-color, fill, stroke !important;
  transition-duration: 200ms !important;
}
body.rm .compass {
  animation: compass-enter-reduced 200ms ease-out both !important;
}
```

`200ms` is the strong-ease-out tooltip/small-surface budget from AUDIT.md §2; `ease-out` is the required direction for an entrance. Do not add new easing values.

## Repo conventions to follow

- `src/index.css:486` already documents the intent: "Reduced motion keeps the fade (comprehension) but drops the movement."
- `src/index.css:393` uses a third opt-out mechanism `[data-motion='reduce'] .province-pill` — leave it untouched; it targets a single keyframe and is already correct.
- `src/lib/motion.ts:8` holds the TS motion tokens; this plan is CSS-only and must not fork them.

## Steps

1. Replace the `body.rm *` + `@media` block at `src/index.css:595-605` with the target CSS above.
2. Keep `compass-enter-reduced` (`src/index.css:499-506`) unchanged; it is the exemplar of an opacity-only reduced-motion animation.
3. Do not change any component files in this plan.

## Boundaries

- Do NOT touch `src/lib/motion.ts` or any component motion props — that is plan 002.
- Do NOT remove `[data-motion='reduce']` rules.
- Do NOT add dependencies.
- If the block at `src/index.css:595` no longer matches verbatim, STOP and report drift.

## Verification

- **Mechanical**: `npm run lint` and `npm run build` must pass.
- **Feel check**: run the app, enable `prefers-reduced-motion: reduce` in DevTools (Rendering panel), then:
  - Trigger the compass entrance (switch landmarks): the dial should still fade in over ~200ms but not slide/scale.
  - Change theme: `html/body` background/colour should still crossfade.
  - Toggle the settings "reduced motion" option and repeat — identical behaviour.
  - In DevTools Animations panel at 10% playback, confirm no transform keyframes remain.
- **Done when**: opacity/colour feedback survives; no CSS transform or keyframe movement runs under either reduced-motion mechanism.
