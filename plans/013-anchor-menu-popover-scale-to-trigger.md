# 013 — Make the desktop menu popover scale from its trigger

- **Status**: TODO
- **Commit**: e5b288e
- **Severity**: MEDIUM
- **Category**: Physicality & origin (3)
- **Estimated scope**: 1 file, ~2 lines

## Problem

`src/components/ui/Menu.tsx` explicitly positions its desktop popover from the trigger
(`anchorRef.getBoundingClientRect()` at `:159-169`), then scales it in from 0.97:

```tsx
// src/components/ui/Menu.tsx:304 — current
              style={
                isPhone
                  ? { zIndex: Z.menu }
                  : {
                      zIndex: Z.menu,
                      top: anchorPos?.top ?? 0,
                      left: anchorPos?.left ?? 0,
                      minWidth: anchorPos?.width,
                    }
              }
```

```tsx
// src/components/ui/Menu.tsx:319 — current
              initial={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: tokens.preScale, y: -4 }}
```

No `transform-origin` is set anywhere on this element, so it grows from its own center
rather than from the button it belongs to. The component's own docstring says "on larger
screens it anchors to the trigger button" (`:23-24`), so the motion contradicts the
layout. Modals are the exempt case; this is a dropdown.

## Target

Set an explicit origin on the desktop branch only. The panel's right edge is aligned to
`rect.right - width` when `align === 'end'` (the default) and its left edge to
`rect.left` otherwise, so the matching origins are `top right` and `top left`:

```tsx
// target — src/components/ui/Menu.tsx:304
              style={
                isPhone
                  ? { zIndex: Z.menu }
                  : {
                      zIndex: Z.menu,
                      top: anchorPos?.top ?? 0,
                      left: anchorPos?.left ?? 0,
                      minWidth: anchorPos?.width,
                      transformOrigin: align === 'end' ? 'top right' : 'top left',
                    }
              }
```

Everything else — `tokens.preScale` (0.97), `y: -4`, `tokens.open` (250ms),
`tokens.ease`, the reduced-motion opacity-only branch, and the phone bottom-popover
branch — stays exactly as it is.

## Repo conventions to follow

- `src/lib/motion.ts:11-12` defines `PRESS_SCALE = 0.96`; dropdown scale/duration/ease
  are read from CSS tokens in `readDropdownTokens()` (`src/components/ui/Menu.tsx:65-93`).
  This plan adds no new token or dependency.
- `src/App.tsx:2109-2120` sets `transformOrigin` explicitly on `scaleY` letterbox bars —
  the exemplar for "scaling surfaces declare their origin".
- AUDIT.md §3: popovers/dropdowns/tooltips scale from their trigger; only modals are
  exempt.

## Steps

1. In `src/components/ui/Menu.tsx`, add the single `transformOrigin` line shown above
   to the non-phone `style` object at `:307-312`.
2. Do not touch the phone branch, the `className`, the variants, or any other file.

## Boundaries

- Do NOT set a transform-origin on the phone bottom-popover branch; it is a different
  surface and the current behaviour is correct.
- Do NOT change the `y: -4` direction or any duration/easing — this plan is about origin only.
- Do NOT add dependencies.
- If the `style` prop at `src/components/ui/Menu.tsx:304` no longer matches verbatim,
  STOP and report drift.

## Verification

- **Mechanical**: `npm run lint` and `npm run build` must pass.
- **Feel check**:
  - Open a menu from a right-aligned trigger (default `align="end"`) and watch the
    first ~250ms: the panel grows out of the corner nearest the button, not out of the
    middle of the screen.
  - Open a left-aligned menu (`align="start"`) and confirm the origin flips to top-left.
  - DevTools → Animations → set playback to 10% and confirm the scale starts at the
    declared origin.
  - Toggle `prefers-reduced-motion`: still opacity-only, no scale at all.
  - Spam open/close: the panel never jumps origin mid-flight.
- **Done when**: desktop dropdown scale is anchored; phone and reduced-motion paths unchanged.
