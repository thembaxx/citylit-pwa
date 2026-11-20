# Graph Report - citylit-pwa  (2026-11-20)

## Corpus Check
- 73 files · ~134,700 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 9 file(s) not represented in the graph (top: .woff2 4, (none) 2, .css 2)

## Summary
- 864 nodes · 2626 edges · 43 communities (34 shown, 9 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 51 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `076b62ed`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- landmarksB.ts
- AmbientAudioController
- PassportModal.tsx
- primitives.ts
- globeData.ts
- App.tsx
- placesSliceBuilders.ts
- n8ao.d.ts
- GalleryModal.tsx
- dioramaKit.ts
- CitylitEngine.ts
- TopBar.tsx
- CitylitEngine
- compilerOptions
- PlacesOverlay.tsx
- osmService.ts
- siteAtmosphere.ts
- react-dom
- SearchSheet.tsx
- getStoneBumpTexture
- tailwindcss@4.3.5
- package.json
- dependencies
- globeScene.ts
- citylit.ts
- server.js
- typescript@7.0.2
- .oxfmtrc.json
- .oxlintrc.json
- vite.config.ts
- InfoDrawer.tsx
- scripts
- finalizeTreeBatch
- with
- .setQualityIndex
- weatherScene.ts
- MiniaturePass
- overrides
- workbox-window@7.4.1
- nativeHost.ts
- @ui-sdk/react
- oxfmt@0.79.0

## God Nodes (most connected - your core abstractions)
1. `CitylitEngine` - 65 edges
2. `add()` - 65 edges
3. `R()` - 55 edges
4. `C()` - 54 edges
5. `MStone()` - 50 edges
6. `M()` - 49 edges
7. `CB()` - 44 edges
8. `tree()` - 38 edges
9. `App()` - 36 edges
10. `AmbientAudioController` - 36 edges

## Surprising Connections (you probably didn't know these)
- `App()` --calls--> `AudioVisualizerBar()`  [EXTRACTED]
  src/App.tsx → src/components/AudioVisualizerBar.tsx
- `App()` --calls--> `GalleryModal()`  [EXTRACTED]
  src/App.tsx → src/components/GalleryModal.tsx
- `App()` --calls--> `InfoDrawer()`  [EXTRACTED]
  src/App.tsx → src/components/InfoDrawer.tsx
- `App()` --calls--> `LandmarkCard()`  [EXTRACTED]
  src/App.tsx → src/components/LandmarkCard.tsx
- `App()` --calls--> `PassportModal()`  [EXTRACTED]
  src/App.tsx → src/components/PassportModal.tsx

## Import Cycles
- None detected.

## Communities (43 total, 9 thin omitted)

### Community 0 - "landmarksB.ts"
Cohesion: 0.17
Nodes (97): addAnchor(), addBaseScatter(), addBollards(), addDeck(), addJetty(), addReedbed(), addWindpump(), anchorGroup() (+89 more)

### Community 1 - "AmbientAudioController"
Cohesion: 0.07
Nodes (26): AmbientAudioController, BIOME_HAPTIC_PATTERNS, clamp01(), equalPower(), extractRegionName(), FilterBand, REGION_HAPTIC_ACCENTS, smoothBell() (+18 more)

### Community 2 - "PassportModal.tsx"
Cohesion: 0.08
Nodes (35): motion, ambientAudio, PASSPORT_TABS, PassportModal(), PassportModalProps, PassportTab, ProvinceRing(), ProvinceRingProps (+27 more)

### Community 3 - "primitives.ts"
Cohesion: 0.06
Nodes (36): archGeo(), cacheGeo(), capeDutchGableGeo(), contactShadowBatches, contactShadowMaterials, contactShadowMeshes, ContactShadowSpec, createContactShadowMaterial() (+28 more)

### Community 4 - "globeData.ts"
Cohesion: 0.21
Nodes (11): AFRICA_POLYS, ENCLAVE_POLYS, GLOBE_NEIGHBOR_LABELS, GLOBE_PROVINCES, NEIGHBOR_POLYS, PROVINCE_STYLE, ProvinceGlobeEntry, GEO_AFRICA (+3 more)

### Community 5 - "App.tsx"
Cohesion: 0.11
Nodes (28): App(), INITIAL_GLOBE, readInitialLandmarkIndex(), readSettings(), readStoredSet(), BootSplash(), BootSplashProps, GlobeOverlay() (+20 more)

### Community 6 - "placesSliceBuilders.ts"
Cohesion: 0.05
Nodes (72): OsmArea, OsmPlaceData, centroid(), clamp(), createOsmSlice(), createRibbon(), OsmSliceResult, polygonShape() (+64 more)

### Community 7 - "n8ao.d.ts"
Cohesion: 0.25
Nodes (4): n8ao, N8AOPass, N8AOPassConfiguration, N8AOQualityMode

### Community 8 - "GalleryModal.tsx"
Cohesion: 0.08
Nodes (28): AudioVisualizerBar(), DARK_PALETTE, LIGHT_PALETTE, GalleryDialog(), GalleryModal(), GalleryModalProps, bodySlideVariants, headerSlideVariants (+20 more)

### Community 9 - "dioramaKit.ts"
Cohesion: 0.12
Nodes (27): addCraftedRim(), addDioramaClouds(), addSoaringBirds(), addSquareRim(), addSquareWaterPlate(), addTreeRing(), addWeatherFx(), AnchorKind (+19 more)

### Community 10 - "CitylitEngine.ts"
Cohesion: 0.12
Nodes (18): LANDMARK_BUILDERS, glowMaterials, SwayItem, WetMaterialEntry, wetMaterials, audioForward, audioRight, SKY_COLOR (+10 more)

### Community 11 - "TopBar.tsx"
Cohesion: 0.32
Nodes (7): AudioVisualizerBarProps, IconButton(), IconButtonProps, TopBar(), TopBarProps, swapTransition, ThemeSetting

### Community 12 - "CitylitEngine"
Cohesion: 0.11
Nodes (4): resetSceneDynamicLists(), setContactShadowFade(), updateWetSurfaces(), CitylitEngine

### Community 13 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowImportingTsExtensions, isolatedModules, jsx, lib, module, moduleDetection, moduleResolution (+10 more)

### Community 14 - "PlacesOverlay.tsx"
Cohesion: 0.15
Nodes (16): @phosphor-icons/react@2.1.10, @phosphor-icons/react, placeCardCondition(), PlacesOverlay(), PlacesOverlayProps, QUICK_TIMES, WEATHER_MODES, ANIMATED_BY_CONDITION (+8 more)

### Community 15 - "osmService.ts"
Cohesion: 0.14
Nodes (17): cacheKey(), fallbackPatch(), GEO_CACHE, geocodePlace(), loadElevation(), loadOsmPlace(), LocalPoint, MEMORY_CACHE (+9 more)

### Community 16 - "siteAtmosphere.ts"
Cohesion: 0.15
Nodes (17): AtmosphereEffect, AtmosphereLayer, AtmosphereProfile, AtmosphereSceneController, AtmosphereUpdateOptions, BIOME_EFFECTS, createAtmosphereScene(), createClothMaterial() (+9 more)

### Community 18 - "SearchSheet.tsx"
Cohesion: 0.20
Nodes (13): react, parseSearch(), SearchSheet(), SearchSheetProps, TIME_PHRASES, Sheet(), SheetProps, SheetSide (+5 more)

### Community 19 - "getStoneBumpTexture"
Cohesion: 0.17
Nodes (18): getGrassMaterial(), MCanvas(), MRoof(), MSteel(), applyDissolveToShader(), cascadeize(), getBrushedRoughnessTexture(), getCanvasBumpTexture() (+10 more)

### Community 21 - "package.json"
Cohesion: 0.14
Nodes (13): goeist@0.1.0, recharts@3.11.0, @types/react-dom@19.3.0, @types/three@0.187.0, description, name, private, type (+5 more)

### Community 22 - "dependencies"
Cohesion: 0.14
Nodes (14): dependencies, motion@14.14.0, n8ao@2.1.0, oxlint@1.94.0, react@19.3.1, three@0.187.0, @types/node@^24.0.0, @types/react@19.3.0 (+6 more)

### Community 23 - "globeScene.ts"
Cohesion: 0.30
Nodes (12): three, easeInOutCubic(), easeOutCubic(), GLOBE_RADIUS, latLonToVec3(), mulberry32(), pointInPoly(), provinceVisitRatio() (+4 more)

### Community 24 - "citylit.ts"
Cohesion: 0.13
Nodes (23): AnimatedNumber(), AnimatedNumberProps, Digit(), PresetKey, TIME_PRESETS, WARNING_STYLE, WeatherWidget(), WeatherWidgetProps (+15 more)

### Community 25 - "server.js"
Cohesion: 0.20
Nodes (6): express@5.3.0, express, app, __dirname, distDir, __filename

### Community 27 - ".oxfmtrc.json"
Cohesion: 0.22
Nodes (8): ignorePatterns, printWidth, $schema, semi, singleQuote, tabWidth, trailingComma, useTabs

### Community 28 - ".oxlintrc.json"
Cohesion: 0.22
Nodes (8): categories, correctness, suspicious, ignorePatterns, plugins, rules, react/react-in-jsx-scope, $schema

### Community 29 - "vite.config.ts"
Cohesion: 0.20
Nodes (8): @tailwindcss/vite@4.3.5, vite@8.3.8, vite-plugin-pwa@2.0.0, @vitejs/plugin-react@6.3.0, @tailwindcss/vite, vite, vite-plugin-pwa, @vitejs/plugin-react

### Community 30 - "InfoDrawer.tsx"
Cohesion: 0.13
Nodes (19): GlobeOverlayProps, formatCoords(), InfoDrawer(), InfoDrawerProps, UnfoldAccordion(), LANDMARK_DETAILS, LandmarkDetail, LANDMARKS (+11 more)

### Community 31 - "scripts"
Cohesion: 0.22
Nodes (9): scripts, build, dev, format, format:check, lint, preview, start (+1 more)

### Community 32 - "finalizeTreeBatch"
Cohesion: 0.22
Nodes (10): buildTreeGeometry(), buildTreeLodGeometry(), crownGeo(), finalizeTreeBatch(), mergeTreeParts(), stampContactShadow(), stampContactShadowsFromMeshes(), treeGeometry() (+2 more)

### Community 33 - "with"
Cohesion: 0.11
Nodes (17): jobs, verify, name, on, pull_request, push, branches, name (+9 more)

### Community 35 - "weatherScene.ts"
Cohesion: 0.14
Nodes (14): clamp01(), LiveWeatherVisual, liveWeatherVisual(), WEATHER_CONDITIONS, getSoftTexture(), SKY_NOISE_GLSL, WU, createWeatherScene() (+6 more)

### Community 37 - "overrides"
Cohesion: 0.50
Nodes (3): overrides, three, workbox-build>glob

### Community 41 - "nativeHost.ts"
Cohesion: 0.31
Nodes (6): detectNativeHost(), hasCinematicHost(), isHost(), NativeCinematicHost, nativeHostUrl(), Window

## Knowledge Gaps
- **9 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `three` connect `globeScene.ts` to `landmarksB.ts`, `primitives.ts`, `weatherScene.ts`, `placesSliceBuilders.ts`, `n8ao.d.ts`, `dioramaKit.ts`, `CitylitEngine.ts`, `siteAtmosphere.ts`, `getStoneBumpTexture`, `package.json`, `dependencies`?**
  _High betweenness centrality (0.137) - this node is a cross-community bridge._
- **Should `AmbientAudioController` be split into smaller, more focused modules?**
  _Cohesion score 0.06557377049180328 - nodes in this community are weakly interconnected._
- **Why does `CitylitEngine` connect `CitylitEngine` to `landmarksB.ts`, `.setQualityIndex`, `weatherScene.ts`, `MiniaturePass`, `App.tsx`, `placesSliceBuilders.ts`, `CitylitEngine.ts`, `TopBar.tsx`, `PlacesOverlay.tsx`, `siteAtmosphere.ts`?**
  _High betweenness centrality (0.093) - this node is a cross-community bridge._
- **Should `PassportModal.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.08246225319396051 - nodes in this community are weakly interconnected._
- **Should `primitives.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05855855855855856 - nodes in this community are weakly interconnected._
- **Should `App.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.11095305832147938 - nodes in this community are weakly interconnected._
- **Should `placesSliceBuilders.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.053297199638663056 - nodes in this community are weakly interconnected._