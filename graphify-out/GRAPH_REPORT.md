# Graph Report - citylit-pwa  (2026-11-28)

## Corpus Check
- 229 files · ~462,416 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 11 file(s) not represented in the graph (top: .woff2 4, (none) 3, .css 2)

## Summary
- 2380 nodes · 6846 edges · 103 communities (93 shown, 10 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 236 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `80057303`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- landmarksB.ts
- .frame
- SettingsModal.tsx
- citylit.ts
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
- .fitHeroCamera
- osmService.ts
- osmSlice.ts
- motion.ts
- viewportFraming.ts
- skyEvents.ts
- prepareCanvasTexture
- playwright
- package.json
- habitat.ts
- ambientAudio.ts
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
- AmbientAudioController
- .frame
- vehicleLightKit.ts
- run
- PassportModal.tsx
- measure-idle-pacing.mjs
- species.ts
- placesInteriors.ts
- qualityBenchmark.ts
- daylightBirds.ts
- compare-metrics.mjs
- .constructor
- uiSafeArea.ts
- weatherScene.ts
- plinthKit.ts
- WebGPUSceneRenderer
- ref_node_assert
- capture-visual-matrix.mjs
- WebGLSceneRenderer
- DaylightBirdsController
- postfx.ts
- run
- SearchSheet.tsx
- layer.ts
- siteAtmosphere.ts
- check-exposure.mjs
- mediaService.ts
- layer.ts
- contact-sheet.ts
- framePacing.ts
- MiniaturePass
- .constructor
- run-qa-capture.mjs
- make-contact-sheet.mjs
- CreatureField
- n8ao.d.ts
- windowLights.ts
- material.ts
- three
- globalIllumination.ts
- biomePalette.ts
- windParticles.ts
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
- LandmarkBiome
- landmarkGeometry.ts
- .dispose
- ScaleRulerModal.tsx
- addWildlifeLayer
- AnimalScaffold
- SliceSharedAssets
- addSiteMotion

## God Nodes (most connected - your core abstractions)
1. `CitylitEngine` - 160 edges
2. `add()` - 104 edges
3. `M()` - 83 edges
4. `C()` - 82 edges
5. `CB()` - 71 edges
6. `App()` - 62 edges
7. `mergeByMaterial()` - 60 edges
8. `R()` - 59 edges
9. `addStreetLampSet()` - 56 edges
10. `MStone()` - 56 edges

## Surprising Connections (you probably didn't know these)
- `memoryApiPlugin()` --calls--> `createMemoryMiddleware()`  [EXTRACTED]
  vite.config.ts → server/memory.js
- `CreatureEnvSnapshot` --references--> `CreatureTier`  [EXTRACTED]
  src/three/creatures/env.ts → src/three/creatures/budget.ts
- `EngineCallbacks` --references--> `PlacesSelectionInfo`  [EXTRACTED]
  src/three/CitylitEngine.ts → src/three/placesScene.ts
- `AtmosphereSite` --references--> `LandmarkBiome`  [EXTRACTED]
  src/three/siteAtmosphere.ts → src/types/citylit.ts
- `main()` --indirect_call--> `setupEval()`  [INFERRED]
  scripts/capture-visual-matrix.mjs → scripts/capture-contact-sheets.mjs

## Import Cycles
- None detected.

## Communities (103 total, 10 thin omitted)

### Community 0 - "landmarksB.ts"
Cohesion: 0.06
Nodes (232): headingYaw(), leftLaneOffset(), normalizePlanar(), PlanarVector, registerBeacons(), addAnchor(), addBaseScatter(), addBollards() (+224 more)

### Community 1 - ".frame"
Cohesion: 0.17
Nodes (3): setContactShadowFade(), streetLampNightFactor(), sunAltitudeDeg()

### Community 2 - "SettingsModal.tsx"
Cohesion: 0.07
Nodes (38): AudioVisualizerBar(), AudioVisualizerBarProps, DARK_PALETTE, LIGHT_PALETTE, BUILTIN_MIXER_PRESETS, DEFAULT_MIXER, FPS_OPTIONS, MIXER_CHANNELS (+30 more)

### Community 3 - "citylit.ts"
Cohesion: 0.06
Nodes (37): airQualityInsight(), CAMERA_PRESETS, cardContentVariants, CARDINALS, cardItemVariants, getCategoryMeta(), LandmarkCard(), LandmarkCardProps (+29 more)

### Community 4 - "server.js"
Cohesion: 0.20
Nodes (6): express@5.3.0, express, app, __dirname, distDir, __filename

### Community 5 - "App.tsx"
Cohesion: 0.07
Nodes (43): App(), INITIAL_GLOBE, INITIAL_ROUTE_ID, readInitialLandmarkIndex(), readSettings(), readStoredEggs(), readStoredNotes(), readStoredSavedPlaces() (+35 more)

### Community 6 - "placesSliceBuilders.ts"
Cohesion: 0.11
Nodes (33): getGrassMaterial(), BESPOKE_INTERIORS, createCutawayWaterTopMaterial(), createCutawayWaterWallMaterial(), createSliceMistMaterial(), CutawayWaterOptions, getOrlandoMuralTexture(), addInstancedFlowers() (+25 more)

### Community 7 - "placesShaders.ts"
Cohesion: 0.14
Nodes (20): bindVolumetricFogUniforms(), createStrataTerrainMaterial(), patchPlacesVolumetricFog(), PlacesSliceEmitterSpec, WaterConfluenceSpec, WaterTideSpec, CLOUD_FRAGMENT, CLOUD_VERTEX (+12 more)

### Community 8 - "lightingRig.ts"
Cohesion: 0.07
Nodes (39): clamp01(), LiveWeatherVisual, liveWeatherVisual(), SeasonWeights, MID_MONTH_DAY, solarDeclination(), southernSunDirection(), AUTO_EXPOSURE_ADAPT_RATE (+31 more)

### Community 9 - "dioramaKit.ts"
Cohesion: 0.05
Nodes (38): accentFor(), AnchorKind, CorniceBandSpec, DioramaFx, DoorSurroundSpec, FacadeWindowSpec, FALLBACK_PROFILE, getLampBulbMat() (+30 more)

### Community 10 - "animalKit.ts"
Cohesion: 0.09
Nodes (31): advanceAnimalTime(), AnimalLodSpec, AnimalMember, AnimalPose, AnimalScaffoldSpec, animalSeasonForMonth(), AnimalVec3, ArticulationAxis (+23 more)

### Community 11 - "WeatherWidget.tsx"
Cohesion: 0.10
Nodes (32): HourlyForecast(), HourlyForecastProps, ANIMATED_BY_CONDITION, WeatherIcon(), WeatherIconCondition, WeatherIconProps, pad2(), PRESET_ICONS (+24 more)

### Community 12 - "CitylitEngine"
Cohesion: 0.06
Nodes (5): CompassProps, SwayItem, WetMaterialEntry, CitylitEngine, QualitySetting

### Community 13 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowImportingTsExtensions, isolatedModules, jsx, lib, module, moduleDetection, moduleResolution (+10 more)

### Community 15 - "osmService.ts"
Cohesion: 0.14
Nodes (17): cacheKey(), fallbackPatch(), GEO_CACHE, loadElevation(), loadOsmPlace(), LocalPoint, MEMORY_CACHE, OsmArea (+9 more)

### Community 16 - "osmSlice.ts"
Cohesion: 0.12
Nodes (28): OsmPlaceData, StreetLampSpec, centroid(), clamp(), createOsmSlice(), createRibbon(), OsmSliceResult, pointOnRoad() (+20 more)

### Community 17 - "motion.ts"
Cohesion: 0.06
Nodes (53): motion, @phosphor-icons/react, react, react-dom, ambientAudio, CARDINAL_TARGETS, CARDINALS_8, Compass() (+45 more)

### Community 18 - "viewportFraming.ts"
Cohesion: 0.14
Nodes (23): clampShift(), EMPTY_INSETS, FramingPlan, freeFitFactor(), freeRect(), isCompactViewport(), LayoutMode, layoutModeFor() (+15 more)

### Community 19 - "skyEvents.ts"
Cohesion: 0.21
Nodes (15): dayIndex(), daysInMonth(), entryIntensity(), EVENT_PRIORITY, formatWhen(), getSkyEvent(), getUpcomingSkyEvents(), MONTH_LABELS (+7 more)

### Community 20 - "prepareCanvasTexture"
Cohesion: 0.06
Nodes (63): AFRICA_POLYS, ENCLAVE_POLYS, GLOBE_NEIGHBOR_LABELS, GLOBE_PROVINCES, NEIGHBOR_POLYS, PROVINCE_STYLE, ProvinceGlobeEntry, GEO_AFRICA (+55 more)

### Community 21 - "playwright"
Cohesion: 0.08
Nodes (21): playwright, errors, errors, names, errors, failed, report, sites (+13 more)

### Community 22 - "package.json"
Cohesion: 0.07
Nodes (39): dependencies, goeist@0.1.0, motion@14.14.0, n8ao@2.1.0, oxfmt@0.79.0, oxlint@1.94.0, @phosphor-icons/react@2.1.10, react@19.3.1 (+31 more)

### Community 23 - "habitat.ts"
Cohesion: 0.25
Nodes (13): DAY, currentTimeBand(), clampHour(), HabitatConditions, habitatForSpecies(), HABITATS, habitatSeasonForMonth(), matchesList() (+5 more)

### Community 24 - "ambientAudio.ts"
Cohesion: 0.13
Nodes (16): AnimalAudioEvent, BIOME_HAPTIC_PATTERNS, clamp01(), equalPower(), FilterBand, REGION_HAPTIC_ACCENTS, smoothBell(), smoothstep() (+8 more)

### Community 25 - "markSharedGeo"
Cohesion: 0.18
Nodes (11): addLampWaterReflections(), addWetRoadStreaks(), getLampBulbGeo(), getLampConeGeo(), getLampHaloGeo(), getLampHardwareGeo(), getLampPoolGeo(), getLampReflectionGeo() (+3 more)

### Community 26 - "CitylitEngine.ts"
Cohesion: 0.07
Nodes (29): BeaconAnchor, beaconGeo, collectBeacons(), createBeaconMesh(), LANDMARK_BUILDERS, audioForward, audioRight, compassDir (+21 more)

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
Cohesion: 0.26
Nodes (8): CloudDrift, cloudDrift(), CloudAssets, CloudPuffInstance, createCloudPuffMesh(), createSliceCloudLayer(), SliceCloudLayer, WU

### Community 35 - "createRenderer.ts"
Cohesion: 0.19
Nodes (9): createWebGLRendererSelection(), decideRendererBackend(), GPUCapableNavigator, readRendererPreference(), RendererProbe, selectRenderer(), StubWindow, wantsMsaa() (+1 more)

### Community 36 - "PlacesOverlay.tsx"
Cohesion: 0.11
Nodes (27): GlobeOverlay(), EditorialMarkers(), EditorialSources(), MOBILE_WEATHER_ICONS, placeCardCondition(), PlacesOverlay(), PlacesOverlayProps, QUICK_TIMES (+19 more)

### Community 37 - "overrides"
Cohesion: 0.33
Nodes (5): allowBuilds, puppeteer, overrides, three, workbox-build>glob

### Community 38 - "capture-contact-sheets.mjs"
Cohesion: 0.17
Nodes (16): acquirePageTarget(), BASELINE_PATH, captureHour(), CdpSession, checkPerfGuardrails(), HOUR_KEYS, main(), pad() (+8 more)

### Community 39 - "memory.js"
Cohesion: 0.36
Nodes (11): createMemoryMiddleware(), getClient(), HttpError, isTimestamp(), optionalEnum(), optionalInt(), optionalString(), pick() (+3 more)

### Community 40 - "AmbientAudioController"
Cohesion: 0.14
Nodes (3): AmbientAudioController, SiteProfile, AmbientSiteProfile

### Community 44 - "vehicleLightKit.ts"
Cohesion: 0.16
Nodes (16): getCarHeadlightMat(), getCarPoolMat(), getCarTaillightMat(), createVehicleLightBatch(), ensureLightGeometries(), LightGeometries, markLightMesh(), placeInstance() (+8 more)

### Community 45 - "run"
Cohesion: 0.38
Nodes (5): CDP, i0(), listTargets(), run(), sleep()

### Community 46 - "PassportModal.tsx"
Cohesion: 0.15
Nodes (16): CATEGORY_COLORS, PASSPORT_TABS, PassportModal(), PassportTab, ProvinceRing(), ProvinceRingProps, ProvinceStatRow, StatsTooltip() (+8 more)

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
Cohesion: 0.12
Nodes (12): BenchmarkConfig, BenchmarkTier, CachedBenchmark, computeFrameStats(), DEFAULT_BENCHMARK_CONFIG, FrameStats, FrameTimeBenchmark, percentile() (+4 more)

### Community 51 - "daylightBirds.ts"
Cohesion: 0.20
Nodes (10): computeBirdSpawnIntervalSec(), computeFoliageSwayAngle(), computeFoliageWindStrength(), isDaylightForBirds(), BIOME_PALETTES, BirdAgent, BirdPalette, BirdState (+2 more)

### Community 52 - "compare-metrics.mjs"
Cohesion: 0.12
Nodes (12): fakeCtx, rows, after, afterByKey, before, breaches, key(), mean() (+4 more)

### Community 53 - ".constructor"
Cohesion: 0.12
Nodes (13): createContactShadowMaterial(), BiomeWeights, createHorizonRing(), createHorizonScenery(), HorizonUpdateOptions, weightsForBiome(), configureDioramaShadow(), createBounceLight() (+5 more)

### Community 54 - "uiSafeArea.ts"
Cohesion: 0.10
Nodes (28): formatCoords(), InfoDrawer(), PostcardModal(), AdaptiveDialog(), AdaptiveDialogProps, SettleModal(), Sheet(), LANDMARK_DETAILS (+20 more)

### Community 55 - "weatherScene.ts"
Cohesion: 0.30
Nodes (10): getSeasonMonth(), isSpeciesBlooming(), monthToSeasonWeights(), normalizeMonth(), PLANT_SPECIES, PlantSpecies, PlantSpeciesInfo, setSeasonMonth() (+2 more)

### Community 56 - "plinthKit.ts"
Cohesion: 0.07
Nodes (65): boundsFitPlinth(), boundsFitStand(), clamp(), fitBoundsToPlinth(), fitBoundsToStand(), footprintInsidePolygon(), innerStandPolygon(), PlanarBounds (+57 more)

### Community 57 - "WebGPUSceneRenderer"
Cohesion: 0.05
Nodes (23): WebGPUSceneRenderer, ALPHA_UNIFORMS, COLOR_UNIFORMS, createWebGPUCompat(), convert(), findAlphaUniform(), findColorUniform(), findIntensityUniform() (+15 more)

### Community 58 - "ref_node_assert"
Cohesion: 0.29
Nodes (4): condenseHistoryText(), splitSentences(), adjacentRouteStop(), VISUAL_FIELDS

### Community 59 - "capture-visual-matrix.mjs"
Cohesion: 0.32
Nodes (7): captureState(), Cdp, main(), parseCli(), sampleEval(), sleep(), stateEval()

### Community 61 - "DaylightBirdsController"
Cohesion: 0.29
Nodes (3): DaylightBirdsController, paletteKeyForBiome(), tagBirdPart()

### Community 62 - "postfx.ts"
Cohesion: 0.10
Nodes (19): createDitherPass(), createMiniaturePass(), DitherShader, fallbackDepth, MiniatureBlurShader, MiniatureGradeOptions, MiniatureShader, MiniatureTuning (+11 more)

### Community 63 - "run"
Cohesion: 0.32
Nodes (5): CDP, clickAria(), listTargets(), run(), sleep()

### Community 64 - "SearchSheet.tsx"
Cohesion: 0.19
Nodes (19): SearchSheet(), SearchSheetProps, LANDMARK_TAGS, LANDMARKS, PROVINCES, usePWAInstall(), countLandmarksByTag(), filterLandmarks() (+11 more)

### Community 65 - "layer.ts"
Cohesion: 0.11
Nodes (18): addCreatureLife(), CreatureTier, CreatureEffectsStats, DEFAULT_DUST_COLOR, DEFAULT_RIPPLE_COLOR, DEFAULT_SPLASH_COLOR, POOL_CAPS, createCreatureLayer() (+10 more)

### Community 66 - "siteAtmosphere.ts"
Cohesion: 0.17
Nodes (14): AtmosphereEffect, AtmosphereLayer, AtmosphereProfile, AtmosphereSceneController, AtmosphereSite, AtmosphereUpdateOptions, BIOME_EFFECTS, createAtmosphereScene() (+6 more)

### Community 67 - "check-exposure.mjs"
Cohesion: 0.22
Nodes (8): dir, evaluate(), files, pending, send(), target, { values, positionals }, ws

### Community 68 - "mediaService.ts"
Cohesion: 0.21
Nodes (10): GalleryModalProps, cleanCaption(), CommonsImageInfo, CommonsPage, loadLandmarkMedia(), MEDIA_CACHE, stripHtml(), SUMMARY_CACHE (+2 more)

### Community 69 - "layer.ts"
Cohesion: 0.14
Nodes (10): CREATURE_TIER_CAPS, CREATURE_TIER_LABELS, CreatureBudget, CreatureBudgetStats, CreaturePriority, CreatureReservation, PRIORITY_WEIGHT, TierCaps (+2 more)

### Community 70 - "contact-sheet.ts"
Cohesion: 0.25
Nodes (8): build(), engine, grid, hour, params, stage, status, syncButtons()

### Community 71 - "framePacing.ts"
Cohesion: 0.31
Nodes (8): DEFAULT_QUIET_SECONDS, FramePacingInput, frameThrottleMs(), IDLE_QUIET_MS, IDLE_REDUCED_MS, IDLE_SOFTWARE_MS, stageQuiet(), StageQuietInput

### Community 73 - ".constructor"
Cohesion: 0.20
Nodes (10): angularDistance(), createRng(), easeOutBack(), hashString(), mulberry32(), poissonInterval(), ScatterOptions, scatterRing() (+2 more)

### Community 74 - "run-qa-capture.mjs"
Cohesion: 0.11
Nodes (15): devDependencies, playwright@^1.65.1, puppeteer@^25.18.1, puppeteer, outDir, results, viewports, startQaServer() (+7 more)

### Community 75 - "make-contact-sheet.mjs"
Cohesion: 0.53
Nodes (4): delta(), loadStats(), main(), parseCli()

### Community 76 - "CreatureField"
Cohesion: 0.11
Nodes (11): angleDelta(), CreatureField, CreatureFieldOptions, CreatureFieldStats, M_PERCH, CreatureZone, SpeciesId, CreatureAnimState (+3 more)

### Community 77 - "n8ao.d.ts"
Cohesion: 0.25
Nodes (4): n8ao, N8AOPass, N8AOPassConfiguration, N8AOQualityMode

### Community 78 - "windowLights.ts"
Cohesion: 0.23
Nodes (11): bake(), FacadeRecord, facades, hash01(), OCCUPANCY_KEYFRAMES, tmpLit, updateWindowLights(), WindowFacade (+3 more)

### Community 79 - "material.ts"
Cohesion: 0.20
Nodes (11): CreatureAnimation, createCreatureMaterial(), CREATURE_ANIM_STATES, CREATURE_STATE_VALUE, CREATURE_UNIFORMS, CreatureMaterialOptions, CreatureUniforms, deformation() (+3 more)

### Community 80 - "three"
Cohesion: 0.25
Nodes (7): three, auditStandContainment(), isStandGeometry(), labelFor(), StandAudit, StandAuditOptions, StandOverflow

### Community 81 - "globalIllumination.ts"
Cohesion: 0.24
Nodes (9): attachEquirect(), buildProbeData(), Equirect, HORIZ_DIRS, installGI(), probeGrid, probeOrigin, probeSize (+1 more)

### Community 82 - "biomePalette.ts"
Cohesion: 0.12
Nodes (20): BIOME_FALLBACK, normalizeRuleKey(), REGIONAL_PALETTES, RegionalPalette, RegionalPaletteKey, resolveRegionalPalette(), rule(), SITE_RULES (+12 more)

### Community 84 - "windParticles.ts"
Cohesion: 0.31
Nodes (8): GlobeController, BIOME_PALETTES, createLeafWispTexture(), createWindParticles(), seeded(), WindParticlesController, WindParticlesUpdateOptions, QualityIndex

### Community 86 - "creaturesLab.ts"
Cohesion: 0.10
Nodes (21): KEY_DAY, KEY_NIGHT, KEY_WARM, labelled(), mountCreaturesLab(), SKY_DAWN, SKY_DAY, SKY_DUSK (+13 more)

### Community 87 - "cloudShape.ts"
Cohesion: 0.36
Nodes (7): cloudOpacity(), LOBES, sampleCloudDensity(), smoothstep(), addDioramaClouds(), getDioramaCloudMat(), getDioramaCloudTexture()

### Community 88 - "LandmarkBiome"
Cohesion: 0.25
Nodes (9): IDLES, KINDS, SEASONS, WILDLIFE, WildlifeSpot, AnimalIdle, AnimalKind, AnimalSeason (+1 more)

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
Cohesion: 0.31
Nodes (7): computeTerrainContactLift(), createTerrainHeightSampler(), createTriangulatedTerrainSampler(), TerrainGridSamplerOptions, TerrainSurfaceNormal, TriangulatedTerrainSampler, addInstancedRocks()

### Community 95 - "LandmarkBiome"
Cohesion: 0.29
Nodes (3): extractRegionName(), HorizonSceneryController, LandmarkBiome

### Community 96 - "landmarkGeometry.ts"
Cohesion: 0.60
Nodes (3): bridgeStayAnchors(), catenaryArchHeight(), StayAnchor

### Community 98 - "ScaleRulerModal.tsx"
Cohesion: 0.11
Nodes (25): barWidth(), REFERENCE_OPTIONS, RulerRow, RulerScale, RulerSort, SCALE_OPTIONS, ScaleRulerModal(), ScaleRulerModalProps (+17 more)

### Community 99 - "addWildlifeLayer"
Cohesion: 0.67
Nodes (3): getAnimalSeasonMonth(), addWildlifeLayer(), appendLayerTargets()

### Community 101 - "SliceSharedAssets"
Cohesion: 0.67
Nodes (3): BespokeInteriorContext, PlacesShaderEnvironment, SliceSharedAssets

### Community 103 - "addSiteMotion"
Cohesion: 0.50
Nodes (4): addSiteMotion(), addWeatherFx(), stream(), normalMapsActive()

## Knowledge Gaps
- **10 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `three` connect `three` to `landmarksB.ts`, `placesSliceBuilders.ts`, `placesShaders.ts`, `lightingRig.ts`, `dioramaKit.ts`, `animalKit.ts`, `osmSlice.ts`, `prepareCanvasTexture`, `package.json`, `CitylitEngine.ts`, `placesClouds.ts`, `createRenderer.ts`, `vehicleLightKit.ts`, `species.ts`, `placesInteriors.ts`, `daylightBirds.ts`, `compare-metrics.mjs`, `.constructor`, `plinthKit.ts`, `WebGPUSceneRenderer`, `postfx.ts`, `layer.ts`, `siteAtmosphere.ts`, `CreatureField`, `n8ao.d.ts`, `windowLights.ts`, `material.ts`, `globalIllumination.ts`, `windParticles.ts`, `creaturesLab.ts`, `terrainHeight.ts`?**
  _High betweenness centrality (0.253) - this node is a cross-community bridge._
- **Should `landmarksB.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05516683660912063 - nodes in this community are weakly interconnected._
- **Why does `puppeteer` connect `run-qa-capture.mjs` to `package.json`?**
  _High betweenness centrality (0.062) - this node is a cross-community bridge._
- **Should `SettingsModal.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.07053140096618357 - nodes in this community are weakly interconnected._
- **Why does `CitylitEngine` connect `CitylitEngine` to `.frame`, `SettingsModal.tsx`, `citylit.ts`, `App.tsx`, `animalKit.ts`, `.fitHeroCamera`, `osmSlice.ts`, `motion.ts`, `CitylitEngine.ts`, `.frame`, `qualityBenchmark.ts`, `.constructor`, `plinthKit.ts`, `DaylightBirdsController`, `postfx.ts`, `siteAtmosphere.ts`, `contact-sheet.ts`, `framePacing.ts`, `MiniaturePass`, `three`, `biomePalette.ts`, `windParticles.ts`, `LandmarkBiome`, `.dispose`, `ScaleRulerModal.tsx`?**
  _High betweenness centrality (0.061) - this node is a cross-community bridge._
- **Should `citylit.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06352941176470588 - nodes in this community are weakly interconnected._
- **Should `App.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.07330827067669173 - nodes in this community are weakly interconnected._