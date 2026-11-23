# CityLit improvement brainstorm — research & concrete findings

**Date:** 2026-11-23 · **Status:** brainstorm + **Batches 1 & 2 implemented** (see §10–11)
**Method:** four parallel code audits (UI, scene fidelity, animals, performance/motion) grounded via the
graphify knowledge graph, cross-checked against `docs/SCENERY-UPGRADE.md` baselines,
`docs/LANDMARK-RESEARCH.md` (colour contract), `docs/LANDMARK_ART_DIRECTION.md` (silhouettes),
`plans/011` (scale/wildlife/eggs — already shipped), the Phase-2 contact sheets, full-frame screenshots,
the production `dist/` bundle, and external research (three.js docs, caniuse, mobile-UX pattern literature).

**What is already done (do not re-propose):** motion plans 001–010; scale mode + wildlife layer + hidden
details (plan 011); Living Diorama phases 0–2 (biome palettes, north-transiting sun, Southern Cross /
Magellanic Clouds / meteors, batched vehicle lights, left-hand lanes, propKit, animalKit scaffolds with
season gating + idle poses + LOD + contact shadows, albedo audit, true clipping cutaway, 24 bespoke
Places interiors); measured quality tiers with runtime dynamic resolution; WebGPU stack with clean
WebGL fallback; thorough reduced-motion handling.

Priority key: 🟢 quick win (≤1 day) · 🟡 medium (days–1 wk) · 🔴 big bet (multi-week)

## Headline findings (the short version)

1. **UI:** the ruler is a top-layer modal covering the whole stage; there is *no dropdown component at all*
   despite ready `--dropdown-*` tokens; SearchSheet's 5 icon buttons crush the search field on phones;
   Passport's tab row overflows its own panel; virtual keyboards and notch side-insets are unhandled.
2. **Fidelity:** lamps already exist on 36 dioramas — the real gap is **Places/OSM (zero lamps, beige
   unroofed extrusions)** and nine wilderness sites. Mandela Bridge has 8 rail lines instead of 42;
   Voortrekker lacks its assegai gate/friezes/oculus shaft; stone renders near-white on 8+ sites.
3. **Animals:** `animal()` is a horned quadruped masquerading as flamingos/seabirds; no eyes on any
   species; merged geometry blocks all articulation; 2–10× undersized; duplicated herds at four sites from
   a half-finished migration.
4. **Scale:** no global metres-per-unit convention (15–362 m/u across sites); spans compressed ~4×;
   OSM uses 266.7 m/u with 2.5× vertical exaggeration.
5. **Performance:** `CB()` rounded boxes silently cost **588 triangles each** by default — hundreds per
   site, the likely dominant sink behind Bo-Kaap's 8.6 M tris; ~2,236 avg draw calls; the eager `three`
   chunk is 1.75 MB and contains the entire WebGPU/TSL stack for WebGL-only users.
6. **Motion:** reduced-motion and tokens are excellent; the gaps are camera preset tweening (fixed smoothstep),
   animal articulation, and weather-transition crossfades.

---

## 1. Mobile responsiveness & UI simplification

### Findings (audited)

- **The ruler is a top-layer centred modal.** `ScaleRulerModal.tsx:115–122` renders through
  `SettleModal` → `@ui-sdk/react` Dialog in the browser top layer with a fixed `black/70 + blur(4px)`
  backdrop (`index.css:574–593`). While open it dims and covers the TopBar, the scene and every button —
  exactly the "in front of them" problem. Its three control groups (Sort / Scale / Reference,
  `ScaleRulerModal.tsx:18–33`) are horizontal `PillNavigation` rows that wrap on phones.
- **SearchSheet header crushes the input on phones.** Five fixed `w-10 h-10 shrink-0` icon buttons
  (explore, passport, ruler, settings, close — `SearchSheet.tsx:197–222`) consume ~216 px, leaving ~90 px
  for the search field on a 360 px phone.
- **No-wrap header clusters collide with titles below ~400 px.** GlobeOverlay (`GlobeOverlay.tsx:33 vs 37`,
  title and 4-button cluster are separate absolute elements) and PlacesOverlay (5 buttons,
  `PlacesOverlay.tsx:150–215`, `shrink-0`, no wrap). Places' second strip wraps 8 time/weather pills into
  2–3 rows over the scene (`:220–270`).
- **PassportModal's 5-tab row overflows its own panel.** Non-compact `PillNavigation` (~400 px+) inside a
  `100vw−32px` panel (`PassportModal.tsx:318–325`); `PillNavigation` is `inline-flex` with no wrap/scroll.
- **LandmarkCard expanded = 15+ controls** in stacked horizontal rows (3 header icons, 3 toggle pills,
  4 camera presets + pins, notes drawer, footer nav — `LandmarkCard.tsx:446–1014`). A compact strip exists
  and auto-engages ≤640 px (`App.tsx:344–352`), but expanding on a phone still yields a very tall card.
  A long-press **radial menu already exists** (`LandmarkCard.tsx:1016–1055`) — an underused "more actions"
  surface.
- **There is no dropdown/popover component anywhere**, yet `transitions.css:77–81` already defines
  unused `--dropdown-*` tokens (and `--morph-*` at `:198–208`). The design language is ready; the
  component is missing.
- **Keyboard & safe-area gaps.** Auto-focusing inputs (SearchSheet `:79–83`, notes textarea
  `LandmarkCard.tsx:259–265`) sit in `fixed bottom-0` surfaces with no `visualViewport` handling and no
  `interactive-widget=resizes-content` in the viewport meta (`index.html:5`) → iOS keyboard covers them.
  `env(safe-area-inset-left/right)` is used **nowhere** → notch clipping in landscape. JS compact
  threshold (640 px) and CSS landscape threshold (700 px, `index.css:542`) disagree.
- **Stacking conflicts.** Offline pill / toast / confetti (z-50) float over open Sheets (z-40); the scale
  badge (z-40, left, y≈116 px) overlaps the centred time-of-day scrubber (y≈130 px, 300 px wide) on
  ≤360 px screens; fact callout and toast use near-identical bottom offsets and can overlap.
- **Reusable primitives that already exist:** `ui/Sheet.tsx` (portal bottom/right sheet, drag-to-dismiss
  with velocity, grab handle, focus trap), `ui/SettleModal.tsx`, `ui/PillNavigation.tsx`,
  `ui/UnfoldAccordion.tsx`, `ui/LiquidToggle.tsx`, Phosphor icons, Motion springs in `lib/motion.ts`.

### Ideas

