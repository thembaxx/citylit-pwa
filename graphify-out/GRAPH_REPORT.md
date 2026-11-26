# Graph Report - citylit-pwa  (2026-11-26)

## Corpus Check
- 219 files · ~458,668 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 11 file(s) not represented in the graph (top: .woff2 4, (none) 3, .css 2)

## Summary
- 2347 nodes · 6774 edges · 92 communities (85 shown, 7 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 236 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `b9b714be`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- landmarksB.ts
- PassportModal.tsx
- citylit.ts
- resolveTheme
- server.js
- App.tsx
- placesSliceBuilders.ts
- placesShaders.ts
- material.ts
- dioramaKit.ts
- animalKit.ts
- WeatherWidget.tsx
- CitylitEngine
- compilerOptions
- lightingRig.ts
- osmService.ts
- osmSlice.ts
- ScaleRulerModal.tsx
- viewportFraming.ts
- skyEvents.ts
- prepareCanvasTexture
- playwright
- package.json
- layer.ts
- AmbientAudioController
- .updateSpatial
- CitylitEngine.ts
- .oxfmtrc.json
- .oxlintrc.json
- vite.config.ts
- albedoAudit.ts
- scripts
- applyDioramaUpgrade
- with
- placesClouds.ts
- ref_node_test
- citylit.ts
- overrides
- capture-contact-sheets.mjs
- memory.js
- plinthKit.ts
- .frame
- vehicleLightKit.ts
- run
- globeScene.ts
- measure-idle-pacing.mjs
- species.ts
- placesInteriors.ts
- qualityBenchmark.ts
- daylightBirds.ts
- compare-metrics.mjs
- ref_node_assert
- timePresets.ts
- weatherScene.ts
- PMREMGeneratorLike
- WebGPUSceneRenderer
- tide.test.ts
- capture-visual-matrix.mjs
- WebGLSceneRenderer
- weatherScene.ts
- PlacesOverlay.tsx
- run
- motion.ts
- placesScene.ts
- siteAtmosphere.ts
- check-exposure.mjs
- uiSafeArea.ts
- budget.ts
- contact-sheet.ts
- framePacing.ts
- pastdotdev
- .constructor
- run-qa-capture.mjs
- make-contact-sheet.mjs
- CreatureField
- n8ao.d.ts
- field.ts
- addTreeRing
- createWebGPUCompat
- LandmarkBiome
- biomePalette.ts
- markSharedGeo
- creaturesLab.ts
- cloudShape.ts
- nativeHost.ts
- addCraftedRim
- AnimalScaffold
- InfoDrawer.tsx
- addSiteMotion
- addWildlifeLayer

## God Nodes (most connected - your core abstractions)
1. `CitylitEngine` - 160 edges
2. `add()` - 104 edges
3. `M()` - 83 edges
4. `C()` - 82 edges
5. `CB()` - 71 edges
6. `mergeByMaterial()` - 60 edges
7. `App()` - 60 edges
8. `R()` - 59 edges
9. `addStreetLampSet()` - 56 edges
10. `MStone()` - 56 edges

## Surprising Connections (you probably didn't know these)
- `memoryApiPlugin()` --calls--> `createMemoryMiddleware()`  [EXTRACTED]
  vite.config.ts → server/memory.js
- `ScaleReferenceEntry` --references--> `ScaleReferenceKind`  [EXTRACTED]
  src/three/builders/dioramaKit.ts → src/types/citylit.ts
- `main()` --indirect_call--> `setupEval()`  [INFERRED]
  scripts/capture-visual-matrix.mjs → scripts/capture-contact-sheets.mjs
- `CitylitEngine` --references--> `FrameTimeBenchmark`  [EXTRACTED]
  src/three/CitylitEngine.ts → src/lib/qualityBenchmark.ts
- `WebGLSceneRenderer` --implements--> `SceneRenderer`  [EXTRACTED]
  src/three/renderer/SceneRenderer.ts → src/three/renderer/types.ts

## Import Cycles
- None detected.

## Communities (92 total, 7 thin omitted)

### Community 0 - "landmarksB.ts"
Cohesion: 0.06
Nodes (230): headingYaw(), leftLaneOffset(), normalizePlanar(), PlanarVector, registerBeacons(), addAnchor(), addBaseScatter(), addBollards() (+222 more)

### Community 1 - "PassportModal.tsx"
Cohesion: 0.09
Nodes (37): CATEGORY_COLORS, PASSPORT_TABS, PassportModal(), PassportTab, ProvinceRing(), ProvinceRingProps, ProvinceStatRow, StatsTooltip() (+29 more)

### Community 2 - "citylit.ts"
Cohesion: 0.06
Nodes (42): AnimalAudioEvent, BIOME_HAPTIC_PATTERNS, FilterBand, REGION_HAPTIC_ACCENTS, SpatialEmitter, SpatialListener, UI_CUE_CATEGORY, UiCueCategory (+34 more)

### Community 3 - "resolveTheme"
Cohesion: 0.17
Nodes (16): AudioVisualizerBar(), AudioVisualizerBarProps, DARK_PALETTE, LIGHT_PALETTE, TopBarProps, DAYLIGHT_END_HOUR, DAYLIGHT_START_HOUR, msUntilNextThemeBoundary() (+8 more)

### Community 4 - "server.js"
Cohesion: 0.20
Nodes (6): express@5.3.0, express, app, __dirname, distDir, __filename

### Community 5 - "App.tsx"
Cohesion: 0.07
Nodes (52): App(), INITIAL_GLOBE, readInitialLandmarkIndex(), readSettings(), readStoredEggs(), readStoredNotes(), readStoredSavedPlaces(), readStoredSet() (+44 more)

### Community 6 - "placesSliceBuilders.ts"
Cohesion: 0.12
Nodes (33): getGrassMaterial(), BESPOKE_INTERIORS, createCutawayWaterTopMaterial(), createCutawayWaterWallMaterial(), createSliceMistMaterial(), CutawayWaterOptions, getOrlandoMuralTexture(), addInstancedFlowers() (+25 more)

### Community 7 - "placesShaders.ts"
Cohesion: 0.14
Nodes (20): bindVolumetricFogUniforms(), createStrataTerrainMaterial(), patchPlacesVolumetricFog(), PlacesSliceEmitterSpec, WaterConfluenceSpec, WaterTideSpec, CLOUD_FRAGMENT, CLOUD_VERTEX (+12 more)

### Community 8 - "material.ts"
Cohesion: 0.18
Nodes (12): CreatureAnimation, createCreatureMaterial(), CREATURE_ANIM_STATES, CREATURE_STATE_VALUE, CREATURE_UNIFORMS, CreatureMaterialOptions, CreatureUniforms, deformation() (+4 more)

### Community 9 - "dioramaKit.ts"
Cohesion: 0.05
Nodes (41): MAX_REFERENCE_UNITS, MIN_REFERENCE_UNITS, accentFor(), AnchorKind, CorniceBandSpec, DioramaFx, DoorSurroundSpec, FacadeWindowSpec (+33 more)

### Community 10 - "animalKit.ts"
Cohesion: 0.09
Nodes (31): advanceAnimalTime(), AnimalLodSpec, AnimalMember, AnimalPose, AnimalScaffoldSpec, animalSeasonForMonth(), AnimalVec3, ArticulationAxis (+23 more)

### Community 11 - "WeatherWidget.tsx"
Cohesion: 0.14
Nodes (21): HourlyForecast(), HourlyForecastProps, pad2(), PRESET_ICONS, PresetKey, SKY_EVENT_ICON, TIME_PRESETS, WARNING_STYLE (+13 more)

### Community 12 - "CitylitEngine"
Cohesion: 0.05
Nodes (13): CompassProps, resetSceneDynamicLists(), setContactShadowFade(), SwayItem, WetMaterialEntry, CitylitEngine, EngineCallbacks, fitDioramaShadowBounds() (+5 more)

### Community 13 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowImportingTsExtensions, isolatedModules, jsx, lib, module, moduleDetection, moduleResolution (+10 more)

### Community 14 - "lightingRig.ts"
Cohesion: 0.11
Nodes (21): AUTO_EXPOSURE_ADAPT_RATE, BIOME_BOUNCE_COLORS, bounceDayTmp, bounceMixTmp, bounceNightTmp, DIORAMA_SHADOW_EXTENT, GOD_RAY_STRENGTH, GOD_RAYS_ENABLED (+13 more)

### Community 15 - "osmService.ts"
Cohesion: 0.14
Nodes (17): cacheKey(), fallbackPatch(), GEO_CACHE, loadElevation(), loadOsmPlace(), LocalPoint, MEMORY_CACHE, OsmArea (+9 more)

### Community 16 - "osmSlice.ts"
Cohesion: 0.17
Nodes (17): StreetLampSpec, centroid(), clamp(), createOsmSlice(), createRibbon(), pointOnRoad(), polygonShape(), readTag() (+9 more)

### Community 17 - "ScaleRulerModal.tsx"
Cohesion: 0.13
Nodes (22): barWidth(), REFERENCE_OPTIONS, RulerRow, RulerScale, RulerSort, SCALE_OPTIONS, ScaleRulerModal(), ScaleRulerModalProps (+14 more)

### Community 18 - "viewportFraming.ts"
Cohesion: 0.10
Nodes (25): clampShift(), EMPTY_INSETS, FramingPlan, freeFitFactor(), freeRect(), isCompactViewport(), LayoutMode, layoutModeFor() (+17 more)

### Community 19 - "skyEvents.ts"
Cohesion: 0.21
Nodes (15): dayIndex(), daysInMonth(), entryIntensity(), EVENT_PRIORITY, formatWhen(), getSkyEvent(), getUpcomingSkyEvents(), MONTH_LABELS (+7 more)

### Community 20 - "prepareCanvasTexture"
Cohesion: 0.07
Nodes (53): applyDissolveToShader(), cascadeize(), flagWindy(), getBrushedNormalTexture(), getBrushedRoughnessTexture(), getCanvasBumpTexture(), getCanvasNormalTexture(), getOrCreateCanvas() (+45 more)

### Community 21 - "playwright"
Cohesion: 0.08
Nodes (21): playwright, errors, errors, names, errors, failed, report, sites (+13 more)

### Community 22 - "package.json"
Cohesion: 0.07
Nodes (39): dependencies, goeist@0.1.0, motion@14.14.0, n8ao@2.1.0, oxfmt@0.79.0, oxlint@1.94.0, @phosphor-icons/react@2.1.10, react@19.3.1 (+31 more)

### Community 23 - "layer.ts"
Cohesion: 0.10
Nodes (26): DAY, CreatureTier, CREATURE_ENV, CreatureEnvSnapshot, currentTimeBand(), publishCreatureEnvironment(), setCreatureEnvironment(), clampHour() (+18 more)

### Community 24 - "AmbientAudioController"
Cohesion: 0.13
Nodes (3): AmbientAudioController, SiteProfile, AmbientSiteProfile

### Community 25 - ".updateSpatial"
Cohesion: 0.31
Nodes (4): clamp01(), equalPower(), smoothBell(), smoothstep()

### Community 26 - "CitylitEngine.ts"
Cohesion: 0.04
Nodes (61): BeaconAnchor, beaconGeo, collectBeacons(), createBeaconMesh(), LANDMARK_BUILDERS, audioForward, audioRight, compassDir (+53 more)

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
Cohesion: 0.14
Nodes (14): scripts, build, dev, format, format:check, lint, preview, qa:capture (+6 more)

### Community 32 - "applyDioramaUpgrade"
Cohesion: 0.17
Nodes (19): addCreatureLife(), addEdgeWaterfall(), addScaleReference(), addSoaringBirds(), addSquareWaterPlate(), applyDioramaUpgrade(), buildSpatialSources(), finalizeLandmarkGroup() (+11 more)

### Community 33 - "with"
Cohesion: 0.11
Nodes (17): jobs, verify, name, on, pull_request, push, branches, name (+9 more)

### Community 34 - "placesClouds.ts"
Cohesion: 0.28
Nodes (7): createContactShadowMaterial(), CloudAssets, CloudPuffInstance, createCloudPuffMesh(), createSliceCloudLayer(), SliceCloudLayer, getSoftTexture()

### Community 35 - "ref_node_test"
Cohesion: 0.14
Nodes (13): three, createWebGLRendererSelection(), decideRendererBackend(), GPUCapableNavigator, readRendererPreference(), RendererProbe, selectRenderer(), StubWindow (+5 more)

### Community 36 - "citylit.ts"
Cohesion: 0.07
Nodes (34): GalleryDialog(), GalleryModal(), GalleryModalProps, airQualityInsight(), CAMERA_PRESETS, cardContentVariants, CARDINALS, cardItemVariants (+26 more)

### Community 37 - "overrides"
Cohesion: 0.33
Nodes (5): allowBuilds, puppeteer, overrides, three, workbox-build>glob

### Community 38 - "capture-contact-sheets.mjs"
Cohesion: 0.17
Nodes (16): acquirePageTarget(), BASELINE_PATH, captureHour(), CdpSession, checkPerfGuardrails(), HOUR_KEYS, main(), pad() (+8 more)

### Community 39 - "memory.js"
Cohesion: 0.36
Nodes (11): createMemoryMiddleware(), getClient(), HttpError, isTimestamp(), optionalEnum(), optionalInt(), optionalString(), pick() (+3 more)

### Community 40 - "plinthKit.ts"
Cohesion: 0.07
Nodes (67): boundsFitPlinth(), boundsFitStand(), clamp(), fitBoundsToPlinth(), fitBoundsToStand(), footprintInsidePolygon(), innerStandPolygon(), PlanarBounds (+59 more)

### Community 42 - ".frame"
Cohesion: 0.06
Nodes (8): readCachedBenchmark(), updateWetSurfaces(), setSpatialListener(), updateBounceLightMood(), updateShadowMood(), MiniaturePass, SceneRenderer, configureTextureQuality()

### Community 44 - "vehicleLightKit.ts"
Cohesion: 0.16
Nodes (16): getCarHeadlightMat(), getCarPoolMat(), getCarTaillightMat(), createVehicleLightBatch(), ensureLightGeometries(), LightGeometries, markLightMesh(), placeInstance() (+8 more)

### Community 45 - "run"
Cohesion: 0.38
Nodes (5): CDP, i0(), listTargets(), run(), sleep()

### Community 46 - "globeScene.ts"
Cohesion: 0.16
Nodes (24): AFRICA_POLYS, ENCLAVE_POLYS, GLOBE_NEIGHBOR_LABELS, GLOBE_PROVINCES, NEIGHBOR_POLYS, PROVINCE_STYLE, ProvinceGlobeEntry, GEO_AFRICA (+16 more)

### Community 47 - "measure-idle-pacing.mjs"
Cohesion: 0.17
Nodes (5): cdp, CdpSession, ROOT, server, tab

### Community 48 - "species.ts"
Cohesion: 0.19
Nodes (29): AssembledGeometry, assembleParts(), AXIS_DEFAULT, axisId(), ball(), box(), buildBat(), buildButterfly() (+21 more)

### Community 49 - "placesInteriors.ts"
Cohesion: 0.09
Nodes (50): buildThemedInterior(), bx(), co(), colonnade(), compactShell(), cy(), emptyMats(), fBench() (+42 more)

### Community 50 - "qualityBenchmark.ts"
Cohesion: 0.14
Nodes (11): BenchmarkConfig, BenchmarkTier, CachedBenchmark, computeFrameStats(), DEFAULT_BENCHMARK_CONFIG, FrameStats, FrameTimeBenchmark, percentile() (+3 more)

### Community 51 - "daylightBirds.ts"
Cohesion: 0.13
Nodes (13): computeBirdSpawnIntervalSec(), computeFoliageSwayAngle(), computeFoliageWindStrength(), isDaylightForBirds(), BIOME_PALETTES, BirdAgent, BirdPalette, BirdState (+5 more)

### Community 52 - "compare-metrics.mjs"
Cohesion: 0.12
Nodes (12): fakeCtx, rows, after, afterByKey, before, breaches, key(), mean() (+4 more)

### Community 53 - "ref_node_assert"
Cohesion: 0.17
Nodes (8): IDLES, KINDS, SEASONS, WILDLIFE, bridgeStayAnchors(), catenaryArchHeight(), StayAnchor, VISUAL_FIELDS

### Community 54 - "timePresets.ts"
Cohesion: 0.43
Nodes (5): GOLDEN_HOUR_END, GOLDEN_HOUR_START, TIME_PRESETS, TimePreset, TimePresetKey

### Community 55 - "weatherScene.ts"
Cohesion: 0.33
Nodes (9): getSeasonMonth(), isSpeciesBlooming(), monthToSeasonWeights(), normalizeMonth(), PLANT_SPECIES, PlantSpecies, PlantSpeciesInfo, SeasonWeights (+1 more)

### Community 57 - "WebGPUSceneRenderer"
Cohesion: 0.05
Nodes (13): MiniatureGradeOptions, createSceneRenderer(), WebGPUSceneRenderer, RendererSelection, WebGPUCompat, BloomModule, DOFModule, makeUniforms() (+5 more)

### Community 58 - "tide.test.ts"
Cohesion: 0.60
Nodes (4): computeCoastalTideOffset(), TIDE_CENTER_OFFSET, TIDE_HALF_AMPLITUDE, TIDE_WAVE_AMPLITUDE

### Community 59 - "capture-visual-matrix.mjs"
Cohesion: 0.32
Nodes (7): captureState(), Cdp, main(), parseCli(), sampleEval(), sleep(), stateEval()

### Community 61 - "weatherScene.ts"
Cohesion: 0.18
Nodes (13): clamp01(), LiveWeatherVisual, liveWeatherVisual(), MID_MONTH_DAY, solarDeclination(), southernSunDirection(), KELVIN_KEY_MIX, KELVIN_LIGHTING (+5 more)

### Community 62 - "PlacesOverlay.tsx"
Cohesion: 0.11
Nodes (27): EditorialMarkers(), EditorialSources(), MOBILE_WEATHER_ICONS, placeCardCondition(), PlacesOverlay(), PlacesOverlayProps, QUICK_TIMES, WEATHER_MODES (+19 more)

### Community 63 - "run"
Cohesion: 0.32
Nodes (5): CDP, clickAria(), listTargets(), run(), sleep()

### Community 64 - "motion.ts"
Cohesion: 0.07
Nodes (45): motion, @phosphor-icons/react, react, react-dom, ambientAudio, CARDINAL_TARGETS, CARDINALS_8, Compass() (+37 more)

### Community 65 - "placesScene.ts"
Cohesion: 0.19
Nodes (14): OsmPlaceData, OsmSliceResult, createPlacesScene(), ExplorerInfo, HERO_CAM, HERO_TARGET, PlacesController, createPlacesShaderEnv() (+6 more)

### Community 66 - "siteAtmosphere.ts"
Cohesion: 0.19
Nodes (13): AtmosphereEffect, AtmosphereLayer, AtmosphereProfile, AtmosphereSceneController, AtmosphereUpdateOptions, BIOME_EFFECTS, createAtmosphereScene(), effectOpacity() (+5 more)

### Community 67 - "check-exposure.mjs"
Cohesion: 0.22
Nodes (8): dir, evaluate(), files, pending, send(), target, { values, positionals }, ws

### Community 68 - "uiSafeArea.ts"
Cohesion: 0.23
Nodes (12): Sheet(), clearSafeArea(), EMPTY, getSafeArea(), listeners, merged(), onSafeAreaChange(), publish() (+4 more)

### Community 69 - "budget.ts"
Cohesion: 0.14
Nodes (10): CREATURE_TIER_CAPS, CREATURE_TIER_LABELS, CreatureBudget, CreatureBudgetStats, CreaturePriority, CreatureReservation, PRIORITY_WEIGHT, TierCaps (+2 more)

### Community 70 - "contact-sheet.ts"
Cohesion: 0.25
Nodes (8): build(), engine, grid, hour, params, stage, status, syncButtons()

### Community 71 - "framePacing.ts"
Cohesion: 0.31
Nodes (8): DEFAULT_QUIET_SECONDS, FramePacingInput, frameThrottleMs(), IDLE_QUIET_MS, IDLE_REDUCED_MS, IDLE_SOFTWARE_MS, stageQuiet(), StageQuietInput

### Community 73 - ".constructor"
Cohesion: 0.21
Nodes (10): angularDistance(), createRng(), easeOutBack(), hashString(), mulberry32(), poissonInterval(), ScatterOptions, scatterRing() (+2 more)

### Community 74 - "run-qa-capture.mjs"
Cohesion: 0.11
Nodes (15): devDependencies, playwright@^1.65.1, puppeteer@^25.18.1, puppeteer, outDir, results, viewports, startQaServer() (+7 more)

### Community 75 - "make-contact-sheet.mjs"
Cohesion: 0.53
Nodes (4): delta(), loadStats(), main(), parseCli()

### Community 76 - "CreatureField"
Cohesion: 0.13
Nodes (5): angleDelta(), CreatureField, SpeciesId, CreatureAnimState, encodeCreatureState()

### Community 77 - "n8ao.d.ts"
Cohesion: 0.25
Nodes (4): n8ao, N8AOPass, N8AOPassConfiguration, N8AOQualityMode

### Community 78 - "field.ts"
Cohesion: 0.17
Nodes (13): CreatureEffectsStats, DEFAULT_DUST_COLOR, DEFAULT_RIPPLE_COLOR, DEFAULT_SPLASH_COLOR, POOL_CAPS, CreatureFieldOptions, CreatureFieldStats, M_PERCH (+5 more)

### Community 80 - "createWebGPUCompat"
Cohesion: 0.18
Nodes (19): ALPHA_UNIFORMS, COLOR_UNIFORMS, createWebGPUCompat(), convert(), findAlphaUniform(), findColorUniform(), findIntensityUniform(), tryGroundSheen() (+11 more)

### Community 81 - "LandmarkBiome"
Cohesion: 0.26
Nodes (8): extractRegionName(), WildlifeSpot, AnimalIdle, AnimalKind, AnimalSeason, HabitatEntry, AtmosphereSite, LandmarkBiome

### Community 82 - "biomePalette.ts"
Cohesion: 0.12
Nodes (20): BIOME_FALLBACK, normalizeRuleKey(), REGIONAL_PALETTES, RegionalPalette, RegionalPaletteKey, resolveRegionalPalette(), rule(), SITE_RULES (+12 more)

### Community 85 - "markSharedGeo"
Cohesion: 0.18
Nodes (11): addLampWaterReflections(), addWetRoadStreaks(), getLampBulbGeo(), getLampConeGeo(), getLampHaloGeo(), getLampHardwareGeo(), getLampPoolGeo(), getLampReflectionGeo() (+3 more)

### Community 86 - "creaturesLab.ts"
Cohesion: 0.12
Nodes (17): KEY_DAY, KEY_NIGHT, KEY_WARM, labelled(), mountCreaturesLab(), SKY_DAWN, SKY_DAY, SKY_DUSK (+9 more)

### Community 87 - "cloudShape.ts"
Cohesion: 0.36
Nodes (7): cloudOpacity(), LOBES, sampleCloudDensity(), smoothstep(), addDioramaClouds(), getDioramaCloudMat(), getDioramaCloudTexture()

### Community 92 - "nativeHost.ts"
Cohesion: 0.31
Nodes (6): detectNativeHost(), hasCinematicHost(), isHost(), NativeCinematicHost, nativeHostUrl(), Window

### Community 93 - "addCraftedRim"
Cohesion: 0.36
Nodes (8): addCraftedRim(), addRimEdgeContinuity(), addSquareRim(), getRimMaterial(), getRimPalette(), paintRadial(), paintStrata(), rimEdgeColor()

### Community 98 - "InfoDrawer.tsx"
Cohesion: 0.11
Nodes (26): formatCoords(), INFO_TABS, InfoDrawer(), InfoDrawerProps, InfoDrawerTab, PassportModalProps, PostcardModal(), PostcardModalProps (+18 more)

### Community 103 - "addSiteMotion"
Cohesion: 0.50
Nodes (4): addSiteMotion(), addWeatherFx(), stream(), normalMapsActive()

### Community 104 - "addWildlifeLayer"
Cohesion: 0.67
Nodes (3): getAnimalSeasonMonth(), addWildlifeLayer(), appendLayerTargets()

## Knowledge Gaps
- **7 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `three` connect `ref_node_test` to `landmarksB.ts`, `placesSliceBuilders.ts`, `placesShaders.ts`, `material.ts`, `dioramaKit.ts`, `animalKit.ts`, `lightingRig.ts`, `osmSlice.ts`, `prepareCanvasTexture`, `package.json`, `layer.ts`, `CitylitEngine.ts`, `placesClouds.ts`, `plinthKit.ts`, `vehicleLightKit.ts`, `globeScene.ts`, `species.ts`, `placesInteriors.ts`, `daylightBirds.ts`, `compare-metrics.mjs`, `WebGPUSceneRenderer`, `weatherScene.ts`, `placesScene.ts`, `siteAtmosphere.ts`, `n8ao.d.ts`, `field.ts`, `createWebGPUCompat`, `creaturesLab.ts`?**
  _High betweenness centrality (0.270) - this node is a cross-community bridge._
- **Should `landmarksB.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05603232496603018 - nodes in this community are weakly interconnected._
- **Why does `CitylitEngine` connect `CitylitEngine` to `citylit.ts`, `App.tsx`, `animalKit.ts`, `ScaleRulerModal.tsx`, `viewportFraming.ts`, `CitylitEngine.ts`, `ref_node_test`, `citylit.ts`, `plinthKit.ts`, `.frame`, `qualityBenchmark.ts`, `daylightBirds.ts`, `PMREMGeneratorLike`, `motion.ts`, `placesScene.ts`, `siteAtmosphere.ts`, `contact-sheet.ts`, `framePacing.ts`, `biomePalette.ts`?**
  _High betweenness centrality (0.078) - this node is a cross-community bridge._
- **Should `PassportModal.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.08787878787878788 - nodes in this community are weakly interconnected._
- **Why does `puppeteer` connect `run-qa-capture.mjs` to `package.json`?**
  _High betweenness centrality (0.049) - this node is a cross-community bridge._
- **Should `citylit.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06382978723404255 - nodes in this community are weakly interconnected._
- **Should `App.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.06573426573426573 - nodes in this community are weakly interconnected._