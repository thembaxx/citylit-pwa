# Graph Report - citylit-pwa  (2026-11-27)

## Corpus Check
- 227 files · ~460,745 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 11 file(s) not represented in the graph (top: .woff2 4, (none) 3, .css 2)

## Summary
- 2365 nodes · 6809 edges · 92 communities (86 shown, 6 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 236 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `aff76ebf`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- landmarksB.ts
- PassportModal.tsx
- citylit.ts
- standFootprint.ts
- server.js
- App.tsx
- placesSliceBuilders.ts
- placesShaders.ts
- lightingRig.ts
- dioramaKit.ts
- animalKit.ts
- WeatherWidget.tsx
- CitylitEngine
- compilerOptions
- standAudit.ts
- osmService.ts
- osmSlice.ts
- react
- viewportFraming.ts
- skyEvents.ts
- prepareCanvasTexture
- playwright
- package.json
- LandmarkBiome
- AmbientAudioController
- markSharedGeo
- CitylitEngine.ts
- .oxfmtrc.json
- .oxlintrc.json
- vite.config.ts
- albedoAudit.ts
- scripts
- applyDioramaUpgrade
- with
- placesClouds.ts
- createRenderer.ts
- LandmarkCard.tsx
- overrides
- capture-contact-sheets.mjs
- memory.js
- plinthProfiles.ts
- .frame
- vehicleLightKit.ts
- run
- globeScene.ts
- measure-idle-pacing.mjs
- species.ts
- placesInteriors.ts
- qualityBenchmark.ts
- DaylightBirdsController
- compare-metrics.mjs
- globalIllumination.ts
- TopBar.tsx
- weatherScene.ts
- plinthKit.ts
- WebGPUSceneRenderer
- ref_node_assert
- capture-visual-matrix.mjs
- WebGLSceneRenderer
- standFootprint.ts
- postfx.ts
- run
- InfoDrawer.tsx
- placesScene.ts
- siteAtmosphere.ts
- check-exposure.mjs
- react
- layer.ts
- contact-sheet.ts
- framePacing.ts
- MiniaturePass
- .constructor
- run-qa-capture.mjs
- make-contact-sheet.mjs
- CreatureField
- n8ao.d.ts
- addWildlifeLayer
- createWebGPUCompat
- webgpuCompat.ts
- timePresets.ts
- biomePalette.ts
- tide.test.ts
- pastdotdev
- creaturesLab.ts
- cloudShape.ts
- nativeHost.ts
- addCraftedRim
- ScaleRulerModal.tsx
- addSiteMotion

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
- `SearchSheetProps` --references--> `LatLon`  [EXTRACTED]
  src/components/SearchSheet.tsx → src/services/osmService.ts
- `TopBarProps` --references--> `ThemeSetting`  [EXTRACTED]
  src/components/TopBar.tsx → src/types/citylit.ts
- `AtmosphereSite` --references--> `LandmarkBiome`  [EXTRACTED]
  src/three/siteAtmosphere.ts → src/types/citylit.ts
- `CreatureEnvSnapshot` --references--> `CreatureTier`  [EXTRACTED]
  src/three/creatures/env.ts → src/three/creatures/budget.ts

## Import Cycles
- None detected.

## Communities (92 total, 6 thin omitted)

### Community 0 - "landmarksB.ts"
Cohesion: 0.06
Nodes (226): headingYaw(), leftLaneOffset(), normalizePlanar(), PlanarVector, registerBeacons(), addAnchor(), addBaseScatter(), addBollards() (+218 more)

### Community 1 - "PassportModal.tsx"
Cohesion: 0.07
Nodes (53): @phosphor-icons/react, GlobeOverlay(), GlobeOverlayProps, EditorialMarkers(), EditorialSources(), MOBILE_WEATHER_ICONS, PlacesOverlay(), PlacesOverlayProps (+45 more)

### Community 2 - "citylit.ts"
Cohesion: 0.07
Nodes (36): AnimalAudioEvent, BIOME_HAPTIC_PATTERNS, FilterBand, REGION_HAPTIC_ACCENTS, SpatialEmitter, SpatialListener, UI_CUE_CATEGORY, UiCueCategory (+28 more)

### Community 3 - "standFootprint.ts"
Cohesion: 0.21
Nodes (16): boundsFitPlinth(), boundsFitStand(), fitBoundsToPlinth(), fitBoundsToStand(), footprintInsidePolygon(), innerStandPolygon(), PlanarBounds, PLINTH_FRAME_WIDTH (+8 more)

### Community 4 - "server.js"
Cohesion: 0.20
Nodes (6): express@5.3.0, express, app, __dirname, distDir, __filename

### Community 5 - "App.tsx"
Cohesion: 0.10
Nodes (34): App(), INITIAL_GLOBE, readInitialLandmarkIndex(), readSettings(), readStoredEggs(), readStoredNotes(), readStoredSavedPlaces(), readStoredSet() (+26 more)

### Community 6 - "placesSliceBuilders.ts"
Cohesion: 0.10
Nodes (34): catmullRom(), RoadControlPoint, RoadSample, sampleRoadRibbon(), createTerrainHeightSampler(), getGrassMaterial(), createCutawayWaterTopMaterial(), createCutawayWaterWallMaterial() (+26 more)

### Community 7 - "placesShaders.ts"
Cohesion: 0.13
Nodes (21): bindVolumetricFogUniforms(), patchPlacesVolumetricFog(), PlacesSliceEmitterSpec, WaterConfluenceSpec, WaterTideSpec, CLOUD_FRAGMENT, CLOUD_VERTEX, NOISE_GLSL (+13 more)

### Community 8 - "lightingRig.ts"
Cohesion: 0.10
Nodes (24): AUTO_EXPOSURE_ADAPT_RATE, BIOME_BOUNCE_COLORS, bounceDayTmp, bounceMixTmp, bounceNightTmp, DIORAMA_SHADOW_EXTENT, GOD_RAY_STRENGTH, GOD_RAYS_ENABLED (+16 more)

### Community 9 - "dioramaKit.ts"
Cohesion: 0.05
Nodes (40): STAND_BLOCK_HALF, accentFor(), AnchorKind, CorniceBandSpec, DioramaFx, DoorSurroundSpec, FacadeWindowSpec, FALLBACK_PROFILE (+32 more)

### Community 10 - "animalKit.ts"
Cohesion: 0.08
Nodes (32): advanceAnimalTime(), AnimalLodSpec, AnimalMember, AnimalPose, AnimalScaffold, AnimalScaffoldSpec, animalSeasonForMonth(), AnimalVec3 (+24 more)

### Community 11 - "WeatherWidget.tsx"
Cohesion: 0.07
Nodes (47): HourlyForecast(), HourlyForecastProps, WeatherIcon(), pad2(), PRESET_ICONS, PresetKey, SKY_EVENT_ICON, TIME_PRESETS (+39 more)

### Community 12 - "CitylitEngine"
Cohesion: 0.06
Nodes (6): CompassProps, setContactShadowFade(), SwayItem, WetMaterialEntry, CitylitEngine, fitDioramaShadowBounds()

### Community 13 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowImportingTsExtensions, isolatedModules, jsx, lib, module, moduleDetection, moduleResolution (+10 more)

### Community 14 - "standAudit.ts"
Cohesion: 0.36
Nodes (5): auditStandContainment(), isStandGeometry(), labelFor(), StandAuditOptions, StandOverflow

### Community 15 - "osmService.ts"
Cohesion: 0.14
Nodes (17): cacheKey(), fallbackPatch(), GEO_CACHE, loadElevation(), loadOsmPlace(), LocalPoint, MEMORY_CACHE, OsmArea (+9 more)

### Community 16 - "osmSlice.ts"
Cohesion: 0.19
Nodes (16): StreetLampSpec, centroid(), clamp(), createOsmSlice(), createRibbon(), OsmSliceResult, pointOnRoad(), polygonShape() (+8 more)

### Community 17 - "react"
Cohesion: 0.10
Nodes (26): motion, react, ambientAudio, CARDINAL_TARGETS, CARDINALS_8, Compass(), formatBearing(), TICKS (+18 more)

### Community 18 - "viewportFraming.ts"
Cohesion: 0.10
Nodes (24): clampShift(), EMPTY_INSETS, FramingPlan, freeFitFactor(), freeRect(), isCompactViewport(), LayoutMode, layoutModeFor() (+16 more)

### Community 19 - "skyEvents.ts"
Cohesion: 0.21
Nodes (15): dayIndex(), daysInMonth(), entryIntensity(), EVENT_PRIORITY, formatWhen(), getSkyEvent(), getUpcomingSkyEvents(), MONTH_LABELS (+7 more)

### Community 20 - "prepareCanvasTexture"
Cohesion: 0.07
Nodes (57): getRoofDirtMap(), windowPaneMaterial(), applyDissolveToShader(), cascadeize(), flagWindy(), getBrushedNormalTexture(), getBrushedRoughnessTexture(), getCanvasBumpTexture() (+49 more)

### Community 21 - "playwright"
Cohesion: 0.08
Nodes (21): playwright, errors, errors, names, errors, failed, report, sites (+13 more)

### Community 22 - "package.json"
Cohesion: 0.07
Nodes (39): dependencies, goeist@0.1.0, motion@14.14.0, n8ao@2.1.0, oxfmt@0.79.0, oxlint@1.94.0, @phosphor-icons/react@2.1.10, react@19.3.1 (+31 more)

### Community 23 - "LandmarkBiome"
Cohesion: 0.14
Nodes (22): IDLES, KINDS, SEASONS, WILDLIFE, WildlifeSpot, DAY, AnimalIdle, AnimalKind (+14 more)

### Community 24 - "AmbientAudioController"
Cohesion: 0.09
Nodes (8): AmbientAudioController, clamp01(), equalPower(), extractRegionName(), smoothBell(), smoothstep(), SiteProfile, AmbientSiteProfile

### Community 25 - "markSharedGeo"
Cohesion: 0.18
Nodes (11): addLampWaterReflections(), addWetRoadStreaks(), getLampBulbGeo(), getLampConeGeo(), getLampHaloGeo(), getLampHardwareGeo(), getLampPoolGeo(), getLampReflectionGeo() (+3 more)

### Community 26 - "CitylitEngine.ts"
Cohesion: 0.05
Nodes (48): BeaconAnchor, beaconGeo, collectBeacons(), createBeaconMesh(), LANDMARK_BUILDERS, resetSceneDynamicLists(), audioForward, audioRight (+40 more)

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
Cohesion: 0.18
Nodes (18): addEdgeWaterfall(), addScaleReference(), addSoaringBirds(), addSquareWaterPlate(), applyDioramaUpgrade(), buildSpatialSources(), finalizeLandmarkGroup(), getSiteProfile() (+10 more)

### Community 33 - "with"
Cohesion: 0.11
Nodes (17): jobs, verify, name, on, pull_request, push, branches, name (+9 more)

### Community 34 - "placesClouds.ts"
Cohesion: 0.29
Nodes (7): CloudDrift, cloudDrift(), CloudAssets, CloudPuffInstance, createCloudPuffMesh(), createSliceCloudLayer(), SliceCloudLayer

### Community 35 - "createRenderer.ts"
Cohesion: 0.12
Nodes (13): createWebGLRendererSelection(), decideRendererBackend(), GPUCapableNavigator, readRendererPreference(), RendererProbe, selectRenderer(), StubWindow, wantsMsaa() (+5 more)

### Community 36 - "LandmarkCard.tsx"
Cohesion: 0.06
Nodes (45): GalleryDialog(), GalleryModal(), GalleryModalProps, airQualityInsight(), CAMERA_PRESETS, cardContentVariants, CARDINALS, cardItemVariants (+37 more)

### Community 37 - "overrides"
Cohesion: 0.33
Nodes (5): allowBuilds, puppeteer, overrides, three, workbox-build>glob

### Community 38 - "capture-contact-sheets.mjs"
Cohesion: 0.17
Nodes (16): acquirePageTarget(), BASELINE_PATH, captureHour(), CdpSession, checkPerfGuardrails(), HOUR_KEYS, main(), pad() (+8 more)

### Community 39 - "memory.js"
Cohesion: 0.36
Nodes (11): createMemoryMiddleware(), getClient(), HttpError, isTimestamp(), optionalEnum(), optionalInt(), optionalString(), pick() (+3 more)

### Community 40 - "plinthProfiles.ts"
Cohesion: 0.28
Nodes (14): clamp(), bouldersGroundHeight(), fbm2(), getPilotGroundHeightFn(), hash2(), krugerGroundHeight(), noise2(), orlandoGroundHeight() (+6 more)

### Community 42 - ".frame"
Cohesion: 0.10
Nodes (5): setSpatialListener(), updateBounceLightMood(), updateRimLight(), updateShadowMood(), SceneRenderer

### Community 44 - "vehicleLightKit.ts"
Cohesion: 0.16
Nodes (16): getCarHeadlightMat(), getCarPoolMat(), getCarTaillightMat(), createVehicleLightBatch(), ensureLightGeometries(), LightGeometries, markLightMesh(), placeInstance() (+8 more)

### Community 45 - "run"
Cohesion: 0.38
Nodes (5): CDP, i0(), listTargets(), run(), sleep()

### Community 46 - "globeScene.ts"
Cohesion: 0.15
Nodes (25): three, AFRICA_POLYS, ENCLAVE_POLYS, GLOBE_NEIGHBOR_LABELS, GLOBE_PROVINCES, NEIGHBOR_POLYS, PROVINCE_STYLE, ProvinceGlobeEntry (+17 more)

### Community 47 - "measure-idle-pacing.mjs"
Cohesion: 0.17
Nodes (5): cdp, CdpSession, ROOT, server, tab

### Community 48 - "species.ts"
Cohesion: 0.17
Nodes (31): CreatureAnimation, AssembledGeometry, assembleParts(), AXIS_DEFAULT, axisId(), ball(), box(), buildBat() (+23 more)

### Community 49 - "placesInteriors.ts"
Cohesion: 0.08
Nodes (54): BESPOKE_INTERIORS, BespokeInteriorContext, buildThemedInterior(), bx(), co(), colonnade(), compactShell(), cy() (+46 more)

### Community 50 - "qualityBenchmark.ts"
Cohesion: 0.09
Nodes (14): BenchmarkConfig, BenchmarkTier, CachedBenchmark, computeFrameStats(), DEFAULT_BENCHMARK_CONFIG, FrameStats, FrameTimeBenchmark, percentile() (+6 more)

### Community 51 - "DaylightBirdsController"
Cohesion: 0.13
Nodes (13): computeBirdSpawnIntervalSec(), computeFoliageSwayAngle(), computeFoliageWindStrength(), isDaylightForBirds(), BIOME_PALETTES, BirdAgent, BirdPalette, BirdState (+5 more)

### Community 52 - "compare-metrics.mjs"
Cohesion: 0.12
Nodes (12): fakeCtx, rows, after, afterByKey, before, breaches, key(), mean() (+4 more)

### Community 53 - "globalIllumination.ts"
Cohesion: 0.08
Nodes (13): attachEquirect(), buildProbeData(), Equirect, HORIZ_DIRS, installGI(), probeGrid, probeOrigin, probeSize (+5 more)

### Community 54 - "TopBar.tsx"
Cohesion: 0.18
Nodes (15): AudioVisualizerBar(), AudioVisualizerBarProps, DARK_PALETTE, LIGHT_PALETTE, DAYLIGHT_END_HOUR, DAYLIGHT_START_HOUR, msUntilNextThemeBoundary(), resolveAutoTheme() (+7 more)

### Community 55 - "weatherScene.ts"
Cohesion: 0.27
Nodes (11): getSeasonMonth(), isSpeciesBlooming(), monthToSeasonWeights(), normalizeMonth(), PLANT_SPECIES, PlantSpecies, PlantSpeciesInfo, SeasonWeights (+3 more)

### Community 56 - "plinthKit.ts"
Cohesion: 0.18
Nodes (18): formatDmsCoords(), getPlinthOutlinePoints, mapDomainToPlinth, PlinthSiteSpec, UndergroundStoryKind, TerrainNormal, terrainNormalFromTangents(), TerrainTangent (+10 more)

### Community 57 - "WebGPUSceneRenderer"
Cohesion: 0.07
Nodes (4): WebGPUSceneRenderer, WebGPUCompat, makeUniforms(), WebGPUPostFX

### Community 58 - "ref_node_assert"
Cohesion: 0.18
Nodes (9): condenseHistoryText(), splitSentences(), bridgeStayAnchors(), catenaryArchHeight(), StayAnchor, MID_MONTH_DAY, solarDeclination(), southernSunDirection() (+1 more)

### Community 59 - "capture-visual-matrix.mjs"
Cohesion: 0.32
Nodes (7): captureState(), Cdp, main(), parseCli(), sampleEval(), sleep(), stateEval()

### Community 61 - "standFootprint.ts"
Cohesion: 0.26
Nodes (15): clamp(), clampToStand(), getStandOutlinePoints(), mapStandDomain(), pointInStandPolygon(), smoothstep(), STAND_EDGE_ALLOWANCE, STAND_HALF (+7 more)

### Community 62 - "postfx.ts"
Cohesion: 0.11
Nodes (15): createDitherPass(), createMiniaturePass(), DitherShader, fallbackDepth, MiniatureBlurShader, MiniatureGradeOptions, MiniatureShader, MiniatureTuning (+7 more)

### Community 63 - "run"
Cohesion: 0.32
Nodes (5): CDP, clickAria(), listTargets(), run(), sleep()

### Community 64 - "InfoDrawer.tsx"
Cohesion: 0.07
Nodes (41): formatCoords(), INFO_TABS, InfoDrawer(), InfoDrawerProps, InfoDrawerTab, CATEGORY_COLORS, PASSPORT_TABS, PassportModal() (+33 more)

### Community 65 - "placesScene.ts"
Cohesion: 0.15
Nodes (17): HIGHLIGHT_COLORS, OsmPlaceData, createPlacesScene(), ExplorerInfo, HERO_CAM, HERO_TARGET, PlacesController, createPlacesShaderEnv() (+9 more)

### Community 66 - "siteAtmosphere.ts"
Cohesion: 0.17
Nodes (14): AtmosphereEffect, AtmosphereLayer, AtmosphereProfile, AtmosphereSceneController, AtmosphereSite, AtmosphereUpdateOptions, BIOME_EFFECTS, createAtmosphereScene() (+6 more)

### Community 67 - "check-exposure.mjs"
Cohesion: 0.22
Nodes (8): dir, evaluate(), files, pending, send(), target, { values, positionals }, ws

### Community 68 - "react"
Cohesion: 0.12
Nodes (20): react-dom, Sheet(), SheetProps, SheetSide, useFocusTrap(), shouldDismiss(), Z, clearSafeArea() (+12 more)

### Community 69 - "layer.ts"
Cohesion: 0.07
Nodes (27): addCreatureLife(), CREATURE_TIER_CAPS, CREATURE_TIER_LABELS, CreatureBudget, CreatureBudgetStats, CreaturePriority, CreatureReservation, CreatureTier (+19 more)

### Community 70 - "contact-sheet.ts"
Cohesion: 0.25
Nodes (8): build(), engine, grid, hour, params, stage, status, syncButtons()

### Community 71 - "framePacing.ts"
Cohesion: 0.31
Nodes (8): DEFAULT_QUIET_SECONDS, FramePacingInput, frameThrottleMs(), IDLE_QUIET_MS, IDLE_REDUCED_MS, IDLE_SOFTWARE_MS, stageQuiet(), StageQuietInput

### Community 73 - ".constructor"
Cohesion: 0.19
Nodes (10): angularDistance(), createRng(), easeOutBack(), hashString(), mulberry32(), poissonInterval(), ScatterOptions, scatterRing() (+2 more)

### Community 74 - "run-qa-capture.mjs"
Cohesion: 0.11
Nodes (15): devDependencies, playwright@^1.65.1, puppeteer@^25.18.1, puppeteer, outDir, results, viewports, startQaServer() (+7 more)

### Community 75 - "make-contact-sheet.mjs"
Cohesion: 0.53
Nodes (4): delta(), loadStats(), main(), parseCli()

### Community 76 - "CreatureField"
Cohesion: 0.10
Nodes (20): angleDelta(), CreatureField, CreatureFieldOptions, CreatureFieldStats, M_PERCH, CreatureZone, SpeciesId, createCreatureMaterial() (+12 more)

### Community 77 - "n8ao.d.ts"
Cohesion: 0.25
Nodes (4): n8ao, N8AOPass, N8AOPassConfiguration, N8AOQualityMode

### Community 78 - "addWildlifeLayer"
Cohesion: 0.67
Nodes (3): getAnimalSeasonMonth(), addWildlifeLayer(), appendLayerTargets()

### Community 79 - "createWebGPUCompat"
Cohesion: 0.41
Nodes (12): createWebGPUCompat(), convert(), findAlphaUniform(), findColorUniform(), findIntensityUniform(), tryGroundSheen(), tryHorizonRing(), trySkyMaterial() (+4 more)

### Community 80 - "webgpuCompat.ts"
Cohesion: 0.25
Nodes (7): ALPHA_UNIFORMS, COLOR_UNIFORMS, INTENSITY_UNIFORMS, TSLModule, UniformLink, UV_MAP_KEYS, WebGPUModule

### Community 81 - "timePresets.ts"
Cohesion: 0.43
Nodes (5): GOLDEN_HOUR_END, GOLDEN_HOUR_START, TIME_PRESETS, TimePreset, TimePresetKey

### Community 82 - "biomePalette.ts"
Cohesion: 0.12
Nodes (20): BIOME_FALLBACK, normalizeRuleKey(), REGIONAL_PALETTES, RegionalPalette, RegionalPaletteKey, resolveRegionalPalette(), rule(), SITE_RULES (+12 more)

### Community 83 - "tide.test.ts"
Cohesion: 0.60
Nodes (4): computeCoastalTideOffset(), TIDE_CENTER_OFFSET, TIDE_HALF_AMPLITUDE, TIDE_WAVE_AMPLITUDE

### Community 86 - "creaturesLab.ts"
Cohesion: 0.08
Nodes (23): KEY_DAY, KEY_NIGHT, KEY_WARM, labelled(), mountCreaturesLab(), SKY_DAWN, SKY_DAY, SKY_DUSK (+15 more)

### Community 87 - "cloudShape.ts"
Cohesion: 0.36
Nodes (7): cloudOpacity(), LOBES, sampleCloudDensity(), smoothstep(), addDioramaClouds(), getDioramaCloudMat(), getDioramaCloudTexture()

### Community 92 - "nativeHost.ts"
Cohesion: 0.31
Nodes (6): detectNativeHost(), hasCinematicHost(), isHost(), NativeCinematicHost, nativeHostUrl(), Window

### Community 93 - "addCraftedRim"
Cohesion: 0.36
Nodes (8): addCraftedRim(), addRimEdgeContinuity(), addSquareRim(), getRimMaterial(), getRimPalette(), paintRadial(), paintStrata(), rimEdgeColor()

### Community 98 - "ScaleRulerModal.tsx"
Cohesion: 0.12
Nodes (23): barWidth(), REFERENCE_OPTIONS, RulerRow, RulerScale, RulerSort, SCALE_OPTIONS, ScaleRulerModal(), ScaleRulerModalProps (+15 more)

### Community 103 - "addSiteMotion"
Cohesion: 0.33
Nodes (6): addSiteMotion(), addWeatherFx(), createContactShadowMaterial(), stream(), getSoftTexture(), normalMapsActive()

## Knowledge Gaps
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `three` connect `globeScene.ts` to `landmarksB.ts`, `placesSliceBuilders.ts`, `placesShaders.ts`, `lightingRig.ts`, `dioramaKit.ts`, `animalKit.ts`, `WeatherWidget.tsx`, `standAudit.ts`, `osmSlice.ts`, `prepareCanvasTexture`, `package.json`, `CitylitEngine.ts`, `placesClouds.ts`, `createRenderer.ts`, `vehicleLightKit.ts`, `species.ts`, `placesInteriors.ts`, `DaylightBirdsController`, `compare-metrics.mjs`, `globalIllumination.ts`, `plinthKit.ts`, `postfx.ts`, `placesScene.ts`, `siteAtmosphere.ts`, `layer.ts`, `CreatureField`, `n8ao.d.ts`, `webgpuCompat.ts`, `creaturesLab.ts`?**
  _High betweenness centrality (0.246) - this node is a cross-community bridge._
- **Should `landmarksB.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05719994080213112 - nodes in this community are weakly interconnected._
- **Why does `CitylitEngine` connect `CitylitEngine` to `citylit.ts`, `standFootprint.ts`, `App.tsx`, `animalKit.ts`, `WeatherWidget.tsx`, `react`, `viewportFraming.ts`, `CitylitEngine.ts`, `createRenderer.ts`, `LandmarkCard.tsx`, `.frame`, `qualityBenchmark.ts`, `DaylightBirdsController`, `globalIllumination.ts`, `postfx.ts`, `placesScene.ts`, `siteAtmosphere.ts`, `contact-sheet.ts`, `framePacing.ts`, `MiniaturePass`, `biomePalette.ts`, `.dispose`, `ScaleRulerModal.tsx`?**
  _High betweenness centrality (0.094) - this node is a cross-community bridge._
- **Should `PassportModal.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.06605222734254992 - nodes in this community are weakly interconnected._
- **Why does `puppeteer` connect `run-qa-capture.mjs` to `package.json`?**
  _High betweenness centrality (0.060) - this node is a cross-community bridge._
- **Should `citylit.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.07317073170731707 - nodes in this community are weakly interconnected._
- **Should `App.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.09619450317124736 - nodes in this community are weakly interconnected._