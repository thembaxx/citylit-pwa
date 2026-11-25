# Handoff — Citylit PWA landmark stand: thinner, less repetitive, blended with terrain

**Repo:** `C:/Users/PC/Documents/citylit-pwa` (branch `main`, up to date with `origin/main`)
**Written:** 2026-03 (previous session ended on a context-window overflow, mid visual verification)

---

## 1. The user request (original wording, preserved)

> "I want to improve the stand in landmarks where the 3D models sit. I don't want it to be too thick
> and repetitive, and I want it to beautifully and seamlessly blend with the 3D landmark
> (rivers, roads, streams etc.), and I want to install and implement this skill
> https://github.com/Microck/ui-unslop and optimize, improve performance without sacrificing quality."

So the goal has four parts:
1. The **stand** (the base block under each 3D landmark) should be **less thick**.
2. It should be **less repetitive** — the evenly striped strata banding reads as template.
3. It should **seamlessly blend** with the landmark's rivers / roads / streams at the cut edge.
4. **Install + apply the `ui-unslop` skill**, and **optimize performance** without hurting visual quality.

The user then said "implement all", and later "yes" to a proposal to verify in the browser and then
fix the pilot-site depth and the edge band.

---

## 2. Current state of the working tree

```
 M graphify-out/GRAPH_REPORT.md     <- regenerated, expected churn
 M graphify-out/graph.html
 M graphify-out/graph.json
 M graphify-out/manifest.json
 M src/three/builders/dioramaKit.ts  <- the only source file changed (+50 / -18)
```

Nothing has been committed. `git diff -- src/three/builders/dioramaKit.ts` is the authoritative record
of what changed — read the diff rather than trusting any summary below.

### What was already implemented (turn 3 of the old thread)

All in `src/three/builders/dioramaKit.ts`:

- **Thickness** — `addSquareRim`: `BoxGeometry(16.8, 1.2, ...)` → `BoxGeometry(16.8, 0.62, ...)`
  translated `-0.56` → `-0.31`. The stand is now a thin plinth under the terrain.
- **Repetition** — strata bands `[wall, band, edge, edge]` → `[wall, band, edge]`; seam darkness
  cut from `0.16` to `0.05`. `paintStrata` gained an optional `seamStrength` parameter
  (default `0.16`, so the legacy circular rim path is unchanged).
- **Cost** — wall subdivisions `10, 24, 10` → `10, 12, 10` (24 → 12 rows on the wall).
  **No frame-time measurement was taken.** Do not claim a perf win without measuring.
- **Allocation cleanup** — `rimEdgeColor` now reads from a per-profile parsed palette cached in a
  `WeakMap<SiteProfile, RimColorPalette>` (`getRimPalette`) instead of constructing
  `THREE.Color` objects per vertex; `addRimEdgeContinuity` reuses one `cFade` colour instead of
  `cTmp.clone()` per vertex.

### Verification already passed (before the crash)

| Check | Result |
|---|---|
| `node_modules/.bin/tsc --noEmit` | exit 0 |
| `npm test` | 200 pass / 0 fail |
| `node_modules/.bin/oxlint src/three/builders/dioramaKit.ts` | exit 0 |
| `node_modules/.bin/vite build` | exit 0 |
| `graphify update .` | ran; graphify-out is dirty as a result |

Note: `npx --no-install oxlint ...` and `npx --no-install vite build` **fail** in this environment
(npx resolves paths relative to the wrong cwd). Always use `node_modules/.bin/oxlint` and
`node_modules/.bin/vite` directly.

---

## 3. Key architectural facts the next agent needs (do not re-derive from scratch)

- **The changed stand is the *landmark diorama* stand** — built by `addCraftedRim` → `addSquareRim`
  in `src/three/builders/dioramaKit.ts` (~line 794+). Consumers: `src/three/builders/landmarksA.ts`,
  `landmarksB.ts`, `primitives.ts`, `src/three/osmSlice.ts`, `src/three/placesSliceBuilders.ts`
  (for `addStreetLampSet` only).
- **The Places slice diorama is a different system** — `src/three/placesSliceBuilders.ts`
  (`buildTerrainAndWaterMeshes`, `SLICE_HALF = 1.5`, `baseY`‑anchored cutaway strata walls).
  It does **not** use `addSquareRim`. It was NOT changed.
  **Unresolved scope question:** the screenshot the user originally attached appears to be the
  *Places* diorama, while the ask says "stand in landmarks where the 3D models sit". These were
  treated as the same thing in the previous session. Worth one clarifying question to the user
  before doing more work.
