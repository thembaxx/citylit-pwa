# Plan 023 — Cut idle and HiDPI render cost

**Status: DONE (2026-11-23).** Tier-0 DPR cap 1.5, MSAA off only above DPR
1.25, settled idle measured at 48 renders / 2 s in the headless browser.
Reduced-motion and software-GL caps unchanged.

## Why
Removing the rings (021) removes the worst overdraw, but the renderer still
shades at up to 2× DPR with 4× MSAA on a Retina desktop and renders at full rAF
rate forever when the scene is visually static. Both are pure cost with almost
no visual payoff.

## Current code
- `src/three/renderer/createRenderer.ts:30-37` —
  `new THREE.WebGLRenderer({ antialias: !softwareGl, ... })`; MSAA is always on
  for hardware GL.
- `src/three/CitylitEngine.ts:2895-2907` —
  `base = [min(dpr, 2), min(dpr, 1.4), 1][qualityIndex]`, then
  `pr = max(0.6, base * renderScale)`. Tier 0 can shade 4× the CSS pixels.
- `src/three/CitylitEngine.ts:5374-5399` — idle throttle exists only for
  `motionScale === 0` (66 ms) or `isSoftwareGl` (50 ms); otherwise 0 ms.

## Target
1. **Cap HiDPI work.** In `applyRenderScale()`, change tier-0 base from
   `min(devicePixelRatio, 2)` to `min(devicePixelRatio, 1.5)` and tier-1 from
   `1.4` to `1.25`. Tier 2 stays 1. The auto-quality monitor
   (`frame()` L4798–4819) still fine-tunes `renderScale` within 0.75–1.0.
2. **Disable redundant MSAA on HiDPI.** In `createWebGLRendererSelection()`,
   set `antialias: !softwareGl && devicePixelRatio <= 1.25` (guard with
   `typeof devicePixelRatio === 'number'`). A 1× display keeps MSAA; a HiDPI
   display already has enough subpixel sampling. Apply the same rule to the
   WebGPU candidate in `selectRenderer()` for consistency.
3. **30 fps idle pacing.** In the `frame()` throttle block, add a third case:
   ```
   const isQuietIdle = !this.isUserOrbiting && this.dissolvePhase === 0 &&
     !this.camGoal && !this.timeLapsePlaying && camDeltaSq < 1e-6 &&
     this.elapsed - this.lastInteractAt > 2.0;
   const throttleMs = isReducedStaticIdle ? 66 : isBatterySoftIdle ? 50 :
     isQuietIdle ? 33 : 0;
   ```
   Only gate the **render** (the existing `if` already does); simulation and
   `dt` keep advancing every rAF so interaction resumes at full rate on the
   next pointer/wheel/key event (all of which set `lastInteractAt`).
4. Leave shadow striding, N8AO half-res, dynamic resolution and the async
   auto-exposure readback untouched — they are already correct.

## Steps
1. Edit the three locations above.
2. `pnpm lint`, `pnpm test`, `pnpm build`.
3. Smoke-test at DPR 1 and DPR 2 (browser deviceScaleFactor): interaction
   (orbit/flick, landmark switch, time-lapse) must stay responsive; a settled
   scene must drop to ~30 rAF renders per second.
4. Note before/after observations in the research doc / final report.

## Boundaries
- Never throttle while orbiting, dissolving, flying, time-lapsing or within
  2 s of the last interaction.
- Keep reduced-motion at 15 fps and software GL at 20 fps (their existing
  stricter caps win).
- No change to quality presets exposed in the UI; this is behind-the-scenes.

## Done when
HiDPI tier-0 pixel ratio ≤ 1.5, MSAA off only on HiDPI, static idle renders at
30 fps, and interaction still renders every frame.
