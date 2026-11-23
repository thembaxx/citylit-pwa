# 012 — Gate the compass dial hover lift on a fine pointer

- **Status**: TODO
- **Commit**: e5b288e
- **Severity**: MEDIUM
- **Category**: Accessibility (6)
- **Estimated scope**: 1 file, ~24 lines

## Problem

`src/index.css:465-478` puts a transform on `:hover` for a control that is explicitly
touch-driven (`touch-action: none` at `src/index.css:457`):

```css
/* src/index.css:465 — current */
.compass__dial:hover,
.compass__dial:focus-within {
  transform: translateY(-1px) scale(1.045);
  border-color: rgba(232, 176, 74, 0.62);
  box-shadow:
    0 12px 30px rgba(0, 0, 0, 0.58),
    0 0 0 1px rgba(232, 176, 74, 0.24),
    0 0 18px rgba(232, 176, 74, 0.16),
    inset 0 1px 0 rgba(255, 255, 255, 0.18);
}

.compass__dial:hover svg {
  filter: drop-shadow(0 0 3px rgba(232, 176, 74, 0.35));
}
```

On touch, a tap fires a sticky `:hover`, so after every drag the dial stays lifted,
scaled and glowing until focus moves elsewhere. Touch users get the wrong persistent
state on a high-frequency control. The repo has a `useFinePointer()` hook
(`src/hooks/useFinePointer.ts`) that is currently unused; this CSS fix does not need it.

## Target

Keep the keyboard `:focus-within` lift for everyone. Move **only the `:hover` rules**
into a `@media (hover: hover) and (pointer: fine)` block, placed after the
`:focus-within` block and before `.compass__dial[data-dragging='true']` so the dragging
state still wins the cascade:

```css
/* target — replaces src/index.css:465-478 */
.compass__dial:focus-within {
  transform: translateY(-1px) scale(1.045);
  border-color: rgba(232, 176, 74, 0.62);
  box-shadow:
    0 12px 30px rgba(0, 0, 0, 0.58),
    0 0 0 1px rgba(232, 176, 74, 0.24),
    0 0 18px rgba(232, 176, 74, 0.16),
    inset 0 1px 0 rgba(255, 255, 255, 0.18);
}

/* Touch fires a sticky :hover on tap — only real pointers get the lift. */
@media (hover: hover) and (pointer: fine) {
  .compass__dial:hover {
    transform: translateY(-1px) scale(1.045);
    border-color: rgba(232, 176, 74, 0.62);
    box-shadow:
      0 12px 30px rgba(0, 0, 0, 0.58),
      0 0 0 1px rgba(232, 176, 74, 0.24),
      0 0 18px rgba(232, 176, 74, 0.16),
      inset 0 1px 0 rgba(255, 255, 255, 0.18);
  }

  .compass__dial:hover svg {
    filter: drop-shadow(0 0 3px rgba(232, 176, 74, 0.35));
  }
}
```

The 180ms `transition` on `.compass__dial` (`src/index.css:459-462`) and every value
inside the blocks are unchanged — only the media-query wrapper is new.

## Repo conventions to follow

- `src/index.css:396-401` already gates a transform on reduced motion with a scoped
  selector; gating pointer-dependent transforms is the same idea.
- AUDIT.md §6 gives the exact gate: `@media (hover: hover) and (pointer: fine)`.
- Do **not** reach for `useFinePointer()` — this is a pure CSS hover state and adding a
  re-render to the compass would regress the stutter fix documented at
  `src/components/Compass.tsx:92-94`.

## Steps

1. In `src/index.css`, remove the `, .compass__dial:focus-within` selector from the
   hover rule at `:465`, leaving a standalone `.compass__dial:focus-within` block with
   the identical declarations.
2. Wrap the now-standalone `.compass__dial:hover` block **and** the
   `.compass__dial:hover svg` block in `@media (hover: hover) and (pointer: fine)`,
   placed immediately after the `:focus-within` block and before the
   `.compass__dial[data-dragging='true']` rule at `:480`.
3. Change nothing else in the file.

## Boundaries

- Do NOT touch `.compass__dial`'s `transition`, `[data-dragging='true']`, the
  `@keyframes compass-enter*` rules, or the reduced-motion blocks.
- Do NOT change any TypeScript or component props.
- Do NOT add dependencies.
- If the selector at `src/index.css:465` no longer matches verbatim, STOP and report drift.

## Verification

- **Mechanical**: `npm run lint` and `npm run build` must pass.
- **Feel check**:
  - DevTools → device toolbar with touch emulation: tap and drag the dial, release,
    wait 1s. The dial must return to its rest state — no lingering lift, scale or glow.
  - Switch back to a mouse: hovering the dial still lifts it by ~1px with the gold
    glow after 180ms; leaving settles it.
  - Tab to the dial (keyboard): the focus lift still appears on touch-only devices,
    because `:focus-within` is ungated.
  - Start a drag and confirm `[data-dragging='true']` still wins over `:hover`.
  - Toggle `prefers-reduced-motion` in the Rendering panel: unchanged.
- **Done when**: touch never shows a sticky hover state; mouse and keyboard lifts are unchanged.
