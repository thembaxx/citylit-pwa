# Plan 024 — Diorama context kit for every local 3D stage

**Status:** implemented (repo-side scope) · **Date:** 2026-11-23

## Important scope finding

The live page at `https://citylit.themba.dev/dioramas` is **not in this repo**.
It is a separate Next.js app (canonical host `citylit.vercel.app`) with three
stages — Regional Dioramas, Cities & Landmarks, and a PixiJS 3D Stage
(`@pixi/3d`, GLB + Draco + PBR). No page source, `@pixi` dependency, `.glb`
assets or Draco pipeline exists in `citylit-pwa`, and `dist/` contains none of
those strings. Editing this repo cannot change that page; a port would need the
Next.js repository.

This plan therefore implements the transferable learnings in the **three real
local stages**: the hero landmark diorama, the Places cutaway archipelago and
the Globe. The PixiJS/GLB "context kit" item is out of scope here by design
(`docs/vite-framework-research.md:43`, `docs/IMPROVEMENT-BRAINSTORM.md:611`).

## Baselines

- Before: `pnpm exec tsc --noEmit` clean; `pnpm test` 115 / 115 pass.
- Working tree already contained another session's in-progress editorial work
  (`src/lib/placeEditorial.ts` + test, `PlacesOverlay.tsx`, `placesScene.ts`,
  `CitylitEngine.ts`, `App.tsx`, `graphify-out/*`). It was preserved and extended.

## Implemented

### P0 — control grammar on the local stages
- [x] Editorial grammar (`narrative`, ≤3 category highlights with camera focus,
      source links, illustrative-position disclosure) reached the **hero**
      stage: `LandmarkCard.tsx` now renders `resolvePlaceEditorial(index)`
      sources and the "illustrative, not survey-accurate" note. It was already
      present in Places by the in-progress work.
- [x] One time vocabulary for all stages: `src/lib/timePresets.ts` +
      `timePresets.test.ts`; `WeatherWidget` and `PlacesOverlay` now share it
      instead of duplicating hour tables.
- [x] Reusable-cutaway correctness: the clipping-plane Inspect mode is gated
      off on WebGPU (`App.tsx` `cutawaySupported`, `LandmarkCard.tsx`
      `cutawaySupported`). Places keeps its own shader-based Section view, so
      the same control grammar works on both backends.
- [x] Places markers/section/focus from the in-progress work verified intact.

### P1 — fidelity gaps (audit result: most were already shipped)
Already implemented before this plan — verified, not re-done: 42 rail lines,
Voortrekker gate/friezes/oculus shaft, Ponte hollow core + neon crown, Big Hole
void, stone-albedo corrections, wildlife dedupe + eyes + bird templates +
articulation.

Closed here:
- [x] Table Mountain: plateau cap gorge now matches the cliff notch
      (`gorge * (cap ? 0.5 : 0.32)`), bump scale 0.03 → 0.06, tablecloth 16 → 22
      puffs (27 with the spillover band), and five shallow summit reservoirs.
- [x] Named species vocabulary: added `camelthorn` and `milkwood` builders in
      `primitives.ts`, mapped in `dioramaKit.ts`, and assigned to Kgalagadi,
      Knysna Heads and Storms River Mouth rings.

### P2 — life layer / scale
- [x] Per-site far-horizon signatures: `horizonScenery.ts` now resolves an
      explicit `SITE_SIGNATURES` table (Table Mountain, Drakensberg, Soweto
      towers, Ponte, Mabhida, Nelson Mandela Bridge, Voortrekker, Big Hole,
      Knysna, Cape Point/Agulhas, Augrabies, Robben Island …) before falling
      back to the regional silhouette. Still one instanced draw call.

## Deliberately not changed
- `metresPerUnit` for all sites: the repo intentionally derives a *per-site*
  ratio and discloses compression (`scaleFacts.ts:30-38`, `lib/scale.ts:20`).
  A global convention would contradict the documented design.
- Lamp-water reflections / Places moon glint: visual-only changes that cannot
  be verified without a running renderer here; the reflection helper already
  exists and is wired at iSimangaliso.
- A stage-aware camera facade and per-stage auto-rotate toggle: the three local
  stages share one renderer/canvas and OrbitControls; changing that is a larger
  refactor than the control-grammar port.
- The live Next.js page and its PixiJS stage (different repository).

## Verification
- `pnpm lint` → pass (one pre-existing warning in `.opencode/plugins/graphify.js`).
- `pnpm test` → pass (118 / 118 after adding three time-preset tests).
- `graphify update .` run after the code changes.
