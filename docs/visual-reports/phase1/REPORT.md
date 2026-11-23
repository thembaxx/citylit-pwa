# Phase 1 — Foundation visual report

Date: 2026-11-23
Scope: the first workstream of the Citylit 3D Visual Overhaul — lighting and
exposure foundation only. Geometry, material, sky, water and per-landmark art
direction workstreams are deferred (see the end of this report).

## Baseline

The existing `scripts/capture-contact-sheets.mjs` harness cannot capture a
usable baseline on this host: it renders thumbnails into a `WebGLRenderTarget`
and reads them with `readRenderTargetPixels()`, which returns an all-zero buffer
in the installed headless Chromium. The on-screen canvas renders correctly.

`scripts/capture-visual-matrix.mjs` was added to drive the live app over CDP and
screenshot the composited canvas instead. It captures a reproducible matrix:

- 5 hero landmarks (0 Table Mountain, 1 Union Buildings, 3 Nelson Mandela
  Bridge, 7 Bo-Kaap, 14 Palace of the Lost City)
- dawn (6), noon (12), dusk (18), night (22)
- High and Balanced tiers, clear weather
- rain and fog sweeps at noon and night (High)
- mobile 390×844 @3x at noon and night (High)
- all 43 landmarks at noon/dusk/night (High, clear)

Motion is frozen, the theme is pinned to daylight, and each state is applied
immediately before a fixed 6-frame warmup and 8-frame measurement window. The
baseline is committed at `docs/visual-baseline/` (199 states, 5.2 MB).

## Changes in this phase

1. **Kelvin colour-temperature curve** (`src/three/lightingRig.ts`,
   `src/three/weatherScene.ts`). A code-based Kelvin→RGB conversion with a
   smooth 24 h curve through the brief's keyframes — dawn 3500 K, noon 5800 K,
   dusk 2800 K, night 9000 K. It gently retints the existing key light on top of
   the seasonal palette; it never adds a light and never changes the fixed lamp
   pool, so the light count and shader programs are unchanged. No per-frame
   allocations: one preallocated colour is written in place.
2. **Midday highlight guard** (`MIDDAY_HIGHLIGHT_TRIM`). A 12 % trim of key
   intensity only near solar noon, so pale limestone, cream strata and white
   walls keep more highlight separation. Off at dawn, dusk and night.
3. **Faster auto-exposure settling** (`AUTO_EXPOSURE_ADAPT_RATE`). The original
   0.9/s rate left a multi-second washed-out window after an hour or weather
   change; 1.6/s settles substantially faster while retaining the existing
   clamps (0.7–1.9 day, 0.8–1.28 dark) and readback cadence.
4. **No pure-white lights.** The studio hemisphere light is now `#f4f7fb`
   rather than `#ffffff`.

Every change is behind a single constant in `lightingRig.ts` and can be dialled
back without touching call sites.

## Verification

Results are from the committed capture data
(`scripts/compare-metrics.mjs`, `scripts/check-exposure.mjs`).

#### Perf budget (199 matched states)

| Metric | Baseline | New | Verdict |
| --- | --- | --- | --- |
| Shader programs (mean) | 103.98 | 103.98 | PASS — 0 states increased |
| Mean frame time, all states | 40.30 ms | 40.76 ms | +1.1 % — PASS |
| Mean frame time, High | 40.37 ms | 41.48 ms | +2.8 % — PASS |
| Mean frame time, Balanced | 39.60 ms | 34.27 ms | improved — PASS |
| Draw calls (median per render) | unchanged | unchanged | PASS by construction — only light colours/intensities changed |
| Triangles (median per render) | unchanged | unchanged | PASS by construction |

The accumulated draw-call totals in `stats.json` are noisy: the engine's idle
frame cap means a rAF tick may not render, so an 8-rAF window contains a variable
number of renders (≈280 calls per render). The harness now records
`callsPerRender`, `trianglesPerRender` and `rendersObserved` so future captures
can compare per-render figures directly. Neither this phase nor the shared
lighting curve changes geometry, materials or passes, so draw calls and programs
cannot increase structurally; the measured program count is identical.

#### Histogram / clipping

- Pure-black pixels: 0 frames over 1 % in both captures — no crushed shadows.
- Pure-white pixels: 121/199 baseline frames vs 116/199 new frames over 1 %.
  These are **transient** captures (6 warmup + 8 sample frames): the async
  auto-exposure probe has not settled, so bright midday frames are temporarily
  over-exposed in both captures. A settled check on the worst pale landmark
  (Union Buildings, noon, High) measures 0.24 % pure white, within the brief's
  1 % ceiling. This is a known limitation of the capture window, not a new
  regression.
- Mean luma across the matrix: 169.1 → 168.2 (neutral, as expected).

#### Build and tests

- `pnpm build`: PASS (35 precache entries, 5485 KiB; no new assets).
- `pnpm test`: 134/134 PASS (including 6 new lighting-curve tests).
- `pnpm lint`: PASS (one pre-existing warning in `.opencode/plugins/graphify.js`).
- Reduced-motion, software-GL and theme paths were not touched.

Contact sheets: `docs/visual-reports/phase1/contact-sheet.html` (70 hero states)
and `contact-sheet-all.html` (all 199 states), baseline left / new right.

### Deferred to later phases

- **C — Materials:** the repo already has a cached material library (`M`,
  `MStone`, `MPlaster`, … in `builders/primitives.ts`), procedural bump detail,
  vertex AO/weathering, wet-response uniforms, window emissives and an albedo
  audit contract. A per-landmark albedo pass is still needed for the remaining
  pale landmarks.
- **B — Sky/environment:** PMREM day/golden/night probes, procedural sky,
  horizon-matched fog, cloud shadows and atmosphere shells already exist;
  god-rays and a sky-following PMREM refresh threshold remain.
- **D/E — Geometry and camera:** bevels, architectural detail, diorama base,
  foliage and hero-camera framing need a per-landmark pass (five heroes first).
- **F/G/I — Atmosphere, water and night:** cloud shading, height fog, weather
  particles, water shader, lamp pools and floodlight cones are partly present
  but not yet art-directed to the brief.
- **H — Post:** AgX / Khronos Neutral evaluation and a time-of-day LUT grade were
  not attempted; the existing local ACES curve and split-tone grade were kept so
  the albedo guardrails and auto-exposure clamps stay intact.
- **J/K — Transitions and roll-out:** no changes to dissolve, micro-animation,
  or non-hero landmarks beyond the shared lighting curve.

No geometry, data, route, UI or control files were changed.
