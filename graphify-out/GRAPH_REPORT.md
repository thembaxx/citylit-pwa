# Graph Report - citylit-pwa  (2026-11-23)

## Corpus Check
- 159 files · ~351,919 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 10 file(s) not represented in the graph (top: .woff2 4, (none) 2, .css 2)

## Summary
- 1887 nodes · 5576 edges · 78 communities (70 shown, 8 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 196 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `70b31287`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- landmarksB.ts
- shaders.ts
- citylit.ts
- SearchSheet.tsx
- prepareCanvasTexture
- App.tsx
- placesSliceBuilders.ts
- placesShaders.ts
- three
- dioramaKit.ts
- animalKit.ts
- WeatherWidget.tsx
- CitylitEngine
- compilerOptions
- .constructor
- osmService.ts
- placesScene.ts
- LandmarkCard.tsx
- scaleFacts.ts
- DaylightBirdsController
- PassportModal.tsx
- devDependencies
- package.json
- getSoftTexture
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
- ref_node_test
- motion.ts
- overrides
- capture-contact-sheets.mjs
- memory.js
- getSoftTexture
- .frame
- fitMath.ts
- run
- contact-sheet.ts
- InfoDrawer.tsx
- siteAtmosphere.ts
- placesInteriors.ts
- qualityBenchmark.ts
- framePacing.ts
- LandmarkBiome
- nativeHost.ts
- ref_node_test
- weatherScene.ts
- webgpuPostFX.ts
- WebGPUSceneRenderer
- skyEvents.ts
- PlacesOverlay.tsx
- WebGLSceneRenderer
- SceneRenderer.ts
- ambientAudio.ts
- solarPosition.ts
- windowLights.ts
- placesScene.ts
- timePresets.ts
- .showLandmarkImmediate
- tide.test.ts
- siteVisuals.ts
- WebGPUPostFX
- textureCache.ts
- createWebGPUCompat
- markSharedGeo
- webgpuCompat.ts
- addCraftedRim
- addSiteMotion

## God Nodes (most connected - your core abstractions)
1. `CitylitEngine` - 151 edges
2. `add()` - 104 edges
3. `C()` - 83 edges
4. `M()` - 83 edges
5. `CB()` - 71 edges
6. `R()` - 60 edges
7. `mergeByMaterial()` - 59 edges
8. `MStone()` - 57 edges
9. `addStreetLampSet()` - 56 edges
10. `App()` - 53 edges

## Surprising Connections (you probably didn't know these)
- `memoryApiPlugin()` --calls--> `createMemoryMiddleware()`  [EXTRACTED]
  vite.config.ts → server/memory.js
- `CompassProps` --references--> `CitylitEngine`  [EXTRACTED]
  src/components/Compass.tsx → src/three/CitylitEngine.ts
- `EngineCallbacks` --references--> `PlacesSelectionInfo`  [EXTRACTED]
  src/three/CitylitEngine.ts → src/three/placesScene.ts
- `WebGLSceneRenderer` --implements--> `SceneRenderer`  [EXTRACTED]
  src/three/renderer/SceneRenderer.ts → src/three/renderer/types.ts
- `CitylitEngine` --references--> `FrameTimeBenchmark`  [EXTRACTED]
  src/three/CitylitEngine.ts → src/lib/qualityBenchmark.ts

## Import Cycles
- None detected.

## Communities (78 total, 8 thin omitted)

### Community 0 - "landmarksB.ts"
Cohesion: 0.06
Nodes (215): headingYaw(), leftLaneOffset(), normalizePlanar(), PlanarVector, registerBeacons(), addAnchor(), addBaseScatter(), addBollards() (+207 more)

### Community 1 - "shaders.ts"
Cohesion: 0.14
Nodes (17): addStandUnderside(), getUndersideMaterial(), applyDissolveToShader(), cascadeize(), flagWindy(), HEIGHT_KEYS, installDissolveShader(), lights() (+9 more)

### Community 2 - "citylit.ts"
Cohesion: 0.10
Nodes (24): ambientAudio, BUILTIN_MIXER_PRESETS, DEFAULT_MIXER, FPS_OPTIONS, MIXER_CHANNELS, MOTION_OPTIONS, QUALITY_OPTIONS, readCustomPresets() (+16 more)

### Community 3 - "SearchSheet.tsx"
Cohesion: 0.10
Nodes (36): @phosphor-icons/react, GlobeOverlayProps, bodySlideVariants, CAMERA_PRESETS, CARDINALS, getCategoryMeta(), headerSlideVariants, LandmarkCard() (+28 more)

### Community 4 - "prepareCanvasTexture"
Cohesion: 0.20
Nodes (20): getRoofDirtMap(), getBrushedNormalTexture(), getBrushedRoughnessTexture(), getCanvasBumpTexture(), getCanvasNormalTexture(), getOrCreateCanvas(), getPlasterBumpTexture(), getPlasterNormalTexture() (+12 more)

### Community 5 - "App.tsx"
Cohesion: 0.08
Nodes (45): App(), INITIAL_GLOBE, readInitialLandmarkIndex(), readSettings(), readStoredEggs(), readStoredNotes(), readStoredSavedPlaces(), readStoredSet() (+37 more)

### Community 6 - "placesSliceBuilders.ts"
Cohesion: 0.12
Nodes (32): getGrassMaterial(), createCutawayWaterTopMaterial(), createCutawayWaterWallMaterial(), createSliceMistMaterial(), CutawayWaterOptions, getOrlandoMuralTexture(), addInstancedFlowers(), addInstancedRocks() (+24 more)

### Community 7 - "placesShaders.ts"
Cohesion: 0.13
Nodes (22): bindVolumetricFogUniforms(), createStrataTerrainMaterial(), patchPlacesVolumetricFog(), PlacesSliceEmitterSpec, WaterConfluenceSpec, WaterTideSpec, CLOUD_FRAGMENT, CLOUD_VERTEX (+14 more)

### Community 8 - "three"
Cohesion: 0.07
Nodes (45): three, AFRICA_POLYS, ENCLAVE_POLYS, GLOBE_NEIGHBOR_LABELS, GLOBE_PROVINCES, NEIGHBOR_POLYS, PROVINCE_STYLE, ProvinceGlobeEntry (+37 more)

### Community 9 - "dioramaKit.ts"
Cohesion: 0.05
Nodes (38): getAnimalSeasonMonth(), accentFor(), addWildlifeLayer(), AnchorKind, appendLayerTargets(), CorniceBandSpec, DioramaFx, DoorSurroundSpec (+30 more)

### Community 10 - "animalKit.ts"
Cohesion: 0.08
Nodes (37): WILDLIFE, WildlifeSpot, advanceAnimalTime(), AnimalIdle, AnimalKind, AnimalLodSpec, AnimalMember, AnimalPose (+29 more)

### Community 11 - "WeatherWidget.tsx"
Cohesion: 0.06
Nodes (55): HourlyForecast(), HourlyForecastProps, LandmarkCardProps, ANIMATED_BY_CONDITION, WeatherIcon(), WeatherIconCondition, WeatherIconProps, pad2() (+47 more)

### Community 12 - "CitylitEngine"
Cohesion: 0.06
Nodes (3): CitylitEngine, fitDioramaShadowBounds(), QualitySetting

### Community 13 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowImportingTsExtensions, isolatedModules, jsx, lib, module, moduleDetection, moduleResolution (+10 more)

### Community 14 - ".constructor"
Cohesion: 0.06
Nodes (27): attachEquirect(), buildProbeData(), Equirect, HORIZ_DIRS, installGI(), probeGrid, probeOrigin, probeSize (+19 more)

### Community 15 - "osmService.ts"
Cohesion: 0.14
Nodes (17): cacheKey(), fallbackPatch(), GEO_CACHE, loadElevation(), loadOsmPlace(), LocalPoint, MEMORY_CACHE, OsmArea (+9 more)

### Community 16 - "placesScene.ts"
Cohesion: 0.17
Nodes (17): StreetLampSpec, centroid(), clamp(), createOsmSlice(), createRibbon(), pointOnRoad(), polygonShape(), readTag() (+9 more)

### Community 17 - "LandmarkCard.tsx"
Cohesion: 0.11
Nodes (18): GalleryDialog(), GalleryModalProps, applyRubberBand(), project(), rubberBand(), DragOptions, Point, useDrag() (+10 more)

### Community 18 - "scaleFacts.ts"
Cohesion: 0.25
Nodes (10): REFERENCE_HEIGHTS, referenceHeightM(), SCALE_FACTS, ScaleFact, ScaleMeasure, scaleRatio(), MAX_REFERENCE_UNITS, metresToUnits() (+2 more)

### Community 19 - "DaylightBirdsController"
Cohesion: 0.13
Nodes (13): computeBirdSpawnIntervalSec(), computeFoliageSwayAngle(), computeFoliageWindStrength(), isDaylightForBirds(), BIOME_PALETTES, BirdAgent, BirdPalette, BirdState (+5 more)

### Community 20 - "PassportModal.tsx"
Cohesion: 0.08
Nodes (35): CATEGORY_COLORS, PASSPORT_TABS, PassportModal(), PassportModalProps, PassportTab, ProvinceRing(), ProvinceRingProps, ProvinceStatRow (+27 more)

### Community 21 - "devDependencies"
Cohesion: 0.40
Nodes (5): devDependencies, playwright@^1.65.1, puppeteer@^25.18.1, playwright, puppeteer

### Community 22 - "package.json"
Cohesion: 0.07
Nodes (41): dependencies, goeist@0.1.0, motion@14.14.0, n8ao@2.1.0, oxfmt@0.79.0, oxlint@1.94.0, pastdotdev@^0.0.1, @phosphor-icons/react@2.1.10 (+33 more)

### Community 23 - "getSoftTexture"
Cohesion: 0.13
Nodes (19): BIOME_FALLBACK, normalizeRuleKey(), REGIONAL_PALETTES, RegionalPalette, RegionalPaletteKey, resolveRegionalPalette(), rule(), SITE_RULES (+11 more)

### Community 24 - "AmbientAudioController"
Cohesion: 0.13
Nodes (3): AmbientAudioController, SiteProfile, AmbientSiteProfile

### Community 25 - "server.js"
Cohesion: 0.20
Nodes (6): express@5.3.0, express, app, __dirname, distDir, __filename

### Community 26 - "CitylitEngine.ts"
Cohesion: 0.05
Nodes (49): BeaconAnchor, beaconGeo, collectBeacons(), createBeaconMesh(), LANDMARK_BUILDERS, glowMaterials, swayItems, wetMaterials (+41 more)

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
Nodes (22): ALBEDO_CONTRACT, AlbedoAudit, AlbedoBand, auditAlbedo(), auditHeroLuminance(), clamp(), DEFAULT_SATURATION_REDUCTION, GRADE_GUARDRAILS (+14 more)

### Community 31 - "scripts"
Cohesion: 0.15
Nodes (13): scripts, build, dev, format, format:check, lint, preview, qa:capture (+5 more)

### Community 32 - "applyDioramaUpgrade"
Cohesion: 0.10
Nodes (21): addDioramaClouds(), addEdgeWaterfall(), addScaleReference(), addSoaringBirds(), addSquareWaterPlate(), applyDioramaUpgrade(), buildSpatialSources(), getDioramaCloudMat() (+13 more)

### Community 33 - "with"
Cohesion: 0.11
Nodes (17): jobs, verify, name, on, pull_request, push, branches, name (+9 more)

### Community 35 - "ref_node_test"
Cohesion: 0.14
Nodes (12): createWebGLRendererSelection(), decideRendererBackend(), GPUCapableNavigator, readRendererPreference(), RendererProbe, selectRenderer(), StubWindow, wantsMsaa() (+4 more)

### Community 36 - "motion.ts"
Cohesion: 0.08
Nodes (31): motion, AudioVisualizerBarProps, DARK_PALETTE, LIGHT_PALETTE, CARDINAL_TARGETS, CARDINALS_8, Compass(), CompassProps (+23 more)

### Community 37 - "overrides"
Cohesion: 0.33
Nodes (5): allowBuilds, puppeteer, overrides, three, workbox-build>glob

### Community 38 - "capture-contact-sheets.mjs"
Cohesion: 0.06
Nodes (29): CDP, clickAria(), listTargets(), run(), sleep(), acquirePageTarget(), BASELINE_PATH, captureHour() (+21 more)

### Community 39 - "memory.js"
Cohesion: 0.36
Nodes (11): createMemoryMiddleware(), getClient(), HttpError, isTimestamp(), optionalEnum(), optionalInt(), optionalString(), pick() (+3 more)

### Community 40 - "getSoftTexture"
Cohesion: 0.24
Nodes (8): CloudAssets, CloudPuffInstance, createCloudPuffMesh(), createSliceCloudLayer(), SliceCloudLayer, getSoftTexture(), solarHalfDay(), createWeatherScene()

### Community 42 - ".frame"
Cohesion: 0.07
Nodes (4): updateWetSurfaces(), setSpatialListener(), MiniaturePass, SceneRenderer

### Community 44 - "fitMath.ts"
Cohesion: 0.33
Nodes (8): boundsFitPlinth(), clamp(), fitBoundsToPlinth(), PlanarBounds, PLINTH_FRAME_WIDTH, PLINTH_HALF_EXTENT, PLINTH_INNER_HALF_EXTENT, PlinthFit

### Community 45 - "run"
Cohesion: 0.38
Nodes (5): CDP, i0(), listTargets(), run(), sleep()

### Community 46 - "contact-sheet.ts"
Cohesion: 0.25
Nodes (8): build(), engine, grid, hour, params, stage, status, syncButtons()

### Community 47 - "InfoDrawer.tsx"
Cohesion: 0.10
Nodes (18): react, react-dom, formatCoords(), InfoDrawer(), InfoDrawerProps, Sheet(), SheetProps, SheetSide (+10 more)

### Community 48 - "siteAtmosphere.ts"
Cohesion: 0.15
Nodes (16): SKY_NOISE_GLSL, AtmosphereEffect, AtmosphereLayer, AtmosphereProfile, AtmosphereSceneController, AtmosphereUpdateOptions, BIOME_EFFECTS, createAtmosphereScene() (+8 more)

### Community 49 - "placesInteriors.ts"
Cohesion: 0.09
Nodes (51): BESPOKE_INTERIORS, buildThemedInterior(), bx(), co(), colonnade(), compactShell(), cy(), emptyMats() (+43 more)

### Community 50 - "qualityBenchmark.ts"
Cohesion: 0.13
Nodes (12): BenchmarkConfig, BenchmarkTier, CachedBenchmark, computeFrameStats(), DEFAULT_BENCHMARK_CONFIG, FrameStats, FrameTimeBenchmark, percentile() (+4 more)

### Community 51 - "framePacing.ts"
Cohesion: 0.31
Nodes (8): DEFAULT_QUIET_SECONDS, FramePacingInput, frameThrottleMs(), IDLE_QUIET_MS, IDLE_REDUCED_MS, IDLE_SOFTWARE_MS, stageQuiet(), StageQuietInput

### Community 52 - "LandmarkBiome"
Cohesion: 0.33
Nodes (4): extractRegionName(), HorizonSceneryController, AtmosphereSite, LandmarkBiome

### Community 53 - "nativeHost.ts"
Cohesion: 0.31
Nodes (6): detectNativeHost(), hasCinematicHost(), isHost(), NativeCinematicHost, nativeHostUrl(), Window

### Community 54 - "ref_node_test"
Cohesion: 0.21
Nodes (7): SKY_CALENDAR_SIZE, IDLES, KINDS, SEASONS, bridgeStayAnchors(), catenaryArchHeight(), StayAnchor

### Community 55 - "weatherScene.ts"
Cohesion: 0.27
Nodes (11): getSeasonMonth(), isSpeciesBlooming(), monthToSeasonWeights(), normalizeMonth(), PLANT_SPECIES, PlantSpecies, PlantSpeciesInfo, SeasonWeights (+3 more)

### Community 56 - "webgpuPostFX.ts"
Cohesion: 0.15
Nodes (8): MiniatureGradeOptions, BloomModule, DOFModule, makeUniforms(), SSAOModule, TSL, Uniforms, WebGPUModule

### Community 58 - "skyEvents.ts"
Cohesion: 0.23
Nodes (14): dayIndex(), daysInMonth(), entryIntensity(), EVENT_PRIORITY, formatWhen(), getSkyEvent(), getUpcomingSkyEvents(), MONTH_LABELS (+6 more)

### Community 59 - "PlacesOverlay.tsx"
Cohesion: 0.13
Nodes (24): EditorialMarkers(), EditorialSources(), MOBILE_WEATHER_ICONS, placeCardCondition(), PlacesOverlay(), PlacesOverlayProps, QUICK_TIMES, WEATHER_MODES (+16 more)

### Community 63 - "ambientAudio.ts"
Cohesion: 0.13
Nodes (16): AnimalAudioEvent, BIOME_HAPTIC_PATTERNS, clamp01(), equalPower(), FilterBand, REGION_HAPTIC_ACCENTS, smoothBell(), smoothstep() (+8 more)

### Community 64 - "solarPosition.ts"
Cohesion: 0.70
Nodes (3): MID_MONTH_DAY, solarDeclination(), southernSunDirection()

### Community 65 - "windowLights.ts"
Cohesion: 0.18
Nodes (14): windowPaneMaterial(), interiorParallaxShader(), bake(), createWindowFacade(), FacadeRecord, facades, hash01(), OCCUPANCY_KEYFRAMES (+6 more)

### Community 66 - "placesScene.ts"
Cohesion: 0.19
Nodes (14): OsmPlaceData, OsmSliceResult, createPlacesScene(), ExplorerInfo, HERO_CAM, HERO_TARGET, PlacesController, createPlacesShaderEnv() (+6 more)

### Community 67 - "timePresets.ts"
Cohesion: 0.43
Nodes (5): GOLDEN_HOUR_END, GOLDEN_HOUR_START, TIME_PRESETS, TimePreset, TimePresetKey

### Community 68 - ".showLandmarkImmediate"
Cohesion: 0.24
Nodes (4): resetSceneDynamicLists(), setContactShadowFade(), SwayItem, WetMaterialEntry

### Community 69 - "tide.test.ts"
Cohesion: 0.60
Nodes (4): computeCoastalTideOffset(), TIDE_CENTER_OFFSET, TIDE_HALF_AMPLITUDE, TIDE_WAVE_AMPLITUDE

### Community 70 - "siteVisuals.ts"
Cohesion: 0.24
Nodes (10): blendHex(), DEFAULT_BY_BIOME, getSiteVisualProfile(), normalizeSiteVisualKey(), REGIONAL_BLEND_WEIGHTS, RegionalColourField, SITE_VISUALS_MAP, SitePointLightSpec (+2 more)

### Community 72 - "textureCache.ts"
Cohesion: 0.36
Nodes (7): preloadProceduralTextures(), canvasCache, openTextureDb(), persistCanvas(), preloadProceduralCanvases(), StoredCanvas, storeGeneratedCanvas()

### Community 75 - "createWebGPUCompat"
Cohesion: 0.41
Nodes (12): createWebGPUCompat(), convert(), findAlphaUniform(), findColorUniform(), findIntensityUniform(), tryGroundSheen(), tryHorizonRing(), trySkyMaterial() (+4 more)

### Community 76 - "markSharedGeo"
Cohesion: 0.18
Nodes (11): addLampWaterReflections(), addWetRoadStreaks(), getLampBulbGeo(), getLampConeGeo(), getLampHaloGeo(), getLampHardwareGeo(), getLampPoolGeo(), getLampReflectionGeo() (+3 more)

### Community 77 - "webgpuCompat.ts"
Cohesion: 0.25
Nodes (7): ALPHA_UNIFORMS, COLOR_UNIFORMS, INTENSITY_UNIFORMS, TSLModule, UniformLink, UV_MAP_KEYS, WebGPUModule

### Community 78 - "addCraftedRim"
Cohesion: 0.60
Nodes (5): addCraftedRim(), addSquareRim(), getRimMaterial(), paintRadial(), paintStrata()

### Community 79 - "addSiteMotion"
Cohesion: 0.50
Nodes (4): addSiteMotion(), addWeatherFx(), stream(), normalMapsActive()

## Knowledge Gaps
- **8 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `three` connect `three` to `landmarksB.ts`, `shaders.ts`, `placesSliceBuilders.ts`, `placesShaders.ts`, `dioramaKit.ts`, `animalKit.ts`, `WeatherWidget.tsx`, `.constructor`, `placesScene.ts`, `DaylightBirdsController`, `package.json`, `getSoftTexture`, `CitylitEngine.ts`, `ref_node_test`, `getSoftTexture`, `siteAtmosphere.ts`, `placesInteriors.ts`, `webgpuPostFX.ts`, `SceneRenderer.ts`, `windowLights.ts`, `placesScene.ts`, `webgpuCompat.ts`?**
  _High betweenness centrality (0.188) - this node is a cross-community bridge._
- **Should `landmarksB.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06184012066365008 - nodes in this community are weakly interconnected._
- **Why does `CitylitEngine` connect `CitylitEngine` to `citylit.ts`, `App.tsx`, `animalKit.ts`, `WeatherWidget.tsx`, `.constructor`, `DaylightBirdsController`, `PassportModal.tsx`, `CitylitEngine.ts`, `.isStudio`, `ref_node_test`, `motion.ts`, `.frame`, `fitMath.ts`, `contact-sheet.ts`, `siteAtmosphere.ts`, `qualityBenchmark.ts`, `framePacing.ts`, `LandmarkBiome`, `placesScene.ts`, `.showLandmarkImmediate`, `siteVisuals.ts`?**
  _High betweenness centrality (0.095) - this node is a cross-community bridge._
- **Should `shaders.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.1437908496732026 - nodes in this community are weakly interconnected._
- **Why does `SceneRenderer` connect `.frame` to `ref_node_test`, `CitylitEngine`, `.constructor`, `webgpuPostFX.ts`, `WebGPUSceneRenderer`, `CitylitEngine.ts`, `WebGLSceneRenderer`, `SceneRenderer.ts`?**
  _High betweenness centrality (0.043) - this node is a cross-community bridge._
- **Should `citylit.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.09971509971509972 - nodes in this community are weakly interconnected._
- **Should `SearchSheet.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.09966777408637874 - nodes in this community are weakly interconnected._