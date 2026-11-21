# 003 — Make the `/`-opened search sheet instant

- **Status**: DONE
- **Commit**: e444ba6
- **Severity**: HIGH
- **Category**: Purpose & frequency (1)
- **Estimated scope**: 2 files, ~12 lines

## Problem

The `/` shortcut is a power-user action (100+/day tier in AUDIT.md §1) but opens a sheet that slides up with a spring:

```tsx
// src/App.tsx:853-855
} else if (e.key === '/') {
  e.preventDefault();
  setSearchOpen(true);
}

// src/components/ui/Sheet.tsx:64-65,95-98
const from = horizontal ? { x: '100%' } : { y: '100%' };
const to = { x: 0, y: 0 };
...
initial={from}
animate={to}
exit={from}
transition={reducedMotion ? { duration: 0.2 } : SHEET_SPRING}
```

Raycast has no open/close animation for exactly this reason: a keyboard command palette must feel instant. The sheet's drag/spring behaviour is still desirable for touch/mouse users.

## Target

Add an opt-in `instant` prop to `Sheet`. When true, entry uses `{ opacity: 0 } → { opacity: 1 }` with `{ duration: 0 }`; drag and exit behaviour remain unchanged. Pass it only from the `/` shortcut path, not from pointer-driven opens.

## Repo conventions to follow

- `src/components/ui/Sheet.tsx:33` already has a `reducedMotion?: boolean` prop with a default — add `instant?: boolean` the same way (default `false`).
- `src/lib/motion.ts:8` `EASE_SMOOTH_OUT` and `src/lib/motion.ts:39` `SPRING.surface` are the existing tokens; do not create new ones.
- `src/components/Compass.tsx:467` shows the `reduce ? { opacity: 0 } : …` branch pattern.

## Steps

1. `src/components/ui/Sheet.tsx` — add `instant?: boolean` to `SheetProps` (near line 20) and destructure it with `instant = false` near line 33.
2. In the panel's motion props (lines 95-98), use:
   ```tsx
   initial={instant ? { opacity: 0 } : from}
   animate={instant ? { opacity: 1 } : to}
   exit={instant ? { opacity: 0 } : from}
   transition={
     instant
       ? { duration: 0 }
       : reducedMotion
         ? { duration: 0.2, ease: EASE_SMOOTH_OUT }
         : SHEET_SPRING
   }
   ```
   (If plan 002 landed first, keep its reduced-motion branches and only add the `instant` branches.)
3. `src/App.tsx` — add `const instantSearchRef = useRef(false);` beside the other refs.
4. At `src/App.tsx:853-855`, set `instantSearchRef.current = true;` immediately before `setSearchOpen(true);`.
5. `src/components/SearchSheet.tsx` renders `Sheet` at line 173. Add `instantOpen?: boolean` to `SearchSheetProps` (`src/components/SearchSheet.tsx:30`), destructure it beside `reducedMotion` (`:84`), and pass `instant={instantOpen}` to that `Sheet`. In `src/App.tsx`, pass `instantOpen` to `SearchSheet`, reading-and-clearing the ref:
   ```tsx
   const instantOpen = instantSearchRef.current;
   instantSearchRef.current = false;
   ```
   Reset it in the same render pass that opens the sheet. Do not keep it true for subsequent pointer opens.
6. Clear `instantSearchRef.current = false` on pointer-driven search opens as well (e.g. the top-bar search button), so a stale flag never makes a click open instantly.

## Boundaries

- Do NOT remove the sheet's drag handling (`drag`, `dragConstraints`, `dragElastic`, `dragMomentum`) — gesture motion stays.
- Do NOT change other `Sheet` consumers (settings, passport, postcard, info drawer); they keep their spring entry.
- Do NOT change the `SearchSheet` content animations.
- If the search sheet is not rendered via `Sheet` in your checkout, STOP and report drift instead of guessing.

## Verification

- **Mechanical**: `npm run lint` and `npm run build` must pass.
- **Feel check**: run the app and compare:
  - Press `/`: the search field is focusable immediately and the panel appears with no slide; in DevTools Animations at 10% playback, no transform keyframes should be recorded.
  - Click the search button in the top bar: the panel still slides up with its spring.
  - Drag the sheet down to dismiss: velocity-based dismissal still works.
  - Open with `/`, close, then open by click: the second open must animate (stale-flag check).
- **Done when**: `/` never animates entry; all pointer-opened sheets are unchanged.
