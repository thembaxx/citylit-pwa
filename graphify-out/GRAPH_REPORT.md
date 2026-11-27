# Graph Report - citylit-pwa  (2026-11-27)

## Corpus Check
- 227 files · ~461,216 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 11 file(s) not represented in the graph (top: .woff2 4, (none) 3, .css 2)

## Summary
- 2367 nodes · 6814 edges · 97 communities (89 shown, 8 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 236 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `439a3e09`
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
- motion.ts
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
- PassportModal.tsx
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
- CreatureTier
- siteAtmosphere.ts
- check-exposure.mjs
- react
- budget.ts
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
- field.ts
- biomePalette.ts
- globeData.ts
- .dispose
- pastdotdev
- creaturesLab.ts
- cloudShape.ts
- LandmarkBiome
- WebGPUPostFX
- roadRibbon.ts
- solarPosition.ts
- nativeHost.ts
- addCraftedRim
- terrainHeight.ts
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
- `CompassProps` --references--> `CitylitEngine`  [EXTRACTED]
  src/components/Compass.tsx → src/three/CitylitEngine.ts
- `AtmosphereSite` --references--> `LandmarkBiome`  [EXTRACTED]
  src/three/siteAtmosphere.ts → src/types/citylit.ts
- `CreatureEnvSnapshot` --references--> `CreatureTier`  [EXTRACTED]
  src/three/creatures/env.ts → src/three/creatures/budget.ts
- `currentTimeBand()` --calls--> `timeBandForHour()`  [EXTRACTED]
  src/three/creatures/env.ts → src/three/creatures/habitat.ts

## Import Cycles
- None detected.

## Communities (97 total, 8 thin omitted)

### Community 0 - "landmarksB.ts"
Cohesion: 0.06
Nodes (225): headingYaw(), leftLaneOffset(), normalizePlanar(), PlanarVector, registerBeacons(), addAnchor(), addBaseScatter(), addBollards() (+217 more)

### Community 1 - "PassportModal.tsx"
Cohesion: 0.06
Nodes (54): @phosphor-icons/react, GlobeOverlay(), GlobeOverlayProps, EditorialMarkers(), EditorialSources(), MOBILE_WEATHER_ICONS, PlacesOverlay(), PlacesOverlayProps (+46 more)

### Community 2 - "citylit.ts"
Cohesion: 0.07
Nodes (35): ambientAudio, AnimalAudioEvent, BIOME_HAPTIC_PATTERNS, FilterBand, REGION_HAPTIC_ACCENTS, SpatialEmitter, SpatialListener, UI_CUE_CATEGORY (+27 more)

### Community 3 - "standFootprint.ts"
Cohesion: 0.21
Nodes (16): boundsFitPlinth(), boundsFitStand(), fitBoundsToPlinth(), fitBoundsToStand(), footprintInsidePolygon(), innerStandPolygon(), PlanarBounds, PLINTH_FRAME_WIDTH (+8 more)

### Community 4 - "server.js"
Cohesion: 0.20
Nodes (6): express@5.3.0, express, app, __dirname, distDir, __filename

### Community 5 - "App.tsx"
Cohesion: 0.07
Nodes (46): App(), INITIAL_GLOBE, readInitialLandmarkIndex(), readSettings(), readStoredEggs(), readStoredNotes(), readStoredSavedPlaces(), readStoredSet() (+38 more)

### Community 6 - "placesSliceBuilders.ts"
Cohesion: 0.13
Nodes (31): getGrassMaterial(), createCutawayWaterTopMaterial(), createCutawayWaterWallMaterial(), createSliceMistMaterial(), CutawayWaterOptions, getOrlandoMuralTexture(), addInstancedFlowers(), addInstancedRocks() (+23 more)

### Community 7 - "placesShaders.ts"
Cohesion: 0.13
Nodes (21): bindVolumetricFogUniforms(), patchPlacesVolumetricFog(), PlacesSliceEmitterSpec, WaterConfluenceSpec, WaterTideSpec, CLOUD_FRAGMENT, CLOUD_VERTEX, NOISE_GLSL (+13 more)

### Community 8 - "lightingRig.ts"
Cohesion: 0.09
Nodes (27): AUTO_EXPOSURE_ADAPT_RATE, BIOME_BOUNCE_COLORS, bounceDayTmp, bounceMixTmp, bounceNightTmp, DIORAMA_SHADOW_EXTENT, GOD_RAY_STRENGTH, GOD_RAYS_ENABLED (+19 more)

### Community 9 - "dioramaKit.ts"
Cohesion: 0.05
Nodes (37): accentFor(), AnchorKind, CorniceBandSpec, DioramaFx, DoorSurroundSpec, FacadeWindowSpec, FALLBACK_PROFILE, getLampBulbMat() (+29 more)

### Community 10 - "animalKit.ts"
Cohesion: 0.08
Nodes (32): advanceAnimalTime(), AnimalLodSpec, AnimalMember, AnimalPose, AnimalScaffold, AnimalScaffoldSpec, animalSeasonForMonth(), AnimalVec3 (+24 more)

### Community 11 - "WeatherWidget.tsx"
Cohesion: 0.07
Nodes (47): HourlyForecast(), HourlyForecastProps, WeatherIcon(), pad2(), PRESET_ICONS, PresetKey, SKY_EVENT_ICON, TIME_PRESETS (+39 more)

### Community 12 - "CitylitEngine"
Cohesion: 0.06
Nodes (8): resetSceneDynamicLists(), setContactShadowFade(), SwayItem, WetMaterialEntry, CitylitEngine, streetLampNightFactor(), sunAltitudeDeg(), NoteCategory

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
Cohesion: 0.11
Nodes (30): HIGHLIGHT_COLORS, OsmPlaceData, StreetLampSpec, centroid(), clamp(), createOsmSlice(), createRibbon(), OsmSliceResult (+22 more)

### Community 17 - "motion.ts"
Cohesion: 0.07
Nodes (40): motion, react, AudioVisualizerBar(), AudioVisualizerBarProps, DARK_PALETTE, LIGHT_PALETTE, CARDINAL_TARGETS, CARDINALS_8 (+32 more)

### Community 18 - "viewportFraming.ts"
Cohesion: 0.10
Nodes (25): clampShift(), EMPTY_INSETS, FramingPlan, freeFitFactor(), freeRect(), isCompactViewport(), LayoutMode, layoutModeFor() (+17 more)

### Community 19 - "skyEvents.ts"
Cohesion: 0.21
Nodes (15): dayIndex(), daysInMonth(), entryIntensity(), EVENT_PRIORITY, formatWhen(), getSkyEvent(), getUpcomingSkyEvents(), MONTH_LABELS (+7 more)

### Community 20 - "prepareCanvasTexture"
Cohesion: 0.07
Nodes (54): windowPaneMaterial(), applyDissolveToShader(), cascadeize(), flagWindy(), getBrushedNormalTexture(), getBrushedRoughnessTexture(), getCanvasBumpTexture(), getCanvasNormalTexture() (+46 more)

### Community 21 - "playwright"
Cohesion: 0.08
Nodes (21): playwright, errors, errors, names, errors, failed, report, sites (+13 more)

### Community 22 - "package.json"
Cohesion: 0.07
Nodes (39): dependencies, goeist@0.1.0, motion@14.14.0, n8ao@2.1.0, oxfmt@0.79.0, oxlint@1.94.0, @phosphor-icons/react@2.1.10, react@19.3.1 (+31 more)

### Community 23 - "LandmarkBiome"
Cohesion: 0.19
Nodes (19): DAY, tierDensity(), clampHour(), HabitatConditions, habitatForSpecies(), HABITATS, habitatSeasonForMonth(), matchesList() (+11 more)

### Community 24 - "AmbientAudioController"
Cohesion: 0.10
Nodes (8): AmbientAudioController, clamp01(), equalPower(), extractRegionName(), smoothBell(), smoothstep(), SiteProfile, AmbientSiteProfile

### Community 25 - "markSharedGeo"
Cohesion: 0.18
Nodes (11): addLampWaterReflections(), addWetRoadStreaks(), getLampBulbGeo(), getLampConeGeo(), getLampHaloGeo(), getLampHardwareGeo(), getLampPoolGeo(), getLampReflectionGeo() (+3 more)

### Community 26 - "CitylitEngine.ts"
Cohesion: 0.05
Nodes (46): STAND_BLOCK_HALF, computeCoastalTideOffset(), TIDE_CENTER_OFFSET, TIDE_HALF_AMPLITUDE, TIDE_WAVE_AMPLITUDE, BeaconAnchor, beaconGeo, collectBeacons() (+38 more)

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
Cohesion: 0.16
Nodes (20): addCreatureLife(), addEdgeWaterfall(), addScaleReference(), addSoaringBirds(), addSquareWaterPlate(), applyDioramaUpgrade(), buildSpatialSources(), finalizeLandmarkGroup() (+12 more)

### Community 33 - "with"
Cohesion: 0.11
Nodes (17): jobs, verify, name, on, pull_request, push, branches, name (+9 more)

### Community 34 - "placesClouds.ts"
Cohesion: 0.26
Nodes (8): CloudDrift, cloudDrift(), CloudAssets, CloudPuffInstance, createCloudPuffMesh(), createSliceCloudLayer(), SliceCloudLayer, WU

### Community 35 - "createRenderer.ts"
Cohesion: 0.12
Nodes (13): createWebGLRendererSelection(), decideRendererBackend(), GPUCapableNavigator, readRendererPreference(), RendererProbe, selectRenderer(), StubWindow, wantsMsaa() (+5 more)

### Community 36 - "LandmarkCard.tsx"
Cohesion: 0.10
Nodes (25): GalleryDialog(), GalleryModal(), GalleryModalProps, airQualityInsight(), CAMERA_PRESETS, cardContentVariants, CARDINALS, cardItemVariants (+17 more)

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
Cohesion: 0.22
Nodes (17): clamp(), bouldersGroundHeight(), fbm2(), formatDmsCoords(), getPilotGroundHeightFn(), hash2(), krugerGroundHeight(), noise2() (+9 more)

### Community 42 - ".frame"
Cohesion: 0.10
Nodes (6): updateWetSurfaces(), setSpatialListener(), updateBounceLightMood(), updateRimLight(), updateShadowMood(), SceneRenderer

### Community 44 - "vehicleLightKit.ts"
Cohesion: 0.16
Nodes (16): getCarHeadlightMat(), getCarPoolMat(), getCarTaillightMat(), createVehicleLightBatch(), ensureLightGeometries(), LightGeometries, markLightMesh(), placeInstance() (+8 more)

### Community 45 - "run"
Cohesion: 0.38
Nodes (5): CDP, i0(), listTargets(), run(), sleep()

### Community 46 - "globeScene.ts"
Cohesion: 0.32
Nodes (13): easeInOutCubic(), easeOutCubic(), GLOBE_RADIUS, latLonToVec3(), mulberry32(), pointInPoly(), provinceVisitRatio(), slerpDirection() (+5 more)

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
Nodes (22): createContactShadowMaterial(), attachEquirect(), buildProbeData(), Equirect, HORIZ_DIRS, installGI(), probeGrid, probeOrigin (+14 more)

### Community 54 - "PassportModal.tsx"
Cohesion: 0.11
Nodes (23): CATEGORY_COLORS, PASSPORT_TABS, PassportModal(), PassportModalProps, PassportTab, ProvinceRing(), ProvinceRingProps, ProvinceStatRow (+15 more)

### Community 55 - "weatherScene.ts"
Cohesion: 0.27
Nodes (11): getSeasonMonth(), isSpeciesBlooming(), monthToSeasonWeights(), normalizeMonth(), PLANT_SPECIES, PlantSpecies, PlantSpeciesInfo, SeasonWeights (+3 more)

### Community 56 - "plinthKit.ts"
Cohesion: 0.22
Nodes (15): getPlinthOutlinePoints, mapDomainToPlinth, TerrainNormal, terrainNormalFromTangents(), TerrainTangent, buildNameplateMesh(), buildPilotPlinth(), buildUndergroundStories() (+7 more)

### Community 58 - "ref_node_assert"
Cohesion: 0.16
Nodes (11): condenseHistoryText(), splitSentences(), bridgeStayAnchors(), catenaryArchHeight(), StayAnchor, GOLDEN_HOUR_END, GOLDEN_HOUR_START, TIME_PRESETS (+3 more)

### Community 59 - "capture-visual-matrix.mjs"
Cohesion: 0.32
Nodes (7): captureState(), Cdp, main(), parseCli(), sampleEval(), sleep(), stateEval()

### Community 61 - "standFootprint.ts"
Cohesion: 0.26
Nodes (15): clamp(), clampToStand(), getStandOutlinePoints(), mapStandDomain(), pointInStandPolygon(), smoothstep(), STAND_EDGE_ALLOWANCE, STAND_HALF (+7 more)

### Community 62 - "postfx.ts"
Cohesion: 0.11
Nodes (14): createMiniaturePass(), DitherShader, fallbackDepth, MiniatureBlurShader, MiniatureGradeOptions, MiniatureShader, MiniatureTuning, createSceneRenderer() (+6 more)

### Community 63 - "run"
Cohesion: 0.32
Nodes (5): CDP, clickAria(), listTargets(), run(), sleep()

### Community 64 - "InfoDrawer.tsx"
Cohesion: 0.15
Nodes (18): formatCoords(), INFO_TABS, InfoDrawer(), InfoDrawerProps, InfoDrawerTab, LANDMARK_DETAILS, LandmarkDetail, HistorySummary (+10 more)

### Community 65 - "CreatureTier"
Cohesion: 0.12
Nodes (10): CreatureTier, CreatureEffectsStats, DEFAULT_DUST_COLOR, DEFAULT_RIPPLE_COLOR, DEFAULT_SPLASH_COLOR, POOL_CAPS, CreatureLayer, CreatureLayerOptions (+2 more)

### Community 66 - "siteAtmosphere.ts"
Cohesion: 0.17
Nodes (14): AtmosphereEffect, AtmosphereLayer, AtmosphereProfile, AtmosphereSceneController, AtmosphereSite, AtmosphereUpdateOptions, BIOME_EFFECTS, createAtmosphereScene() (+6 more)

### Community 67 - "check-exposure.mjs"
Cohesion: 0.22
Nodes (8): dir, evaluate(), files, pending, send(), target, { values, positionals }, ws

### Community 68 - "react"
Cohesion: 0.12
Nodes (20): react-dom, Sheet(), SheetProps, SheetSide, useFocusTrap(), shouldDismiss(), Z, clearSafeArea() (+12 more)

### Community 69 - "budget.ts"
Cohesion: 0.14
Nodes (9): CREATURE_TIER_CAPS, CREATURE_TIER_LABELS, CreatureBudget, CreatureBudgetStats, CreaturePriority, CreatureReservation, PRIORITY_WEIGHT, TierCaps (+1 more)

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
Nodes (5): CreatureEffectsPool, angleDelta(), CreatureField, SpeciesId, SpeciesBuild

### Community 77 - "n8ao.d.ts"
Cohesion: 0.22
Nodes (5): three, n8ao, N8AOPass, N8AOPassConfiguration, N8AOQualityMode

### Community 78 - "addWildlifeLayer"
Cohesion: 0.67
Nodes (3): getAnimalSeasonMonth(), addWildlifeLayer(), appendLayerTargets()

### Community 79 - "createWebGPUCompat"
Cohesion: 0.41
Nodes (12): createWebGPUCompat(), convert(), findAlphaUniform(), findColorUniform(), findIntensityUniform(), tryGroundSheen(), tryHorizonRing(), trySkyMaterial() (+4 more)

### Community 80 - "webgpuCompat.ts"
Cohesion: 0.25
Nodes (7): ALPHA_UNIFORMS, COLOR_UNIFORMS, INTENSITY_UNIFORMS, TSLModule, UniformLink, UV_MAP_KEYS, WebGPUModule

### Community 81 - "field.ts"
Cohesion: 0.18
Nodes (15): CreatureFieldOptions, CreatureFieldStats, M_PERCH, CreatureZone, createCreatureMaterial(), CREATURE_STATE_VALUE, CREATURE_UNIFORMS, CreatureAnimState (+7 more)

### Community 82 - "biomePalette.ts"
Cohesion: 0.12
Nodes (20): BIOME_FALLBACK, normalizeRuleKey(), REGIONAL_PALETTES, RegionalPalette, RegionalPaletteKey, resolveRegionalPalette(), rule(), SITE_RULES (+12 more)

### Community 83 - "globeData.ts"
Cohesion: 0.21
Nodes (11): AFRICA_POLYS, ENCLAVE_POLYS, GLOBE_NEIGHBOR_LABELS, GLOBE_PROVINCES, NEIGHBOR_POLYS, PROVINCE_STYLE, ProvinceGlobeEntry, GEO_AFRICA (+3 more)

### Community 86 - "creaturesLab.ts"
Cohesion: 0.09
Nodes (22): KEY_DAY, KEY_NIGHT, KEY_WARM, labelled(), mountCreaturesLab(), SKY_DAWN, SKY_DAY, SKY_DUSK (+14 more)

### Community 87 - "cloudShape.ts"
Cohesion: 0.36
Nodes (7): cloudOpacity(), LOBES, sampleCloudDensity(), smoothstep(), addDioramaClouds(), getDioramaCloudMat(), getDioramaCloudTexture()

### Community 88 - "LandmarkBiome"
Cohesion: 0.26
Nodes (10): IDLES, KINDS, SEASONS, WILDLIFE, WildlifeSpot, AnimalIdle, AnimalKind, AnimalSeason (+2 more)

### Community 90 - "roadRibbon.ts"
Cohesion: 0.38
Nodes (5): catmullRom(), RoadControlPoint, RoadSample, sampleRoadRibbon(), addRoadRibbon()

### Community 91 - "solarPosition.ts"
Cohesion: 0.70
Nodes (3): MID_MONTH_DAY, solarDeclination(), southernSunDirection()

### Community 92 - "nativeHost.ts"
Cohesion: 0.31
Nodes (6): detectNativeHost(), hasCinematicHost(), isHost(), NativeCinematicHost, nativeHostUrl(), Window

### Community 93 - "addCraftedRim"
Cohesion: 0.36
Nodes (8): addCraftedRim(), addRimEdgeContinuity(), addSquareRim(), getRimMaterial(), getRimPalette(), paintRadial(), paintStrata(), rimEdgeColor()

### Community 94 - "terrainHeight.ts"
Cohesion: 0.70
Nodes (3): createTerrainHeightSampler(), createTriangulatedTerrainSampler(), TerrainGridSamplerOptions

### Community 98 - "ScaleRulerModal.tsx"
Cohesion: 0.10
Nodes (30): barWidth(), REFERENCE_OPTIONS, RulerRow, RulerScale, RulerSort, SCALE_OPTIONS, ScaleRulerModal(), ScaleRulerModalProps (+22 more)

### Community 103 - "addSiteMotion"
Cohesion: 0.50
Nodes (4): addSiteMotion(), addWeatherFx(), stream(), normalMapsActive()

## Knowledge Gaps
- **8 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `three` connect `n8ao.d.ts` to `landmarksB.ts`, `placesSliceBuilders.ts`, `placesShaders.ts`, `lightingRig.ts`, `dioramaKit.ts`, `animalKit.ts`, `WeatherWidget.tsx`, `standAudit.ts`, `osmSlice.ts`, `prepareCanvasTexture`, `package.json`, `LandmarkBiome`, `CitylitEngine.ts`, `placesClouds.ts`, `createRenderer.ts`, `vehicleLightKit.ts`, `globeScene.ts`, `species.ts`, `placesInteriors.ts`, `DaylightBirdsController`, `compare-metrics.mjs`, `globalIllumination.ts`, `plinthKit.ts`, `postfx.ts`, `CreatureTier`, `siteAtmosphere.ts`, `webgpuCompat.ts`, `field.ts`, `creaturesLab.ts`?**
  _High betweenness centrality (0.278) - this node is a cross-community bridge._
- **Should `landmarksB.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.058068368413196 - nodes in this community are weakly interconnected._
- **Why does `CitylitEngine` connect `CitylitEngine` to `citylit.ts`, `standFootprint.ts`, `App.tsx`, `animalKit.ts`, `WeatherWidget.tsx`, `osmSlice.ts`, `motion.ts`, `viewportFraming.ts`, `CitylitEngine.ts`, `createRenderer.ts`, `.frame`, `qualityBenchmark.ts`, `DaylightBirdsController`, `globalIllumination.ts`, `postfx.ts`, `siteAtmosphere.ts`, `contact-sheet.ts`, `framePacing.ts`, `MiniaturePass`, `biomePalette.ts`, `.dispose`, `ScaleRulerModal.tsx`?**
  _High betweenness centrality (0.099) - this node is a cross-community bridge._
- **Should `PassportModal.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.06498015873015874 - nodes in this community are weakly interconnected._
- **Why does `puppeteer` connect `run-qa-capture.mjs` to `package.json`?**
  _High betweenness centrality (0.059) - this node is a cross-community bridge._
- **Should `citylit.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06666666666666667 - nodes in this community are weakly interconnected._
- **Should `App.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.06912442396313365 - nodes in this community are weakly interconnected._