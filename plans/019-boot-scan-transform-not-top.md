# 019 — Move the boot scan line with a transform, not `top`

- **Status**: TODO
- **Commit**: e5b288e
- **Severity**: LOW
- **Category**: Performance (5)
- **Estimated scope**: 1 file, ~4 lines

## Problem

The boot splash's scanning line animates the `top` offset on an infinite 2.4s loop:

```css
/* src/index.css:213-234 — current */
.boot-splash__scan {
  top: 14%;
  animation: bootScan 2.4s cubic-bezier(0.4, 0, 0.3, 1) 0.5s infinite;
}

@keyframes bootScan {
  0% {
    top: 14%;
    opacity: 0;
  }
  12% {
    opacity: 1;
  }
  75% {
    opacity: 0.9;
  }
  90%,
  100% {
    top: 86%;
    opacity: 0;
  }
}
```

`top` triggers layout + paint on every frame while the Three.js engine is warming up
behind the splash. A compositor-only `transform` does the same job. LOW severity because
it is a short, one-time boot effect and the reduced-motion block at `src/index.css:627-636`
already neutralizes it.

## Target

The containing block is `.boot-splash`, which is `fixed inset-0`
(`src/components/BootSplash.tsx:44`) — i.e. full viewport height. Keep the element
pinned at `top: 14%` and animate a `translateY` of 72vh (14% → 86%). The repo already
uses `dvh` units (`src/index.css:546,560`), so use `72dvh` for correct mobile sizing:

```css
/* target — src/index.css:213-234 */
.boot-splash__scan {
  top: 14%;
  animation: bootScan 2.4s cubic-bezier(0.4, 0, 0.3, 1) 0.5s infinite;
}

@keyframes bootScan {
  0% {
    transform: translateY(0);
    opacity: 0;
  }
  12% {
    opacity: 1;
  }
  75% {
    opacity: 0.9;
  }
  90%,
  100% {
    transform: translateY(72dvh);
    opacity: 0;
  }
}
```

Duration, easing, delay, iteration count, opacity keyframes, the `top: 14%` static
offset and the element's classes are unchanged.

## Repo conventions to follow

- AUDIT.md §5: animate `transform` and `opacity` only; layout properties cost layout +
  paint + composite.
- `src/index.css:173-193` (`bootRise`) is the exemplar for a boot keyframe that moves
  with `transform: translateY()` and opacity.
- Do not add `will-change` — AUDIT.md §5 only recommends it when measurement shows a
  benefit, and a 1px line does not warrant a permanent layer.

## Steps

1. In `src/index.css:218` (`@keyframes bootScan`), change the `0%` keyframe's
   `top: 14%;` to `transform: translateY(0);`.
2. In the `90%, 100%` keyframe at `:229-233`, change `top: 86%;` to
   `transform: translateY(72dvh);`.
3. Leave `.boot-splash__scan` at `:213-216` untouched — it keeps `top: 14%`.
4. Change nothing else.

## Boundaries

- Do NOT change the boot splash's markup, classes, duration, easing, delay or opacity
  keyframes.
- Do NOT touch the other `boot*` keyframes or the `data-static='true'` overrides.
- Do NOT add dependencies.
- If the `@keyframes bootScan` block at `src/index.css:218` no longer matches verbatim,
  STOP and report drift.

## Verification

- **Mechanical**: `npm run lint` and `npm run build` must pass.
- **Feel check**:
  - Reload the app and watch the boot splash: the gold scan line still sweeps from
    roughly 14% to 86% of the splash height on the same 2.4s loop with the same fade.
  - DevTools → Performance: record a reload and confirm the scan produces no layout
    events; only transform/opacity compositor work.
  - DevTools → Animations → 10% playback: confirm the transform keyframe starts at
    translateY(0) and ends at translateY(72dvh) with `top` constant at 14%.
  - On a mobile device emulation, confirm the sweep still reaches near the bottom of
    the splash (dvh keeps it correct when browser chrome is visible).
  - Toggle `prefers-reduced-motion`: the global block keeps the line static.
- **Done when**: no `top` animation remains in `@keyframes bootScan` and the sweep looks unchanged.
