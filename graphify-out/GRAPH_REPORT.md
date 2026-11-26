# Graph Report - citylit-pwa  (2026-11-26)

## Corpus Check
- 225 files · ~460,549 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 11 file(s) not represented in the graph (top: .woff2 4, (none) 3, .css 2)

## Summary
- 2362 nodes · 6800 edges · 94 communities (90 shown, 4 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 236 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `066ae0e4`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- landmarksB.ts
- PassportModal.tsx
- SettingsModal.tsx
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
- .isStudio
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
- PlacesOverlay.tsx
- run
- motion.ts
- placesScene.ts
- siteAtmosphere.ts
- check-exposure.mjs
- react
- budget.ts
- contact-sheet.ts
- framePacing.ts
- LandmarkBiome
- .constructor
- run-qa-capture.mjs
- make-contact-sheet.mjs
- CreatureField
- n8ao.d.ts
- addWildlifeLayer
- CreatureTier
- ambientAudio.ts
- globeData.ts
- biomePalette.ts
- material.ts
- .updateSpatial
- condenseHistoryText
- creaturesLab.ts
- cloudShape.ts
- roadRibbon.ts
- boostBuiltVibrancy
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
- `CompassProps` --references--> `CitylitEngine`  [EXTRACTED]
  src/components/Compass.tsx → src/three/CitylitEngine.ts
- `currentTimeBand()` --calls--> `timeBandForHour()`  [EXTRACTED]
  src/three/creatures/env.ts → src/three/creatures/habitat.ts
- `main()` --indirect_call--> `setupEval()`  [INFERRED]
  scripts/capture-visual-matrix.mjs → scripts/capture-contact-sheets.mjs
- `stadium()` --calls--> `catenaryArchHeight()`  [EXTRACTED]
  src/three/builders/landmarksA.ts → src/lib/landmarkGeometry.ts

## Import Cycles
- None detected.

## Communities (94 total, 4 thin omitted)

### Community 0 - "landmarksB.ts"
Cohesion: 0.06
Nodes (223): headingYaw(), leftLaneOffset(), normalizePlanar(), PlanarVector, registerBeacons(), addAnchor(), addBaseScatter(), addBollards() (+215 more)

### Community 1 - "PassportModal.tsx"
Cohesion: 0.12
Nodes (29): GlobeOverlay(), GlobeOverlayProps, SearchSheet(), SearchSheetProps, DropdownTokens, Menu(), MenuItem, MenuProps (+21 more)

### Community 2 - "SettingsModal.tsx"
Cohesion: 0.07
Nodes (44): motion, ambientAudio, CATEGORY_COLORS, PASSPORT_TABS, PassportModal(), PassportModalProps, PassportTab, ProvinceRing() (+36 more)

### Community 3 - "standFootprint.ts"
Cohesion: 0.21
Nodes (16): boundsFitPlinth(), boundsFitStand(), fitBoundsToPlinth(), fitBoundsToStand(), footprintInsidePolygon(), innerStandPolygon(), PlanarBounds, PLINTH_FRAME_WIDTH (+8 more)

### Community 4 - "server.js"
Cohesion: 0.20
Nodes (6): express@5.3.0, express, app, __dirname, distDir, __filename

### Community 5 - "App.tsx"
Cohesion: 0.08
Nodes (36): App(), INITIAL_GLOBE, readInitialLandmarkIndex(), readSettings(), readStoredEggs(), readStoredNotes(), readStoredSavedPlaces(), readStoredSet() (+28 more)

### Community 6 - "placesSliceBuilders.ts"
Cohesion: 0.11
Nodes (34): getGrassMaterial(), BespokeInteriorKind, createCutawayWaterTopMaterial(), createCutawayWaterWallMaterial(), createSliceMistMaterial(), CutawayWaterOptions, getOrlandoMuralTexture(), addInstancedFlowers() (+26 more)

### Community 7 - "placesShaders.ts"
Cohesion: 0.15
Nodes (19): bindVolumetricFogUniforms(), patchPlacesVolumetricFog(), PlacesSliceEmitterSpec, WaterConfluenceSpec, WaterTideSpec, CLOUD_FRAGMENT, CLOUD_VERTEX, NOISE_GLSL (+11 more)

### Community 8 - "lightingRig.ts"
Cohesion: 0.09
Nodes (31): MID_MONTH_DAY, solarDeclination(), southernSunDirection(), AUTO_EXPOSURE_ADAPT_RATE, BIOME_BOUNCE_COLORS, bounceDayTmp, bounceMixTmp, bounceNightTmp (+23 more)

### Community 9 - "dioramaKit.ts"
Cohesion: 0.05
Nodes (37): accentFor(), AnchorKind, CorniceBandSpec, DioramaFx, DoorSurroundSpec, FacadeWindowSpec, FALLBACK_PROFILE, getLampBulbMat() (+29 more)

### Community 10 - "animalKit.ts"
Cohesion: 0.08
Nodes (32): advanceAnimalTime(), AnimalLodSpec, AnimalMember, AnimalPose, AnimalScaffold, AnimalScaffoldSpec, animalSeasonForMonth(), AnimalVec3 (+24 more)

### Community 11 - "WeatherWidget.tsx"
Cohesion: 0.06
Nodes (49): HourlyForecast(), HourlyForecastProps, WeatherIcon(), pad2(), PRESET_ICONS, PresetKey, SKY_EVENT_ICON, TIME_PRESETS (+41 more)

### Community 12 - "CitylitEngine"
Cohesion: 0.07
Nodes (4): SwayItem, WetMaterialEntry, CitylitEngine, NoteCategory

### Community 13 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowImportingTsExtensions, isolatedModules, jsx, lib, module, moduleDetection, moduleResolution (+10 more)

### Community 14 - "standAudit.ts"
Cohesion: 0.27
Nodes (6): auditStandContainment(), isStandGeometry(), labelFor(), StandAudit, StandAuditOptions, StandOverflow

### Community 15 - "osmService.ts"
Cohesion: 0.14
Nodes (17): cacheKey(), fallbackPatch(), GEO_CACHE, loadElevation(), loadOsmPlace(), LocalPoint, MEMORY_CACHE, OsmArea (+9 more)

### Community 16 - "osmSlice.ts"
Cohesion: 0.18
Nodes (16): StreetLampSpec, centroid(), clamp(), createOsmSlice(), createRibbon(), pointOnRoad(), polygonShape(), readTag() (+8 more)

### Community 17 - ".isStudio"
Cohesion: 0.11
Nodes (5): EngineCallbacks, PlacesSelectionInfo, solarHalfDay(), streetLampNightFactor(), sunAltitudeDeg()

### Community 18 - "viewportFraming.ts"
Cohesion: 0.09
Nodes (25): clampShift(), EMPTY_INSETS, FramingPlan, freeFitFactor(), freeRect(), isCompactViewport(), LayoutMode, layoutModeFor() (+17 more)

### Community 19 - "skyEvents.ts"
Cohesion: 0.21
Nodes (15): dayIndex(), daysInMonth(), entryIntensity(), EVENT_PRIORITY, formatWhen(), getSkyEvent(), getUpcomingSkyEvents(), MONTH_LABELS (+7 more)

### Community 20 - "prepareCanvasTexture"
Cohesion: 0.06
Nodes (58): getRoofDirtMap(), windowPaneMaterial(), applyDissolveToShader(), cascadeize(), flagWindy(), getBrushedNormalTexture(), getBrushedRoughnessTexture(), getCanvasBumpTexture() (+50 more)

### Community 21 - "playwright"
Cohesion: 0.08
Nodes (21): playwright, errors, errors, names, errors, failed, report, sites (+13 more)

### Community 22 - "package.json"
Cohesion: 0.06
Nodes (42): dependencies, goeist@0.1.0, motion@14.14.0, n8ao@2.1.0, oxfmt@0.79.0, oxlint@1.94.0, pastdotdev@^0.0.1, @phosphor-icons/react@2.1.10 (+34 more)

### Community 23 - "LandmarkBiome"
Cohesion: 0.19
Nodes (19): DAY, tierDensity(), clampHour(), HabitatConditions, habitatForSpecies(), HABITATS, habitatSeasonForMonth(), matchesList() (+11 more)

### Community 24 - "AmbientAudioController"
Cohesion: 0.14
Nodes (3): AmbientAudioController, SiteProfile, AmbientSiteProfile

### Community 25 - "markSharedGeo"
Cohesion: 0.18
Nodes (11): addLampWaterReflections(), addWetRoadStreaks(), getLampBulbGeo(), getLampConeGeo(), getLampHaloGeo(), getLampHardwareGeo(), getLampPoolGeo(), getLampReflectionGeo() (+3 more)

### Community 26 - "CitylitEngine.ts"
Cohesion: 0.06
Nodes (41): STAND_BLOCK_HALF, BeaconAnchor, beaconGeo, collectBeacons(), createBeaconMesh(), LANDMARK_BUILDERS, glowMaterials, resetSceneDynamicLists() (+33 more)

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
Cohesion: 0.29
Nodes (7): CloudDrift, cloudDrift(), CloudAssets, CloudPuffInstance, createCloudPuffMesh(), createSliceCloudLayer(), SliceCloudLayer

### Community 35 - "createRenderer.ts"
Cohesion: 0.19
Nodes (9): createWebGLRendererSelection(), decideRendererBackend(), GPUCapableNavigator, readRendererPreference(), RendererProbe, selectRenderer(), StubWindow, wantsMsaa() (+1 more)

### Community 36 - "LandmarkCard.tsx"
Cohesion: 0.08
Nodes (33): GalleryDialog(), GalleryModal(), GalleryModalProps, airQualityInsight(), CAMERA_PRESETS, cardContentVariants, CARDINALS, cardItemVariants (+25 more)

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
Cohesion: 0.06
Nodes (10): writeCachedBenchmark(), setContactShadowFade(), updateWetSurfaces(), setSpatialListener(), updateBounceLightMood(), updateShadowMood(), MiniaturePass, SceneRenderer (+2 more)

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
Cohesion: 0.19
Nodes (29): AssembledGeometry, assembleParts(), AXIS_DEFAULT, axisId(), ball(), box(), buildBat(), buildButterfly() (+21 more)

### Community 49 - "placesInteriors.ts"
Cohesion: 0.09
Nodes (51): BESPOKE_INTERIORS, buildThemedInterior(), bx(), co(), colonnade(), compactShell(), cy(), emptyMats() (+43 more)

### Community 50 - "qualityBenchmark.ts"
Cohesion: 0.15
Nodes (11): BenchmarkConfig, BenchmarkTier, CachedBenchmark, computeFrameStats(), DEFAULT_BENCHMARK_CONFIG, FrameStats, FrameTimeBenchmark, percentile() (+3 more)

### Community 51 - "DaylightBirdsController"
Cohesion: 0.13
Nodes (13): computeBirdSpawnIntervalSec(), computeFoliageSwayAngle(), computeFoliageWindStrength(), isDaylightForBirds(), BIOME_PALETTES, BirdAgent, BirdPalette, BirdState (+5 more)

### Community 52 - "compare-metrics.mjs"
Cohesion: 0.12
Nodes (12): fakeCtx, rows, after, afterByKey, before, breaches, key(), mean() (+4 more)

### Community 53 - "globalIllumination.ts"
Cohesion: 0.14
Nodes (12): attachEquirect(), buildProbeData(), Equirect, HORIZ_DIRS, installGI(), probeGrid, probeOrigin, probeSize (+4 more)

### Community 54 - "TopBar.tsx"
Cohesion: 0.13
Nodes (22): AudioVisualizerBar(), AudioVisualizerBarProps, DARK_PALETTE, LIGHT_PALETTE, IconButton(), IconButtonProps, TopBar(), TopBarProps (+14 more)

### Community 55 - "weatherScene.ts"
Cohesion: 0.27
Nodes (11): getSeasonMonth(), isSpeciesBlooming(), monthToSeasonWeights(), normalizeMonth(), PLANT_SPECIES, PlantSpecies, PlantSpeciesInfo, SeasonWeights (+3 more)

### Community 56 - "plinthKit.ts"
Cohesion: 0.22
Nodes (15): getPlinthOutlinePoints, mapDomainToPlinth, TerrainNormal, terrainNormalFromTangents(), TerrainTangent, buildNameplateMesh(), buildPilotPlinth(), buildUndergroundStories() (+7 more)

### Community 57 - "WebGPUSceneRenderer"
Cohesion: 0.05
Nodes (23): WebGPUSceneRenderer, ALPHA_UNIFORMS, COLOR_UNIFORMS, createWebGPUCompat(), convert(), findAlphaUniform(), findColorUniform(), findIntensityUniform() (+15 more)

### Community 58 - "ref_node_assert"
Cohesion: 0.14
Nodes (13): bridgeStayAnchors(), catenaryArchHeight(), StayAnchor, computeCoastalTideOffset(), TIDE_CENTER_OFFSET, TIDE_HALF_AMPLITUDE, TIDE_WAVE_AMPLITUDE, GOLDEN_HOUR_END (+5 more)

### Community 59 - "capture-visual-matrix.mjs"
Cohesion: 0.32
Nodes (7): captureState(), Cdp, main(), parseCli(), sampleEval(), sleep(), stateEval()

### Community 60 - "WebGLSceneRenderer"
Cohesion: 0.04
Nodes (21): createDitherPass(), createMiniaturePass(), DitherShader, fallbackDepth, MiniatureBlurShader, MiniatureGradeOptions, MiniatureShader, MiniatureTuning (+13 more)

### Community 61 - "standFootprint.ts"
Cohesion: 0.26
Nodes (15): clamp(), clampToStand(), getStandOutlinePoints(), mapStandDomain(), pointInStandPolygon(), smoothstep(), STAND_EDGE_ALLOWANCE, STAND_HALF (+7 more)

### Community 62 - "PlacesOverlay.tsx"
Cohesion: 0.10
Nodes (28): @phosphor-icons/react, EditorialMarkers(), EditorialSources(), MOBILE_WEATHER_ICONS, placeCardCondition(), PlacesOverlay(), PlacesOverlayProps, QUICK_TIMES (+20 more)

### Community 63 - "run"
Cohesion: 0.32
Nodes (5): CDP, clickAria(), listTargets(), run(), sleep()

### Community 64 - "motion.ts"
Cohesion: 0.06
Nodes (40): react, CARDINAL_TARGETS, CARDINALS_8, Compass(), CompassProps, formatBearing(), TICKS, formatCoords() (+32 more)

### Community 65 - "placesScene.ts"
Cohesion: 0.13
Nodes (21): OsmPlaceData, BiomeWeights, createHorizonRing(), createHorizonScenery(), HorizonSceneryController, HorizonUpdateOptions, weightsForBiome(), OsmSliceResult (+13 more)

### Community 66 - "siteAtmosphere.ts"
Cohesion: 0.19
Nodes (13): AtmosphereEffect, AtmosphereLayer, AtmosphereProfile, AtmosphereSceneController, AtmosphereUpdateOptions, BIOME_EFFECTS, createAtmosphereScene(), effectOpacity() (+5 more)

### Community 67 - "check-exposure.mjs"
Cohesion: 0.22
Nodes (8): dir, evaluate(), files, pending, send(), target, { values, positionals }, ws

### Community 68 - "react"
Cohesion: 0.15
Nodes (18): Sheet(), SheetProps, SheetSide, useFocusTrap(), shouldDismiss(), Z, clearSafeArea(), EMPTY (+10 more)

### Community 69 - "budget.ts"
Cohesion: 0.14
Nodes (9): CREATURE_TIER_CAPS, CREATURE_TIER_LABELS, CreatureBudget, CreatureBudgetStats, CreaturePriority, CreatureReservation, PRIORITY_WEIGHT, TierCaps (+1 more)

### Community 70 - "contact-sheet.ts"
Cohesion: 0.25
Nodes (8): build(), engine, grid, hour, params, stage, status, syncButtons()

### Community 71 - "framePacing.ts"
Cohesion: 0.31
Nodes (8): DEFAULT_QUIET_SECONDS, FramePacingInput, frameThrottleMs(), IDLE_QUIET_MS, IDLE_REDUCED_MS, IDLE_SOFTWARE_MS, stageQuiet(), StageQuietInput

### Community 72 - "LandmarkBiome"
Cohesion: 0.18
Nodes (12): extractRegionName(), IDLES, KINDS, SEASONS, WILDLIFE, WildlifeSpot, AnimalIdle, AnimalKind (+4 more)

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
Cohesion: 0.14
Nodes (11): angleDelta(), CreatureField, CreatureFieldOptions, CreatureFieldStats, M_PERCH, CreatureZone, SpeciesId, CreatureAnimState (+3 more)

### Community 77 - "n8ao.d.ts"
Cohesion: 0.22
Nodes (5): three, n8ao, N8AOPass, N8AOPassConfiguration, N8AOQualityMode

### Community 78 - "addWildlifeLayer"
Cohesion: 0.67
Nodes (3): getAnimalSeasonMonth(), addWildlifeLayer(), appendLayerTargets()

### Community 79 - "CreatureTier"
Cohesion: 0.12
Nodes (10): CreatureTier, CreatureEffectsStats, DEFAULT_DUST_COLOR, DEFAULT_RIPPLE_COLOR, DEFAULT_SPLASH_COLOR, POOL_CAPS, CreatureEnvSnapshot, CreatureLayer (+2 more)

### Community 80 - "ambientAudio.ts"
Cohesion: 0.15
Nodes (12): AnimalAudioEvent, BIOME_HAPTIC_PATTERNS, FilterBand, REGION_HAPTIC_ACCENTS, SpatialEmitter, SpatialListener, UI_CUE_CATEGORY, UiCueCategory (+4 more)

### Community 81 - "globeData.ts"
Cohesion: 0.21
Nodes (11): AFRICA_POLYS, ENCLAVE_POLYS, GLOBE_NEIGHBOR_LABELS, GLOBE_PROVINCES, NEIGHBOR_POLYS, PROVINCE_STYLE, ProvinceGlobeEntry, GEO_AFRICA (+3 more)

### Community 82 - "biomePalette.ts"
Cohesion: 0.12
Nodes (20): BIOME_FALLBACK, normalizeRuleKey(), REGIONAL_PALETTES, RegionalPalette, RegionalPaletteKey, resolveRegionalPalette(), rule(), SITE_RULES (+12 more)

### Community 83 - "material.ts"
Cohesion: 0.20
Nodes (11): CreatureAnimation, createCreatureMaterial(), CREATURE_ANIM_STATES, CREATURE_STATE_VALUE, CREATURE_UNIFORMS, CreatureMaterialOptions, CreatureUniforms, deformation() (+3 more)

### Community 84 - ".updateSpatial"
Cohesion: 0.27
Nodes (4): clamp01(), equalPower(), smoothBell(), smoothstep()

### Community 86 - "creaturesLab.ts"
Cohesion: 0.09
Nodes (22): KEY_DAY, KEY_NIGHT, KEY_WARM, labelled(), mountCreaturesLab(), SKY_DAWN, SKY_DAY, SKY_DUSK (+14 more)

### Community 87 - "cloudShape.ts"
Cohesion: 0.36
Nodes (7): cloudOpacity(), LOBES, sampleCloudDensity(), smoothstep(), addDioramaClouds(), getDioramaCloudMat(), getDioramaCloudTexture()

### Community 88 - "roadRibbon.ts"
Cohesion: 0.38
Nodes (5): catmullRom(), RoadControlPoint, RoadSample, sampleRoadRibbon(), addRoadRibbon()

### Community 92 - "nativeHost.ts"
Cohesion: 0.31
Nodes (6): detectNativeHost(), hasCinematicHost(), isHost(), NativeCinematicHost, nativeHostUrl(), Window

### Community 93 - "addCraftedRim"
Cohesion: 0.36
Nodes (8): addCraftedRim(), addRimEdgeContinuity(), addSquareRim(), getRimMaterial(), getRimPalette(), paintRadial(), paintStrata(), rimEdgeColor()

### Community 98 - "ScaleRulerModal.tsx"
Cohesion: 0.10
Nodes (26): barWidth(), REFERENCE_OPTIONS, RulerRow, RulerScale, RulerSort, SCALE_OPTIONS, ScaleRulerModal(), ScaleRulerModalProps (+18 more)

### Community 103 - "addSiteMotion"
Cohesion: 0.50
Nodes (4): addSiteMotion(), addWeatherFx(), stream(), normalMapsActive()

## Knowledge Gaps
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `three` connect `n8ao.d.ts` to `landmarksB.ts`, `placesSliceBuilders.ts`, `placesShaders.ts`, `lightingRig.ts`, `dioramaKit.ts`, `animalKit.ts`, `standAudit.ts`, `osmSlice.ts`, `prepareCanvasTexture`, `package.json`, `LandmarkBiome`, `CitylitEngine.ts`, `placesClouds.ts`, `createRenderer.ts`, `vehicleLightKit.ts`, `globeScene.ts`, `species.ts`, `placesInteriors.ts`, `DaylightBirdsController`, `compare-metrics.mjs`, `globalIllumination.ts`, `plinthKit.ts`, `WebGPUSceneRenderer`, `WebGLSceneRenderer`, `placesScene.ts`, `siteAtmosphere.ts`, `CreatureField`, `CreatureTier`, `material.ts`, `creaturesLab.ts`?**
  _High betweenness centrality (0.278) - this node is a cross-community bridge._
- **Should `landmarksB.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05823451910408432 - nodes in this community are weakly interconnected._
- **Why does `CitylitEngine` connect `CitylitEngine` to `landmarksB.ts`, `SettingsModal.tsx`, `standFootprint.ts`, `App.tsx`, `animalKit.ts`, `WeatherWidget.tsx`, `standAudit.ts`, `.isStudio`, `viewportFraming.ts`, `CitylitEngine.ts`, `.frame`, `qualityBenchmark.ts`, `DaylightBirdsController`, `globalIllumination.ts`, `WebGLSceneRenderer`, `motion.ts`, `placesScene.ts`, `siteAtmosphere.ts`, `contact-sheet.ts`, `framePacing.ts`, `biomePalette.ts`, `ScaleRulerModal.tsx`?**
  _High betweenness centrality (0.095) - this node is a cross-community bridge._
- **Should `PassportModal.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.11932773109243698 - nodes in this community are weakly interconnected._
- **Why does `puppeteer` connect `run-qa-capture.mjs` to `package.json`?**
  _High betweenness centrality (0.050) - this node is a cross-community bridge._
- **Should `SettingsModal.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.06823529411764706 - nodes in this community are weakly interconnected._
- **Should `App.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.08078431372549019 - nodes in this community are weakly interconnected._