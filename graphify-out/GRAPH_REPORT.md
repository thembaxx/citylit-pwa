# Graph Report - citylit-pwa  (2026-11-21)

## Corpus Check
- 82 files · ~188,199 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 10 file(s) not represented in the graph (top: .woff2 4, (none) 2, .css 2)

## Summary
- 1009 nodes · 3093 edges · 52 communities (40 shown, 12 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 74 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `14b7cd21`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- landmarksB.ts
- AmbientAudioController
- SettingsModal.tsx
- primitives.ts
- contact-sheet.ts
- App.tsx
- placesSliceBuilders.ts
- placesShaders.ts
- GalleryModal.tsx
- dioramaKit.ts
- CitylitEngine.ts
- SearchSheet.tsx
- CitylitEngine
- compilerOptions
- siteAtmosphere.ts
- osmService.ts
- PlacesOverlay.tsx
- react-dom
- motion.ts
- shaders.ts
- PassportModal.tsx
- package.json
- dependencies
- globeScene.ts
- windParticles.ts
- server.js
- .isStudio
- .oxfmtrc.json
- .oxlintrc.json
- vite.config.ts
- .constructor
- scripts
- contact-sheet.ts
- with
- createSliceSharedAssets
- weatherData.ts
- MiniaturePass
- overrides
- globeData.ts
- placesClouds.ts
- nativeHost.ts
- oxlint@1.94.0
- recharts
- @types/react@19.3.0
- placesScene.ts
- @types/react-dom@19.3.0
- @ui-sdk/core@0.1.0-beta.13
- getSoftTexture
- n8ao.d.ts
- PlacesShaderEnvironment

## God Nodes (most connected - your core abstractions)
1. `CitylitEngine` - 99 edges
2. `add()` - 70 edges
3. `R()` - 57 edges
4. `M()` - 50 edges
5. `MStone()` - 50 edges
6. `C()` - 50 edges
7. `CB()` - 49 edges
8. `App()` - 40 edges
9. `AmbientAudioController` - 37 edges
10. `tree()` - 36 edges

## Surprising Connections (you probably didn't know these)
- `CompassProps` --references--> `CitylitEngine`  [EXTRACTED]
  src/components/Compass.tsx → src/three/CitylitEngine.ts
- `App()` --calls--> `Compass()`  [EXTRACTED]
  src/App.tsx → src/components/Compass.tsx
- `App()` --calls--> `GalleryModal()`  [EXTRACTED]
  src/App.tsx → src/components/GalleryModal.tsx
- `App()` --calls--> `InfoDrawer()`  [EXTRACTED]
  src/App.tsx → src/components/InfoDrawer.tsx
- `App()` --calls--> `LandmarkCard()`  [EXTRACTED]
  src/App.tsx → src/components/LandmarkCard.tsx

## Import Cycles
- None detected.

## Communities (52 total, 12 thin omitted)

### Community 0 - "landmarksB.ts"
Cohesion: 0.16
Nodes (104): addAnchor(), addBollards(), addDeck(), addJetty(), addReedbed(), addWindpump(), anchorGroup(), corniceBand() (+96 more)

### Community 1 - "AmbientAudioController"
Cohesion: 0.07
Nodes (23): AmbientAudioController, BIOME_HAPTIC_PATTERNS, clamp01(), equalPower(), extractRegionName(), FilterBand, REGION_HAPTIC_ACCENTS, smoothBell() (+15 more)

### Community 2 - "SettingsModal.tsx"
Cohesion: 0.10
Nodes (26): motion, ambientAudio, PostcardModal(), SKY_PRESETS, BUILTIN_MIXER_PRESETS, DEFAULT_MIXER, MIXER_CHANNELS, MOTION_OPTIONS (+18 more)

### Community 3 - "primitives.ts"
Cohesion: 0.05
Nodes (47): archGeo(), buildTreeGeometry(), buildTreeLodGeometry(), cacheGeo(), capeDutchGableGeo(), contactShadowBatches, contactShadowMaterials, contactShadowMeshes (+39 more)

### Community 4 - "contact-sheet.ts"
Cohesion: 0.17
Nodes (5): resetSceneDynamicLists(), setContactShadowFade(), updateWetSurfaces(), setBounceLightBiome(), updateRimLight()

### Community 5 - "App.tsx"
Cohesion: 0.11
Nodes (32): App(), INITIAL_GLOBE, readInitialLandmarkIndex(), readSettings(), readStoredNotes(), readStoredSavedPlaces(), readStoredSet(), AudioVisualizerBar() (+24 more)

### Community 6 - "placesSliceBuilders.ts"
Cohesion: 0.13
Nodes (30): getGrassMaterial(), createCloudPuffMesh(), createSliceCloudLayer(), createCutawayWaterTopMaterial(), createCutawayWaterWallMaterial(), createSliceMistMaterial(), CutawayWaterOptions, getOrlandoMuralTexture() (+22 more)

### Community 7 - "placesShaders.ts"
Cohesion: 0.16
Nodes (17): PlacesSliceEmitterSpec, CLOUD_FRAGMENT, CLOUD_VERTEX, NOISE_GLSL, SEASON_MORPH_GLSL, SEASON_UNIFORMS_GLSL, STRATA_COLOR_FRAGMENT, STRATA_FRAG_COMMON (+9 more)

### Community 8 - "GalleryModal.tsx"
Cohesion: 0.07
Nodes (34): GalleryDialog(), GalleryModal(), GalleryModalProps, bodySlideVariants, CAMERA_PRESETS, CARDINALS, getCategoryMeta(), headerSlideVariants (+26 more)

### Community 9 - "dioramaKit.ts"
Cohesion: 0.09
Nodes (35): addBaseScatter(), addCraftedRim(), addDioramaClouds(), addSiteMotion(), addSoaringBirds(), addSquareRim(), addSquareWaterPlate(), addTreeRing() (+27 more)

### Community 10 - "CitylitEngine.ts"
Cohesion: 0.11
Nodes (19): LANDMARK_BUILDERS, glowMaterials, SwayItem, swayItems, WetMaterialEntry, wetMaterials, audioForward, audioRight (+11 more)

### Community 11 - "SearchSheet.tsx"
Cohesion: 0.11
Nodes (23): react, formatCoords(), InfoDrawer(), InfoDrawerProps, parseSearch(), SearchSheet(), SearchSheetProps, TIME_PHRASES (+15 more)

### Community 13 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowImportingTsExtensions, isolatedModules, jsx, lib, module, moduleDetection, moduleResolution (+10 more)

### Community 14 - "siteAtmosphere.ts"
Cohesion: 0.14
Nodes (18): SKY_NOISE_GLSL, AtmosphereEffect, AtmosphereLayer, AtmosphereProfile, AtmosphereSceneController, AtmosphereUpdateOptions, BIOME_EFFECTS, createAtmosphereScene() (+10 more)

### Community 15 - "osmService.ts"
Cohesion: 0.13
Nodes (18): cacheKey(), fallbackPatch(), GEO_CACHE, geocodePlace(), loadElevation(), loadOsmPlace(), LocalPoint, MEMORY_CACHE (+10 more)

### Community 16 - "PlacesOverlay.tsx"
Cohesion: 0.12
Nodes (25): @phosphor-icons/react, placeCardCondition(), PlacesOverlay(), PlacesOverlayProps, QUICK_TIMES, WEATHER_MODES, AnimatedNumber(), AnimatedNumberProps (+17 more)

### Community 18 - "motion.ts"
Cohesion: 0.08
Nodes (27): AudioVisualizerBarProps, DARK_PALETTE, LIGHT_PALETTE, CARDINAL_TARGETS, CARDINALS_8, Compass(), CompassProps, formatBearing() (+19 more)

### Community 19 - "shaders.ts"
Cohesion: 0.13
Nodes (31): getRoofDirtMap(), MSteel(), applyDissolveToShader(), cascadeize(), flagWindy(), getBrushedNormalTexture(), getBrushedRoughnessTexture(), getCanvasBumpTexture() (+23 more)

### Community 20 - "PassportModal.tsx"
Cohesion: 0.14
Nodes (20): GlobeOverlayProps, CATEGORY_COLORS, PASSPORT_TABS, PassportModal(), PassportTab, ProvinceRing(), ProvinceRingProps, ProvinceStatRow (+12 more)

### Community 21 - "package.json"
Cohesion: 0.14
Nodes (13): goeist@0.1.0, oxfmt@0.79.0, typescript@7.0.2, workbox-window@7.4.1, description, name, private, type (+5 more)

### Community 22 - "dependencies"
Cohesion: 0.13
Nodes (15): dependencies, motion@14.14.0, n8ao@2.1.0, @phosphor-icons/react@2.1.10, react@19.3.1, tailwindcss@4.3.5, three@0.187.0, @types/node@^24.0.0 (+7 more)

### Community 23 - "globeScene.ts"
Cohesion: 0.30
Nodes (14): three, easeInOutCubic(), easeOutCubic(), GLOBE_RADIUS, latLonToVec3(), mulberry32(), pointInPoly(), provinceVisitRatio() (+6 more)

### Community 24 - "windParticles.ts"
Cohesion: 0.31
Nodes (8): GlobeController, WU, BIOME_PALETTES, createLeafWispTexture(), createWindParticles(), seeded(), WindParticlesUpdateOptions, QualityIndex

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

### Community 30 - ".constructor"
Cohesion: 0.11
Nodes (18): attachEquirect(), buildProbeData(), Equirect, HORIZ_DIRS, installGI(), probeGrid, probeOrigin, probeSize (+10 more)

### Community 31 - "scripts"
Cohesion: 0.22
Nodes (9): scripts, build, dev, format, format:check, lint, preview, start (+1 more)

### Community 32 - "contact-sheet.ts"
Cohesion: 0.25
Nodes (8): build(), engine, grid, hour, params, stage, status, syncButtons()

### Community 33 - "with"
Cohesion: 0.11
Nodes (17): jobs, verify, name, on, pull_request, push, branches, name (+9 more)

### Community 34 - "createSliceSharedAssets"
Cohesion: 0.67
Nodes (3): createGableRoofGeo(), createSculptedRockGeo(), createSliceSharedAssets()

### Community 35 - "weatherData.ts"
Cohesion: 0.12
Nodes (21): buildLiveForecast(), clamp01(), conditionFromCode(), ExtremeWeatherWarning, fetchLiveWeather(), getClimateRegime(), HourlyWeather, liveConditionLabel() (+13 more)

### Community 37 - "overrides"
Cohesion: 0.50
Nodes (3): overrides, three, workbox-build>glob

### Community 39 - "globeData.ts"
Cohesion: 0.21
Nodes (11): AFRICA_POLYS, ENCLAVE_POLYS, GLOBE_NEIGHBOR_LABELS, GLOBE_PROVINCES, NEIGHBOR_POLYS, PROVINCE_STYLE, ProvinceGlobeEntry, GEO_AFRICA (+3 more)

### Community 40 - "placesClouds.ts"
Cohesion: 0.50
Nodes (3): CloudAssets, CloudPuffInstance, SliceCloudLayer

### Community 41 - "nativeHost.ts"
Cohesion: 0.31
Nodes (6): detectNativeHost(), hasCinematicHost(), isHost(), NativeCinematicHost, nativeHostUrl(), Window

### Community 46 - "placesScene.ts"
Cohesion: 0.14
Nodes (22): OsmPlaceData, centroid(), clamp(), createOsmSlice(), createRibbon(), OsmSliceResult, polygonShape(), createPlacesScene() (+14 more)

### Community 49 - "getSoftTexture"
Cohesion: 0.36
Nodes (7): createContactShadowMaterial(), BiomeWeights, createHorizonRing(), createHorizonScenery(), HorizonUpdateOptions, weightsForBiome(), getSoftTexture()

### Community 50 - "n8ao.d.ts"
Cohesion: 0.25
Nodes (4): n8ao, N8AOPass, N8AOPassConfiguration, N8AOQualityMode

## Knowledge Gaps
- **12 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `three` connect `globeScene.ts` to `landmarksB.ts`, `primitives.ts`, `weatherData.ts`, `placesSliceBuilders.ts`, `placesShaders.ts`, `placesClouds.ts`, `dioramaKit.ts`, `CitylitEngine.ts`, `placesScene.ts`, `siteAtmosphere.ts`, `getSoftTexture`, `n8ao.d.ts`, `shaders.ts`, `package.json`, `dependencies`, `windParticles.ts`, `.constructor`?**
  _High betweenness centrality (0.131) - this node is a cross-community bridge._
- **Should `AmbientAudioController` be split into smaller, more focused modules?**
  _Cohesion score 0.06836055656382335 - nodes in this community are weakly interconnected._
- **Why does `CitylitEngine` connect `CitylitEngine` to `contact-sheet.ts`, `AmbientAudioController`, `SettingsModal.tsx`, `weatherData.ts`, `contact-sheet.ts`, `App.tsx`, `MiniaturePass`, `.frame`, `placesSliceBuilders.ts`, `GalleryModal.tsx`, `CitylitEngine.ts`, `placesScene.ts`, `siteAtmosphere.ts`, `motion.ts`, `windParticles.ts`, `.isStudio`, `.constructor`?**
  _High betweenness centrality (0.111) - this node is a cross-community bridge._
- **Should `SettingsModal.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.10080645161290322 - nodes in this community are weakly interconnected._
- **Should `primitives.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05230496453900709 - nodes in this community are weakly interconnected._
- **Should `App.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.10897435897435898 - nodes in this community are weakly interconnected._
- **Should `placesSliceBuilders.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.1310483870967742 - nodes in this community are weakly interconnected._