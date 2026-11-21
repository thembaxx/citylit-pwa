# Graph Report - citylit-pwa  (2026-11-21)

## Corpus Check
- 76 files · ~168,842 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 9 file(s) not represented in the graph (top: .woff2 4, (none) 2, .css 2)

## Summary
- 933 nodes · 2880 edges · 49 communities (39 shown, 10 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 70 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `65aaf10a`
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
- weatherScene.ts
- server.js
- thumbnailCache.ts
- .oxfmtrc.json
- .oxlintrc.json
- vite.config.ts
- globalIllumination.ts
- scripts
- contact-sheet.ts
- with
- placesScene.ts
- citylit.ts
- MiniaturePass
- overrides
- .frame
- PlacesSelectionInfo
- placesClouds.ts
- nativeHost.ts
- oxlint@1.94.0
- recharts
- @types/react@19.3.0
- osmSlice.ts
- @types/react-dom@19.3.0
- @ui-sdk/core@0.1.0-beta.13

## God Nodes (most connected - your core abstractions)
1. `CitylitEngine` - 75 edges
2. `add()` - 69 edges
3. `R()` - 57 edges
4. `M()` - 50 edges
5. `MStone()` - 50 edges
6. `C()` - 50 edges
7. `CB()` - 48 edges
8. `App()` - 37 edges
9. `tree()` - 36 edges
10. `AmbientAudioController` - 36 edges

## Surprising Connections (you probably didn't know these)
- `EngineCallbacks` --references--> `PlacesSelectionInfo`  [EXTRACTED]
  src/three/CitylitEngine.ts → src/three/placesScene.ts
- `CompassProps` --references--> `CitylitEngine`  [EXTRACTED]
  src/components/Compass.tsx → src/three/CitylitEngine.ts
- `CitylitEngine` --references--> `SwayItem`  [EXTRACTED]
  src/three/CitylitEngine.ts → src/three/builders/primitives.ts
- `CitylitEngine` --references--> `WetMaterialEntry`  [EXTRACTED]
  src/three/CitylitEngine.ts → src/three/builders/primitives.ts
- `CitylitEngine` --references--> `GlobeController`  [EXTRACTED]
  src/three/CitylitEngine.ts → src/three/globeScene.ts

## Import Cycles
- None detected.

## Communities (49 total, 10 thin omitted)

### Community 0 - "landmarksB.ts"
Cohesion: 0.16
Nodes (105): addAnchor(), addBaseScatter(), addBollards(), addDeck(), addJetty(), addReedbed(), addWindpump(), anchorGroup() (+97 more)

### Community 1 - "AmbientAudioController"
Cohesion: 0.07
Nodes (21): AmbientAudioController, BIOME_HAPTIC_PATTERNS, clamp01(), equalPower(), extractRegionName(), FilterBand, REGION_HAPTIC_ACCENTS, smoothBell() (+13 more)

### Community 2 - "SettingsModal.tsx"
Cohesion: 0.12
Nodes (23): motion, ambientAudio, PostcardModal(), PostcardModalProps, DEFAULT_MIXER, MIXER_CHANNELS, MOTION_OPTIONS, QUALITY_OPTIONS (+15 more)

### Community 3 - "primitives.ts"
Cohesion: 0.05
Nodes (47): archGeo(), buildTreeGeometry(), buildTreeLodGeometry(), cacheGeo(), capeDutchGableGeo(), contactShadowBatches, contactShadowMaterials, contactShadowMeshes (+39 more)

### Community 4 - "contact-sheet.ts"
Cohesion: 0.22
Nodes (3): resetSceneDynamicLists(), setContactShadowFade(), updateWetSurfaces()

### Community 5 - "App.tsx"
Cohesion: 0.12
Nodes (27): App(), INITIAL_GLOBE, readInitialLandmarkIndex(), readSettings(), readStoredSet(), AudioVisualizerBar(), BootSplash(), BootSplashProps (+19 more)

### Community 6 - "placesSliceBuilders.ts"
Cohesion: 0.14
Nodes (29): getGrassMaterial(), createCloudPuffMesh(), createSliceCloudLayer(), createCutawayWaterTopMaterial(), createCutawayWaterWallMaterial(), createSliceMistMaterial(), CutawayWaterOptions, getOrlandoMuralTexture() (+21 more)

### Community 7 - "placesShaders.ts"
Cohesion: 0.17
Nodes (17): bindVolumetricFogUniforms(), patchPlacesVolumetricFog(), PlacesSliceEmitterSpec, CLOUD_FRAGMENT, CLOUD_VERTEX, NOISE_GLSL, STRATA_COLOR_FRAGMENT, STRATA_FRAG_COMMON (+9 more)

### Community 8 - "GalleryModal.tsx"
Cohesion: 0.10
Nodes (23): GalleryDialog(), GalleryModal(), GalleryModalProps, bodySlideVariants, headerSlideVariants, LandmarkCard(), LandmarkCardProps, SlideCustom (+15 more)

### Community 9 - "dioramaKit.ts"
Cohesion: 0.09
Nodes (35): addCraftedRim(), addDioramaClouds(), addSiteMotion(), addSoaringBirds(), addSquareRim(), addSquareWaterPlate(), addTreeRing(), addWeatherFx() (+27 more)

### Community 10 - "CitylitEngine.ts"
Cohesion: 0.11
Nodes (23): LANDMARK_BUILDERS, glowMaterials, SwayItem, swayItems, WetMaterialEntry, wetMaterials, audioForward, audioRight (+15 more)

### Community 11 - "SearchSheet.tsx"
Cohesion: 0.15
Nodes (16): react, formatCoords(), InfoDrawer(), InfoDrawerProps, Sheet(), SheetProps, SheetSide, UnfoldAccordion() (+8 more)

### Community 12 - "CitylitEngine"
Cohesion: 0.12
Nodes (3): CompassProps, CitylitEngine, QualitySetting

### Community 13 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowImportingTsExtensions, isolatedModules, jsx, lib, module, moduleDetection, moduleResolution (+10 more)

### Community 14 - "siteAtmosphere.ts"
Cohesion: 0.15
Nodes (17): AtmosphereEffect, AtmosphereLayer, AtmosphereProfile, AtmosphereSceneController, AtmosphereUpdateOptions, BIOME_EFFECTS, createAtmosphereScene(), createClothMaterial() (+9 more)

### Community 15 - "osmService.ts"
Cohesion: 0.13
Nodes (19): parseSearch(), SearchSheet(), cacheKey(), fallbackPatch(), GEO_CACHE, geocodePlace(), loadElevation(), loadOsmPlace() (+11 more)

### Community 16 - "PlacesOverlay.tsx"
Cohesion: 0.23
Nodes (11): @phosphor-icons/react, placeCardCondition(), PlacesOverlay(), PlacesOverlayProps, QUICK_TIMES, WEATHER_MODES, ANIMATED_BY_CONDITION, WeatherIcon() (+3 more)

### Community 18 - "motion.ts"
Cohesion: 0.10
Nodes (21): AudioVisualizerBarProps, DARK_PALETTE, LIGHT_PALETTE, Compass(), TICKS, IconButton(), IconButtonProps, TopBar() (+13 more)

### Community 19 - "shaders.ts"
Cohesion: 0.14
Nodes (29): getRoofDirtMap(), MSteel(), applyDissolveToShader(), cascadeize(), getBrushedNormalTexture(), getBrushedRoughnessTexture(), getCanvasBumpTexture(), getCanvasNormalTexture() (+21 more)

### Community 20 - "PassportModal.tsx"
Cohesion: 0.14
Nodes (18): GlobeOverlayProps, PASSPORT_TABS, PassportModal(), PassportModalProps, PassportTab, ProvinceRing(), ProvinceRingProps, ProvinceStatRow (+10 more)

### Community 21 - "package.json"
Cohesion: 0.14
Nodes (13): goeist@0.1.0, oxfmt@0.79.0, typescript@7.0.2, workbox-window@7.4.1, description, name, private, type (+5 more)

### Community 22 - "dependencies"
Cohesion: 0.13
Nodes (15): dependencies, motion@14.14.0, n8ao@2.1.0, @phosphor-icons/react@2.1.10, react@19.3.1, tailwindcss@4.3.5, three@0.187.0, @types/node@^24.0.0 (+7 more)

### Community 23 - "globeScene.ts"
Cohesion: 0.09
Nodes (29): three, AFRICA_POLYS, ENCLAVE_POLYS, GLOBE_NEIGHBOR_LABELS, GLOBE_PROVINCES, NEIGHBOR_POLYS, PROVINCE_STYLE, ProvinceGlobeEntry (+21 more)

### Community 24 - "weatherScene.ts"
Cohesion: 0.22
Nodes (10): clamp01(), LiveWeatherVisual, liveWeatherVisual(), WEATHER_CONDITIONS, SKY_NOISE_GLSL, WU, createWeatherScene(), monthToSeasonWeights() (+2 more)

### Community 25 - "server.js"
Cohesion: 0.20
Nodes (6): express@5.3.0, express, app, __dirname, distDir, __filename

### Community 26 - "thumbnailCache.ts"
Cohesion: 0.60
Nodes (5): getLandmarkSignature(), loadCachedThumbnails(), openThumbDb(), saveCachedThumbnails(), StoredThumbBundle

### Community 27 - ".oxfmtrc.json"
Cohesion: 0.22
Nodes (8): ignorePatterns, printWidth, $schema, semi, singleQuote, tabWidth, trailingComma, useTabs

### Community 28 - ".oxlintrc.json"
Cohesion: 0.22
Nodes (8): categories, correctness, suspicious, ignorePatterns, plugins, rules, react/react-in-jsx-scope, $schema

### Community 29 - "vite.config.ts"
Cohesion: 0.20
Nodes (8): @tailwindcss/vite@4.3.5, vite@8.3.8, vite-plugin-pwa@2.0.0, @vitejs/plugin-react@6.3.0, @tailwindcss/vite, vite, vite-plugin-pwa, @vitejs/plugin-react

### Community 30 - "globalIllumination.ts"
Cohesion: 0.24
Nodes (9): attachEquirect(), buildProbeData(), Equirect, HORIZ_DIRS, installGI(), probeGrid, probeOrigin, probeSize (+1 more)

### Community 31 - "scripts"
Cohesion: 0.22
Nodes (9): scripts, build, dev, format, format:check, lint, preview, start (+1 more)

### Community 32 - "contact-sheet.ts"
Cohesion: 0.25
Nodes (8): build(), engine, grid, hour, params, stage, status, syncButtons()

### Community 33 - "with"
Cohesion: 0.11
Nodes (17): jobs, verify, name, on, pull_request, push, branches, name (+9 more)

### Community 34 - "placesScene.ts"
Cohesion: 0.20
Nodes (14): createPlacesScene(), ExplorerInfo, HERO_CAM, HERO_TARGET, createPlacesShaderEnv(), createPlacesVolumetricFogLayer(), createPlacesWeatherParticles(), createSliceCloudMaterial() (+6 more)

### Community 35 - "citylit.ts"
Cohesion: 0.10
Nodes (28): PresetKey, TIME_PRESETS, WARNING_STYLE, WeatherWidget(), WeatherWidgetProps, buildLiveForecast(), conditionFromCode(), ExtremeWeatherWarning (+20 more)

### Community 37 - "overrides"
Cohesion: 0.50
Nodes (3): overrides, three, workbox-build>glob

### Community 40 - "placesClouds.ts"
Cohesion: 0.50
Nodes (3): CloudAssets, CloudPuffInstance, SliceCloudLayer

### Community 41 - "nativeHost.ts"
Cohesion: 0.31
Nodes (6): detectNativeHost(), hasCinematicHost(), isHost(), NativeCinematicHost, nativeHostUrl(), Window

### Community 46 - "osmSlice.ts"
Cohesion: 0.17
Nodes (15): LocalPoint, OsmArea, OsmPlaceData, centroid(), clamp(), createOsmSlice(), createRibbon(), OsmSliceResult (+7 more)

## Knowledge Gaps
- **10 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `three` connect `globeScene.ts` to `landmarksB.ts`, `placesScene.ts`, `primitives.ts`, `placesSliceBuilders.ts`, `placesShaders.ts`, `placesClouds.ts`, `dioramaKit.ts`, `CitylitEngine.ts`, `osmSlice.ts`, `siteAtmosphere.ts`, `shaders.ts`, `package.json`, `dependencies`, `weatherScene.ts`, `globalIllumination.ts`?**
  _High betweenness centrality (0.133) - this node is a cross-community bridge._
- **Should `AmbientAudioController` be split into smaller, more focused modules?**
  _Cohesion score 0.0734006734006734 - nodes in this community are weakly interconnected._
- **Why does `CitylitEngine` connect `CitylitEngine` to `contact-sheet.ts`, `landmarksB.ts`, `citylit.ts`, `contact-sheet.ts`, `App.tsx`, `MiniaturePass`, `.frame`, `PlacesSelectionInfo`, `CitylitEngine.ts`, `osmSlice.ts`, `siteAtmosphere.ts`, `motion.ts`?**
  _High betweenness centrality (0.099) - this node is a cross-community bridge._
- **Should `SettingsModal.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.1206896551724138 - nodes in this community are weakly interconnected._
- **Should `primitives.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05230496453900709 - nodes in this community are weakly interconnected._
- **Should `App.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.11587301587301588 - nodes in this community are weakly interconnected._
- **Should `placesSliceBuilders.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.14022988505747128 - nodes in this community are weakly interconnected._