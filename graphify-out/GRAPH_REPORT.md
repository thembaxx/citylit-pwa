# Graph Report - citylit-pwa  (2026-11-21)

## Corpus Check
- 83 files · ~198,438 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 10 file(s) not represented in the graph (top: .woff2 4, (none) 2, .css 2)

## Summary
- 1016 nodes · 3141 edges · 48 communities (38 shown, 10 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 74 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `3e67e884`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- landmarksB.ts
- siteAtmosphere.ts
- WeatherWidget.tsx
- primitives.ts
- SettingsModal.tsx
- App.tsx
- placesSliceBuilders.ts
- placesShaders.ts
- LandmarkCard.tsx
- dioramaKit.ts
- CitylitEngine.ts
- InfoDrawer.tsx
- CitylitEngine
- compilerOptions
- AmbientAudioController
- osmService.ts
- placesScene.ts
- motion.ts
- landmarks.ts
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
- MiniaturePass
- weatherData.ts
- waterize
- overrides
- createSliceSharedAssets
- placesClouds.ts
- .showLandmarkImmediate
- recharts
- oxfmt@0.79.0
- tailwindcss@4.3.5
- @types/three@0.187.0
- typescript@7.0.2
- @ui-sdk/react

## God Nodes (most connected - your core abstractions)
1. `CitylitEngine` - 99 edges
2. `add()` - 70 edges
3. `R()` - 59 edges
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
- `EngineCallbacks` --references--> `PlacesSelectionInfo`  [EXTRACTED]
  src/three/CitylitEngine.ts → src/three/placesScene.ts
- `CitylitEngine` --references--> `GlobeController`  [EXTRACTED]
  src/three/CitylitEngine.ts → src/three/globeScene.ts
- `CitylitEngine` --references--> `HorizonSceneryController`  [EXTRACTED]
  src/three/CitylitEngine.ts → src/three/horizonScenery.ts
- `CitylitEngine` --references--> `PlacesController`  [EXTRACTED]
  src/three/CitylitEngine.ts → src/three/placesScene.ts

## Import Cycles
- None detected.

## Communities (48 total, 10 thin omitted)

### Community 0 - "landmarksB.ts"
Cohesion: 0.16
Nodes (106): addAnchor(), addBaseScatter(), addBollards(), addDeck(), addJetty(), addReedbed(), addSiteMotion(), addWindpump() (+98 more)

### Community 1 - "siteAtmosphere.ts"
Cohesion: 0.15
Nodes (17): AtmosphereEffect, AtmosphereLayer, AtmosphereProfile, AtmosphereSceneController, AtmosphereUpdateOptions, BIOME_EFFECTS, createAtmosphereScene(), createClothMaterial() (+9 more)

### Community 2 - "WeatherWidget.tsx"
Cohesion: 0.09
Nodes (30): @phosphor-icons/react@2.1.10, @phosphor-icons/react, placeCardCondition(), PlacesOverlay(), PlacesOverlayProps, QUICK_TIMES, WEATHER_MODES, AnimatedNumber() (+22 more)

### Community 3 - "primitives.ts"
Cohesion: 0.05
Nodes (47): archGeo(), buildTreeGeometry(), buildTreeLodGeometry(), cacheGeo(), capeDutchGableGeo(), contactShadowBatches, contactShadowMaterials, contactShadowMeshes (+39 more)

### Community 4 - "SettingsModal.tsx"
Cohesion: 0.11
Nodes (22): BUILTIN_MIXER_PRESETS, DEFAULT_MIXER, MIXER_CHANNELS, MOTION_OPTIONS, QUALITY_OPTIONS, readCustomPresets(), SettingsModal(), SettingsModalProps (+14 more)

### Community 5 - "App.tsx"
Cohesion: 0.11
Nodes (26): App(), INITIAL_GLOBE, readInitialLandmarkIndex(), readSettings(), readStoredNotes(), readStoredSavedPlaces(), readStoredSet(), BootSplash() (+18 more)

### Community 6 - "placesSliceBuilders.ts"
Cohesion: 0.12
Nodes (31): getGrassMaterial(), createCloudPuffMesh(), createSliceCloudLayer(), createCutawayWaterTopMaterial(), createCutawayWaterWallMaterial(), createSliceMistMaterial(), CutawayWaterOptions, getOrlandoMuralTexture() (+23 more)

### Community 7 - "placesShaders.ts"
Cohesion: 0.17
Nodes (17): bindVolumetricFogUniforms(), patchPlacesVolumetricFog(), PlacesSliceEmitterSpec, CLOUD_FRAGMENT, CLOUD_VERTEX, NOISE_GLSL, STRATA_COLOR_FRAGMENT, STRATA_FRAG_COMMON (+9 more)

### Community 8 - "LandmarkCard.tsx"
Cohesion: 0.11
Nodes (22): GalleryDialog(), GalleryModal(), GalleryModalProps, bodySlideVariants, CAMERA_PRESETS, CARDINALS, getCategoryMeta(), headerSlideVariants (+14 more)

### Community 9 - "dioramaKit.ts"
Cohesion: 0.09
Nodes (36): addCraftedRim(), addDioramaClouds(), addEdgeWaterfall(), addSoaringBirds(), addSquareRim(), addSquareWaterPlate(), addStandUnderside(), addTreeRing() (+28 more)

### Community 10 - "CitylitEngine.ts"
Cohesion: 0.08
Nodes (32): LANDMARK_BUILDERS, glowMaterials, SwayItem, WetMaterialEntry, wetMaterials, audioForward, audioRight, compassDir (+24 more)

### Community 11 - "InfoDrawer.tsx"
Cohesion: 0.15
Nodes (15): formatCoords(), InfoDrawer(), InfoDrawerProps, UnfoldAccordion(), LANDMARK_DETAILS, LandmarkDetail, cleanCaption(), CommonsImageInfo (+7 more)

### Community 13 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowImportingTsExtensions, isolatedModules, jsx, lib, module, moduleDetection, moduleResolution (+10 more)

### Community 14 - "AmbientAudioController"
Cohesion: 0.07
Nodes (21): AmbientAudioController, BIOME_HAPTIC_PATTERNS, clamp01(), equalPower(), extractRegionName(), FilterBand, REGION_HAPTIC_ACCENTS, smoothBell() (+13 more)

### Community 15 - "osmService.ts"
Cohesion: 0.13
Nodes (18): cacheKey(), fallbackPatch(), formatCoordinates(), GEO_CACHE, loadElevation(), loadOsmPlace(), LocalPoint, MEMORY_CACHE (+10 more)

### Community 16 - "placesScene.ts"
Cohesion: 0.15
Nodes (22): OsmPlaceData, getSiteProfile(), centroid(), clamp(), createOsmSlice(), createRibbon(), OsmSliceResult, polygonShape() (+14 more)

### Community 17 - "motion.ts"
Cohesion: 0.06
Nodes (49): motion@14.14.0, motion, react, ambientAudio, AudioVisualizerBar(), AudioVisualizerBarProps, DARK_PALETTE, LIGHT_PALETTE (+41 more)

### Community 18 - "landmarks.ts"
Cohesion: 0.24
Nodes (10): GlobeOverlay(), GlobeOverlayProps, LANDMARKS, PROVINCES, getLandmarkSignature(), loadCachedThumbnails(), openThumbDb(), saveCachedThumbnails() (+2 more)

### Community 19 - "shaders.ts"
Cohesion: 0.14
Nodes (28): getRoofDirtMap(), MSteel(), getBrushedNormalTexture(), getBrushedRoughnessTexture(), getCanvasBumpTexture(), getCanvasNormalTexture(), getPlasterBumpTexture(), getPlasterNormalTexture() (+20 more)

### Community 20 - "PassportModal.tsx"
Cohesion: 0.11
Nodes (24): CATEGORY_COLORS, PASSPORT_TABS, PassportModal(), PassportModalProps, PassportTab, ProvinceRing(), ProvinceRingProps, ProvinceStatRow (+16 more)

### Community 21 - "package.json"
Cohesion: 0.14
Nodes (13): goeist@0.1.0, n8ao@2.1.0, oxlint@1.94.0, @types/node@^24.0.0, description, name, private, type (+5 more)

### Community 22 - "dependencies"
Cohesion: 0.15
Nodes (13): dependencies, react@19.3.1, react-dom@19.3.1, three@0.187.0, @types/react@19.3.0, @types/react-dom@19.3.0, @ui-sdk/core@0.1.0-beta.13, workbox-window@7.4.1 (+5 more)

### Community 23 - "globeScene.ts"
Cohesion: 0.10
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
Cohesion: 0.24
Nodes (9): attachEquirect(), buildProbeData(), Equirect, HORIZ_DIRS, installGI(), probeGrid, probeOrigin, probeSize (+1 more)

### Community 31 - "scripts"
Cohesion: 0.22
Nodes (9): scripts, build, dev, format, format:check, lint, preview, start (+1 more)

### Community 32 - "contact-sheet.ts"
Cohesion: 0.22
Nodes (8): build(), engine, grid, hour, params, stage, status, syncButtons()

### Community 33 - "with"
Cohesion: 0.11
Nodes (17): jobs, verify, name, on, pull_request, push, branches, name (+9 more)

### Community 35 - "weatherData.ts"
Cohesion: 0.12
Nodes (24): buildLiveForecast(), clamp01(), conditionFromCode(), ExtremeWeatherWarning, fetchLiveWeather(), HourlyWeather, liveConditionLabel(), LiveWeatherResult (+16 more)

### Community 36 - "waterize"
Cohesion: 0.40
Nodes (5): applyDissolveToShader(), cascadeize(), flagWindy(), installDissolveShader(), lights()

### Community 37 - "overrides"
Cohesion: 0.50
Nodes (3): overrides, three, workbox-build>glob

### Community 39 - "createSliceSharedAssets"
Cohesion: 0.50
Nodes (4): createFoliageGeo(), createGableRoofGeo(), createSculptedRockGeo(), createSliceSharedAssets()

### Community 40 - "placesClouds.ts"
Cohesion: 0.50
Nodes (3): CloudAssets, CloudPuffInstance, SliceCloudLayer

### Community 42 - ".showLandmarkImmediate"
Cohesion: 0.15
Nodes (4): resetSceneDynamicLists(), setContactShadowFade(), updateWetSurfaces(), updateRimLight()

## Knowledge Gaps
- **10 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `CitylitEngine` connect `CitylitEngine` to `contact-sheet.ts`, `siteAtmosphere.ts`, `MiniaturePass`, `WeatherWidget.tsx`, `weatherData.ts`, `App.tsx`, `placesSliceBuilders.ts`, `CitylitEngine.ts`, `.showLandmarkImmediate`, `placesScene.ts`, `motion.ts`, `windParticles.ts`, `.isStudio`?**
  _High betweenness centrality (0.137) - this node is a cross-community bridge._
- **Should `WeatherWidget.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.08708708708708708 - nodes in this community are weakly interconnected._
- **Why does `three` connect `globeScene.ts` to `landmarksB.ts`, `siteAtmosphere.ts`, `primitives.ts`, `weatherData.ts`, `placesSliceBuilders.ts`, `placesShaders.ts`, `placesClouds.ts`, `dioramaKit.ts`, `CitylitEngine.ts`, `placesScene.ts`, `shaders.ts`, `package.json`, `dependencies`, `windParticles.ts`, `.constructor`?**
  _High betweenness centrality (0.114) - this node is a cross-community bridge._
- **Should `primitives.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05230496453900709 - nodes in this community are weakly interconnected._
- **Why does `AmbientAudioController` connect `AmbientAudioController` to `InfoDrawer.tsx`?**
  _High betweenness centrality (0.041) - this node is a cross-community bridge._
- **Should `SettingsModal.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.10541310541310542 - nodes in this community are weakly interconnected._
- **Should `App.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.11428571428571428 - nodes in this community are weakly interconnected._