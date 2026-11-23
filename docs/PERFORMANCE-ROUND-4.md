# Performance round 4 — verification and implementation (2026-11-23)

Grounded in `graphify query` output and source reads. This records which of the
review findings were real, and the four that were fixed in this pass.

## Verdict on the reported findings

| Finding | Verdict |
|---|---|
| Per-frame synchronous exposure readback | **Stale.** `CitylitEngine.ts:2625-2749` already uses three's PBO-backed `readRenderTargetPixelsAsync` every 12th frame, with accumulated `dt` preserving the lerp. Verified against `node_modules/three/src/renderers/WebGLRenderer.js:3245-3318`. A GPU-only reduction pass would save a few KB every 12th frame, so it was not built. |
| Full-resolution 10-tap tilt-shift blur | **Real.** Fixed below. |
| Zero-intensity idle point lights | **Structurally real, unmeasured.** Ten point lights (4 street, 4 vehicle, 2 fixed) stay visible and are still evaluated per fragment when dimmed. Reducing the pool or adding a custom lamp term changes lighting fidelity; deferred pending a frame-time test. |
| ~149 transparent/depthWrite/alphaTest uses; overdraw view | **Partly stale.** 174 literals (94/80/0). Clouds are already instanced and foliage is opaque. Added a debug view below. |
| Auto / 60 / 30 fps setting | **Real gap.** Only an idle cap existed. Fixed below. |
| Main-thread procedural texture generation | **Real.** Fixed below. |
| Compile warm-up on idle | **Already done / low payoff.** `prewarmShaders()` and the landmark LRU already compile; theme/time/weather changes are uniform-only, so no new programs need warming. |

## Implemented

### 1. Frame-rate cap setting

- `FpsCapSetting` added to `src/types/citylit.ts`; `CitylitSettings.fpsCap` is
  persisted with the rest of the settings and validated in `readSettings()`.
- `SettingsModal.tsx` gains a "Frame rate" pill row beside Graphics quality.
- `CitylitEngine.setFpsCap()` stores a continuous interval; the render gate at
  `frame()` uses `Math.max(fpsCapMs, idleThrottleMs)` so reduced-motion (66 ms),
  software-GL (50 ms) and settled-idle (33 ms) pacing remain the floor.
- Applied both on boot (`App.tsx` engine creation) and on settings changes.

### 2. Half-resolution bokeh

- `postfx.ts` adds `MiniatureBlurShader`: the existing golden-angle 10-tap blur
  runs into a `HalfFloat` target at half the composer size, with the focus mask
  packed into alpha. `uResolution` stays at full resolution so the screen-space
  blur radius is unchanged.
- `MiniaturePass` samples that texture at full resolution and mixes across the
  focus boundary; the in-focus 4-tap micro-clarity kernel and the grade,
  vignette, ACES and dither chain are untouched. Shader uniforms are shared
  objects, so `setDepth`, `setFocus`, `setExposure` and `applyTuning` still drive
  both materials through the public API.
- Target is resized by the existing `EffectComposer.setSize` path; no extra
  wiring in `CitylitEngine`. Disposed with the pass.

### 3. Persistent procedural texture cache

- `src/three/textureCache.ts` stores the 17 deterministic height/normal/roughness
  canvases in IndexedDB `citylit-textures-v1` with a versioned signature.
- `shaders.ts` getters stay synchronous: they consult an in-memory canvas map,
  generate on miss, and persist in the background.
- `CitylitEngine.create()` awaits `preloadProceduralTextures()` before builders
  run, so repeat visits decode PNGs instead of running ~1M pixel loops.

### 4. Overdraw debug view

- `CitylitEngine.setOverdrawDebug(true)` swaps in an additive, depth-test-off
  white `overrideMaterial`, clears the scene background, disables shadows, and
  bypasses the composer so the accumulation is ungraded. State is restored on
  disable and dispose.
- `?overdraw=1` enables it at boot; `window.citylitEngine.setOverdrawDebug()`
  toggles it at runtime. Documented in README.

## Verification

`pnpm lint`, `pnpm test` (104/104) and `pnpm build` pass. In the dev browser on
WebGL: no console errors, blur target allocated at half the composer size, the
settings row persists `fpsCap`, and the overdraw toggle restores background and
shadow state. WebGPU boot also completes without errors.
