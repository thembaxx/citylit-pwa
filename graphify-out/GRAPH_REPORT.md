# Graph Report - citylit-pwa  (2026-11-23)

## Corpus Check
- 148 files · ~339,658 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 10 file(s) not represented in the graph (top: .woff2 4, (none) 2, .css 2)

## Summary
- 1798 nodes · 5373 edges · 63 communities (58 shown, 5 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 192 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `e5b288e9`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- landmarksB.ts
- primitives.ts
- citylit.ts
- windowLights.ts
- PlacesOverlay.tsx
- App.tsx
- placesSliceBuilders.ts
- placesShaders.ts
- TopBar.tsx
- dioramaKit.ts
- animalKit.ts
- WeatherWidget.tsx
- CitylitEngine
- compilerOptions
- motion.ts
- osmService.ts
- placesScene.ts
- LandmarkCard.tsx
- ScaleRulerModal.tsx
- DaylightBirdsController
- PassportModal.tsx
- devDependencies
- package.json
- globeScene.ts
- AmbientAudioController
- server.js
- CitylitEngine.ts
- .oxfmtrc.json
- .oxlintrc.json
- vite.config.ts
- albedoAudit.ts
- scripts
- applyDioramaUpgrade
- with
- mediaService.ts
- three
- .updateSpatial
- overrides
- capture-contact-sheets.mjs
- memory.js
- placesClouds.ts
- .frame
- siteAtmosphere.ts
- run
- contact-sheet.ts
- fitMath.ts
- vehicleLightKit.ts
- placesInteriors.ts
- qualityBenchmark.ts
- prepareCanvasTexture
- nativeHost.ts
- n8ao.d.ts
- weatherScene.ts
- WebGPUSceneRenderer
- skyEvents.ts
- WebGLSceneRenderer
- LandmarkBiome
- ambientAudio.ts
- .constructor
- tide.test.ts

## God Nodes (most connected - your core abstractions)
1. `CitylitEngine` - 147 edges
2. `add()` - 102 edges
3. `C()` - 81 edges
4. `M()` - 81 edges
5. `CB()` - 71 edges
6. `R()` - 60 edges
7. `mergeByMaterial()` - 57 edges
8. `MStone()` - 57 edges
9. `addStreetLampSet()` - 56 edges
10. `App()` - 53 edges

## Surprising Connections (you probably didn't know these)
- `memoryApiPlugin()` --calls--> `createMemoryMiddleware()`  [EXTRACTED]
  vite.config.ts → server/memory.js
- `CompassProps` --references--> `CitylitEngine`  [EXTRACTED]
  src/components/Compass.tsx → src/three/CitylitEngine.ts
- `EngineCallbacks` --references--> `PlacesSelectionInfo`  [EXTRACTED]
  src/three/CitylitEngine.ts → src/three/placesScene.ts
- `CitylitEngine` --references--> `FrameTimeBenchmark`  [EXTRACTED]
  src/three/CitylitEngine.ts → src/lib/qualityBenchmark.ts
- `CitylitEngine` --references--> `SwayItem`  [EXTRACTED]
  src/three/CitylitEngine.ts → src/three/builders/primitives.ts

## Import Cycles
- None detected.

## Communities (63 total, 5 thin omitted)

### Community 0 - "landmarksB.ts"
Cohesion: 0.09
Nodes (166): headingYaw(), leftLaneOffset(), normalizePlanar(), PlanarVector, registerBeacons(), addAnchor(), addBaseScatter(), addBollards() (+158 more)

### Community 1 - "primitives.ts"
Cohesion: 0.04
Nodes (60): archGeo(), buildTreeGeometry(), buildTreeLodGeometry(), cableDir, cableEnd, cableMid, cableStart, cableUp (+52 more)

### Community 2 - "citylit.ts"
Cohesion: 0.09
Nodes (28): ScaleRulerModalProps, BUILTIN_MIXER_PRESETS, DEFAULT_MIXER, MIXER_CHANNELS, MOTION_OPTIONS, QUALITY_OPTIONS, readCustomPresets(), RENDERER_OPTIONS (+20 more)

### Community 3 - "windowLights.ts"
Cohesion: 0.18
Nodes (14): windowPaneMaterial(), interiorParallaxShader(), bake(), createWindowFacade(), FacadeRecord, facades, hash01(), OCCUPANCY_KEYFRAMES (+6 more)

### Community 4 - "PlacesOverlay.tsx"
Cohesion: 0.11
Nodes (32): GlobeOverlay(), GlobeOverlayProps, MOBILE_WEATHER_ICONS, placeCardCondition(), PlacesOverlay(), PlacesOverlayProps, QUICK_TIMES, WEATHER_MODES (+24 more)

### Community 5 - "App.tsx"
Cohesion: 0.09
Nodes (33): react-dom, App(), INITIAL_GLOBE, readInitialLandmarkIndex(), readSettings(), readStoredEggs(), readStoredNotes(), readStoredSavedPlaces() (+25 more)

### Community 6 - "placesSliceBuilders.ts"
Cohesion: 0.11
Nodes (33): BESPOKE_INTERIORS, BespokeInteriorContext, createCutawayWaterTopMaterial(), createCutawayWaterWallMaterial(), createSliceMistMaterial(), CutawayWaterOptions, getOrlandoMuralTexture(), PlacesShaderEnvironment (+25 more)

### Community 7 - "placesShaders.ts"
Cohesion: 0.13
Nodes (22): bindVolumetricFogUniforms(), createStrataTerrainMaterial(), patchPlacesVolumetricFog(), PlacesSliceEmitterSpec, WaterConfluenceSpec, WaterTideSpec, CLOUD_FRAGMENT, CLOUD_VERTEX (+14 more)

### Community 8 - "TopBar.tsx"
Cohesion: 0.17
Nodes (16): AudioVisualizerBar(), AudioVisualizerBarProps, DARK_PALETTE, LIGHT_PALETTE, TopBarProps, DAYLIGHT_END_HOUR, DAYLIGHT_START_HOUR, msUntilNextThemeBoundary() (+8 more)

### Community 9 - "dioramaKit.ts"
Cohesion: 0.05
Nodes (56): getAnimalSeasonMonth(), accentFor(), addCraftedRim(), addDioramaClouds(), addLampWaterReflections(), addSquareRim(), addWetRoadStreaks(), addWildlifeLayer() (+48 more)

### Community 10 - "animalKit.ts"
Cohesion: 0.07
Nodes (40): IDLES, KINDS, SEASONS, WILDLIFE, WildlifeSpot, advanceAnimalTime(), AnimalIdle, AnimalKind (+32 more)

### Community 11 - "WeatherWidget.tsx"
Cohesion: 0.06
Nodes (49): HourlyForecast(), HourlyForecastProps, ANIMATED_BY_CONDITION, WeatherIcon(), WeatherIconCondition, WeatherIconProps, pad2(), PresetKey (+41 more)

### Community 12 - "CitylitEngine"
Cohesion: 0.07
Nodes (4): setContactShadowFade(), CitylitEngine, fitDioramaShadowBounds(), NoteCategory

### Community 13 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowImportingTsExtensions, isolatedModules, jsx, lib, module, moduleDetection, moduleResolution (+10 more)

### Community 14 - "motion.ts"
Cohesion: 0.06
Nodes (61): motion, @phosphor-icons/react, react, ambientAudio, CARDINAL_TARGETS, CARDINALS_8, Compass(), CompassProps (+53 more)

### Community 15 - "osmService.ts"
Cohesion: 0.14
Nodes (17): cacheKey(), fallbackPatch(), GEO_CACHE, loadElevation(), loadOsmPlace(), LocalPoint, MEMORY_CACHE, OsmArea (+9 more)

### Community 16 - "placesScene.ts"
Cohesion: 0.12
Nodes (28): OsmPlaceData, StreetLampSpec, centroid(), clamp(), createOsmSlice(), createRibbon(), OsmSliceResult, pointOnRoad() (+20 more)

### Community 17 - "LandmarkCard.tsx"
Cohesion: 0.10
Nodes (21): GalleryDialog(), bodySlideVariants, CAMERA_PRESETS, CARDINALS, getCategoryMeta(), headerSlideVariants, LandmarkCard(), LandmarkCardProps (+13 more)

### Community 18 - "ScaleRulerModal.tsx"
Cohesion: 0.13
Nodes (16): formatMetres(), REFERENCE_HEIGHTS, referenceHeightM(), SCALE_FACTS, ScaleFact, ScaleMeasure, scaleRatio(), getWeatherMoment() (+8 more)

### Community 19 - "DaylightBirdsController"
Cohesion: 0.13
Nodes (13): computeBirdSpawnIntervalSec(), computeFoliageSwayAngle(), computeFoliageWindStrength(), isDaylightForBirds(), BIOME_PALETTES, BirdAgent, BirdPalette, BirdState (+5 more)

### Community 20 - "PassportModal.tsx"
Cohesion: 0.14
Nodes (17): CATEGORY_COLORS, PASSPORT_TABS, PassportModal(), PassportTab, ProvinceRing(), ProvinceRingProps, ProvinceStatRow, StatsTooltip() (+9 more)

### Community 21 - "devDependencies"
Cohesion: 0.40
Nodes (5): devDependencies, playwright@^1.65.1, puppeteer@^25.18.1, playwright, puppeteer

### Community 22 - "package.json"
Cohesion: 0.07
Nodes (41): dependencies, goeist@0.1.0, motion@14.14.0, n8ao@2.1.0, oxfmt@0.79.0, oxlint@1.94.0, pastdotdev@^0.0.1, @phosphor-icons/react@2.1.10 (+33 more)

### Community 23 - "globeScene.ts"
Cohesion: 0.06
Nodes (52): AFRICA_POLYS, ENCLAVE_POLYS, GLOBE_NEIGHBOR_LABELS, GLOBE_PROVINCES, NEIGHBOR_POLYS, PROVINCE_STYLE, ProvinceGlobeEntry, GEO_AFRICA (+44 more)

### Community 25 - "server.js"
Cohesion: 0.20
Nodes (6): express@5.3.0, express, app, __dirname, distDir, __filename

### Community 26 - "CitylitEngine.ts"
Cohesion: 0.07
Nodes (37): BeaconAnchor, beaconGeo, collectBeacons(), createBeaconMesh(), LANDMARK_BUILDERS, audioForward, audioRight, compassDir (+29 more)

### Community 27 - ".oxfmtrc.json"
Cohesion: 0.22
Nodes (8): ignorePatterns, printWidth, $schema, semi, singleQuote, tabWidth, trailingComma, useTabs

### Community 28 - ".oxlintrc.json"
Cohesion: 0.22
Nodes (8): categories, correctness, suspicious, ignorePatterns, plugins, rules, react/react-in-jsx-scope, $schema

### Community 29 - "vite.config.ts"
Cohesion: 0.18
Nodes (9): @tailwindcss/vite@4.3.5, vite@8.3.8, vite-plugin-pwa@2.0.0, @vitejs/plugin-react@6.3.0, @tailwindcss/vite, vite, vite-plugin-pwa, @vitejs/plugin-react (+1 more)

### Community 30 - "albedoAudit.ts"
Cohesion: 0.19
Nodes (21): ALBEDO_CONTRACT, AlbedoAudit, AlbedoBand, auditAlbedo(), auditHeroLuminance(), clamp(), DEFAULT_SATURATION_REDUCTION, HeroLuminanceAudit (+13 more)

### Community 31 - "scripts"
Cohesion: 0.15
Nodes (13): scripts, build, dev, format, format:check, lint, preview, qa:capture (+5 more)

### Community 32 - "applyDioramaUpgrade"
Cohesion: 0.10
Nodes (21): addEdgeWaterfall(), addScaleReference(), addSiteMotion(), addSoaringBirds(), addSquareWaterPlate(), addStandUnderside(), addWeatherFx(), applyDioramaUpgrade() (+13 more)

### Community 33 - "with"
Cohesion: 0.11
Nodes (17): jobs, verify, name, on, pull_request, push, branches, name (+9 more)

### Community 34 - "mediaService.ts"
Cohesion: 0.21
Nodes (10): GalleryModalProps, cleanCaption(), CommonsImageInfo, CommonsPage, loadLandmarkMedia(), MEDIA_CACHE, stripHtml(), SUMMARY_CACHE (+2 more)

### Community 35 - "three"
Cohesion: 0.09
Nodes (25): three, GRADE_GUARDRAILS, createDitherPass(), createMiniaturePass(), DitherShader, fallbackDepth, MiniatureGradeOptions, MiniatureShader (+17 more)

### Community 36 - ".updateSpatial"
Cohesion: 0.27
Nodes (4): clamp01(), equalPower(), smoothBell(), smoothstep()

### Community 37 - "overrides"
Cohesion: 0.33
Nodes (5): allowBuilds, puppeteer, overrides, three, workbox-build>glob

### Community 38 - "capture-contact-sheets.mjs"
Cohesion: 0.08
Nodes (24): CDP, clickAria(), listTargets(), run(), sleep(), acquirePageTarget(), BASELINE_PATH, captureHour() (+16 more)

### Community 39 - "memory.js"
Cohesion: 0.36
Nodes (11): createMemoryMiddleware(), getClient(), HttpError, isTimestamp(), optionalEnum(), optionalInt(), optionalString(), pick() (+3 more)

### Community 40 - "placesClouds.ts"
Cohesion: 0.33
Nodes (5): CloudAssets, CloudPuffInstance, createCloudPuffMesh(), createSliceCloudLayer(), SliceCloudLayer

### Community 42 - ".frame"
Cohesion: 0.06
Nodes (4): SwayItem, WetMaterialEntry, MiniaturePass, SceneRenderer

### Community 44 - "siteAtmosphere.ts"
Cohesion: 0.15
Nodes (16): SKY_NOISE_GLSL, AtmosphereEffect, AtmosphereLayer, AtmosphereProfile, AtmosphereSceneController, AtmosphereUpdateOptions, BIOME_EFFECTS, createAtmosphereScene() (+8 more)

### Community 45 - "run"
Cohesion: 0.38
Nodes (5): CDP, i0(), listTargets(), run(), sleep()

### Community 46 - "contact-sheet.ts"
Cohesion: 0.25
Nodes (8): build(), engine, grid, hour, params, stage, status, syncButtons()

### Community 47 - "fitMath.ts"
Cohesion: 0.33
Nodes (8): boundsFitPlinth(), clamp(), fitBoundsToPlinth(), PlanarBounds, PLINTH_FRAME_WIDTH, PLINTH_HALF_EXTENT, PLINTH_INNER_HALF_EXTENT, PlinthFit

### Community 48 - "vehicleLightKit.ts"
Cohesion: 0.16
Nodes (16): getCarHeadlightMat(), getCarPoolMat(), getCarTaillightMat(), createVehicleLightBatch(), ensureLightGeometries(), LightGeometries, markLightMesh(), placeInstance() (+8 more)

### Community 49 - "placesInteriors.ts"
Cohesion: 0.09
Nodes (50): buildThemedInterior(), bx(), co(), colonnade(), compactShell(), cy(), emptyMats(), fBench() (+42 more)

### Community 50 - "qualityBenchmark.ts"
Cohesion: 0.09
Nodes (13): BenchmarkConfig, BenchmarkTier, CachedBenchmark, computeFrameStats(), DEFAULT_BENCHMARK_CONFIG, FrameStats, FrameTimeBenchmark, percentile() (+5 more)

### Community 51 - "prepareCanvasTexture"
Cohesion: 0.12
Nodes (30): applyDissolveToShader(), cascadeize(), configureTextureQuality(), flagWindy(), getBrushedNormalTexture(), getBrushedRoughnessTexture(), getCanvasBumpTexture(), getCanvasNormalTexture() (+22 more)

### Community 53 - "nativeHost.ts"
Cohesion: 0.31
Nodes (6): detectNativeHost(), hasCinematicHost(), isHost(), NativeCinematicHost, nativeHostUrl(), Window

### Community 54 - "n8ao.d.ts"
Cohesion: 0.25
Nodes (4): n8ao, N8AOPass, N8AOPassConfiguration, N8AOQualityMode

### Community 55 - "weatherScene.ts"
Cohesion: 0.33
Nodes (9): getSeasonMonth(), isSpeciesBlooming(), normalizeMonth(), PLANT_SPECIES, PlantSpecies, PlantSpeciesInfo, setSeasonMonth(), addTreeRing() (+1 more)

### Community 57 - "WebGPUSceneRenderer"
Cohesion: 0.05
Nodes (23): WebGPUSceneRenderer, ALPHA_UNIFORMS, COLOR_UNIFORMS, createWebGPUCompat(), convert(), findAlphaUniform(), findColorUniform(), findIntensityUniform() (+15 more)

### Community 58 - "skyEvents.ts"
Cohesion: 0.21
Nodes (15): dayIndex(), daysInMonth(), entryIntensity(), EVENT_PRIORITY, formatWhen(), getSkyEvent(), getUpcomingSkyEvents(), MONTH_LABELS (+7 more)

### Community 61 - "LandmarkBiome"
Cohesion: 0.29
Nodes (6): extractRegionName(), SiteProfile, HorizonSceneryController, AtmosphereSite, AmbientSiteProfile, LandmarkBiome

### Community 63 - "ambientAudio.ts"
Cohesion: 0.15
Nodes (12): AnimalAudioEvent, BIOME_HAPTIC_PATTERNS, FilterBand, REGION_HAPTIC_ACCENTS, SpatialEmitter, SpatialListener, UI_CUE_CATEGORY, UiCueCategory (+4 more)

### Community 64 - ".constructor"
Cohesion: 0.07
Nodes (27): attachEquirect(), buildProbeData(), Equirect, HORIZ_DIRS, installGI(), probeGrid, probeOrigin, probeSize (+19 more)

### Community 73 - "tide.test.ts"
Cohesion: 0.60
Nodes (4): computeCoastalTideOffset(), TIDE_CENTER_OFFSET, TIDE_HALF_AMPLITUDE, TIDE_WAVE_AMPLITUDE

## Knowledge Gaps
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `three` connect `three` to `landmarksB.ts`, `primitives.ts`, `windowLights.ts`, `placesSliceBuilders.ts`, `placesShaders.ts`, `dioramaKit.ts`, `animalKit.ts`, `WeatherWidget.tsx`, `placesScene.ts`, `DaylightBirdsController`, `package.json`, `globeScene.ts`, `CitylitEngine.ts`, `placesClouds.ts`, `siteAtmosphere.ts`, `vehicleLightKit.ts`, `placesInteriors.ts`, `prepareCanvasTexture`, `n8ao.d.ts`, `WebGPUSceneRenderer`, `.constructor`?**
  _High betweenness centrality (0.181) - this node is a cross-community bridge._
- **Should `landmarksB.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.09494324045407637 - nodes in this community are weakly interconnected._
- **Why does `CitylitEngine` connect `CitylitEngine` to `.constructor`, `citylit.ts`, `three`, `App.tsx`, `.frame`, `WeatherWidget.tsx`, `animalKit.ts`, `siteAtmosphere.ts`, `contact-sheet.ts`, `motion.ts`, `fitMath.ts`, `placesScene.ts`, `qualityBenchmark.ts`, `DaylightBirdsController`, `globeScene.ts`, `CitylitEngine.ts`, `LandmarkBiome`?**
  _High betweenness centrality (0.123) - this node is a cross-community bridge._
- **Should `primitives.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.03913273400317292 - nodes in this community are weakly interconnected._
- **Why does `SceneRenderer` connect `.frame` to `three`, `CitylitEngine`, `qualityBenchmark.ts`, `WebGPUSceneRenderer`, `CitylitEngine.ts`, `WebGLSceneRenderer`?**
  _High betweenness centrality (0.044) - this node is a cross-community bridge._
- **Should `citylit.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.0907258064516129 - nodes in this community are weakly interconnected._
- **Should `PlacesOverlay.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.10953058321479374 - nodes in this community are weakly interconnected._