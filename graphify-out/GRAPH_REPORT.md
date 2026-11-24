# Graph Report - citylit-pwa  (2026-11-24)

## Corpus Check
- 200 files · ~439,307 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 11 file(s) not represented in the graph (top: .woff2 4, (none) 3, .css 2)

## Summary
- 2217 nodes · 6406 edges · 108 communities (92 shown, 16 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 233 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `5298876b`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- landmarksB.ts
- scaleFacts.ts
- citylit.ts
- timePresets.ts
- ScaleRulerModal.tsx
- App.tsx
- placesSliceBuilders.ts
- placesShaders.ts
- motion.ts
- dioramaKit.ts
- animalKit.ts
- WeatherWidget.tsx
- CitylitEngine
- compilerOptions
- weatherScene.ts
- osmService.ts
- osmSlice.ts
- .isStudio
- MiniaturePass
- skyEvents.ts
- prepareCanvasTexture
- playwright
- package.json
- layer.ts
- AmbientAudioController
- .showLandmarkImmediate
- CitylitEngine.ts
- .oxfmtrc.json
- .oxlintrc.json
- vite.config.ts
- albedoAudit.ts
- scripts
- applyDioramaUpgrade
- with
- CreatureTier
- ref_node_test
- citylit.ts
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
- DaylightBirdsController
- compare-metrics.mjs
- placesScene.ts
- daylightBirds.ts
- weatherScene.ts
- .constructor
- WebGPUSceneRenderer
- plinthProfiles.ts
- capture-visual-matrix.mjs
- WebGLSceneRenderer
- vehicleLightKit.ts
- PlacesOverlay.tsx
- run
- addWildlifeLayer
- windowLights.ts
- siteAtmosphere.ts
- check-exposure.mjs
- webgpuPostFX.ts
- budget.ts
- contact-sheet.ts
- framePacing.ts
- markSharedGeo
- .constructor
- ref_node_fs
- make-contact-sheet.mjs
- CreatureField
- field.ts
- addCraftedRim
- addSiteMotion
- createWebGPUCompat
- verify_phase2.mjs
- biomePalette.ts
- globalIllumination.ts
- InfoDrawer.tsx
- windParticles.ts
- creaturesLab.ts
- plinthKit.ts
- webgpuCompat.ts
- n8ao.d.ts
- addDioramaClouds
- nativeHost.ts
- .animateVehicleNightLights
- LandmarkBiome
- ambientAudio.ts
- tide.test.ts
- devDependencies
- ref_node_assert
- .setQualityIndex
- fitMath.ts
- getSoftTexture
- WebGPUPostFX
- textureCache.ts
- landmarkGeometry.ts
- SceneRenderer.ts
- condenseHistoryText
- AnimalScaffold

## God Nodes (most connected - your core abstractions)
1. `CitylitEngine` - 152 edges
2. `add()` - 104 edges
3. `M()` - 83 edges
4. `C()` - 82 edges
5. `CB()` - 71 edges
6. `mergeByMaterial()` - 60 edges
7. `R()` - 60 edges
8. `addStreetLampSet()` - 56 edges
9. `MStone()` - 56 edges
10. `App()` - 53 edges

## Surprising Connections (you probably didn't know these)
- `memoryApiPlugin()` --calls--> `createMemoryMiddleware()`  [EXTRACTED]
  vite.config.ts → server/memory.js
- `ScaleReferenceEntry` --references--> `ScaleReferenceKind`  [EXTRACTED]
  src/three/builders/dioramaKit.ts → src/types/citylit.ts
- `AtmosphereSite` --references--> `LandmarkBiome`  [EXTRACTED]
  src/three/siteAtmosphere.ts → src/types/citylit.ts
- `main()` --indirect_call--> `setupEval()`  [INFERRED]
  scripts/capture-visual-matrix.mjs → scripts/capture-contact-sheets.mjs
- `App()` --calls--> `InfoDrawer()`  [EXTRACTED]
  src/App.tsx → src/components/InfoDrawer.tsx

## Import Cycles
- None detected.

## Communities (108 total, 16 thin omitted)

### Community 0 - "landmarksB.ts"
Cohesion: 0.06
Nodes (223): headingYaw(), leftLaneOffset(), normalizePlanar(), PlanarVector, registerBeacons(), addAnchor(), addBaseScatter(), addBollards() (+215 more)

### Community 1 - "scaleFacts.ts"
Cohesion: 0.24
Nodes (11): formatMetres(), REFERENCE_HEIGHTS, referenceHeightM(), SCALE_FACTS, ScaleFact, ScaleMeasure, scaleRatio(), MAX_REFERENCE_UNITS (+3 more)

### Community 2 - "citylit.ts"
Cohesion: 0.09
Nodes (31): ambientAudio, BUILTIN_MIXER_PRESETS, DEFAULT_MIXER, FPS_OPTIONS, MIXER_CHANNELS, MOTION_OPTIONS, QUALITY_OPTIONS, readCustomPresets() (+23 more)

### Community 3 - "timePresets.ts"
Cohesion: 0.43
Nodes (5): GOLDEN_HOUR_END, GOLDEN_HOUR_START, TIME_PRESETS, TimePreset, TimePresetKey

### Community 4 - "ScaleRulerModal.tsx"
Cohesion: 0.09
Nodes (28): @phosphor-icons/react, react, react-dom, barWidth(), REFERENCE_OPTIONS, RulerRow, RulerScale, RulerSort (+20 more)

### Community 5 - "App.tsx"
Cohesion: 0.08
Nodes (43): App(), INITIAL_GLOBE, readInitialLandmarkIndex(), readSettings(), readStoredEggs(), readStoredNotes(), readStoredSavedPlaces(), readStoredSet() (+35 more)

### Community 6 - "placesSliceBuilders.ts"
Cohesion: 0.12
Nodes (33): getGrassMaterial(), BESPOKE_INTERIORS, createCutawayWaterTopMaterial(), createCutawayWaterWallMaterial(), createSliceMistMaterial(), CutawayWaterOptions, getOrlandoMuralTexture(), addInstancedFlowers() (+25 more)

### Community 7 - "placesShaders.ts"
Cohesion: 0.14
Nodes (20): bindVolumetricFogUniforms(), createStrataTerrainMaterial(), patchPlacesVolumetricFog(), PlacesSliceEmitterSpec, WaterConfluenceSpec, WaterTideSpec, CLOUD_FRAGMENT, CLOUD_VERTEX (+12 more)

### Community 8 - "motion.ts"
Cohesion: 0.09
Nodes (27): motion, AudioVisualizerBarProps, DARK_PALETTE, LIGHT_PALETTE, CARDINAL_TARGETS, CARDINALS_8, Compass(), formatBearing() (+19 more)

### Community 9 - "dioramaKit.ts"
Cohesion: 0.05
Nodes (36): accentFor(), AnchorKind, CorniceBandSpec, DioramaFx, DoorSurroundSpec, FacadeWindowSpec, FALLBACK_PROFILE, getLampBulbMat() (+28 more)

### Community 10 - "animalKit.ts"
Cohesion: 0.09
Nodes (31): advanceAnimalTime(), AnimalLodSpec, AnimalMember, AnimalPose, AnimalScaffoldSpec, animalSeasonForMonth(), AnimalVec3, ArticulationAxis (+23 more)

### Community 11 - "WeatherWidget.tsx"
Cohesion: 0.09
Nodes (40): HourlyForecast(), HourlyForecastProps, AnimatedNumber(), ANIMATED_BY_CONDITION, WeatherIcon(), WeatherIconCondition, WeatherIconProps, pad2() (+32 more)

### Community 12 - "CitylitEngine"
Cohesion: 0.07
Nodes (4): CompassProps, SwayItem, WetMaterialEntry, CitylitEngine

### Community 13 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowImportingTsExtensions, isolatedModules, jsx, lib, module, moduleDetection, moduleResolution (+10 more)

### Community 14 - "weatherScene.ts"
Cohesion: 0.10
Nodes (25): clamp01(), LiveWeatherVisual, liveWeatherVisual(), SeasonWeights, MID_MONTH_DAY, solarDeclination(), southernSunDirection(), KELVIN_KEY_MIX (+17 more)

### Community 15 - "osmService.ts"
Cohesion: 0.13
Nodes (18): cacheKey(), fallbackPatch(), GEO_CACHE, geocodePlace(), loadElevation(), loadOsmPlace(), LocalPoint, MEMORY_CACHE (+10 more)

### Community 16 - "osmSlice.ts"
Cohesion: 0.17
Nodes (17): StreetLampSpec, centroid(), clamp(), createOsmSlice(), createRibbon(), pointOnRoad(), polygonShape(), readTag() (+9 more)

### Community 19 - "skyEvents.ts"
Cohesion: 0.23
Nodes (14): dayIndex(), daysInMonth(), entryIntensity(), EVENT_PRIORITY, formatWhen(), getSkyEvent(), getUpcomingSkyEvents(), MONTH_LABELS (+6 more)

### Community 20 - "prepareCanvasTexture"
Cohesion: 0.12
Nodes (36): getRoofDirtMap(), applyDissolveToShader(), cascadeize(), flagWindy(), getBrushedNormalTexture(), getBrushedRoughnessTexture(), getCanvasBumpTexture(), getCanvasNormalTexture() (+28 more)

### Community 21 - "playwright"
Cohesion: 0.08
Nodes (11): playwright, errors, errors, names, errors, failed, report, sites (+3 more)

### Community 22 - "package.json"
Cohesion: 0.06
Nodes (43): dependencies, express@5.3.0, goeist@0.1.0, motion@14.14.0, n8ao@2.1.0, oxfmt@0.79.0, oxlint@1.94.0, pastdotdev@^0.0.1 (+35 more)

### Community 23 - "layer.ts"
Cohesion: 0.14
Nodes (25): DAY, addCreatureLife(), tierDensity(), CREATURE_ENV, currentTimeBand(), publishCreatureEnvironment(), setCreatureEnvironment(), clampHour() (+17 more)

### Community 24 - "AmbientAudioController"
Cohesion: 0.11
Nodes (3): AmbientAudioController, extractRegionName(), AmbientSiteProfile

### Community 26 - "CitylitEngine.ts"
Cohesion: 0.05
Nodes (48): LANDMARK_BUILDERS, glowMaterials, resetSceneDynamicLists(), swayItems, updateWetSurfaces(), wetMaterials, audioForward, audioRight (+40 more)

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
Cohesion: 0.18
Nodes (18): addEdgeWaterfall(), addScaleReference(), addSoaringBirds(), addSquareWaterPlate(), applyDioramaUpgrade(), buildSpatialSources(), finalizeLandmarkGroup(), getSiteProfile() (+10 more)

### Community 33 - "with"
Cohesion: 0.11
Nodes (17): jobs, verify, name, on, pull_request, push, branches, name (+9 more)

### Community 34 - "CreatureTier"
Cohesion: 0.12
Nodes (10): CreatureTier, CreatureEffectsStats, DEFAULT_DUST_COLOR, DEFAULT_RIPPLE_COLOR, DEFAULT_SPLASH_COLOR, POOL_CAPS, CreatureEnvSnapshot, CreatureLayer (+2 more)

### Community 35 - "ref_node_test"
Cohesion: 0.12
Nodes (18): three, createMiniaturePass(), DitherShader, fallbackDepth, MiniatureBlurShader, MiniatureShader, MiniatureTuning, createWebGLRendererSelection() (+10 more)

### Community 36 - "citylit.ts"
Cohesion: 0.08
Nodes (33): GalleryDialog(), GalleryModalProps, airQualityInsight(), CAMERA_PRESETS, cardContentVariants, CARDINALS, cardItemVariants, getCategoryMeta() (+25 more)

### Community 37 - "overrides"
Cohesion: 0.33
Nodes (5): allowBuilds, puppeteer, overrides, three, workbox-build>glob

### Community 38 - "capture-contact-sheets.mjs"
Cohesion: 0.17
Nodes (16): acquirePageTarget(), BASELINE_PATH, captureHour(), CdpSession, checkPerfGuardrails(), HOUR_KEYS, main(), pad() (+8 more)

### Community 39 - "memory.js"
Cohesion: 0.18
Nodes (15): app, __dirname, distDir, __filename, createMemoryMiddleware(), getClient(), HttpError, isTimestamp() (+7 more)

### Community 40 - "getSoftTexture"
Cohesion: 0.33
Nodes (5): CloudAssets, CloudPuffInstance, createCloudPuffMesh(), createSliceCloudLayer(), SliceCloudLayer

### Community 44 - "SearchSheet.tsx"
Cohesion: 0.16
Nodes (22): GlobeOverlay(), GlobeOverlayProps, SearchSheet(), SearchSheetProps, Menu(), MenuItem, LANDMARK_TAGS, LANDMARKS (+14 more)

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
Nodes (29): AssembledGeometry, assembleParts(), AXIS_DEFAULT, axisId(), ball(), box(), buildBat(), buildButterfly() (+21 more)

### Community 49 - "placesInteriors.ts"
Cohesion: 0.09
Nodes (50): buildThemedInterior(), bx(), co(), colonnade(), compactShell(), cy(), emptyMats(), fBench() (+42 more)

### Community 50 - "qualityBenchmark.ts"
Cohesion: 0.14
Nodes (12): BenchmarkConfig, BenchmarkTier, CachedBenchmark, computeFrameStats(), DEFAULT_BENCHMARK_CONFIG, FrameStats, FrameTimeBenchmark, percentile() (+4 more)

### Community 51 - "DaylightBirdsController"
Cohesion: 0.29
Nodes (3): DaylightBirdsController, paletteKeyForBiome(), tagBirdPart()

### Community 52 - "compare-metrics.mjs"
Cohesion: 0.12
Nodes (12): fakeCtx, rows, after, afterByKey, before, breaches, key(), mean() (+4 more)

### Community 53 - "placesScene.ts"
Cohesion: 0.19
Nodes (14): OsmPlaceData, OsmSliceResult, createPlacesScene(), ExplorerInfo, HERO_CAM, HERO_TARGET, PlacesController, createPlacesShaderEnv() (+6 more)

### Community 54 - "daylightBirds.ts"
Cohesion: 0.20
Nodes (10): computeBirdSpawnIntervalSec(), computeFoliageSwayAngle(), computeFoliageWindStrength(), isDaylightForBirds(), BIOME_PALETTES, BirdAgent, BirdPalette, BirdState (+2 more)

### Community 55 - "weatherScene.ts"
Cohesion: 0.30
Nodes (10): getSeasonMonth(), isSpeciesBlooming(), monthToSeasonWeights(), normalizeMonth(), PLANT_SPECIES, PlantSpecies, PlantSpeciesInfo, setSeasonMonth() (+2 more)

### Community 56 - ".constructor"
Cohesion: 0.12
Nodes (3): createDitherPass(), PMREMGeneratorLike, preloadProceduralTextures()

### Community 58 - "plinthProfiles.ts"
Cohesion: 0.30
Nodes (13): clamp(), bouldersGroundHeight(), fbm2(), getPilotGroundHeightFn(), hash2(), krugerGroundHeight(), noise2(), orlandoGroundHeight() (+5 more)

### Community 59 - "capture-visual-matrix.mjs"
Cohesion: 0.32
Nodes (7): captureState(), Cdp, main(), parseCli(), sampleEval(), sleep(), stateEval()

### Community 61 - "vehicleLightKit.ts"
Cohesion: 0.16
Nodes (16): getCarHeadlightMat(), getCarPoolMat(), getCarTaillightMat(), createVehicleLightBatch(), ensureLightGeometries(), LightGeometries, markLightMesh(), placeInstance() (+8 more)

### Community 62 - "PlacesOverlay.tsx"
Cohesion: 0.13
Nodes (24): EditorialMarkers(), EditorialSources(), MOBILE_WEATHER_ICONS, placeCardCondition(), PlacesOverlay(), PlacesOverlayProps, QUICK_TIMES, WEATHER_MODES (+16 more)

### Community 63 - "run"
Cohesion: 0.36
Nodes (5): CDP, clickAria(), listTargets(), run(), sleep()

### Community 64 - "addWildlifeLayer"
Cohesion: 0.67
Nodes (3): getAnimalSeasonMonth(), addWildlifeLayer(), appendLayerTargets()

### Community 65 - "windowLights.ts"
Cohesion: 0.20
Nodes (13): windowPaneMaterial(), bake(), createWindowFacade(), FacadeRecord, facades, hash01(), OCCUPANCY_KEYFRAMES, tmpLit (+5 more)

### Community 66 - "siteAtmosphere.ts"
Cohesion: 0.17
Nodes (14): AtmosphereEffect, AtmosphereLayer, AtmosphereProfile, AtmosphereSceneController, AtmosphereSite, AtmosphereUpdateOptions, BIOME_EFFECTS, createAtmosphereScene() (+6 more)

### Community 67 - "check-exposure.mjs"
Cohesion: 0.22
Nodes (8): dir, evaluate(), files, pending, send(), target, { values, positionals }, ws

### Community 68 - "webgpuPostFX.ts"
Cohesion: 0.15
Nodes (8): MiniatureGradeOptions, BloomModule, DOFModule, makeUniforms(), SSAOModule, TSL, Uniforms, WebGPUModule

### Community 69 - "budget.ts"
Cohesion: 0.14
Nodes (9): CREATURE_TIER_CAPS, CREATURE_TIER_LABELS, CreatureBudget, CreatureBudgetStats, CreaturePriority, CreatureReservation, PRIORITY_WEIGHT, TierCaps (+1 more)

### Community 70 - "contact-sheet.ts"
Cohesion: 0.25
Nodes (8): build(), engine, grid, hour, params, stage, status, syncButtons()

### Community 71 - "framePacing.ts"
Cohesion: 0.31
Nodes (8): DEFAULT_QUIET_SECONDS, FramePacingInput, frameThrottleMs(), IDLE_QUIET_MS, IDLE_REDUCED_MS, IDLE_SOFTWARE_MS, stageQuiet(), StageQuietInput

### Community 72 - "markSharedGeo"
Cohesion: 0.18
Nodes (11): addLampWaterReflections(), addWetRoadStreaks(), getLampBulbGeo(), getLampConeGeo(), getLampHaloGeo(), getLampHardwareGeo(), getLampPoolGeo(), getLampReflectionGeo() (+3 more)

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
Cohesion: 0.12
Nodes (11): angleDelta(), CreatureField, CreatureFieldOptions, CreatureFieldStats, M_PERCH, CreatureZone, SpeciesId, CreatureAnimState (+3 more)

### Community 77 - "field.ts"
Cohesion: 0.20
Nodes (11): CreatureAnimation, createCreatureMaterial(), CREATURE_ANIM_STATES, CREATURE_STATE_VALUE, CREATURE_UNIFORMS, CreatureMaterialOptions, CreatureUniforms, deformation() (+3 more)

### Community 78 - "addCraftedRim"
Cohesion: 0.43
Nodes (7): addCraftedRim(), addRimEdgeContinuity(), addSquareRim(), getRimMaterial(), paintRadial(), paintStrata(), rimEdgeColor()

### Community 79 - "addSiteMotion"
Cohesion: 0.50
Nodes (4): addSiteMotion(), addWeatherFx(), stream(), normalMapsActive()

### Community 80 - "createWebGPUCompat"
Cohesion: 0.41
Nodes (12): createWebGPUCompat(), convert(), findAlphaUniform(), findColorUniform(), findIntensityUniform(), tryGroundSheen(), tryHorizonRing(), trySkyMaterial() (+4 more)

### Community 81 - "verify_phase2.mjs"
Cohesion: 0.38
Nodes (10): captureSite(), main(), orbit(), setFullscreen(), setHourViaScrubber(), setWeatherControls(), sleep(), waitAnimationFrames() (+2 more)

### Community 82 - "biomePalette.ts"
Cohesion: 0.12
Nodes (20): BIOME_FALLBACK, normalizeRuleKey(), REGIONAL_PALETTES, RegionalPalette, RegionalPaletteKey, resolveRegionalPalette(), rule(), SITE_RULES (+12 more)

### Community 83 - "globalIllumination.ts"
Cohesion: 0.14
Nodes (14): BeaconAnchor, beaconGeo, collectBeacons(), createBeaconMesh(), attachEquirect(), buildProbeData(), Equirect, HORIZ_DIRS (+6 more)

### Community 84 - "InfoDrawer.tsx"
Cohesion: 0.08
Nodes (39): formatCoords(), INFO_TABS, InfoDrawer(), InfoDrawerProps, InfoDrawerTab, CATEGORY_COLORS, PASSPORT_TABS, PassportModal() (+31 more)

### Community 85 - "windParticles.ts"
Cohesion: 0.31
Nodes (8): GlobeController, BIOME_PALETTES, createLeafWispTexture(), createWindParticles(), seeded(), WindParticlesController, WindParticlesUpdateOptions, QualityIndex

### Community 86 - "creaturesLab.ts"
Cohesion: 0.12
Nodes (17): KEY_DAY, KEY_NIGHT, KEY_WARM, labelled(), mountCreaturesLab(), SKY_DAWN, SKY_DAY, SKY_DUSK (+9 more)

### Community 87 - "plinthKit.ts"
Cohesion: 0.21
Nodes (16): formatDmsCoords(), getPlinthOutlinePoints(), mapDomainToPlinth(), PlinthSiteSpec, UndergroundStoryKind, buildNameplateMesh(), buildPilotPlinth(), buildUndergroundStories() (+8 more)

### Community 88 - "webgpuCompat.ts"
Cohesion: 0.25
Nodes (7): ALPHA_UNIFORMS, COLOR_UNIFORMS, INTENSITY_UNIFORMS, TSLModule, UniformLink, UV_MAP_KEYS, WebGPUModule

### Community 89 - "n8ao.d.ts"
Cohesion: 0.25
Nodes (4): n8ao, N8AOPass, N8AOPassConfiguration, N8AOQualityMode

### Community 92 - "nativeHost.ts"
Cohesion: 0.31
Nodes (6): detectNativeHost(), hasCinematicHost(), isHost(), NativeCinematicHost, nativeHostUrl(), Window

### Community 94 - "LandmarkBiome"
Cohesion: 0.43
Nodes (7): WildlifeSpot, AnimalIdle, AnimalKind, AnimalSeason, SiteProfile, HabitatEntry, LandmarkBiome

### Community 95 - "ambientAudio.ts"
Cohesion: 0.15
Nodes (15): AnimalAudioEvent, BIOME_HAPTIC_PATTERNS, clamp01(), equalPower(), FilterBand, REGION_HAPTIC_ACCENTS, smoothBell(), smoothstep() (+7 more)

### Community 96 - "tide.test.ts"
Cohesion: 0.60
Nodes (4): computeCoastalTideOffset(), TIDE_CENTER_OFFSET, TIDE_HALF_AMPLITUDE, TIDE_WAVE_AMPLITUDE

### Community 97 - "devDependencies"
Cohesion: 0.50
Nodes (4): devDependencies, playwright@^1.65.1, puppeteer@^25.18.1, puppeteer

### Community 98 - "ref_node_assert"
Cohesion: 0.15
Nodes (7): SKY_CALENDAR_SIZE, IDLES, KINDS, SEASONS, WILDLIFE, SPECIES_IDS, StubWindow

### Community 100 - "fitMath.ts"
Cohesion: 0.39
Nodes (7): boundsFitPlinth(), fitBoundsToPlinth(), PlanarBounds, PLINTH_FRAME_WIDTH, PLINTH_HALF_EXTENT, PLINTH_INNER_HALF_EXTENT, PlinthFit

### Community 101 - "getSoftTexture"
Cohesion: 0.31
Nodes (8): createContactShadowMaterial(), BiomeWeights, createHorizonRing(), createHorizonScenery(), HorizonSceneryController, HorizonUpdateOptions, weightsForBiome(), getSoftTexture()

### Community 103 - "textureCache.ts"
Cohesion: 0.43
Nodes (6): canvasCache, openTextureDb(), persistCanvas(), preloadProceduralCanvases(), StoredCanvas, storeGeneratedCanvas()

### Community 104 - "landmarkGeometry.ts"
Cohesion: 0.60
Nodes (3): bridgeStayAnchors(), catenaryArchHeight(), StayAnchor

## Knowledge Gaps
- **16 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `three` connect `ref_node_test` to `landmarksB.ts`, `placesSliceBuilders.ts`, `placesShaders.ts`, `dioramaKit.ts`, `animalKit.ts`, `weatherScene.ts`, `osmSlice.ts`, `prepareCanvasTexture`, `package.json`, `layer.ts`, `CitylitEngine.ts`, `CreatureTier`, `getSoftTexture`, `globeScene.ts`, `species.ts`, `placesInteriors.ts`, `compare-metrics.mjs`, `placesScene.ts`, `daylightBirds.ts`, `vehicleLightKit.ts`, `windowLights.ts`, `siteAtmosphere.ts`, `webgpuPostFX.ts`, `CreatureField`, `field.ts`, `globalIllumination.ts`, `windParticles.ts`, `creaturesLab.ts`, `plinthKit.ts`, `webgpuCompat.ts`, `n8ao.d.ts`, `getSoftTexture`, `SceneRenderer.ts`?**
  _High betweenness centrality (0.248) - this node is a cross-community bridge._
- **Should `landmarksB.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05862920068350105 - nodes in this community are weakly interconnected._
- **Why does `CitylitEngine` connect `CitylitEngine` to `citylit.ts`, `ScaleRulerModal.tsx`, `App.tsx`, `motion.ts`, `animalKit.ts`, `WeatherWidget.tsx`, `weatherScene.ts`, `.isStudio`, `MiniaturePass`, `.showLandmarkImmediate`, `CitylitEngine.ts`, `ref_node_test`, `citylit.ts`, `.frame`, `qualityBenchmark.ts`, `DaylightBirdsController`, `placesScene.ts`, `.constructor`, `siteAtmosphere.ts`, `contact-sheet.ts`, `framePacing.ts`, `biomePalette.ts`, `windParticles.ts`, `.animateVehicleNightLights`, `.setQualityIndex`, `getSoftTexture`?**
  _High betweenness centrality (0.088) - this node is a cross-community bridge._
- **Should `citylit.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.08558558558558559 - nodes in this community are weakly interconnected._
- **Why does `playwright` connect `playwright` to `verify_phase2.mjs`, `devDependencies`, `package.json`?**
  _High betweenness centrality (0.034) - this node is a cross-community bridge._
- **Should `ScaleRulerModal.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.0873015873015873 - nodes in this community are weakly interconnected._
- **Should `App.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.07987012987012987 - nodes in this community are weakly interconnected._