# Graph Report - citylit-pwa  (2026-11-21)

## Corpus Check
- 83 files · ~195,601 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 10 file(s) not represented in the graph (top: .woff2 4, (none) 2, .css 2)

## Summary
- 1012 nodes · 3125 edges · 52 communities (40 shown, 12 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 74 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `842507b2`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- landmarksB.ts
- siteAtmosphere.ts
- WeatherWidget.tsx
- primitives.ts
- citylit.ts
- App.tsx
- placesSliceBuilders.ts
- placesShaders.ts
- GalleryModal.tsx
- dioramaKit.ts
- CitylitEngine.ts
- motion.ts
- CitylitEngine
- compilerOptions
- AmbientAudioController
- osmService.ts
- osmSlice.ts
- SearchSheet.tsx
- ambientAudio.ts
- shaders.ts
- PassportModal.tsx
- package.json
- dependencies
- globeScene.ts
- windParticles.ts
- server.js
- .oxfmtrc.json
- .oxlintrc.json
- vite.config.ts
- .constructor
- scripts
- contact-sheet.ts
- with
- MiniaturePass
- weatherData.ts
- MiniaturePass
- overrides
- .updateSpatial
- placesClouds.ts
- nativeHost.ts
- LandmarkBiome
- recharts
- horizonScenery.ts
- placesScene.ts
- oxlint@1.94.0
- react-dom
- @types/react@19.3.0
- @types/react-dom@19.3.0
- @ui-sdk/core@0.1.0-beta.13

## God Nodes (most connected - your core abstractions)
1. `CitylitEngine` - 99 edges
2. `add()` - 70 edges
3. `R()` - 57 edges
4. `C()` - 50 edges
5. `M()` - 50 edges
6. `MStone()` - 50 edges
7. `CB()` - 49 edges
8. `App()` - 40 edges
9. `AmbientAudioController` - 37 edges
10. `tree()` - 36 edges

## Surprising Connections (you probably didn't know these)
- `CompassProps` --references--> `CitylitEngine`  [EXTRACTED]
  src/components/Compass.tsx → src/three/CitylitEngine.ts
- `AudioVisualizerBarProps` --references--> `ThemeSetting`  [EXTRACTED]
  src/components/AudioVisualizerBar.tsx → src/types/citylit.ts
- `groot()` --calls--> `capeDutchGableGeo()`  [EXTRACTED]
  src/three/builders/landmarksB.ts → src/three/builders/primitives.ts
- `AmbientAudioController` --references--> `AmbientSiteProfile`  [EXTRACTED]
  src/audio/ambientAudio.ts → src/types/citylit.ts
- `AmbientAudioController` --references--> `SpatialAudioSource`  [EXTRACTED]
  src/audio/ambientAudio.ts → src/types/citylit.ts

## Import Cycles
- None detected.

## Communities (52 total, 12 thin omitted)

### Community 0 - "landmarksB.ts"
Cohesion: 0.16
Nodes (106): addAnchor(), addBaseScatter(), addBollards(), addDeck(), addJetty(), addReedbed(), addSiteMotion(), addWindpump() (+98 more)

### Community 1 - "siteAtmosphere.ts"
Cohesion: 0.15
Nodes (17): AtmosphereEffect, AtmosphereLayer, AtmosphereProfile, AtmosphereSceneController, AtmosphereUpdateOptions, BIOME_EFFECTS, createAtmosphereScene(), createClothMaterial() (+9 more)

### Community 2 - "WeatherWidget.tsx"
Cohesion: 0.11
Nodes (26): @phosphor-icons/react, placeCardCondition(), PlacesOverlay(), PlacesOverlayProps, QUICK_TIMES, WEATHER_MODES, AnimatedNumber(), AnimatedNumberProps (+18 more)

### Community 3 - "primitives.ts"
Cohesion: 0.05
Nodes (47): archGeo(), buildTreeGeometry(), buildTreeLodGeometry(), cacheGeo(), capeDutchGableGeo(), contactShadowBatches, contactShadowMaterials, contactShadowMeshes (+39 more)

### Community 4 - "citylit.ts"
Cohesion: 0.12
Nodes (21): BUILTIN_MIXER_PRESETS, DEFAULT_MIXER, MIXER_CHANNELS, MOTION_OPTIONS, QUALITY_OPTIONS, readCustomPresets(), SettingsModal(), SettingsModalProps (+13 more)

### Community 5 - "App.tsx"
Cohesion: 0.10
Nodes (32): App(), INITIAL_GLOBE, readInitialLandmarkIndex(), readSettings(), readStoredNotes(), readStoredSavedPlaces(), readStoredSet(), AudioVisualizerBar() (+24 more)

### Community 6 - "placesSliceBuilders.ts"
Cohesion: 0.14
Nodes (27): getGrassMaterial(), createCutawayWaterTopMaterial(), createCutawayWaterWallMaterial(), createSliceMistMaterial(), CutawayWaterOptions, getOrlandoMuralTexture(), addInstancedFlowers(), addInstancedRocks() (+19 more)

### Community 7 - "placesShaders.ts"
Cohesion: 0.15
Nodes (19): bindVolumetricFogUniforms(), patchPlacesVolumetricFog(), PlacesSliceEmitterSpec, CLOUD_FRAGMENT, CLOUD_VERTEX, NOISE_GLSL, SEASON_MORPH_GLSL, SEASON_UNIFORMS_GLSL (+11 more)

### Community 8 - "GalleryModal.tsx"
Cohesion: 0.08
Nodes (30): GalleryDialog(), GalleryModalProps, bodySlideVariants, CAMERA_PRESETS, CARDINALS, getCategoryMeta(), headerSlideVariants, LandmarkCard() (+22 more)

### Community 9 - "dioramaKit.ts"
Cohesion: 0.09
Nodes (34): addCraftedRim(), addDioramaClouds(), addSoaringBirds(), addSquareRim(), addSquareWaterPlate(), addTreeRing(), addWeatherFx(), AnchorKind (+26 more)

### Community 10 - "CitylitEngine.ts"
Cohesion: 0.08
Nodes (30): LANDMARK_BUILDERS, glowMaterials, SwayItem, WetMaterialEntry, wetMaterials, audioForward, audioRight, compassDir (+22 more)

### Community 11 - "motion.ts"
Cohesion: 0.07
Nodes (44): motion, react, ambientAudio, AudioVisualizerBarProps, DARK_PALETTE, LIGHT_PALETTE, CARDINAL_TARGETS, CARDINALS_8 (+36 more)

### Community 12 - "CitylitEngine"
Cohesion: 0.09
Nodes (3): CitylitEngine, NoteCategory, QualitySetting

### Community 13 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowImportingTsExtensions, isolatedModules, jsx, lib, module, moduleDetection, moduleResolution (+10 more)

### Community 15 - "osmService.ts"
Cohesion: 0.15
Nodes (16): cacheKey(), fallbackPatch(), formatCoordinates(), GEO_CACHE, loadElevation(), loadOsmPlace(), MEMORY_CACHE, OsmBuilding (+8 more)

### Community 16 - "osmSlice.ts"
Cohesion: 0.20
Nodes (13): LocalPoint, OsmArea, centroid(), clamp(), createOsmSlice(), createRibbon(), OsmSliceResult, polygonShape() (+5 more)

### Community 17 - "SearchSheet.tsx"
Cohesion: 0.23
Nodes (10): parseSearch(), SearchSheet(), SearchSheetProps, TIME_PHRASES, BeforeInstallPromptEvent, usePWAInstall(), swapTransition, geocodePlace() (+2 more)

### Community 18 - "ambientAudio.ts"
Cohesion: 0.17
Nodes (11): BIOME_HAPTIC_PATTERNS, FilterBand, REGION_HAPTIC_ACCENTS, SpatialEmitter, SpatialListener, UI_CUE_CATEGORY, UiCueCategory, UiCueKind (+3 more)

### Community 19 - "shaders.ts"
Cohesion: 0.13
Nodes (31): getRoofDirtMap(), MSteel(), applyDissolveToShader(), cascadeize(), flagWindy(), getBrushedNormalTexture(), getBrushedRoughnessTexture(), getCanvasBumpTexture() (+23 more)

### Community 20 - "PassportModal.tsx"
Cohesion: 0.11
Nodes (24): GlobeOverlayProps, CATEGORY_COLORS, PASSPORT_TABS, PassportModal(), PassportModalProps, PassportTab, ProvinceRing(), ProvinceRingProps (+16 more)

### Community 21 - "package.json"
Cohesion: 0.14
Nodes (13): goeist@0.1.0, oxfmt@0.79.0, typescript@7.0.2, workbox-window@7.4.1, description, name, private, type (+5 more)

### Community 22 - "dependencies"
Cohesion: 0.13
Nodes (15): dependencies, motion@14.14.0, n8ao@2.1.0, @phosphor-icons/react@2.1.10, react@19.3.1, tailwindcss@4.3.5, three@0.187.0, @types/node@^24.0.0 (+7 more)

### Community 23 - "globeScene.ts"
Cohesion: 0.11
Nodes (29): three, AFRICA_POLYS, ENCLAVE_POLYS, GLOBE_NEIGHBOR_LABELS, GLOBE_PROVINCES, NEIGHBOR_POLYS, PROVINCE_STYLE, ProvinceGlobeEntry (+21 more)

### Community 24 - "windParticles.ts"
Cohesion: 0.27
Nodes (9): GlobeController, WU, BIOME_PALETTES, createLeafWispTexture(), createWindParticles(), seeded(), WindParticlesController, WindParticlesUpdateOptions (+1 more)

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
Cohesion: 0.28
Nodes (8): attachEquirect(), buildProbeData(), Equirect, HORIZ_DIRS, probeGrid, probeOrigin, probeSize, sampleEquirect()

### Community 31 - "scripts"
Cohesion: 0.22
Nodes (9): scripts, build, dev, format, format:check, lint, preview, start (+1 more)

### Community 32 - "contact-sheet.ts"
Cohesion: 0.15
Nodes (9): build(), engine, grid, hour, params, stage, status, syncButtons() (+1 more)

### Community 33 - "with"
Cohesion: 0.11
Nodes (17): jobs, verify, name, on, pull_request, push, branches, name (+9 more)

### Community 35 - "weatherData.ts"
Cohesion: 0.11
Nodes (23): buildLiveForecast(), clamp01(), conditionFromCode(), ExtremeWeatherWarning, ExtremeWeatherWarningKind, fetchLiveWeather(), getClimateRegime(), HourlyWeather (+15 more)

### Community 37 - "overrides"
Cohesion: 0.50
Nodes (3): overrides, three, workbox-build>glob

### Community 38 - ".updateSpatial"
Cohesion: 0.27
Nodes (4): clamp01(), equalPower(), smoothBell(), smoothstep()

### Community 40 - "placesClouds.ts"
Cohesion: 0.38
Nodes (6): CloudAssets, CloudPuffInstance, createCloudPuffMesh(), createSliceCloudLayer(), SliceCloudLayer, getSoftTexture()

### Community 41 - "nativeHost.ts"
Cohesion: 0.31
Nodes (6): detectNativeHost(), hasCinematicHost(), isHost(), NativeCinematicHost, nativeHostUrl(), Window

### Community 42 - "LandmarkBiome"
Cohesion: 0.33
Nodes (5): extractRegionName(), SiteProfile, AtmosphereSite, AmbientSiteProfile, LandmarkBiome

### Community 45 - "horizonScenery.ts"
Cohesion: 0.38
Nodes (6): BiomeWeights, createHorizonRing(), createHorizonScenery(), HorizonSceneryController, HorizonUpdateOptions, weightsForBiome()

### Community 46 - "placesScene.ts"
Cohesion: 0.16
Nodes (16): OsmPlaceData, EngineCallbacks, createPlacesScene(), ExplorerInfo, HERO_CAM, HERO_TARGET, PlacesController, PlacesSelectionInfo (+8 more)

## Knowledge Gaps
- **12 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `three` connect `globeScene.ts` to `landmarksB.ts`, `siteAtmosphere.ts`, `primitives.ts`, `weatherData.ts`, `placesSliceBuilders.ts`, `placesShaders.ts`, `placesClouds.ts`, `dioramaKit.ts`, `CitylitEngine.ts`, `horizonScenery.ts`, `placesScene.ts`, `osmSlice.ts`, `shaders.ts`, `package.json`, `dependencies`, `windParticles.ts`, `.constructor`?**
  _High betweenness centrality (0.102) - this node is a cross-community bridge._
- **Should `WeatherWidget.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.10967741935483871 - nodes in this community are weakly interconnected._
- **Why does `CitylitEngine` connect `CitylitEngine` to `contact-sheet.ts`, `siteAtmosphere.ts`, `MiniaturePass`, `weatherData.ts`, `MiniaturePass`, `App.tsx`, `placesSliceBuilders.ts`, `citylit.ts`, `CitylitEngine.ts`, `motion.ts`, `horizonScenery.ts`, `placesScene.ts`, `windParticles.ts`, `.isStudio`?**
  _High betweenness centrality (0.101) - this node is a cross-community bridge._
- **Should `primitives.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05230496453900709 - nodes in this community are weakly interconnected._
- **Why does `AmbientAudioController` connect `AmbientAudioController` to `ambientAudio.ts`, `LandmarkBiome`, `.updateSpatial`, `.update`?**
  _High betweenness centrality (0.038) - this node is a cross-community bridge._
- **Should `citylit.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.11956521739130435 - nodes in this community are weakly interconnected._
- **Should `App.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.1048780487804878 - nodes in this community are weakly interconnected._