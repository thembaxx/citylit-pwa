# Graph Report - citylit-pwa  (2026-11-27)

## Corpus Check
- 227 files · ~461,503 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 11 file(s) not represented in the graph (top: .woff2 4, (none) 3, .css 2)

## Summary
- 2372 nodes · 6821 edges · 98 communities (92 shown, 6 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 236 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `ed75c36b`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- landmarksB.ts
- SearchSheet.tsx
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
- PlacesOverlay.tsx
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
- CreatureEffectsPool
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
- ambientAudio.ts
- createWebGPUCompat
- webgpuCompat.ts
- field.ts
- biomePalette.ts
- scale.ts
- pastdotdev
- creaturesLab.ts
- cloudShape.ts
- LandmarkBiome
- timePresets.ts
- roadRibbon.ts
- tide.test.ts
- nativeHost.ts
- addCraftedRim
- terrainHeight.ts
- SliceSharedAssets
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
- `currentTimeBand()` --calls--> `timeBandForHour()`  [EXTRACTED]
  src/three/creatures/env.ts → src/three/creatures/habitat.ts
- `main()` --indirect_call--> `setupEval()`  [INFERRED]
  scripts/capture-visual-matrix.mjs → scripts/capture-contact-sheets.mjs

## Import Cycles
- None detected.

## Communities (98 total, 6 thin omitted)

### Community 0 - "landmarksB.ts"
Cohesion: 0.06
Nodes (228): headingYaw(), leftLaneOffset(), normalizePlanar(), PlanarVector, registerBeacons(), addAnchor(), addBaseScatter(), addBollards() (+220 more)

### Community 1 - "SearchSheet.tsx"
Cohesion: 0.09
Nodes (32): react-dom, GlobeOverlayProps, SearchSheet(), SearchSheetProps, DropdownTokens, Menu(), MenuItem, MenuProps (+24 more)

### Community 2 - "citylit.ts"
Cohesion: 0.07
Nodes (42): AudioVisualizerBarProps, LandmarkCardProps, BUILTIN_MIXER_PRESETS, DEFAULT_MIXER, FPS_OPTIONS, MIXER_CHANNELS, MOTION_OPTIONS, QUALITY_OPTIONS (+34 more)

### Community 3 - "standFootprint.ts"
Cohesion: 0.21
Nodes (16): boundsFitPlinth(), boundsFitStand(), fitBoundsToPlinth(), fitBoundsToStand(), footprintInsidePolygon(), innerStandPolygon(), PlanarBounds, PLINTH_FRAME_WIDTH (+8 more)

### Community 4 - "server.js"
Cohesion: 0.20
Nodes (6): express@5.3.0, express, app, __dirname, distDir, __filename

### Community 5 - "App.tsx"
Cohesion: 0.09
Nodes (38): App(), INITIAL_GLOBE, readInitialLandmarkIndex(), readSettings(), readStoredEggs(), readStoredNotes(), readStoredSavedPlaces(), readStoredSet() (+30 more)

### Community 6 - "placesSliceBuilders.ts"
Cohesion: 0.11
Nodes (34): TriangulatedTerrainSampler, getGrassMaterial(), createCutawayWaterTopMaterial(), createCutawayWaterWallMaterial(), createSliceMistMaterial(), CutawayWaterOptions, getOrlandoMuralTexture(), addInstancedFlowers() (+26 more)

### Community 7 - "placesShaders.ts"
Cohesion: 0.14
Nodes (20): bindVolumetricFogUniforms(), createStrataTerrainMaterial(), patchPlacesVolumetricFog(), PlacesSliceEmitterSpec, WaterConfluenceSpec, WaterTideSpec, CLOUD_FRAGMENT, CLOUD_VERTEX (+12 more)

### Community 8 - "lightingRig.ts"
Cohesion: 0.09
Nodes (27): AUTO_EXPOSURE_ADAPT_RATE, BIOME_BOUNCE_COLORS, bounceDayTmp, bounceMixTmp, bounceNightTmp, DIORAMA_SHADOW_EXTENT, GOD_RAY_STRENGTH, GOD_RAYS_ENABLED (+19 more)

### Community 9 - "dioramaKit.ts"
Cohesion: 0.05
Nodes (40): getAnimalSeasonMonth(), accentFor(), addWildlifeLayer(), AnchorKind, appendLayerTargets(), CorniceBandSpec, DioramaFx, DoorSurroundSpec (+32 more)

### Community 10 - "animalKit.ts"
Cohesion: 0.07
Nodes (41): IDLES, KINDS, SEASONS, WILDLIFE, WildlifeSpot, advanceAnimalTime(), AnimalIdle, AnimalKind (+33 more)

### Community 11 - "WeatherWidget.tsx"
Cohesion: 0.06
Nodes (48): HourlyForecast(), HourlyForecastProps, ANIMATED_BY_CONDITION, WeatherIcon(), WeatherIconCondition, WeatherIconProps, pad2(), PRESET_ICONS (+40 more)

### Community 12 - "CitylitEngine"
Cohesion: 0.06
Nodes (6): UiInsets, SwayItem, WetMaterialEntry, CitylitEngine, fitDioramaShadowBounds(), NoteCategory

### Community 13 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowImportingTsExtensions, isolatedModules, jsx, lib, module, moduleDetection, moduleResolution (+10 more)

### Community 14 - "standAudit.ts"
Cohesion: 0.36
Nodes (5): auditStandContainment(), isStandGeometry(), labelFor(), StandAuditOptions, StandOverflow

### Community 15 - "osmService.ts"
Cohesion: 0.13
Nodes (19): cacheKey(), fallbackPatch(), GEO_CACHE, geocodePlace(), loadElevation(), loadOsmPlace(), LocalPoint, MEMORY_CACHE (+11 more)

### Community 16 - "osmSlice.ts"
Cohesion: 0.12
Nodes (28): OsmPlaceData, StreetLampSpec, centroid(), clamp(), createOsmSlice(), createRibbon(), OsmSliceResult, pointOnRoad() (+20 more)

### Community 17 - "motion.ts"
Cohesion: 0.06
Nodes (51): motion, @phosphor-icons/react, react, ambientAudio, DARK_PALETTE, LIGHT_PALETTE, CARDINAL_TARGETS, CARDINALS_8 (+43 more)

### Community 18 - "viewportFraming.ts"
Cohesion: 0.14
Nodes (23): clampShift(), EMPTY_INSETS, FramingPlan, freeFitFactor(), freeRect(), isCompactViewport(), LayoutMode, layoutModeFor() (+15 more)

### Community 19 - "skyEvents.ts"
Cohesion: 0.21
Nodes (15): dayIndex(), daysInMonth(), entryIntensity(), EVENT_PRIORITY, formatWhen(), getSkyEvent(), getUpcomingSkyEvents(), MONTH_LABELS (+7 more)

### Community 20 - "prepareCanvasTexture"
Cohesion: 0.06
Nodes (53): applyDissolveToShader(), cascadeize(), flagWindy(), getBrushedNormalTexture(), getBrushedRoughnessTexture(), getCanvasBumpTexture(), getCanvasNormalTexture(), getOrCreateCanvas() (+45 more)

### Community 21 - "playwright"
Cohesion: 0.08
Nodes (21): playwright, errors, errors, names, errors, failed, report, sites (+13 more)

### Community 22 - "package.json"
Cohesion: 0.07
Nodes (39): dependencies, goeist@0.1.0, motion@14.14.0, n8ao@2.1.0, oxfmt@0.79.0, oxlint@1.94.0, @phosphor-icons/react@2.1.10, react@19.3.1 (+31 more)

### Community 23 - "LandmarkBiome"
Cohesion: 0.27
Nodes (12): DAY, clampHour(), HabitatConditions, habitatForSpecies(), HABITATS, habitatSeasonForMonth(), matchesList(), resolveHabitat() (+4 more)

### Community 24 - "AmbientAudioController"
Cohesion: 0.14
Nodes (3): AmbientAudioController, extractRegionName(), AmbientSiteProfile

### Community 25 - "markSharedGeo"
Cohesion: 0.18
Nodes (11): addLampWaterReflections(), addWetRoadStreaks(), getLampBulbGeo(), getLampConeGeo(), getLampHaloGeo(), getLampHardwareGeo(), getLampPoolGeo(), getLampReflectionGeo() (+3 more)

### Community 26 - "CitylitEngine.ts"
Cohesion: 0.05
Nodes (45): STAND_BLOCK_HALF, BeaconAnchor, beaconGeo, collectBeacons(), createBeaconMesh(), LANDMARK_BUILDERS, glowMaterials, resetSceneDynamicLists() (+37 more)

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
Cohesion: 0.16
Nodes (15): CloudDrift, cloudDrift(), createContactShadowMaterial(), BiomeWeights, createHorizonRing(), createHorizonScenery(), HorizonUpdateOptions, weightsForBiome() (+7 more)

### Community 35 - "createRenderer.ts"
Cohesion: 0.14
Nodes (14): three, createWebGLRendererSelection(), decideRendererBackend(), GPUCapableNavigator, readRendererPreference(), RendererProbe, selectRenderer(), StubWindow (+6 more)

### Community 36 - "PlacesOverlay.tsx"
Cohesion: 0.13
Nodes (23): EditorialMarkers(), EditorialSources(), MOBILE_WEATHER_ICONS, placeCardCondition(), PlacesOverlay(), PlacesOverlayProps, QUICK_TIMES, WEATHER_MODES (+15 more)

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
Cohesion: 0.07
Nodes (8): setContactShadowFade(), updateWetSurfaces(), setSpatialListener(), updateBounceLightMood(), updateRimLight(), updateShadowMood(), SceneRenderer, preloadProceduralTextures()

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
Nodes (51): BESPOKE_INTERIORS, buildThemedInterior(), bx(), co(), colonnade(), compactShell(), cy(), emptyMats() (+43 more)

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
Nodes (14): attachEquirect(), buildProbeData(), Equirect, HORIZ_DIRS, installGI(), probeGrid, probeOrigin, probeSize (+6 more)

### Community 54 - "PassportModal.tsx"
Cohesion: 0.12
Nodes (23): CATEGORY_COLORS, PASSPORT_TABS, PassportModal(), PassportModalProps, PassportTab, ProvinceRing(), ProvinceRingProps, ProvinceStatRow (+15 more)

### Community 55 - "weatherScene.ts"
Cohesion: 0.27
Nodes (11): getSeasonMonth(), isSpeciesBlooming(), monthToSeasonWeights(), normalizeMonth(), PLANT_SPECIES, PlantSpecies, PlantSpeciesInfo, SeasonWeights (+3 more)

### Community 56 - "plinthKit.ts"
Cohesion: 0.18
Nodes (18): formatDmsCoords(), getPlinthOutlinePoints, mapDomainToPlinth, PlinthSiteSpec, UndergroundStoryKind, TerrainNormal, terrainNormalFromTangents(), TerrainTangent (+10 more)

### Community 57 - "WebGPUSceneRenderer"
Cohesion: 0.07
Nodes (5): createSceneRenderer(), WebGPUSceneRenderer, WebGPUCompat, makeUniforms(), WebGPUPostFX

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
Cohesion: 0.12
Nodes (13): createMiniaturePass(), DitherShader, fallbackDepth, MiniatureBlurShader, MiniatureGradeOptions, MiniatureShader, MiniatureTuning, BloomModule (+5 more)

### Community 63 - "run"
Cohesion: 0.32
Nodes (5): CDP, clickAria(), listTargets(), run(), sleep()

### Community 64 - "InfoDrawer.tsx"
Cohesion: 0.09
Nodes (29): GalleryModalProps, formatCoords(), INFO_TABS, InfoDrawer(), InfoDrawerProps, InfoDrawerTab, EASTER_EGGS, EasterEgg (+21 more)

### Community 65 - "CreatureEffectsPool"
Cohesion: 0.20
Nodes (6): CreatureEffectsPool, CreatureEffectsStats, DEFAULT_DUST_COLOR, DEFAULT_RIPPLE_COLOR, DEFAULT_SPLASH_COLOR, POOL_CAPS

### Community 66 - "siteAtmosphere.ts"
Cohesion: 0.17
Nodes (14): AtmosphereEffect, AtmosphereLayer, AtmosphereProfile, AtmosphereSceneController, AtmosphereSite, AtmosphereUpdateOptions, BIOME_EFFECTS, createAtmosphereScene() (+6 more)

### Community 67 - "check-exposure.mjs"
Cohesion: 0.22
Nodes (8): dir, evaluate(), files, pending, send(), target, { values, positionals }, ws

### Community 68 - "react"
Cohesion: 0.16
Nodes (16): Sheet(), SheetProps, SheetSide, useFocusTrap(), shouldDismiss(), Z, clearSafeArea(), EMPTY (+8 more)

### Community 69 - "layer.ts"
Cohesion: 0.08
Nodes (22): CREATURE_TIER_CAPS, CREATURE_TIER_LABELS, CreatureBudget, CreatureBudgetStats, CreaturePriority, CreatureReservation, CreatureTier, PRIORITY_WEIGHT (+14 more)

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
Cohesion: 0.14
Nodes (11): angleDelta(), CreatureField, CreatureFieldOptions, CreatureFieldStats, M_PERCH, CreatureZone, SpeciesId, CreatureAnimState (+3 more)

### Community 77 - "n8ao.d.ts"
Cohesion: 0.25
Nodes (4): n8ao, N8AOPass, N8AOPassConfiguration, N8AOQualityMode

### Community 78 - "ambientAudio.ts"
Cohesion: 0.13
Nodes (16): AnimalAudioEvent, BIOME_HAPTIC_PATTERNS, clamp01(), equalPower(), FilterBand, REGION_HAPTIC_ACCENTS, smoothBell(), smoothstep() (+8 more)

### Community 79 - "createWebGPUCompat"
Cohesion: 0.41
Nodes (12): createWebGPUCompat(), convert(), findAlphaUniform(), findColorUniform(), findIntensityUniform(), tryGroundSheen(), tryHorizonRing(), trySkyMaterial() (+4 more)

### Community 80 - "webgpuCompat.ts"
Cohesion: 0.25
Nodes (7): ALPHA_UNIFORMS, COLOR_UNIFORMS, INTENSITY_UNIFORMS, TSLModule, UniformLink, UV_MAP_KEYS, WebGPUModule

### Community 81 - "field.ts"
Cohesion: 0.20
Nodes (11): CreatureAnimation, createCreatureMaterial(), CREATURE_ANIM_STATES, CREATURE_STATE_VALUE, CREATURE_UNIFORMS, CreatureMaterialOptions, CreatureUniforms, deformation() (+3 more)

### Community 82 - "biomePalette.ts"
Cohesion: 0.12
Nodes (20): BIOME_FALLBACK, normalizeRuleKey(), REGIONAL_PALETTES, RegionalPalette, RegionalPaletteKey, resolveRegionalPalette(), rule(), SITE_RULES (+12 more)

### Community 84 - "scale.ts"
Cohesion: 0.24
Nodes (8): ScaleRulerModalProps, ScaleFact, MAX_REFERENCE_UNITS, metresToUnits(), MIN_REFERENCE_UNITS, siteMetresPerUnit(), ScaleReferenceEntry, ScaleReferenceKind

### Community 86 - "creaturesLab.ts"
Cohesion: 0.10
Nodes (21): KEY_DAY, KEY_NIGHT, KEY_WARM, labelled(), mountCreaturesLab(), SKY_DAWN, SKY_DAY, SKY_DUSK (+13 more)

### Community 87 - "cloudShape.ts"
Cohesion: 0.36
Nodes (7): cloudOpacity(), LOBES, sampleCloudDensity(), smoothstep(), addDioramaClouds(), getDioramaCloudMat(), getDioramaCloudTexture()

### Community 88 - "LandmarkBiome"
Cohesion: 0.33
Nodes (3): SiteProfile, HorizonSceneryController, LandmarkBiome

### Community 89 - "timePresets.ts"
Cohesion: 0.43
Nodes (5): GOLDEN_HOUR_END, GOLDEN_HOUR_START, TIME_PRESETS, TimePreset, TimePresetKey

### Community 90 - "roadRibbon.ts"
Cohesion: 0.38
Nodes (5): catmullRom(), RoadControlPoint, RoadSample, sampleRoadRibbon(), addRoadRibbon()

### Community 91 - "tide.test.ts"
Cohesion: 0.60
Nodes (4): computeCoastalTideOffset(), TIDE_CENTER_OFFSET, TIDE_HALF_AMPLITUDE, TIDE_WAVE_AMPLITUDE

### Community 92 - "nativeHost.ts"
Cohesion: 0.31
Nodes (6): detectNativeHost(), hasCinematicHost(), isHost(), NativeCinematicHost, nativeHostUrl(), Window

### Community 93 - "addCraftedRim"
Cohesion: 0.36
Nodes (8): addCraftedRim(), addRimEdgeContinuity(), addSquareRim(), getRimMaterial(), getRimPalette(), paintRadial(), paintStrata(), rimEdgeColor()

### Community 94 - "terrainHeight.ts"
Cohesion: 0.53
Nodes (4): createTerrainHeightSampler(), createTriangulatedTerrainSampler(), TerrainGridSamplerOptions, TerrainSurfaceNormal

### Community 95 - "SliceSharedAssets"
Cohesion: 0.67
Nodes (3): BespokeInteriorContext, PlacesShaderEnvironment, SliceSharedAssets

### Community 98 - "ScaleRulerModal.tsx"
Cohesion: 0.18
Nodes (15): barWidth(), REFERENCE_OPTIONS, RulerRow, RulerScale, RulerSort, SCALE_OPTIONS, ScaleRulerModal(), SORT_OPTIONS (+7 more)

### Community 103 - "addSiteMotion"
Cohesion: 0.50
Nodes (4): addSiteMotion(), addWeatherFx(), stream(), normalMapsActive()

## Knowledge Gaps
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `three` connect `createRenderer.ts` to `landmarksB.ts`, `placesSliceBuilders.ts`, `placesShaders.ts`, `lightingRig.ts`, `dioramaKit.ts`, `animalKit.ts`, `WeatherWidget.tsx`, `standAudit.ts`, `osmSlice.ts`, `prepareCanvasTexture`, `package.json`, `CitylitEngine.ts`, `placesClouds.ts`, `vehicleLightKit.ts`, `globeScene.ts`, `species.ts`, `placesInteriors.ts`, `DaylightBirdsController`, `compare-metrics.mjs`, `globalIllumination.ts`, `plinthKit.ts`, `postfx.ts`, `CreatureEffectsPool`, `siteAtmosphere.ts`, `layer.ts`, `CreatureField`, `n8ao.d.ts`, `webgpuCompat.ts`, `field.ts`, `creaturesLab.ts`?**
  _High betweenness centrality (0.244) - this node is a cross-community bridge._
- **Should `landmarksB.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.0569194398981633 - nodes in this community are weakly interconnected._
- **Why does `CitylitEngine` connect `CitylitEngine` to `citylit.ts`, `standFootprint.ts`, `App.tsx`, `animalKit.ts`, `WeatherWidget.tsx`, `osmSlice.ts`, `motion.ts`, `viewportFraming.ts`, `CitylitEngine.ts`, `createRenderer.ts`, `.frame`, `qualityBenchmark.ts`, `DaylightBirdsController`, `globalIllumination.ts`, `postfx.ts`, `siteAtmosphere.ts`, `contact-sheet.ts`, `framePacing.ts`, `MiniaturePass`, `biomePalette.ts`, `scale.ts`, `LandmarkBiome`?**
  _High betweenness centrality (0.087) - this node is a cross-community bridge._
- **Should `SearchSheet.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.08826945412311266 - nodes in this community are weakly interconnected._
- **Why does `puppeteer` connect `run-qa-capture.mjs` to `package.json`?**
  _High betweenness centrality (0.054) - this node is a cross-community bridge._
- **Should `citylit.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06588235294117648 - nodes in this community are weakly interconnected._
- **Should `App.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.08758503401360544 - nodes in this community are weakly interconnected._