1. 🟢 **Ruler → bottom sheet on mobile, modal on desktop.** Render `ScaleRulerModal` content inside
   `ui/Sheet` (bottom, peek ≈ 46 vh / full ≈ 85 dvh snap points) when `matchMedia('(max-width:640px)')`;
   keep `SettleModal` ≥640 px. The stage and TopBar stay visible and interactive above the peek height —
   "below the buttons", literally. Collapse Sort/Scale/Reference into one `UnfoldAccordion` "Options"
   row so the bar list gets the space. Reuse the existing `--cl-card-h` stacking convention.
2. 🟢 **Build `ui/Menu.tsx` — the missing dropdown.** Icon + text rows, Phosphor icons, entrance from the
   unused `--dropdown-*` tokens, focus trap + Escape + outside-press, `role="menu"`. Anchor to a trigger;
   on mobile render as a small bottom sheet instead of a floating popover (thumb reach). Then:
   - SearchSheet: keep search + close; move explore/passport/ruler/settings into a "More" menu → input
     regains ~170 px.
   - PlacesOverlay/GlobeOverlay: collapse labelled buttons ("Landmarks", "Globe") to icons ≤640 px and
     put reset/sound/close in the menu; make title + cluster one `flex justify-between` row (Globe).
   - TopBar: at ≤374 px fold fullscreen + scale into the menu.
3. 🟢 **LandmarkCard mobile camera presets → one "View" dropdown** (Default / Aerial / Low / Macro with
   icons), and move postcard/gallery/favorite into the existing radial long-press menu (discoverable via
   a visible "⋯" affordance). Keeps every function, removes two pill rows.
4. 🟢 **Passport tabs:** `compact` + `overflow-x-auto no-scrollbar` (pattern already used at
   `GlobeOverlay.tsx:88`).
5. 🟡 **Keyboard & safe-area pass:** add `interactive-widget=resizes-content` to the viewport meta;
   subscribe to `visualViewport.resize` for the two auto-focus inputs (translate the sheet/card by the
   keyboard delta); add `env(safe-area-inset-left/right)` to TopBar, LandmarkCard, compass, Places/Globe
   cards; unify the 640/700 px thresholds on one token.
6. 🟡 **One z-index scale.** Document the ladder (HUD 10 → mode HUD 20 → transient 30 → sheets 40 →
   dialogs/top-layer 50) and move offline pill/toast below sheets or offset them above the sheet handle;
   give the scale badge a `max-width` that clears the scrubber at ≤360 px (or hide it while the scrubber
   is open).
7. 🟢 **Prune `transitions.css`:** ~20 unused token groups (avatar, like, matrix, reason, stream, think,
   tooltip, morph, dropdown until used, stack…) — dead weight in every page load.

---

## 2. 3D model fidelity to the real place

### Findings

- **Stone reads white on many sites.** The Phase-2 noon contact sheet shows Voortrekker Monument, Castle
  of Good Hope, Chapman's Peak, Knysna Heads, Sani Pass, Hartbeespoort, Gariep and Vredefort as near-white
  masses. Real materials: Voortrekker = pink-grey granite; Castle = warm yellow-ochre plastered walls;
  Chapman's/Knysna = tan/ochre Peninsula sandstone; Sani/Drakensberg = grey basalt over tan sandstone;
  Gariep/Vredefort = grey-brown concrete/kimberlite. The albedo contract (`albedoAudit.ts`, ≤0.75 sRGB
  albedo, 0.80–0.88 white ceiling) exists but the *base colours* fed into it are too light on these sites.
- **Streetlights are broad on dioramas, absent in Places.** `addStreetLampSet` has **36 call sites** —
  every urban/coastal diorama already has lamps (Bo-Kaap ×3, Ponte, Orlando, Donkin, Groot…). The system
  is sophisticated: six archetypes (`dioramaKit.ts:2206–2297`), instanced hardware, shader bulbs with
  per-instance staggered switch-on, additive ground pools, haze cones, halos, water reflections and
  rain-gated wet streaks; a session-wide pool of 4 real PointLights with photocell offsets and discharge
  strike flicker (`streetLights.ts:86–125`, `CitylitEngine.ts:1373–1422`). **The gaps:** (a) the nine
  wilderness sites have no lamps at all (baobab, rondavels, kruger, kgalagadi, isandlwana, mapungubwe,
  pilanesberg, richtersveld, vredefort) — camp/park lanterns would fit several; (b) **Places slices and
  the OSM explorer have zero lamp fixtures** (`placesSliceBuilders.ts:1343–1358` is emissive windows and
  taxi lamps only) — the night city is lit by windows alone; (c) `syncStreetLamps` is hero-mode only
  (`CitylitEngine.ts:1376`). Legacy `lampPost()` (`primitives.ts:1916`) is dead code — prune.
- **Human-scale context is sparse.** propKit has 8 helpers (bench, sign, picnic table, crates, kraal
  fence, cairn, path marker, awning), but there are **no people anywhere** (only statues: Mandela,
  Van Wouw mother-and-child, Atlas, pioneers), no bins, no washing lines, no flagpoles, and **no generic
  sidewalk/curb/road-marking system** — roads are bespoke per site. The diorama reads as "monument on a
  plate" rather than a place.
- **Places ≠ OSM.** `placesScene.ts` is 24 **hand-sculpted** curated cutaway slices (correct relative
  geography, not survey-accurate). The separate OSM explorer (`osmSlice.ts:80–352`, Overpass +
  open-meteo relief + Nominatim, 400 m radius) has **real building footprints and road centrelines** but
  renders untextured beige extrusions — no roof shapes, two tones only, no furniture, no lamps, no lane
  markings, no crossings, 2.5× vertical exaggeration clamped ±0.42. This is the biggest "based on the
  real place" opportunity: the geometry is already real; the dressing is not.
- **Specific fidelity gaps vs the research docs:** Nelson Mandela Bridge rail yard is **8 lines vs the
  real 42** (`landmarksA.ts:915`); Voortrekker lacks the assegai gate, wildebeest friezes and the oculus
  volumetric light shaft (dark circle + torus only, `:1433–1452`); Three Rondavels baboons exist only as
  a hidden egg, not a visible troop; Table Mountain bumpScale is still 0.03 (vs 0.05–0.07 recommended),
  tablecloth 16+5 puffs (vs 24–30), no summit reservoirs; Union Buildings terraces are stepped boxes,
  not curved amphitheatre rows.
- **Vegetation is generic.** The same flat-canopy tree and conifer shapes repeat across biomes; Table
  Mountain shows pine-like conifers where Peninsula fynbos (low shrubs, proteas, restios, silver trees)
  belongs. SCENERY-UPGRADE delta D flags the missing named species vocabulary
  (`acacia/camelthorn/marula/yellowwood/milkwood/fynbos/protea/silverTree`).
