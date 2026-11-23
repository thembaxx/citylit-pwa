# Plan 021 — Remove the semi-transparent rings around landmarks

**Status: DONE (2026-11-23).** Verified in the live dev app: 4 atmosphere
objects remain (cloth, two valley-mist planes, wildlife points) down from 19,
and the hero screenshot shows no rings or ripples. Keep the horizon skyline.

## Why
The soft translucent bands wrapping each diorama are the atmospheric fog
cylinders in `src/three/siteAtmosphere.ts`. They are also the largest source of
blended-fragment overdraw in the app. Coastal ripple rings from `seaRings()`
are the second, smaller ring system. The user asked for both gone.

## Current code
- `src/three/siteAtmosphere.ts`
  - `RING_SPECS: LayerSpec[]` (L127–313): 15 cylinder specs.
  - `RING_VERTEX` (L315), `RING_FRAGMENT` (L323) with two `fbm()` calls + discard.
  - `createRingMaterial()` (L456–474): `transparent`, `depthWrite:false`, `DoubleSide`.
  - `createAtmosphereScene()` L501–517: creates one `CylinderGeometry` mesh per
    spec, `renderOrder = 1`, `frustumCulled = false`.
  - `update()` L784–816: per-layer visibility/opacity/uniform/rotation work,
    including the `lowQuality && radius > 12` cull.
- `src/three/builders/primitives.ts:3018-3050`: `seaRings()` helper.
- 12 call sites: `landmarksA.ts` (4), `landmarksB.ts` (8), each stores
  `const sr = seaRings(...)` and calls `sr(t)` inside `userData.tick`.

## Target
1. In `siteAtmosphere.ts`, delete `RING_SPECS`, `RING_VERTEX`, `RING_FRAGMENT`,
   `createRingMaterial()` and the cylinder-mesh creation loop. Keep the table
   cloth sheet, the two valley-mist planes, the micro-wildlife points and the
   weight/tint state machine — `LayerSpec`, `EFFECT_TINTS`, `effectOpacity()`,
   `SKY_NOISE_GLSL`, `setSite`/`setHidden`/`update`/`dispose` all stay.
2. In `update()`, remove the now-dead ring-only `isFar` check; keep
   `lowQuality` for the wildlife gate.
3. Delete `seaRings()` from `primitives.ts`, remove it from the two builder
   import lists, and delete all 12 `const sr = seaRings(...)` declarations and
   all 12 `sr(t)` tick calls.
4. Keep (do not touch): horizon scenery cylinders, plinth emissive rim,
   `addTreeRing()`, lamp halos.

## Steps
1. Edit `siteAtmosphere.ts` as above; verify no leftover references to the
   deleted symbols with a repo search.
2. Edit `primitives.ts` and both landmark builder files. Preserve tick order of
   the remaining FX.
3. `pnpm lint` (oxlint + tsc) and `pnpm test`.
4. Visual check: hero day + night should still show the Table Mountain
   tablecloth, valley mist and wildlife, but no translucent bands hugging the
   plinth and no white ripples on the water.

## Boundaries
- No change to weather, sky, horizon or lighting.
- No new controls or settings; the rings are gone, not hidden behind a flag.
- Do not remove `valleyMist` planes: they read as ground mist, not rings, and
  are part of the canyon/dam look.

## Done when
No source references to `RING_SPECS`, `createRingMaterial` or `seaRings` remain;
type-check and tests pass; day/night captures show the landmark without rings.
