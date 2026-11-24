# Graph Report - citylit-pwa  (2026-11-24)

## Corpus Check
- 197 files · ~438,342 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 11 file(s) not represented in the graph (top: .woff2 4, (none) 3, .css 2)

## Summary
- 2207 nodes · 6372 edges · 95 communities (82 shown, 13 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 233 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `0e35758f`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- landmarksB.ts
- ScaleRulerModal.tsx
- citylit.ts
- PassportModal.tsx
- motion.ts
- App.tsx
- placesSliceBuilders.ts
- placesShaders.ts
- resolveTheme
- dioramaKit.ts
- animalKit.ts
- WeatherWidget.tsx
- CitylitEngine
- compilerOptions
- weatherScene.ts
- osmService.ts
- osmSlice.ts
- .isStudio
- .setQualityIndex
- weatherScene.ts
- prepareCanvasTexture
- playwright
- package.json
- habitat.ts
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
- CreatureEffectsPool
- ref_node_test
- LandmarkCard.tsx
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
- getSoftTexture
- compare-metrics.mjs
- placesScene.ts
- DaylightBirdsController
- weatherScene.ts
- .constructor
- WebGPUSceneRenderer
- plinthKit.ts
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
- .showLandmarkImmediate
- globalIllumination.ts
- boostBuiltVibrancy
- windParticles.ts
- creaturesLab.ts
- WebGPUPostFX
- webgpuCompat.ts
- n8ao.d.ts
- SceneRenderer.ts
- addDioramaClouds
- nativeHost.ts
- addTreeRing
- devDependencies

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
- `CompassProps` --references--> `CitylitEngine`  [EXTRACTED]
  src/components/Compass.tsx → src/three/CitylitEngine.ts
- `PassportModalProps` --references--> `LandmarkNote`  [EXTRACTED]
  src/components/PassportModal.tsx → src/types/citylit.ts
- `AtmosphereSite` --references--> `LandmarkBiome`  [EXTRACTED]
  src/three/siteAtmosphere.ts → src/types/citylit.ts
- `currentTimeBand()` --calls--> `timeBandForHour()`  [EXTRACTED]
  src/three/creatures/env.ts → src/three/creatures/habitat.ts

## Import Cycles
- None detected.

## Communities (95 total, 13 thin omitted)

### Community 0 - "landmarksB.ts"
Cohesion: 0.06
Nodes (228): headingYaw(), leftLaneOffset(), normalizePlanar(), PlanarVector, registerBeacons(), addAnchor(), addBaseScatter(), addBollards() (+220 more)

### Community 1 - "ScaleRulerModal.tsx"
Cohesion: 0.12
Nodes (24): barWidth(), REFERENCE_OPTIONS, RulerRow, RulerScale, RulerSort, SCALE_OPTIONS, ScaleRulerModal(), ScaleRulerModalProps (+16 more)

### Community 2 - "citylit.ts"
Cohesion: 0.06
Nodes (47): ambientAudio, AnimalAudioEvent, BIOME_HAPTIC_PATTERNS, extractRegionName(), FilterBand, REGION_HAPTIC_ACCENTS, SpatialEmitter, SpatialListener (+39 more)

### Community 3 - "PassportModal.tsx"
Cohesion: 0.13
Nodes (17): CATEGORY_COLORS, PASSPORT_TABS, PassportModal(), PassportModalProps, PassportTab, ProvinceRing(), ProvinceRingProps, ProvinceStatRow (+9 more)

### Community 4 - "motion.ts"
Cohesion: 0.05
Nodes (54): motion@14.14.0, motion, react, CARDINAL_TARGETS, CARDINALS_8, Compass(), CompassProps, formatBearing() (+46 more)

### Community 5 - "App.tsx"
Cohesion: 0.10
Nodes (32): App(), INITIAL_GLOBE, readInitialLandmarkIndex(), readSettings(), readStoredEggs(), readStoredNotes(), readStoredSavedPlaces(), readStoredSet() (+24 more)

### Community 6 - "placesSliceBuilders.ts"
Cohesion: 0.11
Nodes (35): getGrassMaterial(), createCloudPuffMesh(), createSliceCloudLayer(), createCutawayWaterTopMaterial(), createCutawayWaterWallMaterial(), createSliceMistMaterial(), CutawayWaterOptions, getOrlandoMuralTexture() (+27 more)

### Community 7 - "placesShaders.ts"
Cohesion: 0.17
Nodes (17): PlacesSliceEmitterSpec, WaterConfluenceSpec, WaterTideSpec, CLOUD_FRAGMENT, CLOUD_VERTEX, NOISE_GLSL, STRATA_COLOR_FRAGMENT, STRATA_FRAG_COMMON (+9 more)

### Community 8 - "resolveTheme"
Cohesion: 0.14
Nodes (20): AudioVisualizerBarProps, DARK_PALETTE, LIGHT_PALETTE, IconButton(), IconButtonProps, TopBar(), TopBarProps, DURATION (+12 more)

### Community 9 - "dioramaKit.ts"
Cohesion: 0.06
Nodes (34): accentFor(), AnchorKind, CorniceBandSpec, DioramaFx, DoorSurroundSpec, FacadeWindowSpec, FALLBACK_PROFILE, getLampBulbMat() (+26 more)

### Community 10 - "animalKit.ts"
Cohesion: 0.07
Nodes (41): IDLES, KINDS, SEASONS, WILDLIFE, WildlifeSpot, advanceAnimalTime(), AnimalIdle, AnimalKind (+33 more)

### Community 11 - "WeatherWidget.tsx"
Cohesion: 0.06
Nodes (45): @phosphor-icons/react@2.1.10, @phosphor-icons/react, HourlyForecast(), HourlyForecastProps, ANIMATED_BY_CONDITION, WeatherIcon(), WeatherIconProps, pad2() (+37 more)

### Community 12 - "CitylitEngine"
Cohesion: 0.08
Nodes (3): CitylitEngine, fitDioramaShadowBounds(), NoteCategory

### Community 13 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowImportingTsExtensions, isolatedModules, jsx, lib, module, moduleDetection, moduleResolution (+10 more)

### Community 14 - "weatherScene.ts"
Cohesion: 0.08
Nodes (27): AUTO_EXPOSURE_ADAPT_RATE, BIOME_BOUNCE_COLORS, bounceDayTmp, bounceMixTmp, bounceNightTmp, configureDioramaShadow(), createBounceLight(), createRimLight() (+19 more)

### Community 15 - "osmService.ts"
Cohesion: 0.13
Nodes (18): cacheKey(), fallbackPatch(), GEO_CACHE, geocodePlace(), loadElevation(), loadOsmPlace(), LocalPoint, MEMORY_CACHE (+10 more)

### Community 16 - "osmSlice.ts"
Cohesion: 0.17
Nodes (17): StreetLampSpec, centroid(), clamp(), createOsmSlice(), createRibbon(), pointOnRoad(), polygonShape(), readTag() (+9 more)

### Community 19 - "weatherScene.ts"
Cohesion: 0.18
Nodes (14): clamp01(), LiveWeatherVisual, liveWeatherVisual(), monthToSeasonWeights(), MID_MONTH_DAY, solarDeclination(), southernSunDirection(), KELVIN_KEY_MIX (+6 more)

### Community 20 - "prepareCanvasTexture"
Cohesion: 0.09
Nodes (41): applyDissolveToShader(), cascadeize(), flagWindy(), getBrushedNormalTexture(), getBrushedRoughnessTexture(), getCanvasBumpTexture(), getCanvasNormalTexture(), getOrCreateCanvas() (+33 more)

### Community 21 - "playwright"
Cohesion: 0.08
Nodes (11): playwright, errors, errors, names, errors, failed, report, sites (+3 more)

### Community 22 - "package.json"
Cohesion: 0.07
Nodes (40): dependencies, goeist@0.1.0, n8ao@2.1.0, oxfmt@0.79.0, oxlint@1.94.0, pastdotdev@^0.0.1, react@19.3.1, react-dom@19.3.1 (+32 more)

### Community 23 - "habitat.ts"
Cohesion: 0.27
Nodes (12): DAY, clampHour(), HabitatConditions, habitatForSpecies(), HABITATS, habitatSeasonForMonth(), matchesList(), resolveHabitat() (+4 more)

### Community 24 - "AmbientAudioController"
Cohesion: 0.06
Nodes (29): AmbientAudioController, clamp01(), equalPower(), smoothBell(), smoothstep(), BIOME_FALLBACK, normalizeRuleKey(), REGIONAL_PALETTES (+21 more)

### Community 25 - "server.js"
Cohesion: 0.20
Nodes (6): express@5.3.0, express, app, __dirname, distDir, __filename

### Community 26 - "CitylitEngine.ts"
Cohesion: 0.07
Nodes (34): LANDMARK_BUILDERS, glowMaterials, resetSceneDynamicLists(), swayItems, updateWetSurfaces(), wetMaterials, audioForward, audioRight (+26 more)

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
Cohesion: 0.13
Nodes (29): ALBEDO_CONTRACT, AlbedoAudit, AlbedoBand, auditAlbedo(), auditHeroLuminance(), clamp(), conditionSurfaceHex(), DEFAULT_SATURATION_REDUCTION (+21 more)

### Community 31 - "scripts"
Cohesion: 0.15
Nodes (13): scripts, build, dev, format, format:check, lint, preview, qa:capture (+5 more)

### Community 32 - "applyDioramaUpgrade"
Cohesion: 0.20
Nodes (17): addCreatureLife(), addEdgeWaterfall(), addScaleReference(), addSoaringBirds(), addSquareWaterPlate(), applyDioramaUpgrade(), buildSpatialSources(), finalizeLandmarkGroup() (+9 more)

### Community 33 - "with"
Cohesion: 0.11
Nodes (17): jobs, verify, name, on, pull_request, push, branches, name (+9 more)

### Community 34 - "CreatureEffectsPool"
Cohesion: 0.20
Nodes (6): CreatureEffectsPool, CreatureEffectsStats, DEFAULT_DUST_COLOR, DEFAULT_RIPPLE_COLOR, DEFAULT_SPLASH_COLOR, POOL_CAPS

### Community 35 - "ref_node_test"
Cohesion: 0.14
Nodes (12): createWebGLRendererSelection(), decideRendererBackend(), GPUCapableNavigator, readRendererPreference(), RendererProbe, selectRenderer(), StubWindow, wantsMsaa() (+4 more)

### Community 36 - "LandmarkCard.tsx"
Cohesion: 0.17
Nodes (14): airQualityInsight(), CAMERA_PRESETS, cardContentVariants, CARDINALS, cardItemVariants, getCategoryMeta(), LandmarkCard(), LandmarkCardProps (+6 more)

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
Cohesion: 0.12
Nodes (29): GlobeOverlayProps, SearchSheet(), SearchSheetProps, DropdownTokens, Menu(), MenuItem, MenuProps, readDropdownTokens() (+21 more)

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
Nodes (51): BESPOKE_INTERIORS, buildThemedInterior(), bx(), co(), colonnade(), compactShell(), cy(), emptyMats() (+43 more)

### Community 50 - "qualityBenchmark.ts"
Cohesion: 0.14
Nodes (12): BenchmarkConfig, BenchmarkTier, CachedBenchmark, computeFrameStats(), DEFAULT_BENCHMARK_CONFIG, FrameStats, FrameTimeBenchmark, percentile() (+4 more)

### Community 51 - "getSoftTexture"
Cohesion: 0.17
Nodes (13): three, BeaconAnchor, beaconGeo, collectBeacons(), createBeaconMesh(), createContactShadowMaterial(), BiomeWeights, createHorizonRing() (+5 more)

### Community 52 - "compare-metrics.mjs"
Cohesion: 0.12
Nodes (12): fakeCtx, rows, after, afterByKey, before, breaches, key(), mean() (+4 more)

### Community 53 - "placesScene.ts"
Cohesion: 0.17
Nodes (15): OsmPlaceData, OsmSliceResult, createPlacesScene(), ExplorerInfo, HERO_CAM, HERO_TARGET, PlacesController, bindVolumetricFogUniforms() (+7 more)

### Community 54 - "DaylightBirdsController"
Cohesion: 0.13
Nodes (13): computeBirdSpawnIntervalSec(), computeFoliageSwayAngle(), computeFoliageWindStrength(), isDaylightForBirds(), BIOME_PALETTES, BirdAgent, BirdPalette, BirdState (+5 more)

### Community 55 - "weatherScene.ts"
Cohesion: 0.36
Nodes (8): getSeasonMonth(), isSpeciesBlooming(), normalizeMonth(), PLANT_SPECIES, PlantSpecies, PlantSpeciesInfo, SeasonWeights, setSeasonMonth()

### Community 56 - ".constructor"
Cohesion: 0.11
Nodes (4): createDitherPass(), PMREMGeneratorLike, configureTextureQuality(), preloadProceduralTextures()

### Community 58 - "plinthKit.ts"
Cohesion: 0.06
Nodes (61): dayIndex(), daysInMonth(), entryIntensity(), EVENT_PRIORITY, formatWhen(), getSkyEvent(), getUpcomingSkyEvents(), MONTH_LABELS (+53 more)

### Community 59 - "capture-visual-matrix.mjs"
Cohesion: 0.32
Nodes (7): captureState(), Cdp, main(), parseCli(), sampleEval(), sleep(), stateEval()

### Community 61 - "vehicleLightKit.ts"
Cohesion: 0.16
Nodes (16): getCarHeadlightMat(), getCarPoolMat(), getCarTaillightMat(), createVehicleLightBatch(), ensureLightGeometries(), LightGeometries, markLightMesh(), placeInstance() (+8 more)

### Community 62 - "PlacesOverlay.tsx"
Cohesion: 0.11
Nodes (27): EditorialMarkers(), EditorialSources(), MOBILE_WEATHER_ICONS, placeCardCondition(), PlacesOverlay(), PlacesOverlayProps, QUICK_TIMES, WEATHER_MODES (+19 more)

### Community 63 - "run"
Cohesion: 0.36
Nodes (5): CDP, clickAria(), listTargets(), run(), sleep()

### Community 64 - "addWildlifeLayer"
Cohesion: 0.67
Nodes (3): getAnimalSeasonMonth(), addWildlifeLayer(), appendLayerTargets()

### Community 65 - "windowLights.ts"
Cohesion: 0.23
Nodes (11): bake(), FacadeRecord, facades, hash01(), OCCUPANCY_KEYFRAMES, tmpLit, updateWindowLights(), WindowFacade (+3 more)

### Community 66 - "siteAtmosphere.ts"
Cohesion: 0.16
Nodes (15): AtmosphereEffect, AtmosphereLayer, AtmosphereProfile, AtmosphereSceneController, AtmosphereSite, AtmosphereUpdateOptions, BIOME_EFFECTS, createAtmosphereScene() (+7 more)

### Community 67 - "check-exposure.mjs"
Cohesion: 0.22
Nodes (8): dir, evaluate(), files, pending, send(), target, { values, positionals }, ws

### Community 68 - "webgpuPostFX.ts"
Cohesion: 0.15
Nodes (8): MiniatureGradeOptions, BloomModule, DOFModule, makeUniforms(), SSAOModule, TSL, Uniforms, WebGPUModule

### Community 69 - "budget.ts"
Cohesion: 0.08
Nodes (22): CREATURE_TIER_CAPS, CREATURE_TIER_LABELS, CreatureBudget, CreatureBudgetStats, CreaturePriority, CreatureReservation, CreatureTier, PRIORITY_WEIGHT (+14 more)

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
Cohesion: 0.19
Nodes (10): angularDistance(), createRng(), easeOutBack(), hashString(), mulberry32(), poissonInterval(), ScatterOptions, scatterRing() (+2 more)

### Community 74 - "ref_node_fs"
Cohesion: 0.33
Nodes (3): outDir, results, viewports

### Community 75 - "make-contact-sheet.mjs"
Cohesion: 0.53
Nodes (4): delta(), loadStats(), main(), parseCli()

### Community 76 - "CreatureField"
Cohesion: 0.14
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

### Community 83 - "globalIllumination.ts"
Cohesion: 0.24
Nodes (9): attachEquirect(), buildProbeData(), Equirect, HORIZ_DIRS, installGI(), probeGrid, probeOrigin, probeSize (+1 more)

### Community 85 - "windParticles.ts"
Cohesion: 0.31
Nodes (8): GlobeController, BIOME_PALETTES, createLeafWispTexture(), createWindParticles(), seeded(), WindParticlesController, WindParticlesUpdateOptions, QualityIndex

### Community 86 - "creaturesLab.ts"
Cohesion: 0.10
Nodes (21): KEY_DAY, KEY_NIGHT, KEY_WARM, labelled(), mountCreaturesLab(), SKY_DAWN, SKY_DAY, SKY_DUSK (+13 more)

### Community 88 - "webgpuCompat.ts"
Cohesion: 0.25
Nodes (7): ALPHA_UNIFORMS, COLOR_UNIFORMS, INTENSITY_UNIFORMS, TSLModule, UniformLink, UV_MAP_KEYS, WebGPUModule

### Community 89 - "n8ao.d.ts"
Cohesion: 0.25
Nodes (4): n8ao, N8AOPass, N8AOPassConfiguration, N8AOQualityMode

### Community 92 - "nativeHost.ts"
Cohesion: 0.31
Nodes (6): detectNativeHost(), hasCinematicHost(), isHost(), NativeCinematicHost, nativeHostUrl(), Window

### Community 97 - "devDependencies"
Cohesion: 0.50
Nodes (4): devDependencies, playwright@^1.65.1, puppeteer@^25.18.1, puppeteer

## Knowledge Gaps
- **13 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `three` connect `getSoftTexture` to `landmarksB.ts`, `placesSliceBuilders.ts`, `placesShaders.ts`, `dioramaKit.ts`, `animalKit.ts`, `weatherScene.ts`, `osmSlice.ts`, `weatherScene.ts`, `prepareCanvasTexture`, `package.json`, `CitylitEngine.ts`, `albedoAudit.ts`, `CreatureEffectsPool`, `ref_node_test`, `getSoftTexture`, `globeScene.ts`, `species.ts`, `placesInteriors.ts`, `compare-metrics.mjs`, `placesScene.ts`, `DaylightBirdsController`, `plinthKit.ts`, `vehicleLightKit.ts`, `windowLights.ts`, `siteAtmosphere.ts`, `webgpuPostFX.ts`, `budget.ts`, `CreatureField`, `field.ts`, `globalIllumination.ts`, `windParticles.ts`, `creaturesLab.ts`, `webgpuCompat.ts`, `n8ao.d.ts`, `SceneRenderer.ts`?**
  _High betweenness centrality (0.266) - this node is a cross-community bridge._
- **Should `landmarksB.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05695581014729951 - nodes in this community are weakly interconnected._
- **Why does `CitylitEngine` connect `CitylitEngine` to `ScaleRulerModal.tsx`, `citylit.ts`, `motion.ts`, `App.tsx`, `animalKit.ts`, `WeatherWidget.tsx`, `.isStudio`, `.setQualityIndex`, `AmbientAudioController`, `CitylitEngine.ts`, `albedoAudit.ts`, `ref_node_test`, `.frame`, `qualityBenchmark.ts`, `placesScene.ts`, `DaylightBirdsController`, `.constructor`, `siteAtmosphere.ts`, `contact-sheet.ts`, `framePacing.ts`, `.showLandmarkImmediate`, `windParticles.ts`?**
  _High betweenness centrality (0.094) - this node is a cross-community bridge._
- **Should `ScaleRulerModal.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.11822660098522167 - nodes in this community are weakly interconnected._
- **Why does `pastdotdev` connect `package.json` to `memory.js`?**
  _High betweenness centrality (0.040) - this node is a cross-community bridge._
- **Should `citylit.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05589225589225589 - nodes in this community are weakly interconnected._
- **Should `PassportModal.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.13333333333333333 - nodes in this community are weakly interconnected._