- **Water & traffic leftovers (Phase-2 carry-forward):** lamp reflections on water (`reflectY`) are used
  at only 3 iSimangaliso bollards; Places cutaway water has no moon glint; brake lights and traffic
  robots are absent; per-site far-horizon signatures are region-level only.
- **Places interiors are a strength:** all 24 slices have bespoke batched interiors
  (`placesInteriors.ts`, `InteriorBatch` → one InstancedMesh per geometry/material pair), seasonal
  foliage, taxi lamps and shader water — the dressing gap is outside the buildings, not inside.

### Ideas

8. 🟡 **Stone albedo correction pass** against `LANDMARK-RESEARCH.md`: darken/warm the eight washed-out
   sites listed above; add iron-oxide banding on sandstone cliffs (Table Mountain, Chapman's, Knysna) via
   the existing `paintStrata`/`weatherVertexColors` helpers. Validate with `albedoAudit` tests + contact
   sheet diff. This is the single biggest "looks like the real place" win.
9. 🟡 **Streetlight coverage pass — where it's actually missing.** (a) Places slices + OSM explorer:
   sample cobra/victorian fixtures along road centrelines (OSM `highway=*` already parsed), instanced
   hardware + shader bulbs reusing `addStreetLampSet`'s materials; extend the 4-light promoted pool to
   Places mode (`syncStreetLamps` is hero-only today). (b) Wilderness sites: camp lanterns at Kruger /
   Pilanesberg rest camps, a windpump-adjacent farm lantern at Kgalagadi, bollard path lights at
   Mapungubwe/Richtersveld trails — low count, warm tint, same photocell schedule. (c) Prune dead
   `lampPost()`. Keep ≤4 promoted point lights + ≤2 site night lights; everything else stays emissive.
10. 🟡 **Human-context prop kit v2:** static person silhouettes (2–3 poses, shared charcoal material,
    merged), a few walking figures on Places sidewalks (reuse the traffic spline helper), parked cars
    (existing `car()` with lights off), wheelie bins, flagpoles (SA flag at Union Buildings/Castle),
    Bo-Kaap washing lines with coloured cloth, taxi rank shelter + queue at Places slices. All merged /
    instanced; no new lights. People also fix the "how big is this?" reading instantly.
11. 🟡 **Named species vocabulary** in `primitives.ts` + `SITE_PROFILES.ring`: fynbos shrub cluster +
    silver tree + protea for Table Mountain/Cape Point; camel thorn for Kgalagadi (already close);
    marula + knob thorn for Kruger/Pilanesberg; yellowwood/milkwood for Storms River/Knysna; oak rows for
    Groot Constantia; jacaranda with **October/November-only** violet shell + petal carpet on the Union
    Buildings ground (season plumbing already reaches foliage). Replace the conifers on fynbos sites.
12. 🟡 **Water truth extensions:** wire `reflectY` lamp reflections at every coastal/lagoon night site
    (Knysna, Hermanus, Harties, Gariep, iSimangaliso); add moon glint to Places cutaway water (sun glint
    shader exists, `water.glsl.ts:137–139`); per-river flow vectors already exist for dioramas — extend to
    Places confluences.
13. 🟡 **Traffic robots + brake flares** in the existing fixed-count additive batch pattern
    (`vehicleLightKit.ts`): SA robots are distinctive (yellow-backed heads); brake flare on deceleration
    segments of the spline routes. Left-hand lane offsets already exist (`trafficMath.ts`).
14. 🔴 **Per-site horizon signatures:** extrude one low-contrast far silhouette per site (Table Mountain's
    flat top from the city bowl, Lion's Head cone beside it, Drakensberg wall, Soweto cooling towers) —
    region signatures exist; site identity is still colour-only (`horizonScenery.ts:317–319`).
15. 🟢 **Tablecloth ↔ weather link:** the orographic cloud should pour over the SE edge only when the
    live weather wind is south-easterly (the "Cape Doctor"); calm days = bare summit. Weather data already
    reaches the engine (`setLiveWeather`). Same idea: Augrabies spray volume ↔ flow, Hermanus whale
    activity ↔ winter months (already gated).
15a. 🟡 **OSM explorer dressing — real geometry, bare presentation.** The footprints/roads are already
    real (`osmSlice.ts:204–243`); add roof shapes + colours from OSM tags (`roof:shape`, `building:colour`,
    `building:levels`), lane markings/crossings/sidewalks from `highway=*` tags, and a light scattering of
    street furniture/people. This converts geometrically-correct-but-beige slices into recognisable
    places — the highest "based on the real place" ROI in the app.
15b. 🟢 **Architectural symbolism micro-fixes** from the pending `LANDMARK_IMPROVEMENTS.md` list:
    Mandela Bridge rail yard 8 → **42 lines** (`landmarksA.ts:915`) and make the unequal pylons read
    against the longer deck; Voortrekker assegai gate, wildebeest friezes and a volumetric oculus shaft
    (`:1433–1452` is currently a dark circle + torus); visible Three Rondavels baboon troop (currently
    hidden-egg only); Table Mountain bumpScale 0.03 → 0.05–0.07 and tablecloth 21 → 24–30 puffs;
    Groot Constantia's curved amphitheatre-style garden terraces.

---

## 3. Animal detail

### Findings (audited, `primitives.ts` + `animalKit.ts` + `wildlife.ts`)

- **The generic `animal()` (L2370–2391) is a horned quadruped used for seven bird species** — pink
  "flamingos" at iSimangaliso/Harties, "seabirds", "vultures", "eagles", "swallows", "dassies"
  (`wildlife.ts:57–214`). Only the colour changes. This is the worst silhouette mismatch in the app.
- **Zero articulation.** Every builder ends in `mergeByMaterial()` → 2–3 static meshes; `animalKit`
  animates whole-body bob/sway/squash only (`writeAnimalPose:155–197`). No leg swing, no trunk/ear/tail/
  flipper motion anywhere. "Walking" at Pilanesberg is a circular glide; "swimming" is drift + bob.
- **No eyes on any species** (elephant, penguin, whale, gemsbok, generic). The hippo has periscope
  eyes/ears/nostrils but **no body below the waterline** — it can never appear on land.
- **Species-correct features that DO exist** (keep): elephant fan ears + S-trunk + tusks + saddle back;
  penguin pink supraorbital glands + horseshoe chest band + black feet; whale callosities + no dorsal fin;
  gemsbok spear horns + flank stripe + face mask.
- **Fauna is uniformly 2–10× undersized vs the local prop scale** (bench seat 0.42 u ≈ 0.42 m; note there
  is no global metres-per-unit convention — see §4): whale
  1.55 u vs real 14–16 m (dolphin-sized), elephant 0.69 u shoulder vs 3.2 m, gemsbok 0.30 u vs 1.2 m,
  penguin 0.16–0.42 u vs 0.65 m. Inter-animal ratios are near-correct (4.3:1.9:1 vs real 4.9:1.8:1) — the
  whole fauna is miniaturised, not inconsistent. Terrain is hyper-compressed (24 km crater → 15 u), so
  animals are actually *oversized* relative to terrain; the honest fix is a disclosed, per-site
  `unitsPerMetre` (the scale-reference system already computes this, `dioramaKit.ts:3466–3468`).
- **Duplicated populations:** Boulders (16 builder + 36 instanced + 6 wildlife = 58 penguins), Hermanus
  (3 builder + cove + 2 wildlife = 6 whales), iSimangaliso (5 + 3 hippos), Kruger (4 + 3 elephants) —
  the builder→wildlife-layer migration is half-finished (comments at `landmarksA.ts:3234`,
  `landmarksB.ts:1820` say the layer supplies them, but builders still place their own).
- **Builder animals bypass the scaffold:** no season gating, no LOD, no instancing (except Boulders'
  background batch). Only wildlife-layer scaffolds get LOD (`farDistance 18 / cullDistance 34`).
- **No animal audio** (elephant rumble, penguin bray, whale blow, hippo grunt) — `ambientAudio.ts`
  discrete events cover shorebird/cicada/frog only.

### Ideas

16. 🟢 **Eyes everywhere.** Two 0.01–0.02 u dark spheres with a tiny white specular glint per species
    (merged into the dark material batch — zero extra draw calls). Single biggest "alive" upgrade per
    triangle. Add the penguin's white eye-ring and the whale's jaw line (a thin curved tube) at the same
    time.
17. 🟢 **Real bird templates.** Replace `generic` for birds in `wildlife.ts` with: `flamingo()` (biped,
    S-curve neck tube, down-bent beak, one-leg idle pose, pink with black flight feathers), `seabird()`
    (gannet: white body, black wingtips, golden head), `vulture()` (hunched shoulders, bare neck, hooked
    beak), `dassie()` (small rounded quadruped, no horns, sunbathing pose on rocks). Reuse the existing
    `bird()` flying template for swallows. ~4 new builders, same kit, same merge pattern.
18. 🟢 **Finish the migration / dedupe.** Delete builder-local herds at Boulders/Hermanus/iSimangaliso/
    Kruger; keep their tuned positions as `WILDLIFE` spots (Kgalagadi already shows the pattern). Removes
    ~30 redundant animals and unifies season/LOD/audio behaviour.
19. 🟡 **Near-tier articulation without skeletons.** For `count ≤ 6` scaffolds, keep the merged body but
    parent 2–4 *separate* part meshes to pivots: elephant trunk (2-segment sway) + ear fan, penguin
    flipper stroke, whale fluke pitch, gemsbok head graze/look-up. Far tier stays the merged instanced
    batch (current behaviour). Cost: +2–4 draw calls per near herd, offset by the dedupe in #18.
    `animalKit` already composes per-member matrices — extend `writeAnimalPose` to write part pivots.
20. 🔴 **GPU herd animation (optional stretch).** For large instanced herds, add a skinning-lite vertex
    displacement via `onBeforeCompile`/TSL: a per-vertex `aPart` weight attribute + 3 bone uniforms
    (head/legs/tail) driven by the existing per-member phase. Keeps 1 draw call per batch with real gait.
    Only worth it after #19 proves the motion vocabulary.
21. 🟡 **Scale honesty pass.** Fill the `magnitudeM: null` entries in `scaleFacts.ts` for wildlife sites
    (Kruger, Kgalagadi, Hermanus, iSimangaliso) with a defensible measure; then scale fauna toward the
    prop convention (whale ×3, elephant ×1.6, gemsbok ×2.5, penguin ×1.8) *or* keep the miniature
    convention but disclose it in the ruler badge. Whales next to a 0.42 u bench must not read as dolphins.
22. 🟡 **Hippo land moment + whale blow sync.** Give the hippo a full merged body variant used when the
    water level drops (dry-season gate exists); sync the whale's blowhole spray (`drift`) to the fluke
    arch so the blow precedes the dive — the Hermanus breach cycle already has the timing skeleton.
23. 🟡 **Behaviour signatures:** grazing head-down cycles with occasional look-up (gemsbok/elephant),
    penguin waddle already exists — add a chick (grey fluff sphere, smaller, follows an adult), springbok
    pronk (four-leg stiff bounce) for Pilanesberg/Kgalagadi, dassie sunbathing flat on Table Mountain tors.
24. 🟡 **Animal audio hooks** in `ambientAudio.ts` discrete events: elephant low rumble (rare), penguin
    bray colony bed at Boulders, whale blow exhale synced to #22, hippo grunt, hadeda alarm at dawn
    (see §7). Spatial anchors already exist (`dioramaKit.ts:3187–3254`).
25. 🟢 **Register builder animals in the engine LOD list** (`activeLods`, `CitylitEngine.ts:1800–1811`)
    so the remaining bespoke animals get distance culling for free.

---

## 4. Scale of details relative to the real place

### Findings

- **There is no global metres-per-unit convention.** Every site is hand-built to fill a ~12–15 u plinth
  and camera-fitted. `scaleFacts.ts:29–34` records Table Mountain as 1086 m / 3 model units → **~362 m/u**
  (plateau 7.2 u ≈ 2.6 km vs real ~3 km — horizontally plausible; cableway 0.78→2.85 u ≈ 282→1032 m vs
  real 302→1067 m — good). But Moses Mabhida is 106 m / 7.3 u → **~14.5 m/u**, Mandela Bridge 42 m /
  8.3 u → **~5 m/u** with a 15 u deck ≈ 75 m vs the real 284 m span (**spans compressed ~4×**), and
  Vredefort's 300,000 m magnitude is a small plate. Ratios span two orders of magnitude.
- **Props are built to a human-scale convention** (bench 1.35 u long / seat at 0.42 u, picnic table
  1.75 u, lamp poles ~0.65–0.8 u — roughly 1–2 u per human-scale metre) that is *incompatible* with the
  15–362 m/u landscape ratios. The scale-reference system resolves this honestly by clamping silhouettes
  to 0.42–2.6 u and disclosing `displayFactor` (`dioramaKit.ts:3458–3484`, `src/lib/scale.ts:5–7`) — the
  same disclosure discipline should extend to fauna and furniture.
- **OSM explorer uses a real convention:** 1 u = 266.7 m (`SLICE_HALF/data.radiusM` = 1.5/400,
  `osmSlice.ts:87–88`) with 2.5× vertical exaggeration clamped ±0.42 (`:119`).
- **Wildlife sites lack scale facts:** Kruger, Kgalagadi, Hermanus and iSimangaliso have
  `magnitudeM: null`, so no honest ruler comparison or scale figure exists there.

### Ideas

26. 🟢 **Numeric scale facts for all sites.** Curate height/span/length/depth for the null entries from
    the free-text `landmarkDetails.scale` strings; record the *measure* (a crater's "size" is depth, not
    height). Unlocks honest ruler comparisons everywhere.
27. 🟡 **One documented, disclosed convention:** props ≈ human scale, terrain compressed per site with a
    recorded `unitsPerMetre`, vertical exaggeration disclosed (plan 011 D5 + `displayFactor` already model
    the pattern), fauna on the prop convention after #21. Add `unitsPerMetre` to `SITE_PROFILES` so
    builders place details from metres instead of eyeballed units — lamp poles sized as real 8–10 m poles
    *at the site's ratio* rather than as 0.7 u miniatures.
28. 🟢 **Human figure in Places/OSM.** The scale-reference person silhouette exists for dioramas; place
    one on each Places slice sidewalk and OSM pavement so OSM `height`/`building:levels` tags produce
    readable storey heights at 266.7 m/u.
29. 🟡 **Audit signature proportions** against `LANDMARK_ART_DIRECTION.md` cues: keep Mandela Bridge's
    unequal 42 m / 27 m pylons, restore the 284 m span relationship (#15b), Moses Mabhida arch 106 m over
    a 45 m bowl, Big Hole 463 m rim vs 175 m visible depth, Union Buildings 285 m facade. Add a
    `fitMath`-based per-site proportion audit (the helper already publishes `plinthFit`/`fitsPlinth`).

---

## 5. Performance (without sacrificing quality)

### Findings (audited + measured)

- **Baseline cost:** Phase-2 noon avg **2,236 draw calls / 1.22 M triangles**; worst Bo-Kaap **6,556 calls
  / 8.61 M tris**; Union Buildings 5,184 / 3.64 M; Groot Constantia 4,308 / 5.28 M. Mobile target
  (≥30 fps mid-device at Medium) is **not yet certified** outside headless.
- **`CB()` rounded boxes default to `segs=3`** (`primitives.ts:751`) → `RoundedBoxGeometry` builds a
  7×7×7 subdivided box = **588 triangles each** (verified in three r187 source). `CB` is used for every
  window frame, door, shutter, bench slat, animal flipper/foot/muzzle — hundreds per site, most with
  rounding radii of 0.004–0.02 u (sub-pixel at diorama scale). `segs=1` = 108 tris, `segs=2` = 300 tris.
  **This is the dominant triangle sink on house-heavy sites (Bo-Kaap, Groot Constantia, Union Buildings).**
  `C()` cylinders already got radius-adaptive segments (`:759–778`); `CB` never did.
- **`mergeByMaterial` is per-assembly, not per-scene.** ~40 call sites collapse sub-assemblies, but each
  house/tree-group/prop stays separate → thousands of calls. No `BatchedMesh` anywhere.
- **Auto-exposure does a synchronous GPU readback every rendered frame on WebGL**
  (`CitylitEngine.ts:2099`, one half-float row) — a pipeline stall; the WebGPU path is async/throttled,
  and `readRenderTargetPixelsAsync` already exists on the WebGL renderer wrapper (`SceneRenderer.ts:137`).
- **Assets:** the only binary texture in `public/` is `assets/env/sky.hdr` (1.4 MB, async-load + CPU
  luminance pass + PMREM at boot) — everything else is procedural canvas textures, so KTX2 compression is
  N/A; consider a lower-res HDR fallback for the low tier if boot time matters.
- **Bundle:** production `three` chunk = **1,751 KB and contains `WebGPURenderer` + TSL `NodeMaterial`
  code** (verified by string search in `dist/assets/three-*.js`) — every WebGL-only user downloads the
  WebGPU stack because `manualChunks` matches `/three/` for the dynamic `three/webgpu`/`three/tsl`
  imports too (`vite.config.ts:130`). The small `three.webgpu`/`three.tsl` chunks are re-export shims.
  Landmark diorama builders are **not lazy** (all in the 450 KB engine chunk; `placesSliceBuilders` is a
  separate 202 KB lazy chunk). Total JS 3.75 MB.
- **Render loop is always-on rAF**; idle pacing exists only for reduced-motion (15 fps) and software GL
  (20 fps). Ordinary idle on a phone renders at full rate even when the scene is visually static.
- **WebGPU SSAO renders the scene a second time** for an MRT normal pass (`webgpuPostFX.ts:119–128`).
- Quality tiers, dynamic resolution (0.75–1.0 renderScale), strided shadow updates, LRU landmark pool +
  idle prewarm, `compileAsync`, GPU-timestamp benchmark are all **already good** — keep them.

### Ideas

30. 🟢 **Size-aware `CB` segments** (mirror `C()`'s adaptive logic): `segs=1` when max dimension < 0.3 u,
    `2` when < 1.5 u, else 3. Expect **−50–70 % triangles on house-heavy sites** with zero visible change
    (rounding radii are sub-pixel). Re-run `pnpm qa:stats` + contact-sheet diff to prove parity. Highest
    impact-per-line change in the whole app.
31. 🟡 **Scene-level static batching.** After build, merge all *static* meshes sharing a material across
    the whole landmark group into one geometry per material (extend `mergeByMaterial` with a scene pass),
    or use `BatchedMesh` per material where per-object culling/visibility matters. `WEBGL_multi_draw` is
    supported on Chrome 72+ / Safari iOS 15+ (caniuse verified), and three falls back to per-range draws
    without it — still fewer state changes. Keep separate: interactive targets, animated meshes
    (`userData.tick` parts), dissolve/cutaway-flagged meshes, vertex-coloured materials (handle explicitly).
    Target: **2,236 → ~150–300 avg calls**. The diorama is always fully in view, so coarse culling is fine.
32. 🟢 **Async auto-exposure on WebGL:** switch `:2099` to `readRenderTargetPixelsAsync` every 10–15
    frames (exposure is a slow lerp anyway); removes the per-frame sync stall.
33. 🟡 **Lazy landmark builders:** split `landmarksA/B` into per-builder dynamic imports (or 3–4 regional
    chunks) behind the existing registry + LRU prewarm; engine chunk drops from 450 KB toward ~150 KB.
34. 🟢 **Fix `manualChunks`** so `three/webgpu`, `three/tsl` and their node code land in the *lazy*
    WebGPU chunk, not the eager `three` chunk (match `node_modules/three/build/three.webgpu*` /
    `three.tsl*` / `src/renderers/webgpu` explicitly before the generic `/three/` rule). Saves ~600–900 KB
    for the majority WebGL path. Verify with a build + string search as done here.
35. 🟡 **Mobile idle pacing:** when no pointer/gyro input and no active tween for >2 s, cap render at
    30 fps on tier 1/2 (simulation keeps ticking; only `afterDraw` pacing changes — the mechanism exists
    at `:4656–4681`). Halves idle GPU work on phones without touching interaction smoothness.
36. 🟡 **WebGPU SSAO cost:** reconstruct normals from depth (single pass) or run the normal pass at half
    resolution; keep 4× MSAA at tier 0.
37. 🟢 **Perf guardrails in CI:** extend `scripts/capture-contact-sheets.mjs` to *assert* the +10 %
    per-site call/triangle ceilings from `docs/baseline/baseline-stats.json` (they're currently documented
    but not enforced), and add a bundle-size check for the eager `three` chunk.
38. 🟢 **Housekeeping:** move `@types/*`, `typescript`, `vite`, `oxlint`, `oxfmt`, `express` to
    devDependencies; prune unused `transitions.css` tokens (also §1.7).

---

## 6. Animation & motion

### Findings

- `lib/motion.ts` + `transitions.css` tokens are solid; plans 001–010 shipped (reduced-motion gating,
  interruptible pills, no layout-property animation over canvas, consolidated easings).
- Camera presets use a hand-rolled **smoothstep tween** (`camGoalT += dt*1.4`, `CitylitEngine.ts:4214–4235`)
  — fixed-duration, not velocity-aware, not spring-interruptible mid-flight the way the UI springs are.
- Hero dissolve (GPU cut-plane + dust + contact-shadow fade) is a signature motion — keep.
- Weather IBL switches are **texture swaps** (`:4531–4555`) — no crossfade between sky regimes.
- Animals: see §3 (the biggest motion gap).
- `drift()` particle helper rewrites its whole position buffer on CPU each call with
  `frustumCulled=false` (`primitives.ts:1991–2001`) — fine for small sprays, but audit the largest users.

### Ideas

39. 🟡 **Spring camera presets.** Replace the smoothstep tween with the existing
    `springFromResponse`/`noBounce` critically-damped spring (`motion.ts:25–38`) integrated in the frame
    loop, seeded with the current orbit velocity → presets become interruptible and hand off smoothly
    from a flick. Keep reduced-motion instant snap.
40. 🟢 **Dusk lamp flicker-on.** Photocell schedule exists; stagger lamp emissive ignition with a 2–3
    frame fluorescent flicker per archetype (cobra = instant, victorian = warm fade, lantern = flicker).
    Cheap (emissive only), hugely atmospheric at the day→night transition.
41. 🟡 **Sky regime crossfade.** Blend environment intensity + fog colour over ~1.5 s on IBL texture swap
    (uniform lerp, no extra PMREM) so weather changes feel like weather, not a cut.
42. 🟢 **Flag cloth & washing-line sway** via the existing CPU sway list (`:4315–4320`) or a tiny vertex
    shader — Union Buildings flags already flutter; extend to Bo-Kaap washing lines (#10).
43. 🟢 **Diorama pointer wake.** Places water has a pointer wake (`WU.wake`); port the same uniform to
    diorama `waterize()` so dragging over the sea at Boulders/Hermanus/Knysna leaves ripples.
44. 🟢 **UI micro-motion:** ruler sheet snap physics (reuse Sheet velocity dismiss), dropdown entrance
    from `--dropdown-*` tokens, card compact↔expand `layoutId` morph (the title morph already exists),
    haptic tick on camera-preset change (haptics helper exists).
45. 🟡 **Whale breach anticipation:** the 11 s breach cycle exists; add a pre-blow fluke raise and a
    splash ring that expands with easing instead of linear scale — reads as weight, not pop-up.

---

## 7. Delight & "anything else"

46. 🟢 **Hadeda at dawn.** The iconic SA hadeda alarm call as a rare dawn audio event (ambientAudio
    discrete events exist) — instantly recognisable to every South African user.
47. 🟢 **Noon gun.** Cape Town sites: a single distant boom + smoke puff at 12:00 local (the real Noon
    Gun fires daily from the Castle/V&A). Ties audio to the time-of-day system.
48. 🟡 **Load-shedding easter egg.** A scheduled rolling blackout that sweeps window lights off block by
    block for ~30 s (window-light schedule exists, `windowLights.ts`), with a toast "Stage 2 — load
    shedding". Darkly funny, deeply local, zero new systems. SCENERY-UPGRADE flags it as missing.
49. 🟡 **Sardine run event (Jun–Jul).** KZN coast sites (Hole in the Wall, Storms River, iSimangaliso):
    a bait-ball of instanced fish dots + diving gannets + a copper shark silhouette, gated by month like
    the whales. The instancing + season plumbing already exists.
50. 🟢 **Whale crier's kelp horn** at Hermanus as the whale-spotting audio cue (the real town crier blows
    a kelp horn when whales are in the bay) — pair with the existing breach cycle.
51. 🟢 **Protea blooming season** on fynbos sites (spring colour tips via the foliage season shader),
    **jacaranda petal carpet** at Union Buildings in Oct/Nov (windParticles already has jacaranda colour).
52. 🟡 **Minibus taxi quantum** in Places traffic (the real SA street vehicle — white with blue/yellow
    stripe), plus a taxi hoot audio event; left-hand lanes already correct.
53. 🟢 **Postcard date/weather stamp** — the postcard modal already stamps notes; add the capture date,
    time-of-day and live weather glyph so shared postcards carry the moment.
54. 🟡 **Province completion badges** in the Passport (all sites in a province stamped → badge), reusing
    the existing province ring SVG.

---

## 8. Suggested execution order

**Batch 1 — 🟢 quick wins, high certainty (≈2–3 days total):**
#30 CB segments · #16 eyes · #17 bird templates · #18 dedupe populations · #32 async exposure ·
#34 chunk fix · #1 ruler→sheet · #2 SearchSheet/Places overflow menu · #4 passport tabs ·
#37 perf guardrails · #38 housekeeping.
→ Expect: Bo-Kaap-class sites −50 %+ triangles, ~−30 % eager JS, visibly better animals, phone UI
un-crushed. Re-run `pnpm qa:capture` + contact-sheet diff after.

**Batch 2 — 🟡 fidelity & structure (≈1–2 weeks):**
#8 stone albedo · #9 lamp coverage · #10 people/props · #11 species vocabulary · #15a OSM dressing ·
#15b architectural symbolism · #31 scene batching · #33 lazy builders · #19 near-tier articulation ·
#21 scale honesty · #26 scale facts · #5 keyboard/safe-area · #39 spring camera · #40 lamp flicker ·
#24 animal audio.

**Batch 3 — 🔴/🟡 bets & delight:**
#14 horizon signatures · #20 GPU herds · #49 sardine run · #48 load shedding · #12 water extensions ·
#13 robots/brakes · #46–54 delight set.

**Guardrails for every batch** (from SCENERY-UPGRADE carry-forward): keep three@0.187, PCFShadowMap +
`autoUpdate=false`, HalfFloat composer + ACES, ≤4 promoted lamp point lights + ≤2 site night lights,
no new runtime deps / no imported GLTF or texture assets, no per-frame allocation, reduced-motion rest
poses, `normalizeProfileKey`/`normalizeSiteVisualKey` for site lookups, +10 % per-site call/triangle
ceilings vs baseline, `graphify update .` after code changes.

---

## 9. Research references

- three.js `BatchedMesh` docs + `WebGLRenderer` multi-draw fallback (Context7, r187/dev): per-object
  frustum culling, `setVisibleAt`, geometry-layout constraints; fallback issues per-range draws when
  `WEBGL_multi_draw` is absent.
- caniuse `WEBGL_multi_draw`: Chrome 72+, Safari/iOS 15+ → multi-draw batching viable on all target
  browsers.
- three.js `LOD` (hysteresis) and `GPUTimer` docs (Context7) — the engine already uses GPU timestamps;
  LOD hysteresis is the missing nicety for animal/tree tier switches.
- three.js discourse "best practices for mobile" + optimization guides: instancing/merging first,
  cap DPR, avoid postFX on low tier, KTX2 for texture memory (N/A here — textures are procedural).
- NN/g *Bottom Sheets* and *Contextual Menus*; Mobbin bottom-sheet glossary: contextual controls in the
  lower screen area, peek/full snap points, non-modal sheets keep the map visible — the pattern behind
  #1–#3.
- 80.lv *Creating Visual Interest in Low Poly Artworks*: shape language, silhouette readability and
  selective detailing — the principle behind #16–#19 (eyes, beaks, flippers beat polygon count).
- Internal: `docs/SCENERY-UPGRADE.md` (baseline stats + carry-forward invariants),
  `docs/LANDMARK-RESEARCH.md` (colour contract), `docs/LANDMARK_ART_DIRECTION.md` (silhouette/scale cues),
  `plans/011-diorama-scale-wildlife-and-hidden-details.md`, `docs/baseline|phase1|phase2/*-stats.json`,
  `docs/qa-mobile.md`.

---

## 10. Batch 1 — implementation status (2026-11-23)

**Shipped** (19 modified files + 2 new: `src/components/ui/Menu.tsx`, `docs/baseline/current-stats.json`):

| Idea | What landed |
|---|---|
| #30 | `CB()` default segments are now size-derived (1 / 2 / 3), cache key uses the effective count; explicit `segs` still honoured. |
| #16 | Dark eyes + glints added to all six animal builders (glints reuse existing light batches where possible; one shared glint material otherwise). |
| #17 | New `flamingo()`, `seabird()`, `vulture()`, `dassie()` templates + `bird` kind; `AnimalKind` extended; all 10 bird/dassie wildlife spots migrated off the quadruped `generic`. |
| #18 | Builder-local herds removed at Boulders / Hermanus / iSimangaliso / Kruger; season-gated, LOD'd wildlife scaffolds absorb their positions/counts. Signature whale breach/blow and the 36-instance penguin far tier stay. |
| #32 | WebGL auto-exposure now samples via PBO-backed `readRenderTargetPixelsAsync` every 12th frame; dt accumulates so the lerp keeps its time constant; in-flight/context-loss guarded. |
| #34 | `manualChunks` matches `three/build/three.{webgpu,webgpu.nodes,tsl}.js`, `three/src/renderers/webgpu/`, `three/src/nodes/`, `three/examples/jsm/tsl/` before the generic `/three/` rule → separate lazy `three-webgpu` chunk. |
| #1 | `ScaleRulerModal` renders in `ui/Sheet` on phones (50→88 dvh), `SettleModal` on desktop; controls collapsed into an "Options" accordion. Verified on a 390×844 viewport: toolbar remains visible above the sheet. |
| #2 | New `ui/Menu.tsx` (icon+text rows, keyboard/outside-press, phone bottom popover using `--dropdown-*` tokens); SearchSheet header reduced to input + More + close (verified on-device screenshot); Passport tabs compact+scrollable; Globe/Places headers unified with phone menus; LandmarkCard camera presets → "View ▾". |
| #37 | `qa:capture`/`qa:stats` enforce +10% per-site call/triangle ceilings with a per-site PASS/FAIL table and non-zero exit; `--baseline` override added, default `docs/baseline/current-stats.json`. |
| #38 | 251 provably-unused `transitions.css` token groups removed (5 shared + 5 dropdown tokens kept); dependency move skipped — would require an offline-unsafe `pnpm-lock.yaml` rewrite. |

**Verification:** `pnpm lint` (only the pre-existing graphify-plugin warning), `pnpm test` 102/102,
`pnpm build` pass; eager `three` chunk **1,751 KB → 1,050 KB** with `WebGPURenderer`/`NodeMaterial` now only
in the 743 KB lazy `three-webgpu` chunk (verified by string search). Headless QA capture against the
harness-matched baseline: **PASS, 129 site checks**. Measured noon triangles vs Phase 2:
Bo-Kaap **8.61 M → 3.84 M (−55%)**, Union Buildings −39%, Groot Constantia −42% (the `CB()` fix);
calls broadly unchanged or lower apart from a systematic ~10% harness/browser drift, which is why the
guardrail baseline was refreshed from a same-harness capture (`docs/baseline/current-stats.json`).

**Known limitations:** the headless Edge canvas capture produces blank contact-sheet thumbnails in this
environment (stats are valid; direct page screenshots of the app render correctly); real-device touch
and iOS keyboard QA from `docs/qa-mobile.md` is still outstanding. Batch 3 ideas remain unimplemented.

---

## 11. Batch 2 — implementation status (2026-11-23)

**Shipped:**
- **#8 stone albedo** across 14 sites (Voortrekker granite, Castle ochre, Cape Point/Chapman's/Knysna
  sandstone, Amphitheatre/Sani basalt, Big Hole kimberlite, Harties/Gariep concrete, Vredefort,
  Robben, Augrabies, Richtersveld), all ≤0.75 sRGB where non-white; deliberate whites preserved.
  Verified visually: Voortrekker now reads pink-grey granite, Castle warm ochre.
- **#15b architectural symbolism**: Mandela Bridge rail yard 8 → 42 instanced lines (fewer triangles),
  Voortrekker assegai gate + wildebeest frieze + oculus shaft, visible Rondavels baboon troop.
- **#10/#11 shared kits**: `person`, `bin`, `flagpole`, `washingLine`, `taxiShelter` helpers in
  propKit; `fynbos`, `silverTree`, `protea`, `marula`, `yellowwood`, `jacaranda` species in
  primitives; `SITE_PROFILES.species` mapping in dioramaKit (jacaranda bloom gated by month);
  people/props/species placed across both landmark files.
- **#15a OSM dressing**: instanced roofs, dashed lanes, zebra crossings, sidewalk ribbons and
  centreline-sampled lamps in osmSlice; Places slice lamps in placesSliceBuilders; `osmService.ts`
  now forwards `roof:shape` / `building:colour` / `building:levels` so real tags are used.
- **#9 lamp coverage**: wilderness lantern/bollard sets at Pilanesberg, Mapungubwe, Richtersveld
  (all `{anchors:false}` — ≤4 promoted lights unchanged).
- **#19 near-tier articulation**: 2–3 part pivots per near herd (trunk/ears, flippers, fluke,
  gemsbok head) in animalKit; instanced far tier and reduced-motion rest pose preserved.
- **#21/#26 scale honesty**: all 10 null `magnitudeM` entries curated with measure + label;
  convention comment added (props ≈ human scale, terrain compressed per site).
- **#39/#40/#24 engine**: critically-damped camera spring (0.46 s response, velocity-seeded,
  interruptible, reduced-motion snap); archetype-flavoured dusk lamp flicker; synthesised animal
  audio (elephant/penguin/whale/hippo/hadeda) routed through the existing spatial mixer.
- **#5 keyboard/safe-area**: `interactive-widget=resizes-content`, `--cl-kbd-inset` from
  visualViewport lifts sheets/inputs, left/right safe-area insets, single 700 px compact token
  shared by JS and CSS (Menu/ruler `useIsPhone` also uses it).

**Guardrail-driven trims:** the first perf run breached +10% on 5 sites; A/B tests traced it to
individual helper batches (not the globe or engine). Castle's people/flagpoles and Kgalagadi's
lamps were removed, Pilanesberg reverted to instanced trees with no lamps, Chapman's kept three hero
shrubs plus the original instanced bush batch, and Donkin dropped the taxi shelter. Final QA:
**PASS — 129 site/hour checks**. `pnpm lint`, `pnpm test` 102/102, `pnpm build` all green.

**Deferred (documented, not attempted):** **#31 scene-level batching** — a post-build merge cannot be
verified safe against dissolve/cutaway/LOD/eggs/animated pivots without a much heavier QA cycle;
draw-call headroom from Batch 1's `CB()` fix already keeps all sites inside budget. **#33 lazy
landmark builders** — requires cross-file re-export restructuring of the 43 builders; best done as
its own focused change with bundle verification.

---

## 12. Batch 3 — mobile/scale/atmosphere pass (2026-11-23)

Implemented against the app's existing **raw Three.js + Motion** stack (no R3F/drei/GSAP rewrite;
those packages are not dependencies and the 1,799-node scene graph depends on raw `three`).

