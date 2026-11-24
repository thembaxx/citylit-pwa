# Graph Report - citylit-pwa  (2026-11-24)

## Corpus Check
- 190 files · ~420,666 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 10 file(s) not represented in the graph (top: .woff2 4, (none) 2, .css 2)

## Summary
- 2120 nodes · 6091 edges · 92 communities (77 shown, 15 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 222 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `c618abf1`
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
- playwright
- package.json
- layer.ts
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
- species.ts
- placesInteriors.ts
- qualityBenchmark.ts
- framePacing.ts
- compare-metrics.mjs
- siteVisuals.ts
- weatherScene.ts
- weatherScene.ts
- webgpuPostFX.ts
- WebGPUSceneRenderer
- skyEvents.ts
- capture-visual-matrix.mjs
- WebGLSceneRenderer
- MiniaturePass
- PlacesOverlay.tsx
- run
- addWildlifeLayer
- windowLights.ts
- .showLandmarkImmediate
- check-exposure.mjs
- globalIllumination.ts
- budget.ts
- contact-sheet.ts
- windParticles.ts
- .constructor
- .constructor
- ref_node_fs
- make-contact-sheet.mjs
- CreatureField
- field.ts
- addCraftedRim
- addSiteMotion
- placesScene.ts
- createWebGPUCompat
- ref_node_assert
- SceneRenderer.ts
- WebGPUPostFX
- webgpuCompat.ts
- creaturesLab.ts
- .dispose
- wildlife.ts
- CreatureLayer
- AnimalScaffold

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
- `EngineCallbacks` --references--> `PlacesSelectionInfo`  [EXTRACTED]
  src/three/CitylitEngine.ts → src/three/placesScene.ts
- `AtmosphereSite` --references--> `LandmarkBiome`  [EXTRACTED]
  src/three/siteAtmosphere.ts → src/types/citylit.ts
- `ScaleRulerModalProps` --references--> `ScaleReferenceKind`  [EXTRACTED]
  src/components/ScaleRulerModal.tsx → src/types/citylit.ts
- `main()` --indirect_call--> `setupEval()`  [INFERRED]
  scripts/capture-visual-matrix.mjs → scripts/capture-contact-sheets.mjs

## Import Cycles
- None detected.

## Communities (92 total, 15 thin omitted)

### Community 0 - "landmarksB.ts"
Cohesion: 0.06
Nodes (229): headingYaw(), leftLaneOffset(), normalizePlanar(), PlanarVector, registerBeacons(), addAnchor(), addBaseScatter(), addBollards() (+221 more)

### Community 2 - "citylit.ts"
Cohesion: 0.07
Nodes (37): ambientAudio, BUILTIN_MIXER_PRESETS, DEFAULT_MIXER, FPS_OPTIONS, MIXER_CHANNELS, MOTION_OPTIONS, QUALITY_OPTIONS, readCustomPresets() (+29 more)

### Community 3 - "placeEditorial.ts"
Cohesion: 0.18
Nodes (14): LANDMARK_DETAILS, LandmarkDetail, CATEGORY_LABEL, ExplorerEditorialInput, firstSentence(), HIGHLIGHT_COLORS, HIGHLIGHT_FOCUS, PlaceHighlight (+6 more)

### Community 4 - "shaders.ts"
Cohesion: 0.06
Nodes (57): applyDissolveToShader(), cascadeize(), configureTextureQuality(), flagWindy(), getBrushedNormalTexture(), getBrushedRoughnessTexture(), getCanvasBumpTexture(), getCanvasNormalTexture() (+49 more)

### Community 5 - "App.tsx"
Cohesion: 0.09
Nodes (41): App(), INITIAL_GLOBE, readInitialLandmarkIndex(), readSettings(), readStoredEggs(), readStoredNotes(), readStoredSavedPlaces(), readStoredSet() (+33 more)

### Community 6 - "placesSliceBuilders.ts"
Cohesion: 0.11
Nodes (35): getGrassMaterial(), createCloudPuffMesh(), createSliceCloudLayer(), BESPOKE_INTERIORS, createCutawayWaterTopMaterial(), createCutawayWaterWallMaterial(), createSliceMistMaterial(), CutawayWaterOptions (+27 more)

### Community 7 - "placesShaders.ts"
Cohesion: 0.13
Nodes (21): bindVolumetricFogUniforms(), patchPlacesVolumetricFog(), PlacesSliceEmitterSpec, WaterConfluenceSpec, WaterTideSpec, CLOUD_FRAGMENT, CLOUD_VERTEX, NOISE_GLSL (+13 more)

### Community 8 - "vehicleLightKit.ts"
Cohesion: 0.10
Nodes (20): getCarHeadlightMat(), getCarPoolMat(), getCarTaillightMat(), createVehicleLightBatch(), ensureLightGeometries(), LightGeometries, markLightMesh(), placeInstance() (+12 more)

### Community 9 - "dioramaKit.ts"
Cohesion: 0.05
Nodes (50): accentFor(), addDioramaClouds(), addLampWaterReflections(), addStandUnderside(), addWetRoadStreaks(), AnchorKind, CorniceBandSpec, DioramaFx (+42 more)

### Community 10 - "animalKit.ts"
Cohesion: 0.09
Nodes (31): advanceAnimalTime(), AnimalLodSpec, AnimalMember, AnimalPose, AnimalScaffoldSpec, animalSeasonForMonth(), AnimalVec3, ArticulationAxis (+23 more)

### Community 11 - "WeatherWidget.tsx"
Cohesion: 0.06
Nodes (48): HourlyForecast(), HourlyForecastProps, AnimatedNumber(), PillNavigation(), WeatherIcon(), pad2(), PRESET_ICONS, PresetKey (+40 more)

### Community 13 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowImportingTsExtensions, isolatedModules, jsx, lib, module, moduleDetection, moduleResolution (+10 more)

### Community 14 - "weatherScene.ts"
Cohesion: 0.08
Nodes (28): AUTO_EXPOSURE_ADAPT_RATE, BIOME_BOUNCE_COLORS, bounceDayTmp, bounceMixTmp, bounceNightTmp, configureDioramaShadow(), createBounceLight(), createRimLight() (+20 more)

### Community 15 - "osmService.ts"
Cohesion: 0.14
Nodes (17): cacheKey(), fallbackPatch(), GEO_CACHE, loadElevation(), loadOsmPlace(), LocalPoint, MEMORY_CACHE, OsmArea (+9 more)

### Community 16 - "osmSlice.ts"
Cohesion: 0.18
Nodes (17): StreetLampSpec, centroid(), clamp(), createOsmSlice(), createRibbon(), OsmSliceResult, pointOnRoad(), polygonShape() (+9 more)

### Community 17 - "LandmarkCard.tsx"
Cohesion: 0.08
Nodes (32): GalleryDialog(), GalleryModal(), GalleryModalProps, bodySlideVariants, CAMERA_PRESETS, CARDINALS, getCategoryMeta(), headerSlideVariants (+24 more)

### Community 18 - "ScaleRulerModal.tsx"
Cohesion: 0.24
Nodes (11): formatMetres(), REFERENCE_HEIGHTS, referenceHeightM(), SCALE_FACTS, ScaleFact, ScaleMeasure, scaleRatio(), MAX_REFERENCE_UNITS (+3 more)

### Community 19 - "DaylightBirdsController"
Cohesion: 0.18
Nodes (9): BIOME_PALETTES, BirdAgent, BirdPalette, BirdState, collectBirdPerchPoints(), DaylightBirdsController, paletteKeyForBiome(), SharedBirdPaletteMats (+1 more)

### Community 20 - "PassportModal.tsx"
Cohesion: 0.11
Nodes (21): CATEGORY_COLORS, PASSPORT_TABS, PassportModal(), PassportModalProps, PassportTab, ProvinceRing(), ProvinceRingProps, ProvinceStatRow (+13 more)

### Community 21 - "playwright"
Cohesion: 0.08
Nodes (11): playwright, errors, errors, names, errors, failed, report, sites (+3 more)

### Community 22 - "package.json"
Cohesion: 0.06
Nodes (43): dependencies, goeist@0.1.0, motion@14.14.0, n8ao@2.1.0, oxfmt@0.79.0, oxlint@1.94.0, @phosphor-icons/react@2.1.10, react@19.3.1 (+35 more)

### Community 23 - "layer.ts"
Cohesion: 0.15
Nodes (24): DAY, CreatureTier, CREATURE_ENV, CreatureEnvSnapshot, currentTimeBand(), publishCreatureEnvironment(), clampHour(), HabitatConditions (+16 more)

### Community 24 - "AmbientAudioController"
Cohesion: 0.07
Nodes (19): AmbientAudioController, AnimalAudioEvent, BIOME_HAPTIC_PATTERNS, clamp01(), equalPower(), extractRegionName(), FilterBand, REGION_HAPTIC_ACCENTS (+11 more)

### Community 25 - "server.js"
Cohesion: 0.20
Nodes (6): express@5.3.0, express, app, __dirname, distDir, __filename

### Community 26 - "CitylitEngine.ts"
Cohesion: 0.08
Nodes (31): boundsFitPlinth(), clamp(), fitBoundsToPlinth(), PlanarBounds, PLINTH_FRAME_WIDTH, PLINTH_HALF_EXTENT, PLINTH_INNER_HALF_EXTENT, PlinthFit (+23 more)

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
Cohesion: 0.14
Nodes (21): addCreatureLife(), addEdgeWaterfall(), addScaleReference(), addSoaringBirds(), addSquareWaterPlate(), applyDioramaUpgrade(), buildSpatialSources(), finalizeLandmarkGroup() (+13 more)

### Community 33 - "with"
Cohesion: 0.11
Nodes (17): jobs, verify, name, on, pull_request, push, branches, name (+9 more)

### Community 35 - "ref_node_test"
Cohesion: 0.27
Nodes (9): three, createWebGLRendererSelection(), decideRendererBackend(), GPUCapableNavigator, readRendererPreference(), RendererProbe, selectRenderer(), wantsMsaa() (+1 more)

### Community 36 - "motion.ts"
Cohesion: 0.05
Nodes (56): motion, react, react-dom, AudioVisualizerBarProps, DARK_PALETTE, LIGHT_PALETTE, CARDINAL_TARGETS, CARDINALS_8 (+48 more)

### Community 37 - "overrides"
Cohesion: 0.33
Nodes (5): allowBuilds, puppeteer, overrides, three, workbox-build>glob

### Community 38 - "capture-contact-sheets.mjs"
Cohesion: 0.17
Nodes (16): acquirePageTarget(), BASELINE_PATH, captureHour(), CdpSession, checkPerfGuardrails(), HOUR_KEYS, main(), pad() (+8 more)

### Community 39 - "memory.js"
Cohesion: 0.29
Nodes (13): pastdotdev@^0.0.1, pastdotdev, createMemoryMiddleware(), getClient(), HttpError, isTimestamp(), optionalEnum(), optionalInt() (+5 more)

### Community 40 - "getSoftTexture"
Cohesion: 0.40
Nodes (3): CloudAssets, CloudPuffInstance, SliceCloudLayer

### Community 44 - "SearchSheet.tsx"
Cohesion: 0.12
Nodes (29): GlobeOverlay(), GlobeOverlayProps, SearchSheet(), SearchSheetProps, DropdownTokens, Menu(), MenuItem, MenuProps (+21 more)

### Community 45 - "run"
Cohesion: 0.38
Nodes (5): CDP, i0(), listTargets(), run(), sleep()

### Community 46 - "globeScene.ts"
Cohesion: 0.16
Nodes (24): AFRICA_POLYS, ENCLAVE_POLYS, GLOBE_NEIGHBOR_LABELS, GLOBE_PROVINCES, NEIGHBOR_POLYS, PROVINCE_STYLE, ProvinceGlobeEntry, GEO_AFRICA (+16 more)

### Community 47 - "measure-idle-pacing.mjs"
Cohesion: 0.14
Nodes (5): cdp, CdpSession, ROOT, server, tab

### Community 48 - "species.ts"
Cohesion: 0.19
Nodes (28): AssembledGeometry, assembleParts(), AXIS_DEFAULT, axisId(), ball(), box(), buildBat(), buildButterfly() (+20 more)

### Community 49 - "placesInteriors.ts"
Cohesion: 0.08
Nodes (53): BespokeInteriorContext, buildThemedInterior(), bx(), co(), colonnade(), compactShell(), cy(), emptyMats() (+45 more)

### Community 50 - "qualityBenchmark.ts"
Cohesion: 0.14
Nodes (12): BenchmarkConfig, BenchmarkTier, CachedBenchmark, computeFrameStats(), DEFAULT_BENCHMARK_CONFIG, FrameStats, FrameTimeBenchmark, percentile() (+4 more)

### Community 51 - "framePacing.ts"
Cohesion: 0.31
Nodes (8): DEFAULT_QUIET_SECONDS, FramePacingInput, frameThrottleMs(), IDLE_QUIET_MS, IDLE_REDUCED_MS, IDLE_SOFTWARE_MS, stageQuiet(), StageQuietInput

### Community 52 - "compare-metrics.mjs"
Cohesion: 0.18
Nodes (10): after, afterByKey, before, breaches, key(), mean(), pct(), rows (+2 more)

### Community 53 - "siteVisuals.ts"
Cohesion: 0.12
Nodes (20): BIOME_FALLBACK, normalizeRuleKey(), REGIONAL_PALETTES, RegionalPalette, RegionalPaletteKey, resolveRegionalPalette(), rule(), SITE_RULES (+12 more)

### Community 54 - "weatherScene.ts"
Cohesion: 0.12
Nodes (21): clamp01(), LiveWeatherVisual, liveWeatherVisual(), SeasonWeights, MID_MONTH_DAY, solarDeclination(), southernSunDirection(), KELVIN_KEY_MIX (+13 more)

### Community 55 - "weatherScene.ts"
Cohesion: 0.30
Nodes (10): getSeasonMonth(), isSpeciesBlooming(), monthToSeasonWeights(), normalizeMonth(), PLANT_SPECIES, PlantSpecies, PlantSpeciesInfo, setSeasonMonth() (+2 more)

### Community 56 - "webgpuPostFX.ts"
Cohesion: 0.18
Nodes (7): createMiniaturePass(), DitherShader, fallbackDepth, MiniatureBlurShader, MiniatureGradeOptions, MiniatureShader, MiniatureTuning

### Community 58 - "skyEvents.ts"
Cohesion: 0.21
Nodes (15): dayIndex(), daysInMonth(), entryIntensity(), EVENT_PRIORITY, formatWhen(), getSkyEvent(), getUpcomingSkyEvents(), MONTH_LABELS (+7 more)

### Community 59 - "capture-visual-matrix.mjs"
Cohesion: 0.32
Nodes (7): captureState(), Cdp, main(), parseCli(), sampleEval(), sleep(), stateEval()

### Community 62 - "PlacesOverlay.tsx"
Cohesion: 0.16
Nodes (17): @phosphor-icons/react, EditorialMarkers(), EditorialSources(), MOBILE_WEATHER_ICONS, placeCardCondition(), PlacesOverlay(), PlacesOverlayProps, QUICK_TIMES (+9 more)

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

### Community 69 - "budget.ts"
Cohesion: 0.14
Nodes (10): CREATURE_TIER_CAPS, CREATURE_TIER_LABELS, CreatureBudget, CreatureBudgetStats, CreaturePriority, CreatureReservation, PRIORITY_WEIGHT, TierCaps (+2 more)

### Community 70 - "contact-sheet.ts"
Cohesion: 0.25
Nodes (8): build(), engine, grid, hour, params, stage, status, syncButtons()

### Community 71 - "windParticles.ts"
Cohesion: 0.15
Nodes (15): GlobeController, BiomeWeights, createHorizonRing(), createHorizonScenery(), HorizonSceneryController, HorizonUpdateOptions, weightsForBiome(), WU (+7 more)

### Community 73 - ".constructor"
Cohesion: 0.21
Nodes (10): angularDistance(), createRng(), easeOutBack(), hashString(), mulberry32(), poissonInterval(), ScatterOptions, scatterRing() (+2 more)

### Community 74 - "ref_node_fs"
Cohesion: 0.33
Nodes (3): outDir, results, viewports

### Community 75 - "make-contact-sheet.mjs"
Cohesion: 0.53
Nodes (4): delta(), loadStats(), main(), parseCli()

### Community 76 - "CreatureField"
Cohesion: 0.18
Nodes (4): angleDelta(), CreatureField, SpeciesId, SpeciesBuild

### Community 77 - "field.ts"
Cohesion: 0.17
Nodes (14): CreatureFieldOptions, CreatureFieldStats, M_PERCH, CreatureAnimation, CreatureZone, createCreatureMaterial(), CREATURE_UNIFORMS, CreatureMaterialOptions (+6 more)

### Community 78 - "addCraftedRim"
Cohesion: 0.60
Nodes (5): addCraftedRim(), addSquareRim(), getRimMaterial(), paintRadial(), paintStrata()

### Community 79 - "addSiteMotion"
Cohesion: 0.50
Nodes (4): addSiteMotion(), addWeatherFx(), stream(), normalMapsActive()

### Community 80 - "placesScene.ts"
Cohesion: 0.22
Nodes (13): OsmPlaceData, createPlacesScene(), ExplorerInfo, HERO_CAM, HERO_TARGET, PlacesController, createPlacesShaderEnv(), createPlacesVolumetricFogLayer() (+5 more)

### Community 81 - "createWebGPUCompat"
Cohesion: 0.41
Nodes (12): createWebGPUCompat(), convert(), findAlphaUniform(), findColorUniform(), findIntensityUniform(), tryGroundSheen(), tryHorizonRing(), trySkyMaterial() (+4 more)

### Community 82 - "ref_node_assert"
Cohesion: 0.10
Nodes (15): IDLES, KINDS, SEASONS, computeBirdSpawnIntervalSec(), computeFoliageSwayAngle(), computeFoliageWindStrength(), isDaylightForBirds(), bridgeStayAnchors() (+7 more)

### Community 83 - "SceneRenderer.ts"
Cohesion: 0.16
Nodes (6): createSceneRenderer(), AnyRenderer, PMREMGeneratorLike, PMREMResult, RendererBackend, RendererSelection

### Community 84 - "WebGPUPostFX"
Cohesion: 0.13
Nodes (8): BloomModule, DOFModule, makeUniforms(), SSAOModule, TSL, Uniforms, WebGPUModule, WebGPUPostFX

### Community 85 - "webgpuCompat.ts"
Cohesion: 0.25
Nodes (7): ALPHA_UNIFORMS, COLOR_UNIFORMS, INTENSITY_UNIFORMS, TSLModule, UniformLink, UV_MAP_KEYS, WebGPUModule

### Community 86 - "creaturesLab.ts"
Cohesion: 0.26
Nodes (11): labelled(), mountCreaturesLab(), slider(), smallButton(), STATE_OPTIONS, styleButton(), ZONE_BY_SPECIES, setCreatureEnvironment() (+3 more)

### Community 89 - "wildlife.ts"
Cohesion: 0.53
Nodes (5): WILDLIFE, WildlifeSpot, AnimalIdle, AnimalKind, AnimalSeason

## Knowledge Gaps
- **15 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `three` connect `ref_node_test` to `landmarksB.ts`, `shaders.ts`, `placesSliceBuilders.ts`, `placesShaders.ts`, `vehicleLightKit.ts`, `dioramaKit.ts`, `animalKit.ts`, `weatherScene.ts`, `osmSlice.ts`, `DaylightBirdsController`, `package.json`, `layer.ts`, `CitylitEngine.ts`, `getSoftTexture`, `globeScene.ts`, `species.ts`, `placesInteriors.ts`, `weatherScene.ts`, `webgpuPostFX.ts`, `windowLights.ts`, `globalIllumination.ts`, `windParticles.ts`, `field.ts`, `placesScene.ts`, `SceneRenderer.ts`, `WebGPUPostFX`, `webgpuCompat.ts`, `creaturesLab.ts`?**
  _High betweenness centrality (0.265) - this node is a cross-community bridge._
- **Should `landmarksB.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05614857554994591 - nodes in this community are weakly interconnected._
- **Why does `puppeteer` connect `package.json` to `ref_node_fs`?**
  _High betweenness centrality (0.085) - this node is a cross-community bridge._
- **Should `citylit.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06666666666666667 - nodes in this community are weakly interconnected._
- **Why does `CitylitEngine` connect `CitylitEngine` to `.resetToDefaultOrientation`, `citylit.ts`, `shaders.ts`, `App.tsx`, `animalKit.ts`, `WeatherWidget.tsx`, `LandmarkCard.tsx`, `DaylightBirdsController`, `CitylitEngine.ts`, `.frame`, `motion.ts`, `.frame`, `qualityBenchmark.ts`, `framePacing.ts`, `siteVisuals.ts`, `weatherScene.ts`, `webgpuPostFX.ts`, `MiniaturePass`, `.showLandmarkImmediate`, `contact-sheet.ts`, `windParticles.ts`, `.constructor`, `placesScene.ts`, `SceneRenderer.ts`, `.setQualityIndex`, `.dispose`?**
  _High betweenness centrality (0.084) - this node is a cross-community bridge._
- **Should `shaders.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.059887005649717516 - nodes in this community are weakly interconnected._
- **Should `App.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.08823529411764706 - nodes in this community are weakly interconnected._