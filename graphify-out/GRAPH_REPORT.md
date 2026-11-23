# Graph Report - citylit-pwa  (2026-11-23)

## Corpus Check
- 144 files · ~326,174 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 10 file(s) not represented in the graph (top: .woff2 4, (none) 2, .css 2)

## Summary
- 1775 nodes · 5312 edges · 80 communities (67 shown, 13 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 192 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `14c29707`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- landmarksB.ts
- getSoftTexture
- citylit.ts
- primitives.ts
- PlacesOverlay.tsx
- App.tsx
- placesSliceBuilders.ts
- placesShaders.ts
- TopBar.tsx
- dioramaKit.ts
- animalKit.ts
- WeatherWidget.tsx
- CitylitEngine
- compilerOptions
- motion.ts
- osmService.ts
- osmSlice.ts
- LandmarkCard.tsx
- ScaleRulerModal.tsx
- DaylightBirdsController
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
- siteVisuals.ts
- SceneRenderer.ts
- .updateSpatial
- overrides
- capture-contact-sheets.mjs
- windowLights.ts
- placesClouds.ts
- globalIllumination.ts
- .frame
- siteAtmosphere.ts
- run
- contact-sheet.ts
- ref_node_assert
- vehicleLightKit.ts
- placesInteriors.ts
- qualityBenchmark.ts
- prepareCanvasTexture
- .setQualityIndex
- webgpuCompat.ts
- three
- weatherScene.ts
- nativeHost.ts
- WebGPUSceneRenderer
- skyEvents.ts
- placesScene.ts
- WebGLSceneRenderer
- LandmarkBiome
- @types/react@19.3.0
- ambientAudio.ts
- .constructor
- WebGPUPostFX
- markSharedGeo
- oxlint@1.94.0
- typescript@7.0.2
- createWebGPUCompat
- windy
- applyDissolveToShader
- AmbientSiteProfile
- tide.test.ts
- addCraftedRim
- SceneRenderer.ts
- addSiteMotion
- addWildlifeLayer
- addDioramaClouds
- addStandUnderside

## God Nodes (most connected - your core abstractions)
1. `CitylitEngine` - 146 edges
2. `add()` - 101 edges
3. `M()` - 79 edges
4. `C()` - 79 edges
5. `CB()` - 69 edges
6. `R()` - 60 edges
7. `MStone()` - 57 edges
8. `addStreetLampSet()` - 56 edges
9. `mergeByMaterial()` - 55 edges
10. `App()` - 53 edges

## Surprising Connections (you probably didn't know these)
- `App()` --calls--> `AudioVisualizerBar()`  [EXTRACTED]
  src/App.tsx → src/components/AudioVisualizerBar.tsx
- `App()` --calls--> `Compass()`  [EXTRACTED]
  src/App.tsx → src/components/Compass.tsx
- `App()` --calls--> `GalleryModal()`  [EXTRACTED]
  src/App.tsx → src/components/GalleryModal.tsx
- `App()` --calls--> `GlobeOverlay()`  [EXTRACTED]
  src/App.tsx → src/components/GlobeOverlay.tsx
- `App()` --calls--> `InfoDrawer()`  [EXTRACTED]
  src/App.tsx → src/components/InfoDrawer.tsx

## Import Cycles
- None detected.

## Communities (80 total, 13 thin omitted)

### Community 0 - "landmarksB.ts"
Cohesion: 0.10
Nodes (162): headingYaw(), leftLaneOffset(), normalizePlanar(), PlanarVector, registerBeacons(), addAnchor(), addBaseScatter(), addBollards() (+154 more)

### Community 1 - "getSoftTexture"
Cohesion: 0.14
Nodes (17): BIOME_FALLBACK, normalizeRuleKey(), REGIONAL_PALETTES, RegionalPalette, RegionalPaletteKey, resolveRegionalPalette(), rule(), SITE_RULES (+9 more)

### Community 2 - "citylit.ts"
Cohesion: 0.11
Nodes (23): BUILTIN_MIXER_PRESETS, DEFAULT_MIXER, MIXER_CHANNELS, MOTION_OPTIONS, QUALITY_OPTIONS, readCustomPresets(), RENDERER_OPTIONS, SCALE_REFERENCE_OPTIONS (+15 more)

### Community 3 - "primitives.ts"
Cohesion: 0.04
Nodes (45): archGeo(), cableDir, cableEnd, cableMid, cableStart, cableUp, contactShadowBatches, contactShadowMaterials (+37 more)

### Community 4 - "PlacesOverlay.tsx"
Cohesion: 0.09
Nodes (38): @phosphor-icons/react, GlobeOverlay(), GlobeOverlayProps, MOBILE_WEATHER_ICONS, PlacesOverlayProps, QUICK_TIMES, WEATHER_MODES, SearchSheet() (+30 more)

### Community 5 - "App.tsx"
Cohesion: 0.10
Nodes (32): react-dom, App(), INITIAL_GLOBE, readInitialLandmarkIndex(), readSettings(), readStoredEggs(), readStoredNotes(), readStoredSavedPlaces() (+24 more)

### Community 6 - "placesSliceBuilders.ts"
Cohesion: 0.12
Nodes (32): createCloudPuffMesh(), createSliceCloudLayer(), BESPOKE_INTERIORS, BespokeInteriorKind, createCutawayWaterTopMaterial(), createCutawayWaterWallMaterial(), createSliceMistMaterial(), CutawayWaterOptions (+24 more)

### Community 7 - "placesShaders.ts"
Cohesion: 0.14
Nodes (19): PlacesSliceEmitterSpec, WaterConfluenceSpec, WaterTideSpec, CLOUD_FRAGMENT, CLOUD_VERTEX, NOISE_GLSL, SEASON_MORPH_GLSL, SEASON_UNIFORMS_GLSL (+11 more)

### Community 8 - "TopBar.tsx"
Cohesion: 0.14
Nodes (20): AudioVisualizerBar(), AudioVisualizerBarProps, DARK_PALETTE, LIGHT_PALETTE, IconButton(), IconButtonProps, TopBar(), TopBarProps (+12 more)

### Community 9 - "dioramaKit.ts"
Cohesion: 0.05
Nodes (37): MAX_REFERENCE_UNITS, MIN_REFERENCE_UNITS, accentFor(), AnchorKind, CorniceBandSpec, DioramaFx, DoorSurroundSpec, FacadeWindowSpec (+29 more)

### Community 10 - "animalKit.ts"
Cohesion: 0.07
Nodes (40): IDLES, KINDS, SEASONS, WILDLIFE, WildlifeSpot, advanceAnimalTime(), AnimalIdle, AnimalKind (+32 more)

### Community 11 - "WeatherWidget.tsx"
Cohesion: 0.09
Nodes (37): HourlyForecast(), HourlyForecastProps, WeatherIcon(), pad2(), PresetKey, SKY_EVENT_ICON, TIME_PRESETS, WARNING_STYLE (+29 more)

### Community 12 - "CitylitEngine"
Cohesion: 0.06
Nodes (11): CompassProps, resetSceneDynamicLists(), setContactShadowFade(), SwayItem, WetMaterialEntry, CitylitEngine, EngineCallbacks, fitDioramaShadowBounds() (+3 more)

### Community 13 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowImportingTsExtensions, isolatedModules, jsx, lib, module, moduleDetection, moduleResolution (+10 more)

### Community 14 - "motion.ts"
Cohesion: 0.07
Nodes (41): motion, react, ambientAudio, CARDINAL_TARGETS, CARDINALS_8, Compass(), formatBearing(), TICKS (+33 more)

### Community 15 - "osmService.ts"
Cohesion: 0.13
Nodes (19): cacheKey(), fallbackPatch(), GEO_CACHE, geocodePlace(), loadElevation(), loadOsmPlace(), LocalPoint, MEMORY_CACHE (+11 more)

### Community 16 - "osmSlice.ts"
Cohesion: 0.18
Nodes (17): OsmPlaceData, StreetLampSpec, centroid(), clamp(), createOsmSlice(), createRibbon(), OsmSliceResult, pointOnRoad() (+9 more)

### Community 17 - "LandmarkCard.tsx"
Cohesion: 0.08
Nodes (32): GalleryDialog(), GalleryModal(), GalleryModalProps, bodySlideVariants, CAMERA_PRESETS, CARDINALS, getCategoryMeta(), headerSlideVariants (+24 more)

### Community 18 - "ScaleRulerModal.tsx"
Cohesion: 0.13
Nodes (20): barWidth(), REFERENCE_OPTIONS, RulerRow, RulerScale, RulerSort, SCALE_OPTIONS, ScaleRulerModal(), ScaleRulerModalProps (+12 more)

### Community 19 - "DaylightBirdsController"
Cohesion: 0.13
Nodes (13): computeBirdSpawnIntervalSec(), computeFoliageSwayAngle(), computeFoliageWindStrength(), isDaylightForBirds(), BIOME_PALETTES, BirdAgent, BirdPalette, BirdState (+5 more)

### Community 20 - "PassportModal.tsx"
Cohesion: 0.14
Nodes (19): CATEGORY_COLORS, PASSPORT_TABS, PassportModal(), PassportModalProps, PassportTab, ProvinceRing(), ProvinceRingProps, ProvinceStatRow (+11 more)

### Community 21 - "package.json"
Cohesion: 0.10
Nodes (20): goeist@0.1.0, @types/react-dom@19.3.0, @types/three@0.187.0, @ui-sdk/react@0.1.0-beta.13, workbox-window@7.4.1, description, devDependencies, playwright@^1.65.1 (+12 more)

### Community 22 - "dependencies"
Cohesion: 0.11
Nodes (18): dependencies, motion@14.14.0, n8ao@2.1.0, oxfmt@0.79.0, @phosphor-icons/react@2.1.10, react@19.3.1, react-dom@19.3.1, recharts@3.11.0 (+10 more)

### Community 23 - "globeScene.ts"
Cohesion: 0.11
Nodes (29): three, AFRICA_POLYS, ENCLAVE_POLYS, GLOBE_NEIGHBOR_LABELS, GLOBE_PROVINCES, NEIGHBOR_POLYS, PROVINCE_STYLE, ProvinceGlobeEntry (+21 more)

### Community 25 - "server.js"
Cohesion: 0.20
Nodes (6): express@5.3.0, express, app, __dirname, distDir, __filename

### Community 26 - "CitylitEngine.ts"
Cohesion: 0.05
Nodes (49): boundsFitPlinth(), clamp(), fitBoundsToPlinth(), PlanarBounds, PLINTH_FRAME_WIDTH, PLINTH_HALF_EXTENT, PLINTH_INNER_HALF_EXTENT, PlinthFit (+41 more)

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
Cohesion: 0.18
Nodes (22): ALBEDO_CONTRACT, AlbedoAudit, AlbedoBand, auditAlbedo(), auditHeroLuminance(), clamp(), DEFAULT_SATURATION_REDUCTION, GRADE_GUARDRAILS (+14 more)

### Community 31 - "scripts"
Cohesion: 0.15
Nodes (13): scripts, build, dev, format, format:check, lint, preview, qa:capture (+5 more)

### Community 32 - "applyDioramaUpgrade"
Cohesion: 0.13
Nodes (16): addEdgeWaterfall(), addScaleReference(), addSoaringBirds(), addSquareWaterPlate(), applyDioramaUpgrade(), buildSpatialSources(), getSiteProfile(), hasSiteProfile() (+8 more)

### Community 33 - "with"
Cohesion: 0.11
Nodes (17): jobs, verify, name, on, pull_request, push, branches, name (+9 more)

### Community 34 - "siteVisuals.ts"
Cohesion: 0.24
Nodes (10): blendHex(), DEFAULT_BY_BIOME, getSiteVisualProfile(), normalizeSiteVisualKey(), REGIONAL_BLEND_WEIGHTS, RegionalColourField, SITE_VISUALS_MAP, SitePointLightSpec (+2 more)

### Community 35 - "SceneRenderer.ts"
Cohesion: 0.15
Nodes (8): MiniatureGradeOptions, BloomModule, DOFModule, makeUniforms(), SSAOModule, TSL, Uniforms, WebGPUModule

### Community 36 - ".updateSpatial"
Cohesion: 0.31
Nodes (4): clamp01(), equalPower(), smoothBell(), smoothstep()

### Community 37 - "overrides"
Cohesion: 0.33
Nodes (5): allowBuilds, puppeteer, overrides, three, workbox-build>glob

### Community 38 - "capture-contact-sheets.mjs"
Cohesion: 0.08
Nodes (24): CDP, clickAria(), listTargets(), run(), sleep(), acquirePageTarget(), BASELINE_PATH, captureHour() (+16 more)

### Community 39 - "windowLights.ts"
Cohesion: 0.22
Nodes (12): bake(), createWindowFacade(), FacadeRecord, facades, hash01(), OCCUPANCY_KEYFRAMES, tmpLit, updateWindowLights() (+4 more)

### Community 40 - "placesClouds.ts"
Cohesion: 0.40
Nodes (3): CloudAssets, CloudPuffInstance, SliceCloudLayer

### Community 41 - "globalIllumination.ts"
Cohesion: 0.24
Nodes (9): attachEquirect(), buildProbeData(), Equirect, HORIZ_DIRS, installGI(), probeGrid, probeOrigin, probeSize (+1 more)

### Community 42 - ".frame"
Cohesion: 0.09
Nodes (3): updateWetSurfaces(), MiniaturePass, SceneRenderer

### Community 44 - "siteAtmosphere.ts"
Cohesion: 0.14
Nodes (18): SKY_NOISE_GLSL, AtmosphereEffect, AtmosphereLayer, AtmosphereProfile, AtmosphereSceneController, AtmosphereUpdateOptions, BIOME_EFFECTS, createAtmosphereScene() (+10 more)

### Community 45 - "run"
Cohesion: 0.38
Nodes (5): CDP, i0(), listTargets(), run(), sleep()

### Community 46 - "contact-sheet.ts"
Cohesion: 0.25
Nodes (8): build(), engine, grid, hour, params, stage, status, syncButtons()

### Community 47 - "ref_node_assert"
Cohesion: 0.19
Nodes (7): EASTER_EGGS, EasterEgg, EasterEggKind, getWeatherMoment(), isSnowCode(), WEATHER_MOMENT_SITES, WeatherMomentKind

### Community 48 - "vehicleLightKit.ts"
Cohesion: 0.16
Nodes (16): getCarHeadlightMat(), getCarPoolMat(), getCarTaillightMat(), createVehicleLightBatch(), ensureLightGeometries(), LightGeometries, markLightMesh(), placeInstance() (+8 more)

### Community 49 - "placesInteriors.ts"
Cohesion: 0.08
Nodes (53): BespokeInteriorContext, buildThemedInterior(), bx(), co(), colonnade(), compactShell(), cy(), emptyMats() (+45 more)

### Community 50 - "qualityBenchmark.ts"
Cohesion: 0.15
Nodes (11): BenchmarkConfig, BenchmarkTier, CachedBenchmark, computeFrameStats(), DEFAULT_BENCHMARK_CONFIG, FrameStats, FrameTimeBenchmark, percentile() (+3 more)

### Community 51 - "prepareCanvasTexture"
Cohesion: 0.17
Nodes (24): configureTextureQuality(), getBrushedNormalTexture(), getBrushedRoughnessTexture(), getCanvasBumpTexture(), getCanvasNormalTexture(), getPlasterBumpTexture(), getPlasterNormalTexture(), getRoofBumpTexture() (+16 more)

### Community 53 - "webgpuCompat.ts"
Cohesion: 0.25
Nodes (7): ALPHA_UNIFORMS, COLOR_UNIFORMS, INTENSITY_UNIFORMS, TSLModule, UniformLink, UV_MAP_KEYS, WebGPUModule

### Community 54 - "three"
Cohesion: 0.18
Nodes (8): createWebGLRendererSelection(), GPUCapableNavigator, readRendererPreference(), selectRenderer(), AnyRenderer, PMREMResult, RendererBackend, RendererPreference

### Community 55 - "weatherScene.ts"
Cohesion: 0.16
Nodes (18): getSeasonMonth(), isSpeciesBlooming(), monthToSeasonWeights(), normalizeMonth(), PLANT_SPECIES, PlantSpecies, PlantSpeciesInfo, SeasonWeights (+10 more)

### Community 56 - "nativeHost.ts"
Cohesion: 0.31
Nodes (6): detectNativeHost(), hasCinematicHost(), isHost(), NativeCinematicHost, nativeHostUrl(), Window

### Community 58 - "skyEvents.ts"
Cohesion: 0.21
Nodes (15): dayIndex(), daysInMonth(), entryIntensity(), EVENT_PRIORITY, formatWhen(), getSkyEvent(), getUpcomingSkyEvents(), MONTH_LABELS (+7 more)

### Community 59 - "placesScene.ts"
Cohesion: 0.19
Nodes (14): createPlacesScene(), ExplorerInfo, HERO_CAM, HERO_TARGET, bindVolumetricFogUniforms(), createPlacesShaderEnv(), createPlacesVolumetricFogLayer(), createPlacesWeatherParticles() (+6 more)

### Community 61 - "LandmarkBiome"
Cohesion: 0.29
Nodes (4): extractRegionName(), HorizonSceneryController, AtmosphereSite, LandmarkBiome

### Community 63 - "ambientAudio.ts"
Cohesion: 0.15
Nodes (12): AnimalAudioEvent, BIOME_HAPTIC_PATTERNS, FilterBand, REGION_HAPTIC_ACCENTS, SpatialEmitter, SpatialListener, UI_CUE_CATEGORY, UiCueCategory (+4 more)

### Community 64 - ".constructor"
Cohesion: 0.07
Nodes (17): BIOME_BOUNCE_COLORS, bounceDayTmp, bounceMixTmp, bounceNightTmp, configureDioramaShadow(), createBounceLight(), createRimLight(), DIORAMA_SHADOW_EXTENT (+9 more)

### Community 66 - "markSharedGeo"
Cohesion: 0.18
Nodes (11): addLampWaterReflections(), addWetRoadStreaks(), getLampBulbGeo(), getLampConeGeo(), getLampHaloGeo(), getLampHardwareGeo(), getLampPoolGeo(), getLampReflectionGeo() (+3 more)

### Community 69 - "createWebGPUCompat"
Cohesion: 0.41
Nodes (12): createWebGPUCompat(), convert(), findAlphaUniform(), findColorUniform(), findIntensityUniform(), tryGroundSheen(), tryHorizonRing(), trySkyMaterial() (+4 more)

### Community 70 - "windy"
Cohesion: 0.20
Nodes (11): buildTreeGeometry(), buildTreeLodGeometry(), crownGeo(), finalizeTreeBatch(), getGrassMaterial(), mergeTreeParts(), treeGeometry(), treeLodGeometry() (+3 more)

### Community 71 - "applyDissolveToShader"
Cohesion: 0.22
Nodes (9): windowPaneMaterial(), applyDissolveToShader(), cascadeize(), flagWindy(), installDissolveShader(), interiorParallaxShader(), lights(), waterize() (+1 more)

### Community 73 - "tide.test.ts"
Cohesion: 0.60
Nodes (4): computeCoastalTideOffset(), TIDE_CENTER_OFFSET, TIDE_HALF_AMPLITUDE, TIDE_WAVE_AMPLITUDE

### Community 74 - "addCraftedRim"
Cohesion: 0.60
Nodes (5): addCraftedRim(), addSquareRim(), getRimMaterial(), paintRadial(), paintStrata()

### Community 76 - "addSiteMotion"
Cohesion: 0.50
Nodes (4): addSiteMotion(), addWeatherFx(), stream(), normalMapsActive()

### Community 77 - "addWildlifeLayer"
Cohesion: 0.67
Nodes (3): getAnimalSeasonMonth(), addWildlifeLayer(), appendLayerTargets()

## Knowledge Gaps
- **13 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `three` connect `globeScene.ts` to `landmarksB.ts`, `getSoftTexture`, `primitives.ts`, `placesSliceBuilders.ts`, `placesShaders.ts`, `dioramaKit.ts`, `animalKit.ts`, `osmSlice.ts`, `DaylightBirdsController`, `package.json`, `dependencies`, `CitylitEngine.ts`, `SceneRenderer.ts`, `windowLights.ts`, `placesClouds.ts`, `globalIllumination.ts`, `siteAtmosphere.ts`, `vehicleLightKit.ts`, `placesInteriors.ts`, `prepareCanvasTexture`, `webgpuCompat.ts`, `three`, `weatherScene.ts`, `placesScene.ts`, `.constructor`, `SceneRenderer.ts`?**
  _High betweenness centrality (0.172) - this node is a cross-community bridge._
- **Should `landmarksB.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.09876632277613448 - nodes in this community are weakly interconnected._
- **Why does `CitylitEngine` connect `CitylitEngine` to `citylit.ts`, `App.tsx`, `animalKit.ts`, `WeatherWidget.tsx`, `motion.ts`, `osmSlice.ts`, `LandmarkCard.tsx`, `ScaleRulerModal.tsx`, `DaylightBirdsController`, `CitylitEngine.ts`, `siteVisuals.ts`, `.frame`, `siteAtmosphere.ts`, `contact-sheet.ts`, `qualityBenchmark.ts`, `.setQualityIndex`, `three`, `LandmarkBiome`, `.constructor`?**
  _High betweenness centrality (0.138) - this node is a cross-community bridge._
- **Should `getSoftTexture` be split into smaller, more focused modules?**
  _Cohesion score 0.14285714285714285 - nodes in this community are weakly interconnected._
- **Why does `WebGPUSceneRenderer` connect `WebGPUSceneRenderer` to `.constructor`, `WebGPUPostFX`, `SceneRenderer.ts`, `.frame`, `SceneRenderer.ts`?**
  _High betweenness centrality (0.033) - this node is a cross-community bridge._
- **Should `citylit.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.11384615384615385 - nodes in this community are weakly interconnected._
- **Should `primitives.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.0425531914893617 - nodes in this community are weakly interconnected._