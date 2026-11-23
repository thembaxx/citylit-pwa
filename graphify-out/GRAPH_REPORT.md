# Graph Report - citylit-pwa  (2026-11-24)

## Corpus Check
- 168 files · ~407,922 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 10 file(s) not represented in the graph (top: .woff2 4, (none) 2, .css 2)

## Summary
- 1952 nodes · 5712 edges · 85 communities (71 shown, 14 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 204 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `7f2e0490`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- landmarksB.ts
- .resetToDefaultOrientation
- citylit.ts
- PlacesOverlay.tsx
- shaders.ts
- App.tsx
- placesSliceBuilders.ts
- placesShaders.ts
- vehicleLightKit.ts
- dioramaKit.ts
- animalKit.ts
- WeatherWidget.tsx
- CitylitEngine
- compilerOptions
- weatherScene.ts
- osmService.ts
- osmSlice.ts
- LandmarkCard.tsx
- ScaleRulerModal.tsx
- DaylightBirdsController
- PassportModal.tsx
- devDependencies
- package.json
- getSoftTexture
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
- .frame
- ref_node_test
- motion.ts
- overrides
- capture-contact-sheets.mjs
- memory.js
- getSoftTexture
- .frame
- SearchSheet.tsx
- run
- globeScene.ts
- measure-idle-pacing.mjs
- three
- placesInteriors.ts
- qualityBenchmark.ts
- framePacing.ts
- compare-metrics.mjs
- nativeHost.ts
- TopBar.tsx
- weatherScene.ts
- webgpuPostFX.ts
- WebGPUSceneRenderer
- skyEvents.ts
- capture-visual-matrix.mjs
- WebGLSceneRenderer
- .applyPostGrade
- .setQualityIndex
- run
- addWildlifeLayer
- windowLights.ts
- .showLandmarkImmediate
- check-exposure.mjs
- globalIllumination.ts
- tide.test.ts
- contact-sheet.ts
- windParticles.ts
- .constructor
- fitMath.ts
- ref_node_fs
- make-contact-sheet.mjs
- markSharedGeo
- .dispose
- addCraftedRim
- addSiteMotion
- placesScene.ts
- createWebGPUCompat
- landmarkGeometry.ts
- WebGPUPostFX
- webgpuCompat.ts

## God Nodes (most connected - your core abstractions)
1. `CitylitEngine` - 151 edges
2. `add()` - 104 edges
3. `C()` - 83 edges
4. `M()` - 83 edges
5. `CB()` - 71 edges
6. `R()` - 60 edges
7. `mergeByMaterial()` - 59 edges
8. `MStone()` - 58 edges
9. `addStreetLampSet()` - 56 edges
10. `App()` - 53 edges

## Surprising Connections (you probably didn't know these)
- `memoryApiPlugin()` --calls--> `createMemoryMiddleware()`  [EXTRACTED]
  vite.config.ts → server/memory.js
- `AtmosphereSite` --references--> `LandmarkBiome`  [EXTRACTED]
  src/three/siteAtmosphere.ts → src/types/citylit.ts
- `main()` --indirect_call--> `setupEval()`  [INFERRED]
  scripts/capture-visual-matrix.mjs → scripts/capture-contact-sheets.mjs
- `EngineCallbacks` --references--> `PlacesSelectionInfo`  [EXTRACTED]
  src/three/CitylitEngine.ts → src/three/placesScene.ts
- `CompassProps` --references--> `CitylitEngine`  [EXTRACTED]
  src/components/Compass.tsx → src/three/CitylitEngine.ts

## Import Cycles
- None detected.

## Communities (85 total, 14 thin omitted)

### Community 0 - "landmarksB.ts"
Cohesion: 0.06
Nodes (222): headingYaw(), leftLaneOffset(), normalizePlanar(), PlanarVector, registerBeacons(), addAnchor(), addBaseScatter(), addBollards() (+214 more)

### Community 2 - "citylit.ts"
Cohesion: 0.11
Nodes (24): BUILTIN_MIXER_PRESETS, DEFAULT_MIXER, FPS_OPTIONS, MIXER_CHANNELS, MOTION_OPTIONS, QUALITY_OPTIONS, readCustomPresets(), RENDERER_OPTIONS (+16 more)

### Community 3 - "PlacesOverlay.tsx"
Cohesion: 0.09
Nodes (31): EditorialMarkers(), EditorialSources(), MOBILE_WEATHER_ICONS, placeCardCondition(), PlacesOverlay(), PlacesOverlayProps, QUICK_TIMES, WEATHER_MODES (+23 more)

### Community 4 - "shaders.ts"
Cohesion: 0.05
Nodes (61): getUndersideMaterial(), applyDissolveToShader(), cascadeize(), configureTextureQuality(), flagWindy(), getBrushedNormalTexture(), getBrushedRoughnessTexture(), getCanvasBumpTexture() (+53 more)

### Community 5 - "App.tsx"
Cohesion: 0.08
Nodes (47): App(), INITIAL_GLOBE, readInitialLandmarkIndex(), readSettings(), readStoredEggs(), readStoredNotes(), readStoredSavedPlaces(), readStoredSet() (+39 more)

### Community 6 - "placesSliceBuilders.ts"
Cohesion: 0.11
Nodes (35): StreetLampSpec, getGrassMaterial(), treeMaterial(), BESPOKE_INTERIORS, createCutawayWaterTopMaterial(), createCutawayWaterWallMaterial(), createSliceMistMaterial(), CutawayWaterOptions (+27 more)

### Community 7 - "placesShaders.ts"
Cohesion: 0.14
Nodes (20): bindVolumetricFogUniforms(), createStrataTerrainMaterial(), patchPlacesVolumetricFog(), PlacesSliceEmitterSpec, WaterConfluenceSpec, WaterTideSpec, CLOUD_FRAGMENT, CLOUD_VERTEX (+12 more)

### Community 8 - "vehicleLightKit.ts"
Cohesion: 0.16
Nodes (16): getCarHeadlightMat(), getCarPoolMat(), getCarTaillightMat(), createVehicleLightBatch(), ensureLightGeometries(), LightGeometries, markLightMesh(), placeInstance() (+8 more)

### Community 9 - "dioramaKit.ts"
Cohesion: 0.05
Nodes (38): accentFor(), addDioramaClouds(), AnchorKind, CorniceBandSpec, DioramaFx, DoorSurroundSpec, FacadeWindowSpec, FALLBACK_PROFILE (+30 more)

### Community 10 - "animalKit.ts"
Cohesion: 0.08
Nodes (37): WILDLIFE, WildlifeSpot, advanceAnimalTime(), AnimalIdle, AnimalKind, AnimalLodSpec, AnimalMember, AnimalPose (+29 more)

### Community 11 - "WeatherWidget.tsx"
Cohesion: 0.10
Nodes (32): motion, @phosphor-icons/react, ambientAudio, HourlyForecast(), HourlyForecastProps, AnimatedNumber(), AnimatedNumberProps, PillNavigation() (+24 more)

### Community 13 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowImportingTsExtensions, isolatedModules, jsx, lib, module, moduleDetection, moduleResolution (+10 more)

### Community 14 - "weatherScene.ts"
Cohesion: 0.06
Nodes (41): clamp01(), LiveWeatherVisual, liveWeatherVisual(), WEATHER_CONDITIONS, monthToSeasonWeights(), MID_MONTH_DAY, solarDeclination(), southernSunDirection() (+33 more)

### Community 15 - "osmService.ts"
Cohesion: 0.15
Nodes (16): cacheKey(), fallbackPatch(), GEO_CACHE, loadElevation(), loadOsmPlace(), LocalPoint, MEMORY_CACHE, OsmArea (+8 more)

### Community 16 - "osmSlice.ts"
Cohesion: 0.20
Nodes (15): OsmBuilding, centroid(), clamp(), createOsmSlice(), createRibbon(), pointOnRoad(), polygonShape(), readTag() (+7 more)

### Community 17 - "LandmarkCard.tsx"
Cohesion: 0.07
Nodes (34): GalleryDialog(), GalleryModalProps, bodySlideVariants, CAMERA_PRESETS, CARDINALS, getCategoryMeta(), headerSlideVariants, LandmarkCard() (+26 more)

### Community 18 - "ScaleRulerModal.tsx"
Cohesion: 0.12
Nodes (24): barWidth(), REFERENCE_OPTIONS, RulerRow, RulerScale, RulerSort, SCALE_OPTIONS, ScaleRulerModal(), ScaleRulerModalProps (+16 more)

### Community 19 - "DaylightBirdsController"
Cohesion: 0.13
Nodes (13): computeBirdSpawnIntervalSec(), computeFoliageSwayAngle(), computeFoliageWindStrength(), isDaylightForBirds(), BIOME_PALETTES, BirdAgent, BirdPalette, BirdState (+5 more)

### Community 20 - "PassportModal.tsx"
Cohesion: 0.15
Nodes (16): CATEGORY_COLORS, PASSPORT_TABS, PassportModal(), PassportTab, ProvinceRing(), ProvinceRingProps, ProvinceStatRow, StatsTooltip() (+8 more)

### Community 21 - "devDependencies"
Cohesion: 0.40
Nodes (5): devDependencies, playwright@^1.65.1, puppeteer@^25.18.1, playwright, puppeteer

### Community 22 - "package.json"
Cohesion: 0.07
Nodes (41): dependencies, goeist@0.1.0, motion@14.14.0, n8ao@2.1.0, oxfmt@0.79.0, oxlint@1.94.0, pastdotdev@^0.0.1, @phosphor-icons/react@2.1.10 (+33 more)

### Community 23 - "getSoftTexture"
Cohesion: 0.09
Nodes (30): BIOME_FALLBACK, normalizeRuleKey(), REGIONAL_PALETTES, RegionalPalette, RegionalPaletteKey, resolveRegionalPalette(), rule(), SITE_RULES (+22 more)

### Community 24 - "AmbientAudioController"
Cohesion: 0.07
Nodes (22): AmbientAudioController, AnimalAudioEvent, BIOME_HAPTIC_PATTERNS, clamp01(), equalPower(), extractRegionName(), FilterBand, REGION_HAPTIC_ACCENTS (+14 more)

### Community 25 - "server.js"
Cohesion: 0.20
Nodes (6): express@5.3.0, express, app, __dirname, distDir, __filename

### Community 26 - "CitylitEngine.ts"
Cohesion: 0.06
Nodes (38): BeaconAnchor, beaconGeo, collectBeacons(), createBeaconMesh(), LANDMARK_BUILDERS, glowMaterials, resetSceneDynamicLists(), updateWetSurfaces() (+30 more)

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
Cohesion: 0.18
Nodes (23): ALBEDO_CONTRACT, AlbedoAudit, AlbedoBand, auditAlbedo(), auditHeroLuminance(), clamp(), conditionSurfaceHex(), DEFAULT_SATURATION_REDUCTION (+15 more)

### Community 31 - "scripts"
Cohesion: 0.15
Nodes (13): scripts, build, dev, format, format:check, lint, preview, qa:capture (+5 more)

### Community 32 - "applyDioramaUpgrade"
Cohesion: 0.13
Nodes (21): addEdgeWaterfall(), addScaleReference(), addSoaringBirds(), addSquareWaterPlate(), addStandUnderside(), applyDioramaUpgrade(), buildSpatialSources(), finalizeLandmarkGroup() (+13 more)

### Community 33 - "with"
Cohesion: 0.11
Nodes (17): jobs, verify, name, on, pull_request, push, branches, name (+9 more)

### Community 35 - "ref_node_test"
Cohesion: 0.16
Nodes (12): createWebGLRendererSelection(), decideRendererBackend(), GPUCapableNavigator, readRendererPreference(), RendererProbe, selectRenderer(), wantsMsaa(), AnyRenderer (+4 more)

### Community 36 - "motion.ts"
Cohesion: 0.06
Nodes (42): react, react-dom, CARDINAL_TARGETS, CARDINALS_8, Compass(), formatBearing(), TICKS, formatCoords() (+34 more)

### Community 37 - "overrides"
Cohesion: 0.33
Nodes (5): allowBuilds, puppeteer, overrides, three, workbox-build>glob

### Community 38 - "capture-contact-sheets.mjs"
Cohesion: 0.17
Nodes (16): acquirePageTarget(), BASELINE_PATH, captureHour(), CdpSession, checkPerfGuardrails(), HOUR_KEYS, main(), pad() (+8 more)

### Community 39 - "memory.js"
Cohesion: 0.36
Nodes (11): createMemoryMiddleware(), getClient(), HttpError, isTimestamp(), optionalEnum(), optionalInt(), optionalString(), pick() (+3 more)

### Community 40 - "getSoftTexture"
Cohesion: 0.33
Nodes (5): CloudAssets, CloudPuffInstance, createCloudPuffMesh(), createSliceCloudLayer(), SliceCloudLayer

### Community 44 - "SearchSheet.tsx"
Cohesion: 0.09
Nodes (28): GlobeOverlay(), GlobeOverlayProps, SearchSheet(), SearchSheetProps, Menu(), MenuItem, LANDMARK_TAGS, LANDMARKS (+20 more)

### Community 45 - "run"
Cohesion: 0.38
Nodes (5): CDP, i0(), listTargets(), run(), sleep()

### Community 46 - "globeScene.ts"
Cohesion: 0.15
Nodes (25): three, AFRICA_POLYS, ENCLAVE_POLYS, GLOBE_NEIGHBOR_LABELS, GLOBE_PROVINCES, NEIGHBOR_POLYS, PROVINCE_STYLE, ProvinceGlobeEntry (+17 more)

### Community 47 - "measure-idle-pacing.mjs"
Cohesion: 0.14
Nodes (5): cdp, CdpSession, ROOT, server, tab

### Community 48 - "three"
Cohesion: 0.25
Nodes (4): n8ao, N8AOPass, N8AOPassConfiguration, N8AOQualityMode

### Community 49 - "placesInteriors.ts"
Cohesion: 0.09
Nodes (50): buildThemedInterior(), bx(), co(), colonnade(), compactShell(), cy(), emptyMats(), fBench() (+42 more)

### Community 50 - "qualityBenchmark.ts"
Cohesion: 0.14
Nodes (12): BenchmarkConfig, BenchmarkTier, CachedBenchmark, computeFrameStats(), DEFAULT_BENCHMARK_CONFIG, FrameStats, FrameTimeBenchmark, percentile() (+4 more)

### Community 51 - "framePacing.ts"
Cohesion: 0.31
Nodes (8): DEFAULT_QUIET_SECONDS, FramePacingInput, frameThrottleMs(), IDLE_QUIET_MS, IDLE_REDUCED_MS, IDLE_SOFTWARE_MS, stageQuiet(), StageQuietInput

### Community 52 - "compare-metrics.mjs"
Cohesion: 0.18
Nodes (10): after, afterByKey, before, breaches, key(), mean(), pct(), rows (+2 more)

### Community 53 - "nativeHost.ts"
Cohesion: 0.31
Nodes (6): detectNativeHost(), hasCinematicHost(), isHost(), NativeCinematicHost, nativeHostUrl(), Window

### Community 54 - "TopBar.tsx"
Cohesion: 0.14
Nodes (20): AudioVisualizerBarProps, DARK_PALETTE, LIGHT_PALETTE, IconButton(), IconButtonProps, TopBar(), TopBarProps, DURATION (+12 more)

### Community 55 - "weatherScene.ts"
Cohesion: 0.29
Nodes (10): getSeasonMonth(), isSpeciesBlooming(), normalizeMonth(), PLANT_SPECIES, PlantSpecies, PlantSpeciesInfo, SeasonWeights, setSeasonMonth() (+2 more)

### Community 56 - "webgpuPostFX.ts"
Cohesion: 0.11
Nodes (14): createMiniaturePass(), DitherShader, fallbackDepth, MiniatureBlurShader, MiniatureGradeOptions, MiniatureShader, MiniatureTuning, createSceneRenderer() (+6 more)

### Community 58 - "skyEvents.ts"
Cohesion: 0.21
Nodes (15): dayIndex(), daysInMonth(), entryIntensity(), EVENT_PRIORITY, formatWhen(), getSkyEvent(), getUpcomingSkyEvents(), MONTH_LABELS (+7 more)

### Community 59 - "capture-visual-matrix.mjs"
Cohesion: 0.32
Nodes (7): captureState(), Cdp, main(), parseCli(), sampleEval(), sleep(), stateEval()

### Community 63 - "run"
Cohesion: 0.36
Nodes (5): CDP, clickAria(), listTargets(), run(), sleep()

### Community 64 - "addWildlifeLayer"
Cohesion: 0.67
Nodes (3): getAnimalSeasonMonth(), addWildlifeLayer(), appendLayerTargets()

### Community 65 - "windowLights.ts"
Cohesion: 0.23
Nodes (11): bake(), FacadeRecord, facades, hash01(), OCCUPANCY_KEYFRAMES, tmpLit, updateWindowLights(), WindowFacade (+3 more)

### Community 67 - "check-exposure.mjs"
Cohesion: 0.22
Nodes (8): dir, evaluate(), files, pending, send(), target, { values, positionals }, ws

### Community 68 - "globalIllumination.ts"
Cohesion: 0.24
Nodes (9): attachEquirect(), buildProbeData(), Equirect, HORIZ_DIRS, installGI(), probeGrid, probeOrigin, probeSize (+1 more)

### Community 69 - "tide.test.ts"
Cohesion: 0.60
Nodes (4): computeCoastalTideOffset(), TIDE_CENTER_OFFSET, TIDE_HALF_AMPLITUDE, TIDE_WAVE_AMPLITUDE

### Community 70 - "contact-sheet.ts"
Cohesion: 0.25
Nodes (8): build(), engine, grid, hour, params, stage, status, syncButtons()

### Community 71 - "windParticles.ts"
Cohesion: 0.31
Nodes (8): GlobeController, BIOME_PALETTES, createLeafWispTexture(), createWindParticles(), seeded(), WindParticlesController, WindParticlesUpdateOptions, QualityIndex

### Community 73 - "fitMath.ts"
Cohesion: 0.36
Nodes (8): boundsFitPlinth(), clamp(), fitBoundsToPlinth(), PlanarBounds, PLINTH_FRAME_WIDTH, PLINTH_HALF_EXTENT, PLINTH_INNER_HALF_EXTENT, PlinthFit

### Community 74 - "ref_node_fs"
Cohesion: 0.33
Nodes (3): outDir, results, viewports

### Community 75 - "make-contact-sheet.mjs"
Cohesion: 0.53
Nodes (4): delta(), loadStats(), main(), parseCli()

### Community 76 - "markSharedGeo"
Cohesion: 0.18
Nodes (11): addLampWaterReflections(), addWetRoadStreaks(), getLampBulbGeo(), getLampConeGeo(), getLampHaloGeo(), getLampHardwareGeo(), getLampPoolGeo(), getLampReflectionGeo() (+3 more)

### Community 78 - "addCraftedRim"
Cohesion: 0.60
Nodes (5): addCraftedRim(), addSquareRim(), getRimMaterial(), paintRadial(), paintStrata()

### Community 79 - "addSiteMotion"
Cohesion: 0.50
Nodes (4): addSiteMotion(), addWeatherFx(), stream(), normalMapsActive()

### Community 80 - "placesScene.ts"
Cohesion: 0.16
Nodes (16): OsmPlaceData, OsmSliceResult, BespokeInteriorKind, createPlacesScene(), ExplorerInfo, HERO_CAM, HERO_TARGET, PlacesController (+8 more)

### Community 81 - "createWebGPUCompat"
Cohesion: 0.41
Nodes (12): createWebGPUCompat(), convert(), findAlphaUniform(), findColorUniform(), findIntensityUniform(), tryGroundSheen(), tryHorizonRing(), trySkyMaterial() (+4 more)

### Community 82 - "landmarkGeometry.ts"
Cohesion: 0.60
Nodes (3): bridgeStayAnchors(), catenaryArchHeight(), StayAnchor

### Community 85 - "webgpuCompat.ts"
Cohesion: 0.25
Nodes (7): ALPHA_UNIFORMS, COLOR_UNIFORMS, INTENSITY_UNIFORMS, TSLModule, UniformLink, UV_MAP_KEYS, WebGPUModule

## Knowledge Gaps
- **14 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `three` connect `globeScene.ts` to `landmarksB.ts`, `shaders.ts`, `placesSliceBuilders.ts`, `placesShaders.ts`, `vehicleLightKit.ts`, `dioramaKit.ts`, `animalKit.ts`, `weatherScene.ts`, `osmSlice.ts`, `DaylightBirdsController`, `package.json`, `getSoftTexture`, `CitylitEngine.ts`, `ref_node_test`, `getSoftTexture`, `three`, `placesInteriors.ts`, `webgpuPostFX.ts`, `windowLights.ts`, `globalIllumination.ts`, `windParticles.ts`, `placesScene.ts`, `webgpuCompat.ts`?**
  _High betweenness centrality (0.195) - this node is a cross-community bridge._
- **Should `landmarksB.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05918179728797977 - nodes in this community are weakly interconnected._
- **Why does `CitylitEngine` connect `CitylitEngine` to `.resetToDefaultOrientation`, `citylit.ts`, `shaders.ts`, `App.tsx`, `animalKit.ts`, `WeatherWidget.tsx`, `LandmarkCard.tsx`, `ScaleRulerModal.tsx`, `DaylightBirdsController`, `getSoftTexture`, `AmbientAudioController`, `CitylitEngine.ts`, `.frame`, `ref_node_test`, `motion.ts`, `.frame`, `qualityBenchmark.ts`, `framePacing.ts`, `webgpuPostFX.ts`, `.applyPostGrade`, `.setQualityIndex`, `.showLandmarkImmediate`, `contact-sheet.ts`, `windParticles.ts`, `.constructor`, `.dispose`, `placesScene.ts`?**
  _High betweenness centrality (0.102) - this node is a cross-community bridge._
- **Should `citylit.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.10582010582010581 - nodes in this community are weakly interconnected._
- **Why does `puppeteer` connect `devDependencies` to `ref_node_fs`, `package.json`?**
  _High betweenness centrality (0.067) - this node is a cross-community bridge._
- **Should `PlacesOverlay.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.08858858858858859 - nodes in this community are weakly interconnected._
- **Should `shaders.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05480769230769231 - nodes in this community are weakly interconnected._