**Shipped:**
- **Weather temperature** (`ui/AnimatedNumber.tsx`): the old digit-roller rendered all ten digits
  (`0123456789`) into the DOM inside an overflow clip, which produced the corrupted
  `0123456789°C` reading whenever CSS/transform was absent. The canonical value is now real text
  that crossfades on change. Open-Meteo parsing in `data/weatherData.ts` was already correct and
  unchanged.
- **Z-index ladder** (`lib/motion.ts` `Z`, `ui/Sheet.tsx`, `ui/Menu.tsx`, `App.tsx`, `index.css`):
  one documented scale — HUD 10 → mode HUD 20 → transient 30–35 → sheets 40 → dialogs 50 → menus 60.
  Toasts/offline pill/confetti now sit *below* sheets; the scale badge moved to the mode-HUD tier.
- **Camera view tray** (`ui/Menu.tsx`, `LandmarkCard.tsx`): phone view modes are the existing
  bottom-tray dropdown, now with emoji (👁️/🚁/🔭/📸) plus one-line descriptions for each preset.
- **Table Mountain** (`landmarksA.ts`): low-poly Twelve Apostles silhouette on the west flank,
  subtly undulating summit cap, one cableway station window, bilingual trail sign, lower-detail
  tablecloth puffs with vertical bob. Counts were tuned to stay inside the +10% budget.
