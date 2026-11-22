# Graph Report - citylit-pwa  (2026-11-23)

## Corpus Check
- 132 files · ~296,474 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 10 file(s) not represented in the graph (top: .woff2 4, (none) 2, .css 2)

## Summary
- 1648 nodes · 4803 edges · 78 communities (62 shown, 16 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 177 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `56a82eb0`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- landmarksB.ts
- getSoftTexture
- citylit.ts
- primitives.ts
- skyEvents.ts
- App.tsx
- placesSliceBuilders.ts
- placesShaders.ts
- SearchSheet.tsx
- dioramaKit.ts
- animalKit.ts
- ref_node_assert
- CitylitEngine
- compilerOptions
- motion.ts
- osmService.ts
- osmSlice.ts
- LandmarkCard.tsx
- SettingsModal.tsx
- shaders.ts
- PassportModal.tsx
- package.json
- dependencies
- globeScene.ts
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
- strata.glsl.ts
- webgpuPostFX.ts
- ambientAudio.ts
- overrides
- capture-contact-sheets.mjs
- windowLights.ts
- placesClouds.ts
- ScaleReferenceKind
- .frame
- siteAtmosphere.ts
- run
- contact-sheet.ts
- recharts
- vehicleLightKit.ts
- placesInteriors.ts
- weatherScene.ts
- prepareCanvasTexture
- .setQualityIndex
- webgpuCompat.ts
- three
- season.ts
- nativeHost.ts
- WebGPUSceneRenderer
- qualityBenchmark.ts
- horizonScenery.ts
- WebGLSceneRenderer
- AmbientSiteProfile
- MiniatureGradeOptions
- markSharedGeo
- .constructor
- WebGPUPostFX
- .showLandmarkImmediate
- SceneRenderer.ts
- createWebGPUCompat
- @types/node@^24.0.0
- addCraftedRim
- addSiteMotion
- addWildlifeLayer
- oxfmt@0.79.0
- react-dom
- typescript@7.0.2
- addDioramaClouds
- addStandUnderside

## God Nodes (most connected - your core abstractions)
1. `CitylitEngine` - 129 edges
2. `add()` - 86 edges
3. `C()` - 64 edges
4. `M()` - 64 edges
5. `CB()` - 63 edges
6. `R()` - 60 edges
7. `MStone()` - 56 edges
8. `App()` - 50 edges
9. `addStreetLampSet()` - 50 edges
10. `instancedMeshes()` - 41 edges

## Surprising Connections (you probably didn't know these)
- `CompassProps` --references--> `CitylitEngine`  [EXTRACTED]
  src/components/Compass.tsx → src/three/CitylitEngine.ts
- `PassportModalProps` --references--> `LandmarkNote`  [EXTRACTED]
  src/components/PassportModal.tsx → src/types/citylit.ts
- `App()` --calls--> `Compass()`  [EXTRACTED]
  src/App.tsx → src/components/Compass.tsx
- `App()` --calls--> `InfoDrawer()`  [EXTRACTED]
  src/App.tsx → src/components/InfoDrawer.tsx
- `App()` --calls--> `LandmarkCard()`  [EXTRACTED]
  src/App.tsx → src/components/LandmarkCard.tsx

## Import Cycles
- None detected.

## Communities (78 total, 16 thin omitted)

### Community 0 - "landmarksB.ts"
Cohesion: 0.11
Nodes (146): headingYaw(), leftLaneOffset(), normalizePlanar(), PlanarVector, registerBeacons(), addAnchor(), addBaseScatter(), addBollards() (+138 more)

### Community 1 - "getSoftTexture"
Cohesion: 0.13
Nodes (19): BIOME_FALLBACK, normalizeRuleKey(), REGIONAL_PALETTES, RegionalPalette, resolveRegionalPalette(), rule(), SITE_RULES, SiteRule (+11 more)

### Community 2 - "citylit.ts"
Cohesion: 0.08
Nodes (33): WeatherIcon(), pad2(), PresetKey, SKY_EVENT_ICON, TIME_PRESETS, WARNING_STYLE, WEATHER_MOMENT_ICON, WeatherWidget() (+25 more)

### Community 3 - "primitives.ts"
Cohesion: 0.04
Nodes (50): archGeo(), buildTreeGeometry(), buildTreeLodGeometry(), cableDir, cableEnd, cableMid, cableStart, cableUp (+42 more)

### Community 4 - "skyEvents.ts"
Cohesion: 0.21
Nodes (15): dayIndex(), daysInMonth(), entryIntensity(), EVENT_PRIORITY, formatWhen(), getSkyEvent(), getUpcomingSkyEvents(), MONTH_LABELS (+7 more)

### Community 5 - "App.tsx"
Cohesion: 0.08
Nodes (44): App(), INITIAL_GLOBE, readInitialLandmarkIndex(), readSettings(), readStoredEggs(), readStoredNotes(), readStoredSavedPlaces(), readStoredSet() (+36 more)

### Community 6 - "placesSliceBuilders.ts"
Cohesion: 0.11
Nodes (35): getSeasonMonth(), getGrassMaterial(), createCloudPuffMesh(), createSliceCloudLayer(), createCutawayWaterTopMaterial(), createCutawayWaterWallMaterial(), createSliceMistMaterial(), CutawayWaterOptions (+27 more)

### Community 7 - "placesShaders.ts"
Cohesion: 0.14
Nodes (22): createPlacesScene(), ExplorerInfo, HERO_CAM, HERO_TARGET, bindVolumetricFogUniforms(), createPlacesShaderEnv(), createPlacesVolumetricFogLayer(), createPlacesWeatherParticles() (+14 more)

### Community 8 - "SearchSheet.tsx"
Cohesion: 0.17
Nodes (18): SearchSheet(), SearchSheetProps, LANDMARK_TAGS, BeforeInstallPromptEvent, usePWAInstall(), countLandmarksByTag(), filterLandmarks(), IndexedLandmark (+10 more)

### Community 9 - "dioramaKit.ts"
Cohesion: 0.07
Nodes (29): accentFor(), AnchorKind, CorniceBandSpec, DioramaFx, DoorSurroundSpec, FacadeWindowSpec, FALLBACK_PROFILE, getLampBulbMat() (+21 more)

### Community 10 - "animalKit.ts"
Cohesion: 0.10
Nodes (27): WildlifeSpot, advanceAnimalTime(), AnimalIdle, AnimalKind, AnimalLodSpec, AnimalMember, AnimalPose, AnimalScaffold (+19 more)

### Community 11 - "ref_node_assert"
Cohesion: 0.13
Nodes (11): EASTER_EGGS, EasterEgg, EasterEggKind, getWeatherMoment(), isSnowCode(), WEATHER_MOMENT_SITES, IDLES, KINDS (+3 more)

### Community 12 - "CitylitEngine"
Cohesion: 0.08
Nodes (3): CitylitEngine, fitDioramaShadowBounds(), NoteCategory

### Community 13 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowImportingTsExtensions, isolatedModules, jsx, lib, module, moduleDetection, moduleResolution (+10 more)

### Community 14 - "motion.ts"
Cohesion: 0.06
Nodes (44): react, AudioVisualizerBarProps, DARK_PALETTE, LIGHT_PALETTE, CARDINAL_TARGETS, CARDINALS_8, Compass(), CompassProps (+36 more)

### Community 15 - "osmService.ts"
Cohesion: 0.14
Nodes (17): cacheKey(), fallbackPatch(), GEO_CACHE, loadElevation(), loadOsmPlace(), LocalPoint, MEMORY_CACHE, OsmArea (+9 more)

### Community 16 - "osmSlice.ts"
Cohesion: 0.17
Nodes (15): OsmPlaceData, centroid(), clamp(), createOsmSlice(), createRibbon(), OsmSliceResult, polygonShape(), BespokeInteriorContext (+7 more)

### Community 17 - "LandmarkCard.tsx"
Cohesion: 0.07
Nodes (34): GalleryDialog(), GalleryModalProps, bodySlideVariants, CAMERA_PRESETS, CARDINALS, getCategoryMeta(), headerSlideVariants, LandmarkCard() (+26 more)

### Community 18 - "SettingsModal.tsx"
Cohesion: 0.07
Nodes (43): motion, ambientAudio, PostcardModal(), SKY_PRESETS, barWidth(), REFERENCE_OPTIONS, RulerRow, RulerScale (+35 more)

### Community 19 - "shaders.ts"
Cohesion: 0.14
Nodes (19): windowPaneMaterial(), applyDissolveToShader(), cascadeize(), configureTextureQuality(), flagWindy(), getSurfaceRoughnessTexture(), heightToRoughnessTexture(), installDissolveShader() (+11 more)

### Community 20 - "PassportModal.tsx"
Cohesion: 0.10
Nodes (27): @phosphor-icons/react, GlobeOverlayProps, CATEGORY_COLORS, PASSPORT_TABS, PassportModal(), PassportModalProps, PassportTab, ProvinceRing() (+19 more)

### Community 21 - "package.json"
Cohesion: 0.13
Nodes (16): goeist@0.1.0, tailwindcss@4.3.5, @types/react-dom@19.3.0, description, devDependencies, playwright@^1.65.1, puppeteer@^25.18.1, name (+8 more)

### Community 22 - "dependencies"
Cohesion: 0.11
Nodes (19): dependencies, motion@14.14.0, n8ao@2.1.0, oxlint@1.94.0, @phosphor-icons/react@2.1.10, react@19.3.1, three@0.187.0, @types/react@19.3.0 (+11 more)

### Community 23 - "globeScene.ts"
Cohesion: 0.11
Nodes (29): three, AFRICA_POLYS, ENCLAVE_POLYS, GLOBE_NEIGHBOR_LABELS, GLOBE_PROVINCES, NEIGHBOR_POLYS, PROVINCE_STYLE, ProvinceGlobeEntry (+21 more)

### Community 25 - "server.js"
Cohesion: 0.20
Nodes (6): express@5.3.0, express, app, __dirname, distDir, __filename

### Community 26 - "CitylitEngine.ts"
Cohesion: 0.07
Nodes (37): boundsFitPlinth(), clamp(), fitBoundsToPlinth(), PlanarBounds, PLINTH_FRAME_WIDTH, PLINTH_HALF_EXTENT, PLINTH_INNER_HALF_EXTENT, PlinthFit (+29 more)

### Community 27 - ".oxfmtrc.json"
Cohesion: 0.22
Nodes (8): ignorePatterns, printWidth, $schema, semi, singleQuote, tabWidth, trailingComma, useTabs

### Community 28 - ".oxlintrc.json"
Cohesion: 0.22
Nodes (8): categories, correctness, suspicious, ignorePatterns, plugins, rules, react/react-in-jsx-scope, $schema

### Community 29 - "vite.config.ts"
Cohesion: 0.20
Nodes (8): @tailwindcss/vite@4.3.5, vite@8.3.8, vite-plugin-pwa@2.0.0, @vitejs/plugin-react@6.3.0, @tailwindcss/vite, vite, vite-plugin-pwa, @vitejs/plugin-react

### Community 30 - "albedoAudit.ts"
Cohesion: 0.13
Nodes (27): ALBEDO_CONTRACT, AlbedoAudit, AlbedoBand, auditAlbedo(), auditHeroLuminance(), clamp(), DEFAULT_SATURATION_REDUCTION, GRADE_GUARDRAILS (+19 more)

### Community 31 - "scripts"
Cohesion: 0.15
Nodes (13): scripts, build, dev, format, format:check, lint, preview, qa:capture (+5 more)

### Community 32 - "applyDioramaUpgrade"
Cohesion: 0.12
Nodes (17): addEdgeWaterfall(), addScaleReference(), addSoaringBirds(), addSquareWaterPlate(), addTreeRing(), applyDioramaUpgrade(), buildSpatialSources(), getSiteProfile() (+9 more)

### Community 33 - "with"
Cohesion: 0.11
Nodes (17): jobs, verify, name, on, pull_request, push, branches, name (+9 more)

### Community 34 - "strata.glsl.ts"
Cohesion: 0.21
Nodes (9): NOISE_GLSL, SEASON_MORPH_GLSL, SEASON_UNIFORMS_GLSL, STRATA_COLOR_FRAGMENT, STRATA_FRAG_COMMON, STRATA_ROUGHNESS_FRAGMENT, STRATA_VERT_BEGIN, STRATA_VERT_COMMON (+1 more)

### Community 35 - "webgpuPostFX.ts"
Cohesion: 0.22
Nodes (7): BloomModule, DOFModule, makeUniforms(), SSAOModule, TSL, Uniforms, WebGPUModule

### Community 36 - "ambientAudio.ts"
Cohesion: 0.13
Nodes (14): BIOME_HAPTIC_PATTERNS, clamp01(), equalPower(), FilterBand, REGION_HAPTIC_ACCENTS, smoothBell(), smoothstep(), SpatialEmitter (+6 more)

### Community 37 - "overrides"
Cohesion: 0.33
Nodes (5): allowBuilds, puppeteer, overrides, three, workbox-build>glob

### Community 38 - "capture-contact-sheets.mjs"
Cohesion: 0.10
Nodes (20): CDP, clickAria(), listTargets(), run(), sleep(), acquirePageTarget(), captureHour(), CdpSession (+12 more)

### Community 39 - "windowLights.ts"
Cohesion: 0.22
Nodes (12): bake(), createWindowFacade(), FacadeRecord, facades, hash01(), OCCUPANCY_KEYFRAMES, tmpLit, updateWindowLights() (+4 more)

### Community 40 - "placesClouds.ts"
Cohesion: 0.40
Nodes (3): CloudAssets, CloudPuffInstance, SliceCloudLayer

### Community 41 - "ScaleReferenceKind"
Cohesion: 0.33
Nodes (5): ScaleRulerModalProps, MAX_REFERENCE_UNITS, MIN_REFERENCE_UNITS, ScaleReferenceEntry, ScaleReferenceKind

### Community 44 - "siteAtmosphere.ts"
Cohesion: 0.14
Nodes (18): SKY_NOISE_GLSL, AtmosphereEffect, AtmosphereLayer, AtmosphereProfile, AtmosphereSceneController, AtmosphereUpdateOptions, BIOME_EFFECTS, createAtmosphereScene() (+10 more)

### Community 45 - "run"
Cohesion: 0.38
Nodes (5): CDP, i0(), listTargets(), run(), sleep()

### Community 46 - "contact-sheet.ts"
Cohesion: 0.25
Nodes (8): build(), engine, grid, hour, params, stage, status, syncButtons()

### Community 48 - "vehicleLightKit.ts"
Cohesion: 0.16
Nodes (16): getCarHeadlightMat(), getCarPoolMat(), getCarTaillightMat(), createVehicleLightBatch(), ensureLightGeometries(), LightGeometries, markLightMesh(), placeInstance() (+8 more)

### Community 49 - "placesInteriors.ts"
Cohesion: 0.09
Nodes (51): BESPOKE_INTERIORS, buildThemedInterior(), bx(), co(), colonnade(), compactShell(), cy(), emptyMats() (+43 more)

### Community 50 - "weatherScene.ts"
Cohesion: 0.17
Nodes (14): MID_MONTH_DAY, solarDeclination(), southernSunDirection(), collectStreetLampAnchors(), createStreetLampPool(), LAMP_TINT, lampTintForBiome(), solarHalfDay() (+6 more)

### Community 51 - "prepareCanvasTexture"
Cohesion: 0.22
Nodes (16): getRoofDirtMap(), getBrushedNormalTexture(), getBrushedRoughnessTexture(), getCanvasBumpTexture(), getCanvasNormalTexture(), getPlasterBumpTexture(), getPlasterNormalTexture(), getRoofBumpTexture() (+8 more)

### Community 53 - "webgpuCompat.ts"
Cohesion: 0.25
Nodes (7): ALPHA_UNIFORMS, COLOR_UNIFORMS, INTENSITY_UNIFORMS, TSLModule, UniformLink, UV_MAP_KEYS, WebGPUModule

### Community 54 - "three"
Cohesion: 0.16
Nodes (8): createWebGLRendererSelection(), GPUCapableNavigator, readRendererPreference(), selectRenderer(), AnyRenderer, PMREMResult, RendererBackend, RendererPreference

### Community 55 - "season.ts"
Cohesion: 0.36
Nodes (8): isSpeciesBlooming(), monthToSeasonWeights(), normalizeMonth(), PLANT_SPECIES, PlantSpecies, PlantSpeciesInfo, SeasonWeights, setSeasonMonth()

### Community 56 - "nativeHost.ts"
Cohesion: 0.31
Nodes (6): detectNativeHost(), hasCinematicHost(), isHost(), NativeCinematicHost, nativeHostUrl(), Window

### Community 58 - "qualityBenchmark.ts"
Cohesion: 0.14
Nodes (12): BenchmarkConfig, BenchmarkTier, CachedBenchmark, computeFrameStats(), DEFAULT_BENCHMARK_CONFIG, FrameStats, FrameTimeBenchmark, percentile() (+4 more)

### Community 59 - "horizonScenery.ts"
Cohesion: 0.28
Nodes (8): RegionalPaletteKey, BiomeWeights, createHorizonRing(), createHorizonScenery(), HorizonUpdateOptions, SIGNATURE_PARTS, SignaturePart, weightsForBiome()

### Community 61 - "AmbientSiteProfile"
Cohesion: 0.16
Nodes (6): extractRegionName(), SiteProfile, HorizonSceneryController, AtmosphereSite, AmbientSiteProfile, LandmarkBiome

### Community 63 - "markSharedGeo"
Cohesion: 0.18
Nodes (11): addLampWaterReflections(), addWetRoadStreaks(), getLampBulbGeo(), getLampConeGeo(), getLampHaloGeo(), getLampHardwareGeo(), getLampPoolGeo(), getLampReflectionGeo() (+3 more)

### Community 64 - ".constructor"
Cohesion: 0.06
Nodes (26): attachEquirect(), buildProbeData(), Equirect, HORIZ_DIRS, installGI(), probeGrid, probeOrigin, probeSize (+18 more)

### Community 66 - ".showLandmarkImmediate"
Cohesion: 0.12
Nodes (7): resetSceneDynamicLists(), setContactShadowFade(), SwayItem, WetMaterialEntry, EngineCallbacks, setBounceLightBiome(), PlacesSelectionInfo

### Community 69 - "createWebGPUCompat"
Cohesion: 0.42
Nodes (10): createWebGPUCompat(), convert(), findAlphaUniform(), findColorUniform(), findIntensityUniform(), tryGroundSheen(), tryHorizonRing(), trySkyMaterial() (+2 more)

### Community 72 - "addCraftedRim"
Cohesion: 0.60
Nodes (5): addCraftedRim(), addSquareRim(), getRimMaterial(), paintRadial(), paintStrata()

### Community 73 - "addSiteMotion"
Cohesion: 0.50
Nodes (4): addSiteMotion(), addWeatherFx(), stream(), normalMapsActive()

### Community 74 - "addWildlifeLayer"
Cohesion: 0.67
Nodes (3): getAnimalSeasonMonth(), addWildlifeLayer(), appendLayerTargets()

## Knowledge Gaps
- **16 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `three` connect `globeScene.ts` to `landmarksB.ts`, `primitives.ts`, `placesSliceBuilders.ts`, `placesShaders.ts`, `dioramaKit.ts`, `animalKit.ts`, `osmSlice.ts`, `shaders.ts`, `package.json`, `dependencies`, `CitylitEngine.ts`, `albedoAudit.ts`, `webgpuPostFX.ts`, `windowLights.ts`, `placesClouds.ts`, `siteAtmosphere.ts`, `vehicleLightKit.ts`, `placesInteriors.ts`, `weatherScene.ts`, `webgpuCompat.ts`, `three`, `horizonScenery.ts`, `.constructor`, `SceneRenderer.ts`?**
  _High betweenness centrality (0.183) - this node is a cross-community bridge._
- **Should `landmarksB.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.10931567328918322 - nodes in this community are weakly interconnected._
- **Why does `CitylitEngine` connect `CitylitEngine` to `getSoftTexture`, `citylit.ts`, `App.tsx`, `animalKit.ts`, `motion.ts`, `osmSlice.ts`, `SettingsModal.tsx`, `CitylitEngine.ts`, `albedoAudit.ts`, `ScaleReferenceKind`, `.frame`, `siteAtmosphere.ts`, `contact-sheet.ts`, `weatherScene.ts`, `.setQualityIndex`, `three`, `qualityBenchmark.ts`, `AmbientSiteProfile`, `.constructor`, `.showLandmarkImmediate`?**
  _High betweenness centrality (0.093) - this node is a cross-community bridge._
- **Should `getSoftTexture` be split into smaller, more focused modules?**
  _Cohesion score 0.13043478260869565 - nodes in this community are weakly interconnected._
- **Why does `SceneRenderer` connect `.frame` to `.constructor`, `.showLandmarkImmediate`, `SceneRenderer.ts`, `CitylitEngine`, `.setQualityIndex`, `three`, `WebGPUSceneRenderer`, `CitylitEngine.ts`, `WebGLSceneRenderer`, `MiniatureGradeOptions`?**
  _High betweenness centrality (0.056) - this node is a cross-community bridge._
- **Should `citylit.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.08333333333333333 - nodes in this community are weakly interconnected._
- **Should `primitives.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.0444947209653092 - nodes in this community are weakly interconnected._