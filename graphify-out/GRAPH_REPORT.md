# Graph Report - citylit-pwa  (2026-11-20)

## Corpus Check
- 71 files · ~133,700 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 9 file(s) not represented in the graph (top: .woff2 4, (none) 2, .css 2)

## Summary
- 859 nodes · 2610 edges · 47 communities (38 shown, 9 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 51 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `7b511329`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- landmarksB.ts
- AmbientAudioController
- PassportModal.tsx
- primitives.ts
- PassportModal.tsx
- App.tsx
- placesSliceBuilders.ts
- placesShaders.ts
- GalleryModal.tsx
- dioramaKit.ts
- CitylitEngine.ts
- citylit.ts
- CitylitEngine
- compilerOptions
- PlacesOverlay.tsx
- osmService.ts
- siteAtmosphere.ts
- placesScene.ts
- SearchSheet.tsx
- getStoneBumpTexture
- osmSlice.ts
- package.json
- dependencies
- globeScene.ts
- citylit.ts
- server.js
- .frame
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
- landmarks.ts
- oxlint@1.94.0
- @types/react@19.3.0
- nativeHost.ts
- .constructor
- @ui-sdk/react
- oxfmt@0.79.0
- @types/node@^24.0.0

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
- `App()` --calls--> `GalleryModal()`  [EXTRACTED]
  src/App.tsx → src/components/GalleryModal.tsx
- `App()` --calls--> `InfoDrawer()`  [EXTRACTED]
  src/App.tsx → src/components/InfoDrawer.tsx
- `App()` --calls--> `LandmarkCard()`  [EXTRACTED]
  src/App.tsx → src/components/LandmarkCard.tsx
- `App()` --calls--> `PassportModal()`  [EXTRACTED]
  src/App.tsx → src/components/PassportModal.tsx
- `App()` --calls--> `PlacesOverlay()`  [EXTRACTED]
  src/App.tsx → src/components/PlacesOverlay.tsx

## Import Cycles
- None detected.

## Communities (47 total, 9 thin omitted)

### Community 0 - "landmarksB.ts"
Cohesion: 0.17
Nodes (97): addAnchor(), addBaseScatter(), addBollards(), addDeck(), addJetty(), addReedbed(), addWindpump(), anchorGroup() (+89 more)

### Community 1 - "AmbientAudioController"
Cohesion: 0.07
Nodes (21): AmbientAudioController, BIOME_HAPTIC_PATTERNS, clamp01(), equalPower(), extractRegionName(), FilterBand, REGION_HAPTIC_ACCENTS, smoothBell() (+13 more)

### Community 2 - "PassportModal.tsx"
Cohesion: 0.14
Nodes (18): motion, ambientAudio, PostcardModal(), PostcardModalProps, DEFAULT_MIXER, MIXER_CHANNELS, MOTION_OPTIONS, QUALITY_OPTIONS (+10 more)

### Community 3 - "primitives.ts"
Cohesion: 0.06
Nodes (36): archGeo(), cacheGeo(), capeDutchGableGeo(), contactShadowBatches, contactShadowMaterials, contactShadowMeshes, ContactShadowSpec, createContactShadowMaterial() (+28 more)

### Community 4 - "PassportModal.tsx"
Cohesion: 0.10
Nodes (23): PASSPORT_TABS, PassportModal(), PassportModalProps, PassportTab, ProvinceRing(), ProvinceRingProps, ProvinceStatRow, StatsTooltip() (+15 more)

### Community 5 - "App.tsx"
Cohesion: 0.16
Nodes (23): App(), INITIAL_GLOBE, readInitialCoordinate(), readInitialLandmarkIndex(), readSettings(), readStoredSet(), setUrlForCoordinates(), setUrlForGlobe() (+15 more)

### Community 6 - "placesSliceBuilders.ts"
Cohesion: 0.14
Nodes (29): getGrassMaterial(), createCloudPuffMesh(), createSliceCloudLayer(), createCutawayWaterTopMaterial(), createCutawayWaterWallMaterial(), createSliceMistMaterial(), CutawayWaterOptions, getOrlandoMuralTexture() (+21 more)

### Community 7 - "placesShaders.ts"
Cohesion: 0.16
Nodes (18): bindVolumetricFogUniforms(), createStrataTerrainMaterial(), patchPlacesVolumetricFog(), PlacesSliceEmitterSpec, CLOUD_FRAGMENT, CLOUD_VERTEX, NOISE_GLSL, STRATA_COLOR_FRAGMENT (+10 more)

### Community 8 - "GalleryModal.tsx"
Cohesion: 0.14
Nodes (15): GalleryDialog(), GalleryModal(), GalleryModalProps, bodySlideVariants, headerSlideVariants, LandmarkCard(), LandmarkCardProps, SlideCustom (+7 more)

### Community 9 - "dioramaKit.ts"
Cohesion: 0.12
Nodes (27): addCraftedRim(), addDioramaClouds(), addSoaringBirds(), addSquareRim(), addSquareWaterPlate(), addTreeRing(), addWeatherFx(), AnchorKind (+19 more)

### Community 10 - "CitylitEngine.ts"
Cohesion: 0.12
Nodes (17): LANDMARK_BUILDERS, glowMaterials, SwayItem, swayItems, WetMaterialEntry, wetMaterials, audioForward, audioRight (+9 more)

### Community 11 - "citylit.ts"
Cohesion: 0.15
Nodes (14): AudioVisualizerBarProps, DARK_PALETTE, LIGHT_PALETTE, IconButton(), IconButtonProps, TopBar(), TopBarProps, DURATION (+6 more)

### Community 13 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowImportingTsExtensions, isolatedModules, jsx, lib, module, moduleDetection, moduleResolution (+10 more)

### Community 14 - "PlacesOverlay.tsx"
Cohesion: 0.22
Nodes (12): @phosphor-icons/react, placeCardCondition(), PlacesOverlay(), PlacesOverlayProps, QUICK_TIMES, WEATHER_MODES, ANIMATED_BY_CONDITION, WeatherIcon() (+4 more)

### Community 15 - "osmService.ts"
Cohesion: 0.15
Nodes (16): cacheKey(), fallbackPatch(), GEO_CACHE, loadElevation(), loadOsmPlace(), MEMORY_CACHE, OsmArea, OsmBuilding (+8 more)

### Community 16 - "siteAtmosphere.ts"
Cohesion: 0.15
Nodes (17): AtmosphereEffect, AtmosphereLayer, AtmosphereProfile, AtmosphereSceneController, AtmosphereUpdateOptions, BIOME_EFFECTS, createAtmosphereScene(), createClothMaterial() (+9 more)

### Community 17 - "placesScene.ts"
Cohesion: 0.20
Nodes (13): createPlacesScene(), ExplorerInfo, HERO_CAM, HERO_TARGET, createPlacesShaderEnv(), createPlacesVolumetricFogLayer(), createPlacesWeatherParticles(), createSliceCloudMaterial() (+5 more)

### Community 18 - "SearchSheet.tsx"
Cohesion: 0.14
Nodes (16): react, react-dom, parseSearch(), SearchSheet(), SearchSheetProps, TIME_PHRASES, Sheet(), SheetProps (+8 more)

### Community 19 - "getStoneBumpTexture"
Cohesion: 0.21
Nodes (15): MCanvas(), MRoof(), applyDissolveToShader(), cascadeize(), getBrushedRoughnessTexture(), getCanvasBumpTexture(), getPlasterBumpTexture(), getRoofBumpTexture() (+7 more)

### Community 20 - "osmSlice.ts"
Cohesion: 0.21
Nodes (13): LocalPoint, OsmPlaceData, centroid(), clamp(), createOsmSlice(), createRibbon(), OsmSliceResult, polygonShape() (+5 more)

### Community 21 - "package.json"
Cohesion: 0.14
Nodes (13): goeist@0.1.0, n8ao@2.1.0, recharts@3.11.0, tailwindcss@4.3.5, description, name, private, type (+5 more)

### Community 22 - "dependencies"
Cohesion: 0.13
Nodes (15): dependencies, motion@14.14.0, @phosphor-icons/react@2.1.10, react@19.3.1, react-dom@19.3.1, @types/react-dom@19.3.0, @types/three@0.187.0, typescript@7.0.2 (+7 more)

### Community 23 - "globeScene.ts"
Cohesion: 0.10
Nodes (28): three@0.187.0, three, AFRICA_POLYS, ENCLAVE_POLYS, GLOBE_NEIGHBOR_LABELS, GLOBE_PROVINCES, NEIGHBOR_POLYS, PROVINCE_STYLE (+20 more)

### Community 24 - "citylit.ts"
Cohesion: 0.12
Nodes (25): AnimatedNumber(), AnimatedNumberProps, Digit(), PresetKey, TIME_PRESETS, WARNING_STYLE, WeatherWidget(), WeatherWidgetProps (+17 more)

### Community 25 - "server.js"
Cohesion: 0.20
Nodes (6): express@5.3.0, express, app, __dirname, distDir, __filename

### Community 26 - ".frame"
Cohesion: 0.20
Nodes (4): resetSceneDynamicLists(), setContactShadowFade(), updateWetSurfaces(), updateRimLight()

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
Nodes (18): formatCoords(), InfoDrawer(), InfoDrawerProps, UnfoldAccordion(), UnfoldAccordionProps, UnfoldItem, LANDMARK_DETAILS, LandmarkDetail (+10 more)

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
Cohesion: 0.16
Nodes (13): clamp01(), LiveWeatherVisual, liveWeatherVisual(), CloudAssets, CloudPuffInstance, SliceCloudLayer, getSoftTexture(), SKY_NOISE_GLSL (+5 more)

### Community 37 - "overrides"
Cohesion: 0.50
Nodes (3): overrides, three, workbox-build>glob

### Community 38 - "landmarks.ts"
Cohesion: 0.31
Nodes (8): GlobeOverlayProps, LANDMARKS, PROVINCES, getLandmarkSignature(), loadCachedThumbnails(), openThumbDb(), saveCachedThumbnails(), StoredThumbBundle

### Community 41 - "nativeHost.ts"
Cohesion: 0.31
Nodes (6): detectNativeHost(), hasCinematicHost(), isHost(), NativeCinematicHost, nativeHostUrl(), Window

### Community 42 - ".constructor"
Cohesion: 0.40
Nodes (3): configureDioramaShadow(), createRimLight(), DIORAMA_SHADOW_EXTENT

## Knowledge Gaps
- **9 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `three` connect `globeScene.ts` to `landmarksB.ts`, `primitives.ts`, `weatherScene.ts`, `placesSliceBuilders.ts`, `placesShaders.ts`, `dioramaKit.ts`, `CitylitEngine.ts`, `.constructor`, `siteAtmosphere.ts`, `placesScene.ts`, `getStoneBumpTexture`, `osmSlice.ts`, `package.json`?**
  _High betweenness centrality (0.140) - this node is a cross-community bridge._
- **Should `AmbientAudioController` be split into smaller, more focused modules?**
  _Cohesion score 0.0734006734006734 - nodes in this community are weakly interconnected._
- **Why does `CitylitEngine` connect `CitylitEngine` to `landmarksB.ts`, `.setQualityIndex`, `MiniaturePass`, `App.tsx`, `.constructor`, `CitylitEngine.ts`, `citylit.ts`, `siteAtmosphere.ts`, `osmSlice.ts`, `citylit.ts`, `.frame`?**
  _High betweenness centrality (0.094) - this node is a cross-community bridge._
- **Should `PassportModal.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.13852813852813853 - nodes in this community are weakly interconnected._
- **Should `primitives.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05855855855855856 - nodes in this community are weakly interconnected._
- **Should `PassportModal.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.0960591133004926 - nodes in this community are weakly interconnected._
- **Should `placesSliceBuilders.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.14022988505747128 - nodes in this community are weakly interconnected._