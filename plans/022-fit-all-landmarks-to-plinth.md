# Plan 022 — Make every landmark actually fit the stand

**Status: DONE (2026-11-23).** Live audit: 43/43 `fitsPlinth === true`, 40
sites needed a uniform scale (min 0.8534). The fit uses hidden-LOD union bounds,
restores the authored transform per pass, and verifies the post-fit footprint.

## Why
`fitMath.ts` already defines the plinth's inner half-extent (8.46) and a pure
centre-preserving `fitBoundsToPlinth()`. `showLandmarkImmediate()` only stores
the result in `userData` as an audit and deliberately does **not** rescale the
hero. A site whose authored props spill over the rim is therefore detected but
still overflows the stand. The requirement is that *all* landmarks fit.

## Current code
- `src/lib/fitMath.ts:40-74` — `fitBoundsToPlinth(bounds, margin=0.12,
  halfExtent=PLINTH_INNER_HALF_EXTENT)` returns `{scale, offsetX, offsetZ,
  halfX, halfZ}`; `boundsFitPlinth()` is `fit.scale > 0.999`.
- `src/three/CitylitEngine.ts`
  - `computeDioramaBounds()` L3812–3829 — solid-geometry X/Z box (skips
    `noShadow` / `cannotReceiveAO` / `noDissolve` FX).
  - `buildLandmarkGroup()` L1963–1985 — fresh group from the builder, sets
    shadow flags, returns it. Used by both `showLandmarkImmediate()` and
    `prewarmLandmarkIndex()`.
  - `showLandmarkImmediate()` L2293–2304 — computes `plinthFootprint` and the
    audit fields.
  - Group is mounted at L2416 (`heroRoot.add`) *before* anchors, markers,
    cutaway entries and shadow bounds are collected.

## Target
Apply the fit at **build** time, so cached, prewarmed and freshly built groups
are all fitted identically, and every downstream consumer (lamp anchors, bird
perches, markers, shadow fit, camera framing, thumbnails) sees the final
transform.

1. Add a private helper `fitGroupToPlinth(group: THREE.Group): void` near
   `buildLandmarkGroup()`:
   - compute the solid footprint with `computeDioramaBounds(group)`;
   - call `fitBoundsToPlinth({minX, maxX, minZ, maxZ})`;
   - set `group.scale.setScalar(fit.scale)` and add `fit.offsetX`/`fit.offsetZ`
     to `group.position.x`/`.z` (preserve authored `y`);
   - store `group.userData.plinthFit = fit` and
     `group.userData.fitsPlinth = boundsFitPlinth(footprint)`.
2. Call it from `buildLandmarkGroup()` after the shadow-flag traversal and
   before returning.
3. In `showLandmarkImmediate()`, keep the audit but read the already-computed
   values from `group.userData` instead of recomputing (or leave the existing
   computation — it is cheap and now reports `true`). Prefer reading the stored
   values to avoid a second full traversal per switch.
4. `computeDioramaBounds()` calls `group.updateWorldMatrix(true, true)`; the
   helper must run before the group is parented to `heroRoot`, and builders
   must yield identity transforms (verify with the live audit).

## Steps
1. Implement helper + call site in `CitylitEngine.ts`.
2. Keep `fitMath.ts` and its tests unchanged — do not weaken the 8.46 constant.
3. `pnpm lint`, `pnpm test`, `pnpm build`.
4. Live audit in the dev contact-sheet harness: for all 43 sites call
   `showLandmarkImmediate(i)` and assert
   `window.citylitEngine.currentGroup.userData.fitsPlinth === true`; capture
   the fitted `scale` values for the report.

## Boundaries
- No change to the camera-fit logic (`fitHeroCamera`, `frameStudioLandmark`) —
  it already frames whatever bounds the group reports.
- No per-frame fitting; this is a one-time build-step transform.
- Do not rescale FX-only meshes that are intentionally excluded from bounds.
- Uniform scale only; never non-uniform X/Z stretch.

## Done when
Every one of the 43 landmarks reports `fitsPlinth === true` in the live audit,
no landmark geometry visibly crosses the plinth rim, and build/tests pass.
