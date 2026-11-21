# 010 — Animate the offline pill and cinematic letterbox bars

- **Status**: DONE
- **Commit**: e444ba6
- **Severity**: LOW
- **Category**: Missed opportunities (8)
- **Estimated scope**: 1 file, ~25 lines

## Problem

Two spatially-connected moments in `src/App.tsx` teleport while their neighbours animate:

```tsx
// src/App.tsx:1735-1740 — offline status pill snaps in/out
{!isOnline && (
  <div className="fixed left-1/2 -translate-x-1/2 bottom-[calc(18px+env(safe-area-inset-bottom,0px))] z-50 px-3.5 py-1 rounded-full bg-[#14161e] border border-[#e8b04a]/40 text-[11.5px] text-[#e8b04a]">
    Offline mode · 3D models & cached photos ready
  </div>
)}

// src/App.tsx:1743-1746 — letterbox bars appear instantly while the title reveals over 2.2s
{cineKey && (
  <>
    <div className="fixed inset-x-0 top-0 h-[6vh] bg-black z-30 pointer-events-none" />
    <div className="fixed inset-x-0 bottom-0 h-[6vh] bg-black z-30 pointer-events-none" />
    <motion.div ... transition={{ duration: reducedMotion ? 0 : 2.2, ... }} >
```

The adjacent toast/callout stack already uses `toastVariants` (`src/App.tsx:1719-1733`), so the offline pill is the odd one out. The letterbox bars are part of the same cinematic beat as the title but arrive with no motion explaining them.

## Target

- Offline pill: wrap in `AnimatePresence` and use `toastVariants` — `y: 16 → 0`, `scale: 0.97 → 1`, `blur(2px) → 0` with `DURATION.medium` (350ms) in, 250ms out. Reduced motion: opacity-only via the existing `reducedMotion ? { duration: 0 } : undefined` pattern used by the toast at `src/App.tsx:1727`.
- Letterbox bars: make each a `motion.div` with `initial={reducedMotion ? { opacity: 0 } : { opacity: 0, scaleY: 0 }}`, `animate={{ opacity: 1, scaleY: 1 }}`, `exit={reducedMotion ? { opacity: 0 } : { opacity: 0, scaleY: 0 }}` and `transition={{ duration: reducedMotion ? 0 : 0.25, ease: EASE_SMOOTH_OUT }}`. Top bar `transform-origin: top`, bottom bar `transform-origin: bottom`. Use a 250ms `DURATION.fast` beat — the title's longer reveal is a separate, deliberate layer.

`transform`/`opacity` only (AUDIT.md §5); no height animation.

## Repo conventions to follow

- `src/App.tsx:1719-1733` is the exemplar for the offline pill: `AnimatePresence` + `variants={toastVariants}` + reduced-motion transition override.
- `src/lib/motion.ts:90-105` defines `toastVariants`; `:15` `DURATION.fast = 0.25`; `:8` `EASE_SMOOTH_OUT`.
- The cinematic title at `src/App.tsx:1747-1759` already branches on `reducedMotion`.

## Steps

1. `src/App.tsx` — import `DURATION` and `EASE_SMOOTH_OUT` from `./lib/motion` if not already imported (`toastVariants` is already in scope at `:1723`).
2. Replace the offline `<div>` at `:1736-1739` with:
   ```tsx
   <AnimatePresence>
     {!isOnline && (
       <motion.div
         key="offline-pill"
         variants={toastVariants}
         initial="initial"
         animate="animate"
         exit="exit"
         transition={reducedMotion ? { duration: 0 } : undefined}
         className="fixed left-1/2 -translate-x-1/2 bottom-[calc(18px+env(safe-area-inset-bottom,0px))] z-50 px-3.5 py-1 rounded-full bg-[#14161e] border border-[#e8b04a]/40 text-[11.5px] text-[#e8b04a]"
       >
         Offline mode · 3D models & cached photos ready
       </motion.div>
     )}
   </AnimatePresence>
   ```
3. Replace the two letterbox `<div>`s at `:1745-1746` with `motion.div`s using the target props; add inline `style={{ transformOrigin: 'top' }}` / `'bottom'` respectively.
4. Change nothing else in the cinematic block.

## Boundaries

- Do NOT change the title's 2.2s timing or content.
- Do NOT change `toastVariants` or any shared token.
- Do NOT animate the bars' `height` — scaleY with origin is the compositable equivalent.
- If `App.tsx` structure has drifted, STOP and report drift.

## Verification

- **Mechanical**: `npm run lint` and `npm run build` must pass.
- **Feel check**:
  - Toggle network offline in DevTools: the pill rises from the bottom with the same motion as a toast; toggling back fades it out symmetrically.
  - Start and end a cinematic tour: bars wipe out from the edges in ~250ms while the title plays its 2.2s reveal; no black bars pop.
  - Spam the offline toggle: `AnimatePresence` retargets without stacking duplicates.
  - With `prefers-reduced-motion`, both changes are opacity-only — no bar scaling, no pill travel.
  - In DevTools Animations at 10% playback, confirm transform-origin is at the viewport edges for the bars.
- **Done when**: neither element teleports, both share the existing toast/token vocabulary.