- **Union Buildings**: two sandstone lions flanking the ceremonial stair (the existing colonnade,
  Atlas globes, Mandela statue, terraces and flagpoles are preserved).
- **Bilingual signage** (`propKit.ts`): `interpretiveSign()` now draws English/Afrikaans wording on
  a canvas texture; new `streetNameBlade()` helper is available for future sites.
- **Animals** (`primitives.ts`, `animalKit.ts`, `wildlife.ts`): new anatomically-shaped
  `sugarbird()` (long tail, amber breast, down-curved bill), Rock Hyraxes (dassies) on the summit
  tors, sugarbirds at Cape Point, plus `breathe` and one-shot `earFlick` idles and near-part ear/tail
  articulation. Breathing/ear-flick remain deterministic under reduced motion.
- **Scale honesty** (`scaleFacts.ts`, `lib/scale.ts`, new `scale.test.ts`): optional
  `metresPerUnit` + `siteMetresPerUnit()`/`metresToUnits()` expose the curated metres-per-unit
  convention instead of pretending a strict 1 u = 1 m across compressed dioramas.
- **Tablecloth ↔ real weather** (`siteAtmosphere.ts`, `weatherScene.ts`, `CitylitEngine.ts`): the
  orographic cloud now pours only when the live observation reports a south-easterly (~135°);
  climate mode keeps the original cloud amount. SAST sun sync was already live (60 s `timeHour`
  interval in `App.tsx`) and needed no change.

**Not done, by design:** Draco/Meshopt/KTX2 (there are no `.glb`/texture assets — only a procedural
pipeline and one HDR; adding loaders would be dead code), full `THREE.LOD` for animals (the engine's
distance cull + far-scale already serves this role), and a landmark-to-landmark keyframed camera tour
(the existing critically-damped spring already covers preset/flick handoff). See §5/§6 for the
measured rationale.

**Verification:** `pnpm lint` (only the pre-existing graphify-plugin warning), `pnpm test` 104/104,
`pnpm build` green, and the CDP perf guardrail **PASS — 129 site/hour checks** against
`docs/baseline/current-stats.json` (+10% calls/tris).