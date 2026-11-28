# Graph Report - citylit-pwa  (2026-11-28)

## Corpus Check
- 231 files · ~464,055 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 11 file(s) not represented in the graph (top: .woff2 4, (none) 3, .css 2)

## Summary
- 2387 nodes · 6861 edges · 108 communities (93 shown, 15 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 236 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `bc20e390`
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
- globeScene.ts
- motion.ts
- viewportFraming.ts
- skyEvents.ts
- prepareCanvasTexture
- playwright
- package.json
- layer.ts
- .updateSpatial
- Sheet.tsx
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
- fitMath.ts
- measure-idle-pacing.mjs
- species.ts
- placesInteriors.ts
- qualityBenchmark.ts
- daylightBirds.ts
- compare-metrics.mjs
- .constructor
- InfoDrawer.tsx
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
- CreatureLayer
- siteAtmosphere.ts
- check-exposure.mjs
- standFootprint.ts
- layer.ts
- contact-sheet.ts
- framePacing.ts
- MiniaturePass
- .constructor
- run-qa-capture.mjs
- make-contact-sheet.mjs
- CreatureField
- .frame
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
- Menu.tsx
- .setQualityIndex
- ScaleRulerModal.tsx
- addWildlifeLayer
- AnimalScaffold
- createWebGPUCompat
- WebGPUPostFX
- addSiteMotion
- siteVisuals.ts
- three
- getSoftTexture
- webgpuCompat.ts

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
- `main()` --indirect_call--> `setupEval()`  [INFERRED]
  scripts/capture-visual-matrix.mjs → scripts/capture-contact-sheets.mjs
- `EngineCallbacks` --references--> `PlacesSelectionInfo`  [EXTRACTED]
  src/three/CitylitEngine.ts → src/three/placesScene.ts
- `CompassProps` --references--> `CitylitEngine`  [EXTRACTED]
  src/components/Compass.tsx → src/three/CitylitEngine.ts
- `CitylitEngine` --references--> `FrameTimeBenchmark`  [EXTRACTED]
  src/three/CitylitEngine.ts → src/lib/qualityBenchmark.ts

## Import Cycles
- None detected.

## Communities (108 total, 15 thin omitted)

### Community 0 - "landmarksB.ts"
Cohesion: 0.05
Nodes (234): bouldersGroundHeight(), fbm2(), krugerGroundHeight(), noise2(), orlandoGroundHeight(), smoothstep(), headingYaw(), leftLaneOffset() (+226 more)

### Community 2 - "SettingsModal.tsx"
Cohesion: 0.06
Nodes (45): motion, react, ambientAudio, AnimalAudioEvent, BIOME_HAPTIC_PATTERNS, FilterBand, REGION_HAPTIC_ACCENTS, SpatialEmitter (+37 more)

### Community 3 - "citylit.ts"
Cohesion: 0.07
Nodes (35): airQualityInsight(), CAMERA_PRESETS, cardContentVariants, CARDINALS, cardItemVariants, getCategoryMeta(), LandmarkCard(), LandmarkCardProps (+27 more)

### Community 4 - "server.js"
Cohesion: 0.20
Nodes (6): express@5.3.0, express, app, __dirname, distDir, __filename

### Community 5 - "App.tsx"
Cohesion: 0.06
Nodes (55): App(), INITIAL_GLOBE, INITIAL_ROUTE_ID, readInitialLandmarkIndex(), readSettings(), readStoredEggs(), readStoredNotes(), readStoredSavedPlaces() (+47 more)

### Community 6 - "placesSliceBuilders.ts"
Cohesion: 0.11
Nodes (34): getGrassMaterial(), BespokeInteriorKind, createCutawayWaterTopMaterial(), createCutawayWaterWallMaterial(), createSliceMistMaterial(), CutawayWaterOptions, getOrlandoMuralTexture(), addInstancedFlowers() (+26 more)

### Community 7 - "placesShaders.ts"
Cohesion: 0.11
Nodes (27): createPlacesScene(), bindVolumetricFogUniforms(), createPlacesShaderEnv(), createPlacesVolumetricFogLayer(), createPlacesWeatherParticles(), createSliceCloudMaterial(), createStrataTerrainMaterial(), patchPlacesVolumetricFog() (+19 more)

### Community 8 - "lightingRig.ts"
Cohesion: 0.07
Nodes (40): clamp01(), LiveWeatherVisual, liveWeatherVisual(), MID_MONTH_DAY, solarDeclination(), southernSunDirection(), AUTO_EXPOSURE_ADAPT_RATE, BIOME_BOUNCE_COLORS (+32 more)

### Community 9 - "dioramaKit.ts"
Cohesion: 0.05
Nodes (48): accentFor(), addLampWaterReflections(), addWetRoadStreaks(), AnchorKind, CorniceBandSpec, DioramaFx, DoorSurroundSpec, FacadeWindowSpec (+40 more)

### Community 10 - "animalKit.ts"
Cohesion: 0.09
Nodes (31): advanceAnimalTime(), AnimalLodSpec, AnimalMember, AnimalPose, AnimalScaffoldSpec, animalSeasonForMonth(), AnimalVec3, ArticulationAxis (+23 more)

### Community 11 - "WeatherWidget.tsx"
Cohesion: 0.10
Nodes (36): HourlyForecast(), HourlyForecastProps, WeatherIcon(), pad2(), PRESET_ICONS, PresetKey, SKY_EVENT_ICON, TIME_PRESETS (+28 more)

### Community 12 - "CitylitEngine"
Cohesion: 0.08
Nodes (4): CompassProps, SwayItem, WetMaterialEntry, CitylitEngine

### Community 13 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowImportingTsExtensions, isolatedModules, jsx, lib, module, moduleDetection, moduleResolution (+10 more)

### Community 15 - "osmService.ts"
Cohesion: 0.08
Nodes (34): cacheKey(), fallbackPatch(), GEO_CACHE, loadElevation(), loadOsmPlace(), LocalPoint, MEMORY_CACHE, OsmArea (+26 more)

### Community 16 - "globeScene.ts"
Cohesion: 0.16
Nodes (24): AFRICA_POLYS, ENCLAVE_POLYS, GLOBE_NEIGHBOR_LABELS, GLOBE_PROVINCES, NEIGHBOR_POLYS, PROVINCE_STYLE, ProvinceGlobeEntry, GEO_AFRICA (+16 more)

### Community 17 - "motion.ts"
Cohesion: 0.07
Nodes (29): CARDINAL_TARGETS, CARDINALS_8, Compass(), formatBearing(), TICKS, GalleryDialog(), GalleryModal(), GalleryModalProps (+21 more)

### Community 18 - "viewportFraming.ts"
Cohesion: 0.14
Nodes (23): clampShift(), EMPTY_INSETS, FramingPlan, freeFitFactor(), freeRect(), isCompactViewport(), LayoutMode, layoutModeFor() (+15 more)

### Community 19 - "skyEvents.ts"
Cohesion: 0.21
Nodes (15): dayIndex(), daysInMonth(), entryIntensity(), EVENT_PRIORITY, formatWhen(), getSkyEvent(), getUpcomingSkyEvents(), MONTH_LABELS (+7 more)

### Community 20 - "prepareCanvasTexture"
Cohesion: 0.10
Nodes (40): applyDissolveToShader(), cascadeize(), flagWindy(), getBrushedNormalTexture(), getBrushedRoughnessTexture(), getCanvasBumpTexture(), getCanvasNormalTexture(), getOrCreateCanvas() (+32 more)

### Community 21 - "playwright"
Cohesion: 0.08
Nodes (21): playwright, errors, errors, names, errors, failed, report, sites (+13 more)

### Community 22 - "package.json"
Cohesion: 0.07
Nodes (39): dependencies, goeist@0.1.0, motion@14.14.0, n8ao@2.1.0, oxfmt@0.79.0, oxlint@1.94.0, @phosphor-icons/react@2.1.10, react@19.3.1 (+31 more)

### Community 23 - "layer.ts"
Cohesion: 0.11
Nodes (29): DAY, addCreatureLife(), CreatureTier, tierDensity(), CREATURE_ENV, CreatureEnvSnapshot, currentTimeBand(), publishCreatureEnvironment() (+21 more)

### Community 24 - ".updateSpatial"
Cohesion: 0.27
Nodes (4): clamp01(), equalPower(), smoothBell(), smoothstep()

### Community 25 - "Sheet.tsx"
Cohesion: 0.15
Nodes (18): Sheet(), SheetProps, SheetSide, useFocusTrap(), shouldDismiss(), Z, clearSafeArea(), EMPTY (+10 more)

### Community 26 - "CitylitEngine.ts"
Cohesion: 0.06
Nodes (35): STAND_BLOCK_HALF, BeaconAnchor, beaconGeo, collectBeacons(), createBeaconMesh(), LANDMARK_BUILDERS, glowMaterials, resetSceneDynamicLists() (+27 more)

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
Nodes (19): addEdgeWaterfall(), addRimEdgeContinuity(), addScaleReference(), addSoaringBirds(), addSquareWaterPlate(), applyDioramaUpgrade(), buildSpatialSources(), finalizeLandmarkGroup() (+11 more)

### Community 33 - "with"
Cohesion: 0.11
Nodes (17): jobs, verify, name, on, pull_request, push, branches, name (+9 more)

### Community 34 - "placesClouds.ts"
Cohesion: 0.29
Nodes (7): CloudDrift, cloudDrift(), CloudAssets, CloudPuffInstance, createCloudPuffMesh(), createSliceCloudLayer(), SliceCloudLayer

### Community 35 - "createRenderer.ts"
Cohesion: 0.12
Nodes (13): createWebGLRendererSelection(), decideRendererBackend(), GPUCapableNavigator, readRendererPreference(), RendererProbe, selectRenderer(), StubWindow, wantsMsaa() (+5 more)

### Community 36 - "PlacesOverlay.tsx"
Cohesion: 0.09
Nodes (33): @phosphor-icons/react, EditorialMarkers(), EditorialSources(), MOBILE_WEATHER_ICONS, placeCardCondition(), PlacesOverlay(), PlacesOverlayProps, QUICK_TIMES (+25 more)

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
Cohesion: 0.15
Nodes (3): AmbientAudioController, SiteProfile, AmbientSiteProfile

### Community 44 - "vehicleLightKit.ts"
Cohesion: 0.10
Nodes (20): getCarHeadlightMat(), getCarPoolMat(), getCarTaillightMat(), createVehicleLightBatch(), ensureLightGeometries(), LightGeometries, markLightMesh(), placeInstance() (+12 more)

### Community 45 - "run"
Cohesion: 0.38
Nodes (5): CDP, i0(), listTargets(), run(), sleep()

### Community 46 - "fitMath.ts"
Cohesion: 0.21
Nodes (16): boundsFitPlinth(), boundsFitStand(), fitBoundsToPlinth(), fitBoundsToStand(), footprintInsidePolygon(), innerStandPolygon(), PlanarBounds, PLINTH_FRAME_WIDTH (+8 more)

### Community 47 - "measure-idle-pacing.mjs"
Cohesion: 0.17
Nodes (5): cdp, CdpSession, ROOT, server, tab

### Community 48 - "species.ts"
Cohesion: 0.19
Nodes (29): AssembledGeometry, assembleParts(), AXIS_DEFAULT, axisId(), ball(), box(), buildBat(), buildButterfly() (+21 more)

### Community 49 - "placesInteriors.ts"
Cohesion: 0.08
Nodes (54): BESPOKE_INTERIORS, BespokeInteriorContext, buildThemedInterior(), bx(), co(), colonnade(), compactShell(), cy() (+46 more)

### Community 50 - "qualityBenchmark.ts"
Cohesion: 0.14
Nodes (12): BenchmarkConfig, BenchmarkTier, CachedBenchmark, computeFrameStats(), DEFAULT_BENCHMARK_CONFIG, FrameStats, FrameTimeBenchmark, percentile() (+4 more)

### Community 51 - "daylightBirds.ts"
Cohesion: 0.20
Nodes (10): computeBirdSpawnIntervalSec(), computeFoliageSwayAngle(), computeFoliageWindStrength(), isDaylightForBirds(), BIOME_PALETTES, BirdAgent, BirdPalette, BirdState (+2 more)

### Community 52 - "compare-metrics.mjs"
Cohesion: 0.12
Nodes (12): fakeCtx, rows, after, afterByKey, before, breaches, key(), mean() (+4 more)

### Community 53 - ".constructor"
Cohesion: 0.11
Nodes (3): createDitherPass(), PMREMGeneratorLike, preloadProceduralTextures()

### Community 54 - "InfoDrawer.tsx"
Cohesion: 0.13
Nodes (23): formatCoords(), INFO_TABS, InfoDrawer(), InfoDrawerProps, InfoDrawerTab, UnfoldAccordion(), LANDMARK_DETAILS, LandmarkDetail (+15 more)

### Community 55 - "weatherScene.ts"
Cohesion: 0.27
Nodes (11): getSeasonMonth(), isSpeciesBlooming(), monthToSeasonWeights(), normalizeMonth(), PLANT_SPECIES, PlantSpecies, PlantSpeciesInfo, SeasonWeights (+3 more)

### Community 56 - "plinthKit.ts"
Cohesion: 0.16
Nodes (22): clamp(), formatDmsCoords(), getPilotGroundHeightFn(), getPlinthOutlinePoints, hash2(), mapDomainToPlinth, PILOT_PLINTH_SPECS, PlinthSilhouette (+14 more)

### Community 58 - "ref_node_assert"
Cohesion: 0.14
Nodes (10): condenseHistoryText(), splitSentences(), bridgeStayAnchors(), catenaryArchHeight(), StayAnchor, adjacentRouteStop(), TerrainNormal, terrainNormalFromTangents() (+2 more)

### Community 59 - "capture-visual-matrix.mjs"
Cohesion: 0.32
Nodes (7): captureState(), Cdp, main(), parseCli(), sampleEval(), sleep(), stateEval()

### Community 61 - "DaylightBirdsController"
Cohesion: 0.29
Nodes (3): DaylightBirdsController, paletteKeyForBiome(), tagBirdPart()

### Community 62 - "postfx.ts"
Cohesion: 0.11
Nodes (14): createMiniaturePass(), DitherShader, fallbackDepth, MiniatureBlurShader, MiniatureGradeOptions, MiniatureShader, MiniatureTuning, createSceneRenderer() (+6 more)

### Community 63 - "run"
Cohesion: 0.32
Nodes (5): CDP, clickAria(), listTargets(), run(), sleep()

### Community 64 - "SearchSheet.tsx"
Cohesion: 0.09
Nodes (36): CATEGORY_COLORS, PASSPORT_TABS, PassportModal(), PassportTab, ProvinceRing(), ProvinceRingProps, ProvinceStatRow, StatsTooltip() (+28 more)

### Community 66 - "siteAtmosphere.ts"
Cohesion: 0.19
Nodes (13): AtmosphereEffect, AtmosphereLayer, AtmosphereProfile, AtmosphereSceneController, AtmosphereUpdateOptions, BIOME_EFFECTS, createAtmosphereScene(), effectOpacity() (+5 more)

### Community 67 - "check-exposure.mjs"
Cohesion: 0.22
Nodes (8): dir, evaluate(), files, pending, send(), target, { values, positionals }, ws

### Community 68 - "standFootprint.ts"
Cohesion: 0.24
Nodes (16): clamp(), clampToStand(), getStandOutlinePoints(), mapStandDomain(), pointInStandPolygon(), smoothstep(), STAND_DETAIL_HALF, STAND_EDGE_ALLOWANCE (+8 more)

### Community 69 - "layer.ts"
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
Cohesion: 0.12
Nodes (11): angleDelta(), CreatureField, CreatureFieldOptions, CreatureFieldStats, M_PERCH, CreatureZone, SpeciesId, CreatureAnimState (+3 more)

### Community 78 - "windowLights.ts"
Cohesion: 0.23
Nodes (11): bake(), FacadeRecord, facades, hash01(), OCCUPANCY_KEYFRAMES, tmpLit, updateWindowLights(), WindowFacade (+3 more)

### Community 79 - "material.ts"
Cohesion: 0.20
Nodes (11): CreatureAnimation, createCreatureMaterial(), CREATURE_ANIM_STATES, CREATURE_STATE_VALUE, CREATURE_UNIFORMS, CreatureMaterialOptions, CreatureUniforms, deformation() (+3 more)

### Community 80 - "three"
Cohesion: 0.27
Nodes (6): auditStandContainment(), isStandGeometry(), labelFor(), StandAudit, StandAuditOptions, StandOverflow

### Community 81 - "globalIllumination.ts"
Cohesion: 0.24
Nodes (9): attachEquirect(), buildProbeData(), Equirect, HORIZ_DIRS, installGI(), probeGrid, probeOrigin, probeSize (+1 more)

### Community 82 - "biomePalette.ts"
Cohesion: 0.22
Nodes (10): BIOME_FALLBACK, normalizeRuleKey(), REGIONAL_PALETTES, RegionalPalette, RegionalPaletteKey, resolveRegionalPalette(), rule(), SITE_RULES (+2 more)

### Community 84 - "windParticles.ts"
Cohesion: 0.31
Nodes (8): GlobeController, BIOME_PALETTES, createLeafWispTexture(), createWindParticles(), seeded(), WindParticlesController, WindParticlesUpdateOptions, QualityIndex

### Community 86 - "creaturesLab.ts"
Cohesion: 0.09
Nodes (23): KEY_DAY, KEY_NIGHT, KEY_WARM, labelled(), mountCreaturesLab(), SKY_DAWN, SKY_DAY, SKY_DUSK (+15 more)

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
Cohesion: 0.38
Nodes (7): addCraftedRim(), addSquareRim(), getRimMaterial(), getRimPalette(), paintRadial(), paintStrata(), rimEdgeColor()

### Community 94 - "terrainHeight.ts"
Cohesion: 0.31
Nodes (7): computeTerrainContactLift(), createTerrainHeightSampler(), createTriangulatedTerrainSampler(), TerrainGridSamplerOptions, TerrainSurfaceNormal, TriangulatedTerrainSampler, addInstancedRocks()

### Community 95 - "LandmarkBiome"
Cohesion: 0.40
Nodes (4): extractRegionName(), HorizonSceneryController, AtmosphereSite, LandmarkBiome

### Community 96 - "Menu.tsx"
Cohesion: 0.17
Nodes (12): react-dom, GlobeOverlay(), GlobeOverlayProps, DropdownTokens, Menu(), MenuItem, MenuProps, readDropdownTokens() (+4 more)

### Community 98 - "ScaleRulerModal.tsx"
Cohesion: 0.12
Nodes (23): barWidth(), REFERENCE_OPTIONS, RulerRow, RulerScale, RulerSort, SCALE_OPTIONS, ScaleRulerModal(), ScaleRulerModalProps (+15 more)

### Community 99 - "addWildlifeLayer"
Cohesion: 0.67
Nodes (3): getAnimalSeasonMonth(), addWildlifeLayer(), appendLayerTargets()

### Community 101 - "createWebGPUCompat"
Cohesion: 0.41
Nodes (12): createWebGPUCompat(), convert(), findAlphaUniform(), findColorUniform(), findIntensityUniform(), tryGroundSheen(), tryHorizonRing(), trySkyMaterial() (+4 more)

### Community 103 - "addSiteMotion"
Cohesion: 0.50
Nodes (4): addSiteMotion(), addWeatherFx(), stream(), normalMapsActive()

### Community 104 - "siteVisuals.ts"
Cohesion: 0.24
Nodes (10): blendHex(), DEFAULT_BY_BIOME, getSiteVisualProfile(), normalizeSiteVisualKey(), REGIONAL_BLEND_WEIGHTS, RegionalColourField, SITE_VISUALS_MAP, SitePointLightSpec (+2 more)

### Community 105 - "three"
Cohesion: 0.36
Nodes (6): three, auditLandmarkGeometry(), LandmarkGeometryAudit, LandmarkGeometryAuditOptions, objectLabel(), material

### Community 106 - "getSoftTexture"
Cohesion: 0.36
Nodes (7): createContactShadowMaterial(), BiomeWeights, createHorizonRing(), createHorizonScenery(), HorizonUpdateOptions, weightsForBiome(), getSoftTexture()

### Community 107 - "webgpuCompat.ts"
Cohesion: 0.25
Nodes (7): ALPHA_UNIFORMS, COLOR_UNIFORMS, INTENSITY_UNIFORMS, TSLModule, UniformLink, UV_MAP_KEYS, WebGPUModule

## Knowledge Gaps
- **15 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `three` connect `three` to `landmarksB.ts`, `placesSliceBuilders.ts`, `placesShaders.ts`, `lightingRig.ts`, `dioramaKit.ts`, `animalKit.ts`, `osmService.ts`, `globeScene.ts`, `prepareCanvasTexture`, `package.json`, `layer.ts`, `CitylitEngine.ts`, `placesClouds.ts`, `createRenderer.ts`, `PlacesOverlay.tsx`, `vehicleLightKit.ts`, `species.ts`, `placesInteriors.ts`, `daylightBirds.ts`, `compare-metrics.mjs`, `plinthKit.ts`, `postfx.ts`, `siteAtmosphere.ts`, `CreatureField`, `windowLights.ts`, `material.ts`, `three`, `globalIllumination.ts`, `windParticles.ts`, `creaturesLab.ts`, `terrainHeight.ts`, `getSoftTexture`, `webgpuCompat.ts`?**
  _High betweenness centrality (0.276) - this node is a cross-community bridge._
- **Should `landmarksB.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05491009681881051 - nodes in this community are weakly interconnected._
- **Why does `CitylitEngine` connect `CitylitEngine` to `.frame`, `citylit.ts`, `App.tsx`, `animalKit.ts`, `.fitHeroCamera`, `osmService.ts`, `motion.ts`, `CitylitEngine.ts`, `createRenderer.ts`, `.frame`, `fitMath.ts`, `qualityBenchmark.ts`, `.constructor`, `DaylightBirdsController`, `postfx.ts`, `siteAtmosphere.ts`, `contact-sheet.ts`, `framePacing.ts`, `MiniaturePass`, `.frame`, `three`, `windParticles.ts`, `LandmarkBiome`, `.setQualityIndex`, `ScaleRulerModal.tsx`, `siteVisuals.ts`?**
  _High betweenness centrality (0.096) - this node is a cross-community bridge._
- **Should `.frame` be split into smaller, more focused modules?**
  _Cohesion score 0.1455026455026455 - nodes in this community are weakly interconnected._
- **Why does `puppeteer` connect `run-qa-capture.mjs` to `package.json`?**
  _High betweenness centrality (0.056) - this node is a cross-community bridge._
- **Should `SettingsModal.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.057912457912457915 - nodes in this community are weakly interconnected._
- **Should `citylit.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.07030527289546716 - nodes in this community are weakly interconnected._