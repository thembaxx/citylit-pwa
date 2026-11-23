# 015 — Bring the theme crossfade under the 300ms UI budget

- **Status**: TODO
- **Commit**: e5b288e
- **Severity**: MEDIUM
- **Category**: Easing & duration (2)
- **Estimated scope**: 2 files, ~4 lines

## Problem

Changing theme crossfades four layers on four different clocks. The page background
uses `--duration-slow` (400ms), the two full-screen vignettes use a Tailwind
`duration-700` (700ms), and the desktop orbit hint uses `duration-500` (500ms):

```css
/* src/index.css:77 — current */
  transition:
    background-color var(--duration-slow) var(--ease-smooth-out),
    color var(--duration-slow) var(--ease-smooth-out);
```

```tsx
// src/App.tsx:1637 / :1643 — current
className={`fixed inset-0 pointer-events-none bg-[radial-gradient(...)] transition-opacity duration-700 ease-out ${...}`}
```

```tsx
// src/App.tsx:1878 — current
className={`hidden md:block fixed ... pointer-events-none transition-colors duration-500 ${...}`}
```

The 700ms vignette keeps darkening (or lightening) for 300ms after the rest of the UI
has settled — the layers visibly lag each other. All three exceed the 300ms UI budget
in AUDIT.md §2; 200–500ms is reserved for modals and drawers, not theme colour changes.

## Target

Standardize every layer on **250ms** with `ease-out`, using the existing tokens
(`--duration-fast: 250ms`, `--ease-out: ease-out` in `src/transitions.css:13,25`):

```css
/* target — src/index.css:77 */
  transition:
    background-color var(--duration-fast) var(--ease-out),
    color var(--duration-fast) var(--ease-out);
```

```tsx
// target — src/App.tsx:1637 and :1643 (both vignette divs)
className={`fixed inset-0 pointer-events-none bg-[radial-gradient(...)] transition-opacity duration-[250ms] ease-out ${...}`}
```

```tsx
// target — src/App.tsx:1878
className={`hidden md:block fixed ... pointer-events-none transition-colors duration-[250ms] ease-out ${...}`}
```

The gradient definitions, `opacity-100`/`opacity-0` branches, text colours and every
other class are unchanged. Do not edit the `--duration-slow` token itself — it is used
by panel reveals elsewhere.

## Repo conventions to follow

- `src/transitions.css:10-26` is the shared duration/easing token scale; `--duration-fast`
  and `--ease-out` already exist.
- `src/index.css:600` uses `transition: opacity 200ms var(--ease-out)` on the dialog
  backdrop — the same idea (opacity + colour, short, ease-out).
- AUDIT.md §2: hover/colour changes use `ease`; UI animations stay under 300ms.

## Steps

1. In `src/index.css:77-79`, replace both `--duration-slow var(--ease-smooth-out)`
   pairs with `--duration-fast var(--ease-out)`.
2. In `src/App.tsx`, replace `transition-opacity duration-700 ease-out` with
   `transition-opacity duration-[250ms] ease-out` in **both** vignette divs (`:1637`
   and `:1643`).
3. In `src/App.tsx:1878`, replace `transition-colors duration-500` with
   `transition-colors duration-[250ms] ease-out`.
4. Change nothing else.

## Boundaries

- Do NOT edit the `--duration-slow` or `--ease-smooth-out` token definitions; other
  animations depend on them.
- Do NOT touch theme resolution logic (`src/lib/theme.ts`) or the settings UI.
- Do NOT change the vignette gradients or opacity values.
- Do NOT add dependencies.
- If any of the four class strings no longer match verbatim, STOP and report drift.

## Verification

- **Mechanical**: `npm run lint` and `npm run build` must pass.
- **Feel check**:
  - Switch theme in Settings (dark → daylight → studio): page, vignettes and hint
    text all finish together in ~250ms; no layer keeps fading after the others stop.
  - Wait for an automatic theme-boundary change (or set the system theme) and confirm
    the same synchrony.
  - DevTools → Animations → 10% playback: all four transitions start on the same
    frame and have the same 250ms length.
  - Toggle `prefers-reduced-motion`: the global reduced-motion block at
    `src/index.css:627-636` forces colour/opacity transitions to 200ms; confirm the
    fade still exists and no layer pops instantly.
- **Done when**: theme change reads as one 250ms crossfade across all four layers.
