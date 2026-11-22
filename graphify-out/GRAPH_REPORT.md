# Graph Report - citylit-pwa  (2026-11-22)

## Corpus Check
- 85 files · ~214,059 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 10 file(s) not represented in the graph (top: .woff2 4, (none) 2, .css 2)

## Summary
- 1047 nodes · 3206 edges · 58 communities (45 shown, 13 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 82 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `befe5703`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- landmarksB.ts
- siteAtmosphere.ts
- weatherData.ts
- primitives.ts
- nativeHost.ts
- App.tsx
- placesSliceBuilders.ts
- placesShaders.ts
- LandmarkCard.tsx
- dioramaKit.ts
- CitylitEngine.ts
- motion.ts
- CitylitEngine
- compilerOptions
- AmbientAudioController
- osmService.ts
- placesScene.ts
- motion.ts
- SettingsModal.tsx
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
- PlacesOverlay.tsx
- scripts
- MiniaturePass
- with
- MiniaturePass
- season.ts
- waterize
- overrides
- run
- TopBar.tsx
- placesClouds.ts
- placesScene.ts
- .showLandmarkImmediate
- recharts
- run
- contact-sheet.ts
- globeData.ts
- globalIllumination.ts
- windy
- n8ao.d.ts
- PlacesSelectionInfo
- horizonScenery.ts
- oxlint@1.94.0
- react-dom
- @types/react@19.3.0
- @types/react-dom@19.3.0
- @ui-sdk/core@0.1.0-beta.13

## God Nodes (most connected - your core abstractions)
1. `CitylitEngine` - 100 edges
2. `add()` - 71 edges
3. `R()` - 59 edges
4. `M()` - 52 edges
5. `MStone()` - 52 edges
6. `CB()` - 51 edges
7. `C()` - 50 edges
8. `App()` - 40 edges
9. `AmbientAudioController` - 37 edges
10. `tree()` - 36 edges

## Surprising Connections (you probably didn't know these)
- `CompassProps` --references--> `CitylitEngine`  [EXTRACTED]
  src/components/Compass.tsx → src/three/CitylitEngine.ts
- `getRimMaterial()` --calls--> `surfaceDetail()`  [EXTRACTED]
  src/three/builders/dioramaKit.ts → src/three/builders/primitives.ts
- `addSquareRim()` --calls--> `weatherVertexColors()`  [EXTRACTED]
  src/three/builders/dioramaKit.ts → src/three/builders/primitives.ts
- `addVibrantAccents()` --calls--> `add()`  [EXTRACTED]
  src/three/builders/dioramaKit.ts → src/three/builders/primitives.ts
- `addVibrantAccents()` --calls--> `C()`  [EXTRACTED]
  src/three/builders/dioramaKit.ts → src/three/builders/primitives.ts

## Import Cycles
- None detected.

## Communities (58 total, 13 thin omitted)

### Community 0 - "landmarksB.ts"
Cohesion: 0.16
Nodes (104): addAnchor(), addBollards(), addDeck(), addJetty(), addReedbed(), addWindpump(), anchorGroup(), corniceBand() (+96 more)

### Community 1 - "siteAtmosphere.ts"
Cohesion: 0.14
Nodes (18): SKY_NOISE_GLSL, AtmosphereEffect, AtmosphereLayer, AtmosphereProfile, AtmosphereSceneController, AtmosphereUpdateOptions, BIOME_EFFECTS, createAtmosphereScene() (+10 more)

### Community 2 - "weatherData.ts"
Cohesion: 0.10
Nodes (31): AnimatedNumber(), AnimatedNumberProps, Digit(), PresetKey, TIME_PRESETS, WARNING_STYLE, WeatherWidget(), WeatherWidgetProps (+23 more)

### Community 3 - "primitives.ts"
Cohesion: 0.05
Nodes (48): archGeo(), boostBuiltVibrancy(), buildTreeGeometry(), buildTreeLodGeometry(), cacheGeo(), capeDutchGableGeo(), contactShadowBatches, contactShadowMaterials (+40 more)

### Community 4 - "nativeHost.ts"
Cohesion: 0.31
Nodes (6): detectNativeHost(), hasCinematicHost(), isHost(), NativeCinematicHost, nativeHostUrl(), Window

### Community 5 - "App.tsx"
Cohesion: 0.08
Nodes (42): App(), INITIAL_GLOBE, readInitialLandmarkIndex(), readSettings(), readStoredNotes(), readStoredSavedPlaces(), readStoredSet(), BootSplash() (+34 more)

### Community 6 - "placesSliceBuilders.ts"
Cohesion: 0.14
Nodes (28): createCutawayWaterTopMaterial(), createCutawayWaterWallMaterial(), createSliceMistMaterial(), CutawayWaterOptions, getOrlandoMuralTexture(), addInstancedFlowers(), addInstancedRocks(), addInstancedTrees() (+20 more)

### Community 7 - "placesShaders.ts"
Cohesion: 0.17
Nodes (17): bindVolumetricFogUniforms(), patchPlacesVolumetricFog(), PlacesSliceEmitterSpec, CLOUD_FRAGMENT, CLOUD_VERTEX, NOISE_GLSL, STRATA_COLOR_FRAGMENT, STRATA_FRAG_COMMON (+9 more)

### Community 8 - "LandmarkCard.tsx"
Cohesion: 0.13
Nodes (19): bodySlideVariants, CAMERA_PRESETS, CARDINALS, getCategoryMeta(), headerSlideVariants, LandmarkCard(), LandmarkCardProps, nextBearingSummary() (+11 more)

### Community 9 - "dioramaKit.ts"
Cohesion: 0.08
Nodes (40): accentFor(), addBaseScatter(), addCraftedRim(), addDioramaClouds(), addEdgeWaterfall(), addSiteMotion(), addSoaringBirds(), addSquareRim() (+32 more)

### Community 10 - "CitylitEngine.ts"
Cohesion: 0.08
Nodes (32): LANDMARK_BUILDERS, glowMaterials, SwayItem, WetMaterialEntry, wetMaterials, audioForward, audioRight, compassDir (+24 more)

### Community 11 - "motion.ts"
Cohesion: 0.07
Nodes (48): motion, @phosphor-icons/react, react, ambientAudio, CARDINAL_TARGETS, CARDINALS_8, Compass(), CompassProps (+40 more)

### Community 13 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowImportingTsExtensions, isolatedModules, jsx, lib, module, moduleDetection, moduleResolution (+10 more)

### Community 14 - "AmbientAudioController"
Cohesion: 0.07
Nodes (21): AmbientAudioController, BIOME_HAPTIC_PATTERNS, clamp01(), equalPower(), extractRegionName(), FilterBand, REGION_HAPTIC_ACCENTS, smoothBell() (+13 more)

### Community 15 - "osmService.ts"
Cohesion: 0.16
Nodes (15): cacheKey(), fallbackPatch(), GEO_CACHE, loadElevation(), loadOsmPlace(), MEMORY_CACHE, OsmBuilding, OsmRoad (+7 more)

### Community 16 - "placesScene.ts"
Cohesion: 0.20
Nodes (13): LocalPoint, OsmArea, centroid(), clamp(), createOsmSlice(), createRibbon(), OsmSliceResult, polygonShape() (+5 more)

### Community 17 - "motion.ts"
Cohesion: 0.12
Nodes (19): GalleryDialog(), GalleryModal(), GalleryModalProps, applyRubberBand(), project(), rubberBand(), DragOptions, Point (+11 more)

### Community 18 - "SettingsModal.tsx"
Cohesion: 0.15
Nodes (16): BUILTIN_MIXER_PRESETS, DEFAULT_MIXER, MIXER_CHANNELS, MOTION_OPTIONS, QUALITY_OPTIONS, readCustomPresets(), SettingsModal(), SettingsModalProps (+8 more)

### Community 19 - "shaders.ts"
Cohesion: 0.15
Nodes (27): getRoofDirtMap(), MSteel(), getBrushedNormalTexture(), getBrushedRoughnessTexture(), getCanvasBumpTexture(), getCanvasNormalTexture(), getPlasterBumpTexture(), getPlasterNormalTexture() (+19 more)

### Community 20 - "PassportModal.tsx"
Cohesion: 0.17
Nodes (15): CATEGORY_COLORS, PASSPORT_TABS, PassportModal(), PassportTab, ProvinceRing(), ProvinceRingProps, ProvinceStatRow, StatsTooltip() (+7 more)

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

### Community 30 - "PlacesOverlay.tsx"
Cohesion: 0.23
Nodes (11): placeCardCondition(), PlacesOverlay(), PlacesOverlayProps, QUICK_TIMES, WEATHER_MODES, ANIMATED_BY_CONDITION, WeatherIcon(), WeatherIconCondition (+3 more)

### Community 31 - "scripts"
Cohesion: 0.22
Nodes (9): scripts, build, dev, format, format:check, lint, preview, start (+1 more)

### Community 33 - "with"
Cohesion: 0.11
Nodes (17): jobs, verify, name, on, pull_request, push, branches, name (+9 more)

### Community 36 - "waterize"
Cohesion: 0.33
Nodes (6): addSquareWaterPlate(), applyDissolveToShader(), cascadeize(), flagWindy(), lights(), waterize()

### Community 37 - "overrides"
Cohesion: 0.50
Nodes (3): overrides, three, workbox-build>glob

### Community 38 - "run"
Cohesion: 0.32
Nodes (5): CDP, clickAria(), listTargets(), run(), sleep()

### Community 39 - "TopBar.tsx"
Cohesion: 0.33
Nodes (6): AudioVisualizerBar(), AudioVisualizerBarProps, DARK_PALETTE, LIGHT_PALETTE, TopBarProps, ThemeSetting

### Community 40 - "placesClouds.ts"
Cohesion: 0.33
Nodes (5): CloudAssets, CloudPuffInstance, createCloudPuffMesh(), createSliceCloudLayer(), SliceCloudLayer

### Community 41 - "placesScene.ts"
Cohesion: 0.23
Nodes (12): OsmPlaceData, createPlacesScene(), ExplorerInfo, HERO_CAM, HERO_TARGET, PlacesController, createPlacesShaderEnv(), createPlacesVolumetricFogLayer() (+4 more)

### Community 45 - "run"
Cohesion: 0.38
Nodes (5): CDP, i0(), listTargets(), run(), sleep()

### Community 46 - "contact-sheet.ts"
Cohesion: 0.25
Nodes (8): build(), engine, grid, hour, params, stage, status, syncButtons()

### Community 47 - "globeData.ts"
Cohesion: 0.21
Nodes (11): AFRICA_POLYS, ENCLAVE_POLYS, GLOBE_NEIGHBOR_LABELS, GLOBE_PROVINCES, NEIGHBOR_POLYS, PROVINCE_STYLE, ProvinceGlobeEntry, GEO_AFRICA (+3 more)

### Community 48 - "globalIllumination.ts"
Cohesion: 0.24
Nodes (9): attachEquirect(), buildProbeData(), Equirect, HORIZ_DIRS, installGI(), probeGrid, probeOrigin, probeSize (+1 more)

### Community 49 - "windy"
Cohesion: 0.29
Nodes (7): finalizeTreeBatch(), getGrassMaterial(), stampContactShadow(), stampContactShadowsFromMeshes(), treeMaterial(), grassWindy(), windy()

### Community 50 - "n8ao.d.ts"
Cohesion: 0.25
Nodes (4): n8ao, N8AOPass, N8AOPassConfiguration, N8AOQualityMode

### Community 51 - "PlacesSelectionInfo"
Cohesion: 0.33
Nodes (3): setContactShadowFade(), EngineCallbacks, PlacesSelectionInfo

### Community 52 - "horizonScenery.ts"
Cohesion: 0.38
Nodes (6): BiomeWeights, createHorizonRing(), createHorizonScenery(), HorizonSceneryController, HorizonUpdateOptions, weightsForBiome()

## Knowledge Gaps
- **13 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `CitylitEngine` connect `CitylitEngine` to `MiniaturePass`, `siteAtmosphere.ts`, `MiniaturePass`, `weatherData.ts`, `App.tsx`, `TopBar.tsx`, `LandmarkCard.tsx`, `placesScene.ts`, `CitylitEngine.ts`, `motion.ts`, `.showLandmarkImmediate`, `contact-sheet.ts`, `windy`, `PlacesSelectionInfo`, `horizonScenery.ts`, `windParticles.ts`, `.isStudio`?**
  _High betweenness centrality (0.132) - this node is a cross-community bridge._
- **Should `siteAtmosphere.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.14035087719298245 - nodes in this community are weakly interconnected._
- **Why does `three` connect `globeScene.ts` to `landmarksB.ts`, `siteAtmosphere.ts`, `weatherData.ts`, `primitives.ts`, `placesSliceBuilders.ts`, `placesShaders.ts`, `placesClouds.ts`, `dioramaKit.ts`, `CitylitEngine.ts`, `placesScene.ts`, `globalIllumination.ts`, `placesScene.ts`, `n8ao.d.ts`, `shaders.ts`, `horizonScenery.ts`, `package.json`, `dependencies`, `windParticles.ts`?**
  _High betweenness centrality (0.120) - this node is a cross-community bridge._
- **Should `weatherData.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.10158730158730159 - nodes in this community are weakly interconnected._
- **Should `primitives.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.04846938775510204 - nodes in this community are weakly interconnected._
- **Should `App.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.07744107744107744 - nodes in this community are weakly interconnected._
- **Should `placesSliceBuilders.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.14285714285714285 - nodes in this community are weakly interconnected._