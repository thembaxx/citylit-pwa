# Plan 025 — Shared idle pacing across all stages + landmark geometry fidelity

**Status: implemented (2026-11-23).** Preserves the in-progress editorial work
already in the working tree; all edits are additive/targeted.

## Why

- `LANDMARK_IMPROVEMENTS.md` still listed two geometry items that were not
  shipped: the Moses Mabhida arch was a parabola with 40 guide points, and the
  Nelson Mandela Bridge had 12 stays per mast instead of the real 24.
- Idle render throttling existed **only** in the hero branch of `frame()`.
  The Places cutaway and Globe branches rendered on every rAF tick even when
  completely settled — two of the three local stages paid full rate forever.
- Common per-frame churn: `getObjectByName()` walked every active car's subtree
  each frame, a fresh spatial-listener object/arrays and thunder closure were
  allocated each tick, and `isStudio()` was re-evaluated per sway item.

## Implemented

### Performance
- `src/lib/framePacing.ts` — pure pacing policy (`frameThrottleMs`,
  `stageQuiet`) with the 66/50/33 ms idle classes and fps-cap-as-ceiling rule.
- `src/three/CitylitEngine.ts`
  - New `stageThrottle()` feeds the same policy from all three camera modes.
  - Globe and Places now skip redraws once camera, tweens and input settle;
    simulation still advances every rAF, so interaction resumes instantly.
  - Vehicle night-light rigs are cached on `userData` at spawn instead of
    `getObjectByName()` traversals on every frame.
  - One reusable `SpatialListener` (mutated in place), one stable `onThunder`
    callback, and a single `isStudio()` evaluation per sway pass.
  - Defensive `LANDMARKS[this.activeIndex] ?? LANDMARKS[0]` fallback in the
    hero audio path, matching the Places branch.

### Landmark fidelity
- `src/lib/landmarkGeometry.ts` — pure `catenaryArchHeight()` and
  `bridgeStayAnchors()` helpers.
- `landmarksA.ts` (`stadium()`): inverted catenary arch, 60 guide points,
  cable stays follow the new curve.
- `landmarksA.ts` (`bridge()`): 24 semi-fan stays per mast (compressed spacing
  so all anchors stay on the authored deck).

### Tests / tooling
- `src/lib/framePacing.test.ts` (6 cases) and
  `src/lib/landmarkGeometry.test.ts` (4 cases).
- `scripts/measure-idle-pacing.mjs` — starts its own Vite server, drives
  `CitylitEngine.frame()` with synthetic 60 fps timestamps (headless Chrome
  throttles real rAF) and counts stage renders for each mode.

## Verification

- `pnpm lint` — pass (only the pre-existing `.opencode/plugins/graphify.js`
  dangling-underscore warning).
- `pnpm test` — **128 / 128 pass** (was 118 before this pass).
- `pnpm build` — pass (Vite chunk-size advisory only).
- `node scripts/measure-idle-pacing.mjs` — live integration check:
  ```
  Hero settled idle   : 60 stage / 60 renderer renders in 120 frames
  Places settled idle : 60 stage / 60 renderer renders in 120 frames
  Globe reduced idle  : 0 stage / 30 renderer renders in 120 frames
  PASS: all three stages honour the idle caps
  ```
  120 synthetic frames = 2 s. Places and Globe previously rendered 120 times.
  Auto-rotating stages are deliberately kept at full rate (camera motion means
  the scene is not visually static).

## Deliberately not changed

- `drift()` particle callbacks still allocate a 3-tuple per particle per frame
  (~34 call sites). Porting them to the zero-allocation `stream()` signature is
  a high-churn mechanical change; deferred to a dedicated pass.
- Light-pool reduction, scene-level static batching and WebGPU SSAO changes
  remain deferred as in `docs/PERFORMANCE-ROUND-4.md`.
- The live Next.js PixiJS diorama page is a different repository
  (`plans/024-diorama-context-kit.md`).