- **Where the stand is applied:** `applyDioramaUpgrade` (~line 3712) and `finalizeLandmarkGroup`
  (~line 3780) both call `addCraftedRim` + `addRimEdgeContinuity`, and add `addSquareWaterPlate` +
  `addEdgeWaterfall` for `coastal` / `wetland` / `waterfall` biomes.
- **Pilot plinths are skipped for the rim block** — `finalizeLandmarkGroup` checks
  `group.userData.plinthOutlineGeo`; if present (Kruger, Boulders, Orlando) it does **not** add a
  second rim. Those three sites keep their own stand from `src/three/builders/plinthKit.ts`
  (`buildPilotPlinth`, `attachPilotPlinthToGroup`), which was **not changed**.
  - `src/lib/plinthProfiles.ts`: all three pilot specs use `halfExtent 7.72`, `baseY -1.25`,
    `skirtBottomY -1.44`; Boulders Beach has `waterLevel 0.14`.
- **Rivers / streams / roads are hand-placed per landmark**, not data-driven:
  - `src/three/builders/landmarksA.ts` e.g. the Blyde river (`rondavels()` builder, ~line 2219) is a
    `TubeGeometry` along a `CatmullRomCurve3` with endpoints at `y = -1.05`, `z = ±7.1` — i.e. it
    stops *below* the new 0.62-deep rim top and *inside* the ±8.4 edge. It cannot be connected to
    the rim by one generic hook.
  - `src/three/builders/primitives.ts` exports a zero-allocation `stream()` helper used by
    `dioramaKit.ts` biome FX (~lines 1658–1990).
  - `addWetRoadStreaks` (`dioramaKit.ts` ~2897) is **wet-road reflection under street lamps**, not
    rivers — do not confuse the two.
- **Edge-continuity band geometry:** `addRimEdgeContinuity` (`dioramaKit.ts` ~1002) builds a
  `BAND_H = 0.38` band at `±HALF = 8.4`, flush with the slab top (`TOP_Y = 0`).
  **Suspected bug (unverified):** the pilot plinths are only `7.72` half-extent, so this band
  floats ≈0.68 units outside the pilot terrain edge. Needs a visual check.
- `rimEdgeColor` already carries terrain-edge feature colour onto the rim top and into the top of
  the wall band — so the *colour* continuity exists; what stops is the *geometry* of rivers/roads.

---

## 4. What is NOT done (the actual remaining work)

1. **River / road / stream → stand blending.** Not started. Needs per-landmark edge endpoints
   (e.g. extend the Blyde river curve to the ±8.4 wall and drop it below the rim, then give it a
   channel cut into the wall band). This is per-landmark authored geometry, not a one-line fix.
2. **Pilot-plinth stand depth.** `plinthKit.ts` untouched. Lowering `baseY` from `-1.25` changes how
   the basin walls meet the ground, and Boulders' water sits **above** `baseY` (0.14) — needs a
   visual check before changing.
3. **Suspected pilot edge-band mismatch** at ±8.4 vs `halfExtent 7.72` (see §3).
4. **No visual verification was ever completed.** The previous session loaded Kruger in the
   browser (hash deep-link `#kruger-national-park`), but the run died on a context-window overflow
   *before* the screenshot was taken. **Nothing in the visual domain has been confirmed.**
5. **ui-unslop is installed but not applied.** It lives at `C:/Users/PC/.agents/skills/ui-unslop/`
   (available in the skill list as `ui-unslop`). Its procedure targets web UI markup/CSS; the 3D
   material work in `dioramaKit.ts` was done by hand (read → audit → edit → verify) rather than via
   its checklist. The next agent should decide whether ui-unslop actually applies to a WebGL
   material/geometry problem — the honest answer so far is that it mostly does not — and say so
   plainly rather than force it.
6. **No performance measurement.** Vertex reduction is claimed on paper only.

---

## 5. How to run and inspect it

- **Dev server already running on `http://127.0.0.1:3000`** (PID 21560, node). It was **not** started
  by the previous agent — leave it alone; a second one was started on 3002 earlier and was stopped.
  Port 3001 also had a listener (PID 25044).
