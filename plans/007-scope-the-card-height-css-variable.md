# 007 — Scope the card-height CSS variable write

- **Status**: DONE
- **Commit**: e444ba6
- **Severity**: MEDIUM
- **Category**: Performance (5)
- **Estimated scope**: 2 files, ~20 lines

## Problem

```tsx
// src/components/LandmarkCard.tsx:270-281
const sync = () => root.style.setProperty('--cl-card-h', `${el.offsetHeight}px`);
sync();
const ro = new ResizeObserver(sync);
ro.observe(el);
```

Every observed resize writes a CSS custom property on `document.documentElement`, which feeds `bottom` / `top` / `max-height` calculations on fixed overlays (`src/App.tsx:1728`, `src/index.css:526`, `src/App.tsx:1643`). That is a document-wide style recalculation and layout pass on each callback, over the continuously rendering 3D canvas. Reading `offsetHeight` in the same callback also forces a synchronous layout read after any prior write.

## Target

Throttle the observer callback to one write per animation frame, read before write, and skip writes when the height has not changed:

```tsx
let frame = 0;
let lastHeight = -1;
const sync = () => {
  if (frame) return;
  frame = requestAnimationFrame(() => {
    frame = 0;
    const h = el.offsetHeight; // read first
    if (h === lastHeight) return;
    lastHeight = h;
    root.style.setProperty('--cl-card-h', `${h}px`); // then write
  });
};
```

Keep the cleanup (`ro.disconnect()` and `cancelAnimationFrame(frame)`).

Do not move the variable to a narrower scope in this plan: the fixed overlays are siblings of the card under `body`, so the root variable is the correct channel; the win is eliminating redundant writes and forced synchronous layout.

## Repo conventions to follow

- `src/components/LandmarkCard.tsx:269-281` is the existing effect; keep its structure and cleanup pattern.
- `src/App.tsx:1728` consumes `var(--cl-card-h, 218px)` — the 218px fallback must remain valid.
- Do not add a dependency (no `useResizeObserver` package).

## Steps

1. `src/components/LandmarkCard.tsx:270` — keep `const root = document.documentElement;`.
2. Replace the `sync` function at `:276` with the rAF-throttled version above, adding `let frame = 0; let lastHeight = -1;` in the effect scope.
3. Extend the cleanup at `:280-282` with `cancelAnimationFrame(frame);`.
4. Leave all consumers (`src/App.tsx`, `src/index.css`) unchanged.

## Boundaries

- Do NOT change the variable name `--cl-card-h` or its default value.
- Do NOT change overlay positioning rules.
- Do NOT add dependencies.
- If the ResizeObserver block has changed shape, STOP and report drift.

## Verification

- **Mechanical**: `npm run lint` and `npm run build` must pass.
- **Feel check**: run the app and:
  - Resize the window rapidly (and rotate a device in DevTools): overlays keep their spacing without jitter; no overlay overlaps the card.
  - Open DevTools Performance, record 2s of continuous landmark switching plus window resize: count style/layout events caused by `--cl-card-h` — there should be at most one per animation frame and none when the card height is unchanged.
  - Toggle the note panel so the card height changes: overlays settle within one frame.
- **Done when**: no more than one `--cl-card-h` write per frame, no read-after-write layout thrash, overlays remain correctly positioned.
