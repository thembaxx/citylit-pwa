# Graph Report - citylit-pwa  (2026-11-21)

## Corpus Check
- 83 files · ~197,199 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 10 file(s) not represented in the graph (top: .woff2 4, (none) 2, .css 2)

## Summary
- 1015 nodes · 3139 edges · 49 communities (39 shown, 10 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 74 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `9b78c5de`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- landmarksB.ts
- siteAtmosphere.ts
- citylit.ts
- primitives.ts
- SettingsModal.tsx
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
- osmSlice.ts
- SearchSheet.tsx
- TopBar.tsx
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
- nativeHost.ts
- placesScene.ts
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
- `getRimMaterial()` --calls--> `surfaceDetail()`  [EXTRACTED]
  src/three/builders/dioramaKit.ts → src/three/builders/primitives.ts
- `addSquareRim()` --calls--> `weatherVertexColors()`  [EXTRACTED]
  src/three/builders/dioramaKit.ts → src/three/builders/primitives.ts
- `createPlacesScene()` --calls--> `addSquareRim()`  [EXTRACTED]
  src/three/placesScene.ts → src/three/builders/dioramaKit.ts
- `getUndersideMaterial()` --calls--> `surfaceDetail()`  [EXTRACTED]
  src/three/builders/dioramaKit.ts → src/three/builders/primitives.ts

## Import Cycles
- None detected.

## Communities (49 total, 10 thin omitted)

### Community 0 - "landmarksB.ts"
Cohesion: 0.16
Nodes (106): addAnchor(), addBaseScatter(), addBollards(), addDeck(), addJetty(), addReedbed(), addSiteMotion(), addWindpump() (+98 more)

### Community 1 - "siteAtmosphere.ts"
Cohesion: 0.15
Nodes (17): AtmosphereEffect, AtmosphereLayer, AtmosphereProfile, AtmosphereSceneController, AtmosphereUpdateOptions, BIOME_EFFECTS, createAtmosphereScene(), createClothMaterial() (+9 more)

### Community 2 - "citylit.ts"
Cohesion: 0.13
Nodes (18): placeCardCondition(), PlacesOverlay(), PlacesOverlayProps, QUICK_TIMES, WEATHER_MODES, ANIMATED_BY_CONDITION, WeatherIconCondition, WeatherIconProps (+10 more)

### Community 3 - "primitives.ts"
Cohesion: 0.05
Nodes (47): archGeo(), buildTreeGeometry(), buildTreeLodGeometry(), cacheGeo(), capeDutchGableGeo(), contactShadowBatches, contactShadowMaterials, contactShadowMeshes (+39 more)

### Community 4 - "SettingsModal.tsx"
Cohesion: 0.12
Nodes (22): motion@14.14.0, motion, ambientAudio, BUILTIN_MIXER_PRESETS, DEFAULT_MIXER, MIXER_CHANNELS, MOTION_OPTIONS, QUALITY_OPTIONS (+14 more)

### Community 5 - "App.tsx"
Cohesion: 0.09
Nodes (33): App(), INITIAL_GLOBE, readInitialLandmarkIndex(), readSettings(), readStoredNotes(), readStoredSavedPlaces(), readStoredSet(), BootSplash() (+25 more)

### Community 6 - "placesSliceBuilders.ts"
Cohesion: 0.13
Nodes (30): getGrassMaterial(), createCloudPuffMesh(), createSliceCloudLayer(), createCutawayWaterTopMaterial(), createCutawayWaterWallMaterial(), createSliceMistMaterial(), CutawayWaterOptions, getOrlandoMuralTexture() (+22 more)

### Community 7 - "placesShaders.ts"
Cohesion: 0.19
Nodes (15): PlacesSliceEmitterSpec, CLOUD_FRAGMENT, CLOUD_VERTEX, NOISE_GLSL, STRATA_COLOR_FRAGMENT, STRATA_FRAG_COMMON, STRATA_ROUGHNESS_FRAGMENT, STRATA_VERT_BEGIN (+7 more)

### Community 8 - "LandmarkCard.tsx"
Cohesion: 0.13
Nodes (16): bodySlideVariants, CAMERA_PRESETS, CARDINALS, getCategoryMeta(), headerSlideVariants, LandmarkCard(), LandmarkCardProps, nextBearingSummary() (+8 more)

### Community 9 - "dioramaKit.ts"
Cohesion: 0.09
Nodes (36): addCraftedRim(), addDioramaClouds(), addEdgeWaterfall(), addSoaringBirds(), addSquareRim(), addSquareWaterPlate(), addStandUnderside(), addTreeRing() (+28 more)

### Community 10 - "CitylitEngine.ts"
Cohesion: 0.08
Nodes (32): LANDMARK_BUILDERS, glowMaterials, SwayItem, WetMaterialEntry, wetMaterials, audioForward, audioRight, compassDir (+24 more)

### Community 11 - "motion.ts"
Cohesion: 0.07
Nodes (29): CARDINAL_TARGETS, CARDINALS_8, Compass(), CompassProps, formatBearing(), TICKS, GalleryDialog(), GalleryModal() (+21 more)

### Community 13 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowImportingTsExtensions, isolatedModules, jsx, lib, module, moduleDetection, moduleResolution (+10 more)

### Community 14 - "AmbientAudioController"
Cohesion: 0.07
Nodes (21): AmbientAudioController, BIOME_HAPTIC_PATTERNS, clamp01(), equalPower(), extractRegionName(), FilterBand, REGION_HAPTIC_ACCENTS, smoothBell() (+13 more)

### Community 15 - "osmService.ts"
Cohesion: 0.13
Nodes (18): cacheKey(), fallbackPatch(), formatCoordinates(), GEO_CACHE, loadElevation(), loadOsmPlace(), LocalPoint, MEMORY_CACHE (+10 more)

### Community 16 - "osmSlice.ts"
Cohesion: 0.21
Nodes (13): OsmPlaceData, centroid(), clamp(), createOsmSlice(), createRibbon(), OsmSliceResult, polygonShape(), PlacesController (+5 more)

### Community 17 - "SearchSheet.tsx"
Cohesion: 0.10
Nodes (28): @phosphor-icons/react@2.1.10, @phosphor-icons/react, react, formatCoords(), InfoDrawer(), InfoDrawerProps, parseSearch(), SearchSheet() (+20 more)

### Community 18 - "TopBar.tsx"
Cohesion: 0.21
Nodes (11): AudioVisualizerBar(), AudioVisualizerBarProps, DARK_PALETTE, LIGHT_PALETTE, IconButton(), IconButtonProps, TopBar(), TopBarProps (+3 more)

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
Cohesion: 0.08
Nodes (35): PillNavigation(), WeatherIcon(), PresetKey, TIME_PRESETS, WARNING_STYLE, WeatherWidget(), WeatherWidgetProps, buildLiveForecast() (+27 more)

### Community 36 - "waterize"
Cohesion: 0.40
Nodes (5): applyDissolveToShader(), cascadeize(), flagWindy(), installDissolveShader(), lights()

### Community 37 - "overrides"
Cohesion: 0.50
Nodes (3): overrides, three, workbox-build>glob

### Community 38 - "nativeHost.ts"
Cohesion: 0.31
Nodes (6): detectNativeHost(), hasCinematicHost(), isHost(), NativeCinematicHost, nativeHostUrl(), Window

### Community 39 - "placesScene.ts"
Cohesion: 0.19
Nodes (15): getSiteProfile(), createPlacesScene(), ExplorerInfo, HERO_CAM, HERO_TARGET, bindVolumetricFogUniforms(), createPlacesShaderEnv(), createPlacesVolumetricFogLayer() (+7 more)

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

- **Why does `three` connect `globeScene.ts` to `landmarksB.ts`, `siteAtmosphere.ts`, `primitives.ts`, `weatherData.ts`, `placesSliceBuilders.ts`, `placesScene.ts`, `placesClouds.ts`, `dioramaKit.ts`, `CitylitEngine.ts`, `placesShaders.ts`, `osmSlice.ts`, `shaders.ts`, `package.json`, `dependencies`, `windParticles.ts`, `.constructor`?**
  _High betweenness centrality (0.133) - this node is a cross-community bridge._
- **Should `citylit.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.12648221343873517 - nodes in this community are weakly interconnected._
- **Why does `CitylitEngine` connect `CitylitEngine` to `contact-sheet.ts`, `siteAtmosphere.ts`, `MiniaturePass`, `citylit.ts`, `weatherData.ts`, `App.tsx`, `placesSliceBuilders.ts`, `CitylitEngine.ts`, `motion.ts`, `.showLandmarkImmediate`, `osmSlice.ts`, `TopBar.tsx`, `windParticles.ts`, `.isStudio`?**
  _High betweenness centrality (0.110) - this node is a cross-community bridge._
- **Should `primitives.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05230496453900709 - nodes in this community are weakly interconnected._
- **Why does `AmbientAudioController` connect `AmbientAudioController` to `SearchSheet.tsx`?**
  _High betweenness centrality (0.065) - this node is a cross-community bridge._
- **Should `SettingsModal.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.12 - nodes in this community are weakly interconnected._
- **Should `App.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.0927536231884058 - nodes in this community are weakly interconnected._