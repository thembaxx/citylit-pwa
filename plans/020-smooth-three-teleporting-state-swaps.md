# 020 — Smooth three teleporting state swaps

- **Status**: TODO
- **Commit**: e5b288e
- **Severity**: LOW
- **Category**: Missed opportunities (8)
- **Estimated scope**: 3 files, ~40 lines

## Problem

Three content changes snap into place while their neighbours animate:

```tsx
// src/components/HourlyForecast.tsx:84-94 — header swaps on hover/focus
        {focusedSlot && focusedLabel ? (
          <span className="text-[10.5px] font-mono tabular-nums text-[#e8b04a] truncate">
            {focusedSlot.label} · {focusedLabel} · {focusedSlot.temp}°
          </span>
        ) : (
          <span className="text-[10.5px] font-mono tabular-nums text-[#a9a69e] whitespace-nowrap">
            <span>{curve.minTemp}°</span>
            <span className="mx-1 text-white/30">–</span>
            <span className="text-[#e8b04a]">{curve.maxTemp}°C</span>
          </span>
        )}
```

```tsx
// src/components/ScaleRulerModal.tsx:222-224 — 43 rows teleport when Sort changes
        <ul className="m-0 p-0 list-none space-y-2.5" aria-label="Landmark dimensions">
          {rows.map((row) => (
            <li key={row.index}>
```

```tsx
// src/App.tsx:1996-1997 — repeated facts replace text in place
              <Sparkle size={16} weight="fill" className="text-[#e8b04a] shrink-0 mt-0.5" />
              <span>{factText}</span>
```

The repo already defines `swapVariants` / `swapTransition` for exactly the text-state
seam (`src/lib/motion.ts:155-163`: 4px travel + 2px blur, symmetric 150ms), and the
scale ruler's own sort pill already animates with `layoutId="ruler-sort-pill"`.

**Performance caveat:** Motion's `layout` runs on the main thread in every version
(AUDIT.md §5). The list change is therefore a single 250ms morph on ~43 rows, gated
by reduced motion and verified for frame drops — not a decorative stagger.

## Target

### 1. HourlyForecast header

Wrap the two states in `AnimatePresence mode="wait" initial={false}` and give each a
stable key. Use the shared swap recipe and a zero-duration reduced-motion branch:

```tsx
        <AnimatePresence mode="wait" initial={false}>
          {focusedSlot && focusedLabel ? (
            <motion.span
              key="focused"
              variants={swapVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={reducedMotion ? { duration: 0 } : swapTransition}
              className="text-[10.5px] font-mono tabular-nums text-[#e8b04a] truncate"
            >
              {focusedSlot.label} · {focusedLabel} · {focusedSlot.temp}°
            </motion.span>
          ) : (
            <motion.span
              key="range"
              variants={swapVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={reducedMotion ? { duration: 0 } : swapTransition}
              className="text-[10.5px] font-mono tabular-nums text-[#a9a69e] whitespace-nowrap"
            >
              <span>{curve.minTemp}°</span>
              <span className="mx-1 text-white/30">–</span>
              <span className="text-[#e8b04a]">{curve.maxTemp}°C</span>
            </motion.span>
          )}
        </AnimatePresence>
```

### 2. Scale ruler list reorder

```tsx
        <ul className="m-0 p-0 list-none space-y-2.5" aria-label="Landmark dimensions">
          {rows.map((row) => (
            <motion.li
              key={row.index}
              layout={!reducedMotion}
              transition={reducedMotion ? { duration: 0 } : SPRING.morph}
            >
```

The closing `</li>` becomes `</motion.li>`. Everything inside each row is unchanged.

### 3. Fact callout text

```tsx
              <Sparkle size={16} weight="fill" className="text-[#e8b04a] shrink-0 mt-0.5" />
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={factText}
                  variants={swapVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  transition={reducedMotion ? { duration: 0 } : swapTransition}
                >
                  {factText}
                </motion.span>
              </AnimatePresence>
```

The outer `motion.div` (`key="fact"`, `toastVariants`) is unchanged — this only animates
the text inside an already-mounted callout.

## Repo conventions to follow

- `src/lib/motion.ts:155-163` defines `swapVariants` and `swapTransition` — the exemplar,
  already used by `src/components/ui/Sheet.tsx`, `src/components/InfoDrawer.tsx:303-316`
  and `src/components/TopBar.tsx:71-74`.
- `SPRING.morph` (`src/lib/motion.ts:75`) is the repo's gentle morph config, used for
  accordions and shared-element transitions — appropriate for a list reorder.
- Import edits:
  - `src/components/HourlyForecast.tsx:1-6` — `AnimatePresence` from `motion/react`;
    add `swapVariants, swapTransition` to the `../lib/motion` import.
  - `src/components/ScaleRulerModal.tsx:3,10` — `motion` is already imported; add
    `SPRING` to the `../lib/motion` import (note plan 017 also edits line 10 — apply
    that plan first, then add `SPRING` to the resulting import).
  - `src/App.tsx:3-11` — `AnimatePresence` already imported; add `swapVariants,
    swapTransition` to the `./lib/motion` import.
- AUDIT.md §7: a jarring state change is a missed opportunity; stagger is decorative
  and must never block interaction.

## Steps

1. `src/components/HourlyForecast.tsx` — extend the two imports, then replace the
   ternary at `:84-94` with the `AnimatePresence` block above.
2. `src/components/ScaleRulerModal.tsx` — extend the import at `:10` (after plan 017
   is applied), then convert the `<li>` at `:224` to `<motion.li>` with the `layout`
   and `transition` props; change its closing tag to `</motion.li>`.
3. `src/App.tsx` — extend the import at `:4-11`, then wrap `<span>{factText}</span>`
   at `:1997` as shown.
4. Change nothing else.

## Boundaries

- Do NOT change the outer fact callout's key or `toastVariants` — that would animate
  the whole card and could stack two callouts.
- Do NOT remove `key={row.index}` from the list rows; identity must stay stable.
- Do NOT add a stagger to the list — the reorder itself is the explanation, and a
  stagger would delay reading 43 rows.
- Do NOT touch `PillNavigation` or the sort pills.
- Do NOT add dependencies.
- If any of the three excerpts no longer matches verbatim, STOP and report drift.

## Verification

- **Mechanical**: `npm run lint` and `npm run build` must pass.
- **Feel check**:
  - Hover/unhover hourly forecast columns: the header crossfades between the focused
    readout and the min/max range in ~150ms with a 4px rise, no double-exposure.
  - Change `Sort` in the scale ruler: the 43 rows glide to their new positions; record
    with DevTools Performance and confirm no long frames (>16ms) on a mid-range device.
    If frames drop, revert step 2 only and report it.
  - Trigger two facts in a row (tap wildlife / find a hidden detail): the text inside
    the visible callout swaps with the same 150ms recipe; the card itself does not
    re-enter.
  - DevTools → Animations → 10% playback: confirm the 4px travel and 2px blur on
    both swaps, and the shared-layout morph on the list.
  - Toggle `prefers-reduced-motion` and the app setting: all three changes become
    instant/opacity-only; the list does not morph.
- **Done when**: no cited state change teleports, reduced motion is honored, and the
  list reorder stays within frame budget (or step 2 is reverted with a report).
