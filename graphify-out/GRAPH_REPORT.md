# Graph Report - citylit-pwa  (2026-11-24)

## Corpus Check
- 168 files · ~406,163 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 10 file(s) not represented in the graph (top: .woff2 4, (none) 2, .css 2)

## Summary
- 1948 nodes · 5702 edges · 86 communities (76 shown, 10 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 204 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `475a34d5`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- landmarksB.ts
- .resetToDefaultOrientation
- citylit.ts
- placeEditorial.ts
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
- weatherScene.ts
- weatherScene.ts
- webgpuPostFX.ts
- WebGPUSceneRenderer
- skyEvents.ts
- capture-visual-matrix.mjs
- WebGLSceneRenderer
- .setQualityIndex
- PlacesOverlay.tsx
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
- siteAtmosphere.ts
- addCraftedRim
- addSiteMotion
- placesScene.ts
- createWebGPUCompat
- ref_node_assert
- timePresets.ts
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
- `CitylitEngine` --references--> `HorizonSceneryController`  [EXTRACTED]
  src/three/CitylitEngine.ts → src/three/horizonScenery.ts
- `WebGLSceneRenderer` --implements--> `SceneRenderer`  [EXTRACTED]
  src/three/renderer/SceneRenderer.ts → src/three/renderer/types.ts

## Import Cycles
- None detected.

## Communities (86 total, 10 thin omitted)

### Community 0 - "landmarksB.ts"
Cohesion: 0.06
Nodes (222): headingYaw(), leftLaneOffset(), normalizePlanar(), PlanarVector, registerBeacons(), addAnchor(), addBaseScatter(), addBollards() (+214 more)

### Community 2 - "citylit.ts"
Cohesion: 0.06
Nodes (38): motion, ambientAudio, AnimalAudioEvent, BIOME_HAPTIC_PATTERNS, FilterBand, REGION_HAPTIC_ACCENTS, SpatialEmitter, SpatialListener (+30 more)

### Community 3 - "placeEditorial.ts"
Cohesion: 0.18
Nodes (14): LANDMARK_DETAILS, LandmarkDetail, CATEGORY_LABEL, ExplorerEditorialInput, firstSentence(), HIGHLIGHT_COLORS, HIGHLIGHT_FOCUS, PlaceHighlight (+6 more)

### Community 4 - "shaders.ts"
Cohesion: 0.09
Nodes (42): applyDissolveToShader(), cascadeize(), configureTextureQuality(), flagWindy(), getBrushedNormalTexture(), getBrushedRoughnessTexture(), getCanvasBumpTexture(), getCanvasNormalTexture() (+34 more)

### Community 5 - "App.tsx"
Cohesion: 0.08
Nodes (47): App(), INITIAL_GLOBE, readInitialLandmarkIndex(), readSettings(), readStoredEggs(), readStoredNotes(), readStoredSavedPlaces(), readStoredSet() (+39 more)

### Community 6 - "placesSliceBuilders.ts"
Cohesion: 0.11
Nodes (37): getGrassMaterial(), treeMaterial(), createCloudPuffMesh(), createSliceCloudLayer(), BESPOKE_INTERIORS, createCutawayWaterTopMaterial(), createCutawayWaterWallMaterial(), createSliceMistMaterial() (+29 more)

### Community 7 - "placesShaders.ts"
Cohesion: 0.14
Nodes (19): PlacesSliceEmitterSpec, WaterConfluenceSpec, WaterTideSpec, CLOUD_FRAGMENT, CLOUD_VERTEX, NOISE_GLSL, SEASON_MORPH_GLSL, SEASON_UNIFORMS_GLSL (+11 more)

### Community 8 - "vehicleLightKit.ts"
Cohesion: 0.16
Nodes (16): getCarHeadlightMat(), getCarPoolMat(), getCarTaillightMat(), createVehicleLightBatch(), ensureLightGeometries(), LightGeometries, markLightMesh(), placeInstance() (+8 more)

### Community 9 - "dioramaKit.ts"
Cohesion: 0.05
Nodes (37): accentFor(), addDioramaClouds(), AnchorKind, CorniceBandSpec, DioramaFx, DoorSurroundSpec, FacadeWindowSpec, FALLBACK_PROFILE (+29 more)

### Community 10 - "animalKit.ts"
Cohesion: 0.08
Nodes (37): WILDLIFE, WildlifeSpot, advanceAnimalTime(), AnimalIdle, AnimalKind, AnimalLodSpec, AnimalMember, AnimalPose (+29 more)

### Community 11 - "WeatherWidget.tsx"
Cohesion: 0.07
Nodes (45): HourlyForecast(), HourlyForecastProps, pad2(), PRESET_ICONS, PresetKey, SKY_EVENT_ICON, TIME_PRESETS, WARNING_STYLE (+37 more)

### Community 13 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowImportingTsExtensions, isolatedModules, jsx, lib, module, moduleDetection, moduleResolution (+10 more)

### Community 14 - "weatherScene.ts"
Cohesion: 0.08
Nodes (27): AUTO_EXPOSURE_ADAPT_RATE, BIOME_BOUNCE_COLORS, bounceDayTmp, bounceMixTmp, bounceNightTmp, configureDioramaShadow(), createBounceLight(), createRimLight() (+19 more)

### Community 15 - "osmService.ts"
Cohesion: 0.14
Nodes (17): cacheKey(), fallbackPatch(), GEO_CACHE, loadElevation(), loadOsmPlace(), LocalPoint, MEMORY_CACHE, OsmArea (+9 more)

### Community 16 - "osmSlice.ts"
Cohesion: 0.18
Nodes (17): StreetLampSpec, centroid(), clamp(), createOsmSlice(), createRibbon(), OsmSliceResult, pointOnRoad(), polygonShape() (+9 more)

### Community 17 - "LandmarkCard.tsx"
Cohesion: 0.07
Nodes (38): GalleryDialog(), GalleryModalProps, bodySlideVariants, CAMERA_PRESETS, CARDINALS, getCategoryMeta(), headerSlideVariants, LandmarkCard() (+30 more)

### Community 18 - "ScaleRulerModal.tsx"
Cohesion: 0.24
Nodes (11): formatMetres(), REFERENCE_HEIGHTS, referenceHeightM(), SCALE_FACTS, ScaleFact, ScaleMeasure, scaleRatio(), MAX_REFERENCE_UNITS (+3 more)

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
Cohesion: 0.43
Nodes (6): BiomeWeights, createHorizonRing(), createHorizonScenery(), HorizonUpdateOptions, weightsForBiome(), getSoftTexture()

### Community 24 - "AmbientAudioController"
Cohesion: 0.06
Nodes (30): AmbientAudioController, clamp01(), equalPower(), extractRegionName(), smoothBell(), smoothstep(), BIOME_FALLBACK, normalizeRuleKey() (+22 more)

### Community 25 - "server.js"
Cohesion: 0.20
Nodes (6): express@5.3.0, express, app, __dirname, distDir, __filename

### Community 26 - "CitylitEngine.ts"
Cohesion: 0.06
Nodes (36): BeaconAnchor, beaconGeo, collectBeacons(), createBeaconMesh(), LANDMARK_BUILDERS, glowMaterials, resetSceneDynamicLists(), swayItems (+28 more)

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
Nodes (22): addEdgeWaterfall(), addScaleReference(), addSoaringBirds(), addSquareWaterPlate(), addStandUnderside(), applyDioramaUpgrade(), buildSpatialSources(), finalizeLandmarkGroup() (+14 more)

### Community 33 - "with"
Cohesion: 0.11
Nodes (17): jobs, verify, name, on, pull_request, push, branches, name (+9 more)

### Community 34 - ".frame"
Cohesion: 0.13
Nodes (3): setContactShadowFade(), streetLampNightFactor(), sunAltitudeDeg()

### Community 35 - "ref_node_test"
Cohesion: 0.16
Nodes (12): createWebGLRendererSelection(), decideRendererBackend(), GPUCapableNavigator, readRendererPreference(), RendererProbe, selectRenderer(), wantsMsaa(), AnyRenderer (+4 more)

### Community 36 - "motion.ts"
Cohesion: 0.05
Nodes (55): react, react-dom, CARDINAL_TARGETS, CARDINALS_8, Compass(), formatBearing(), TICKS, formatCoords() (+47 more)

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
Cohesion: 0.40
Nodes (3): CloudAssets, CloudPuffInstance, SliceCloudLayer

### Community 44 - "SearchSheet.tsx"
Cohesion: 0.14
Nodes (22): GlobeOverlayProps, SearchSheet(), SearchSheetProps, LANDMARK_TAGS, LANDMARKS, PROVINCES, BeforeInstallPromptEvent, usePWAInstall() (+14 more)

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
Cohesion: 0.15
Nodes (11): BenchmarkConfig, BenchmarkTier, CachedBenchmark, computeFrameStats(), DEFAULT_BENCHMARK_CONFIG, FrameStats, FrameTimeBenchmark, percentile() (+3 more)

### Community 51 - "framePacing.ts"
Cohesion: 0.31
Nodes (8): DEFAULT_QUIET_SECONDS, FramePacingInput, frameThrottleMs(), IDLE_QUIET_MS, IDLE_REDUCED_MS, IDLE_SOFTWARE_MS, stageQuiet(), StageQuietInput

### Community 52 - "compare-metrics.mjs"
Cohesion: 0.18
Nodes (10): after, afterByKey, before, breaches, key(), mean(), pct(), rows (+2 more)

### Community 53 - "nativeHost.ts"
Cohesion: 0.31
Nodes (6): detectNativeHost(), hasCinematicHost(), isHost(), NativeCinematicHost, nativeHostUrl(), Window

### Community 54 - "weatherScene.ts"
Cohesion: 0.16
Nodes (16): clamp01(), LiveWeatherVisual, liveWeatherVisual(), WEATHER_CONDITIONS, monthToSeasonWeights(), MID_MONTH_DAY, solarDeclination(), southernSunDirection() (+8 more)

### Community 55 - "weatherScene.ts"
Cohesion: 0.29
Nodes (10): getSeasonMonth(), isSpeciesBlooming(), normalizeMonth(), PLANT_SPECIES, PlantSpecies, PlantSpeciesInfo, SeasonWeights, setSeasonMonth() (+2 more)

### Community 56 - "webgpuPostFX.ts"
Cohesion: 0.11
Nodes (14): createMiniaturePass(), DitherShader, fallbackDepth, MiniatureBlurShader, MiniatureGradeOptions, MiniatureShader, MiniatureTuning, createSceneRenderer() (+6 more)

### Community 58 - "skyEvents.ts"
Cohesion: 0.23
Nodes (14): dayIndex(), daysInMonth(), entryIntensity(), EVENT_PRIORITY, formatWhen(), getSkyEvent(), getUpcomingSkyEvents(), MONTH_LABELS (+6 more)

### Community 59 - "capture-visual-matrix.mjs"
Cohesion: 0.32
Nodes (7): captureState(), Cdp, main(), parseCli(), sampleEval(), sleep(), stateEval()

### Community 61 - ".setQualityIndex"
Cohesion: 0.11
Nodes (3): readCachedBenchmark(), MiniaturePass, QualitySetting

### Community 62 - "PlacesOverlay.tsx"
Cohesion: 0.18
Nodes (15): @phosphor-icons/react, EditorialMarkers(), EditorialSources(), MOBILE_WEATHER_ICONS, placeCardCondition(), PlacesOverlay(), PlacesOverlayProps, QUICK_TIMES (+7 more)

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

### Community 77 - "siteAtmosphere.ts"
Cohesion: 0.15
Nodes (16): AtmosphereEffect, AtmosphereLayer, AtmosphereProfile, AtmosphereSceneController, AtmosphereSite, AtmosphereUpdateOptions, BIOME_EFFECTS, createAtmosphereScene() (+8 more)

### Community 78 - "addCraftedRim"
Cohesion: 0.60
Nodes (5): addCraftedRim(), addSquareRim(), getRimMaterial(), paintRadial(), paintStrata()

### Community 79 - "addSiteMotion"
Cohesion: 0.50
Nodes (4): addSiteMotion(), addWeatherFx(), stream(), normalMapsActive()

### Community 80 - "placesScene.ts"
Cohesion: 0.16
Nodes (16): OsmPlaceData, BespokeInteriorKind, createPlacesScene(), ExplorerInfo, HERO_CAM, HERO_TARGET, PlacesController, bindVolumetricFogUniforms() (+8 more)

### Community 81 - "createWebGPUCompat"
Cohesion: 0.41
Nodes (12): createWebGPUCompat(), convert(), findAlphaUniform(), findColorUniform(), findIntensityUniform(), tryGroundSheen(), tryHorizonRing(), trySkyMaterial() (+4 more)

### Community 82 - "ref_node_assert"
Cohesion: 0.14
Nodes (8): SKY_CALENDAR_SIZE, IDLES, KINDS, SEASONS, bridgeStayAnchors(), catenaryArchHeight(), StayAnchor, StubWindow

### Community 83 - "timePresets.ts"
Cohesion: 0.43
Nodes (5): GOLDEN_HOUR_END, GOLDEN_HOUR_START, TIME_PRESETS, TimePreset, TimePresetKey

### Community 85 - "webgpuCompat.ts"
Cohesion: 0.25
Nodes (7): ALPHA_UNIFORMS, COLOR_UNIFORMS, INTENSITY_UNIFORMS, TSLModule, UniformLink, UV_MAP_KEYS, WebGPUModule

## Knowledge Gaps
- **10 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `three` connect `globeScene.ts` to `landmarksB.ts`, `shaders.ts`, `placesSliceBuilders.ts`, `placesShaders.ts`, `vehicleLightKit.ts`, `dioramaKit.ts`, `animalKit.ts`, `weatherScene.ts`, `osmSlice.ts`, `DaylightBirdsController`, `package.json`, `getSoftTexture`, `CitylitEngine.ts`, `ref_node_test`, `getSoftTexture`, `three`, `placesInteriors.ts`, `weatherScene.ts`, `webgpuPostFX.ts`, `windowLights.ts`, `globalIllumination.ts`, `windParticles.ts`, `siteAtmosphere.ts`, `placesScene.ts`, `webgpuCompat.ts`?**
  _High betweenness centrality (0.228) - this node is a cross-community bridge._
- **Should `landmarksB.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05918179728797977 - nodes in this community are weakly interconnected._
- **Why does `CitylitEngine` connect `CitylitEngine` to `.resetToDefaultOrientation`, `citylit.ts`, `App.tsx`, `animalKit.ts`, `WeatherWidget.tsx`, `LandmarkCard.tsx`, `DaylightBirdsController`, `AmbientAudioController`, `CitylitEngine.ts`, `.frame`, `ref_node_test`, `motion.ts`, `.frame`, `qualityBenchmark.ts`, `framePacing.ts`, `webgpuPostFX.ts`, `.setQualityIndex`, `.showLandmarkImmediate`, `contact-sheet.ts`, `windParticles.ts`, `.constructor`, `siteAtmosphere.ts`, `placesScene.ts`?**
  _High betweenness centrality (0.105) - this node is a cross-community bridge._
- **Should `citylit.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06236786469344609 - nodes in this community are weakly interconnected._
- **Why does `puppeteer` connect `devDependencies` to `ref_node_fs`, `package.json`?**
  _High betweenness centrality (0.076) - this node is a cross-community bridge._
- **Should `shaders.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.09090909090909091 - nodes in this community are weakly interconnected._
- **Should `App.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.0780399274047187 - nodes in this community are weakly interconnected._