- **Deep links work by URL hash** — `readInitialLandmarkIndex()` in `src/App.tsx` (~line 76) reads
  `window.location.hash` and matches `slugifyLandmark()` (`src/data/landmarks.ts` ~741:
  lowercase, non-alphanumerics → `-`). A hash change alone does **not** re-select a landmark; the
  page must be **reloaded**.
  - Useful slugs: `#kruger-national-park` (17), `#boulders-beach` (19), `#orlando-towers` (21),
    `#three-rondavels` (10, the Blyde river site), `#storms-river-mouth` (34),
    `#chapman-s-peak-drive` (28, road).
- **Do not** click "Next landmark" 43 times in one `preview_evaluate` call — it times out and leaves
  the app stepping in the background. Use hash deep-links + reload instead.
- **Landmark order** (`src/data/landmarks.ts`, `k:` fields) is listed in `git` order; the grep
  `grep -n "^    k: " src/data/landmarks.ts` gives the full 43-item list.
- The **Places** view is reached via the globe overlay → "Places" button (`src/components/GlobeOverlay.tsx`
  ~line 69, `src/components/PlacesOverlay.tsx`); `PLACE_SLICE_SPECS` has 24 slices and can be
  stepped through with the slice advance control.

---

## 6. Repo rules the next agent must follow

- **AGENTS.md (project root)** mandates the `graphify` workflow:
  - `graphify-out/graph.json` exists → run `graphify query "<question>"` **before** the first grep
    or source read for any codebase question. Use `graphify path "<A>" "<B>"` for relationships and
    `graphify explain "<concept>"` for a focused symbol.
  - `graphify section "<heading>"` prints a Markdown section without opening the `.md`.
  - `graphify-out/wiki/index.md` (if present) is the preferred navigation entry point.
  - After modifying code, run `graphify update .` to refresh the graph.
  - A large diff to `graphify-out/graph.json` in a PR is **expected** — do not treat it as churn and
    do not skip the rebuild.
- Tooling quirks in this environment:
  - **No Python** (`python3` → "Python was not found"). Use the `edit`/`write` tools for file edits.
  - `npx --no-install <bin>` resolves relative to the wrong cwd → use `node_modules/.bin/<bin>`.
- The `graphify` skill is installed locally; the user has explicitly asked for it to be used.

---

## 7. Suggested skills for the next agent

| Skill | Why to call it |
|---|---|
| `ui-unslop` | The user explicitly asked for it (installed at `C:/Users/PC/.agents/skills/ui-unslop/`). Read it, judge honestly whether it maps onto the material/geometry work, and report that judgement. |
| `codebase-design` | Deciding where the "stand" abstraction should live, given `dioramaKit.ts` vs `plinthKit.ts` vs `placesSliceBuilders.ts` are three parallel stand systems. |
| `emil-design-eng` | Judging whether the stand reads as crafted rather than templated — closest skill to "not too thick, not repetitive, blends seamlessly". |
| `animation-performance` | Only if the perf work turns out to involve animated materials; otherwise the relevant perf work is static vertex/geometry budget. |
| `diagnosing-bugs` | For the suspected ±8.4-vs-7.72 pilot edge-band mismatch, which needs isolating and confirming. |
| `graphify` | Required by AGENTS.md before any code exploration (the `graphify` skill or CLI). |

---

## 8. Suggested next steps, in order

1. `graphify query` for the stand/rim/plinth relationship, then re-read the current
   `src/three/builders/dioramaKit.ts` diff region and `src/three/builders/plinthKit.ts`.
2. **Get a baseline visual.** Reload `http://127.0.0.1:3000/#kruger-national-park` and
   `#boulders-beach` and screenshot both, so the pilot and non-pilot stands can be compared and
   the ±8.4/7.72 mismatch confirmed or dismissed.
3. **Decide the pilot depth question with evidence** in front of you (Boulders' water level vs
   `baseY`), then change `plinthKit.ts` / `plinthProfiles.ts` only if the shots support it.
4. **Implement river/road/stream continuation for at least the two named cases** (Blyde river at
   Three Rondavels, Storms River Mouth) as authored edge geometry reaching the wall.
5. **Re-verify**: `node_modules/.bin/tsc --noEmit`, `npm test`, `node_modules/.bin/oxlint`,
   `node_modules/.bin/vite build`, then `graphify update .`.
6. **Report honestly**: what is verified visually, what is only inferred, and no perf numbers
   without a measurement.

---

## 9. Note on sensitive information

No API keys, credentials, tokens, or personal data were used or captured in this work. Nothing to
redact. A browser profile with saved logins exists in the DeepAI Code preview browser
(`preview_status` → `profiles`) — treat it as a secret: do not print or export its contents.
