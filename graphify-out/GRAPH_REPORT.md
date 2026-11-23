# Graph Report - citylit-pwa  (2026-11-23)

## Corpus Check
- 132 files · ~297,038 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 10 file(s) not represented in the graph (top: .woff2 4, (none) 2, .css 2)

## Summary
- 1650 nodes · 4811 edges · 72 communities (60 shown, 12 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 177 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `47cbd752`
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
- InfoDrawer.tsx
- dioramaKit.ts
- animalKit.ts
- wildlife.ts
- CitylitEngine
- compilerOptions
- motion.ts
- osmService.ts
- placesScene.ts
- LandmarkCard.tsx
- ScaleRulerModal.tsx
- applyDissolveToShader
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
- ambientAudio.ts
- overrides
- capture-contact-sheets.mjs
- windowLights.ts
- placesClouds.ts
- globalIllumination.ts
- .frame
- siteAtmosphere.ts
- run
- contact-sheet.ts
- vehicleLightKit.ts
- placesInteriors.ts
- windParticles.ts
- prepareCanvasTexture
- .setQualityIndex
- webgpuCompat.ts
- three
- season.ts
- nativeHost.ts
- WebGPUSceneRenderer
- goeist@0.1.0
- tailwindcss@4.3.5
- WebGLSceneRenderer
- LandmarkBiome
- @types/react@19.3.0
- @types/three@0.187.0
- .constructor
- WebGPUPostFX
- .showLandmarkImmediate
- @ui-sdk/core@0.1.0-beta.13
- @ui-sdk/react
- createWebGPUCompat
- addCraftedRim
- addSiteMotion

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
- `App()` --calls--> `AudioVisualizerBar()`  [EXTRACTED]
  src/App.tsx → src/components/AudioVisualizerBar.tsx
- `App()` --calls--> `Compass()`  [EXTRACTED]
  src/App.tsx → src/components/Compass.tsx
- `App()` --calls--> `GalleryModal()`  [EXTRACTED]
  src/App.tsx → src/components/GalleryModal.tsx
- `App()` --calls--> `GlobeOverlay()`  [EXTRACTED]
  src/App.tsx → src/components/GlobeOverlay.tsx

## Import Cycles
- None detected.

## Communities (72 total, 12 thin omitted)

### Community 0 - "landmarksB.ts"
Cohesion: 0.11
Nodes (146): headingYaw(), leftLaneOffset(), normalizePlanar(), PlanarVector, registerBeacons(), addAnchor(), addBaseScatter(), addBollards() (+138 more)

### Community 1 - "getSoftTexture"
Cohesion: 0.13
Nodes (18): BIOME_FALLBACK, normalizeRuleKey(), REGIONAL_PALETTES, RegionalPalette, RegionalPaletteKey, resolveRegionalPalette(), rule(), SITE_RULES (+10 more)

### Community 2 - "citylit.ts"
Cohesion: 0.06
Nodes (56): BUILTIN_MIXER_PRESETS, DEFAULT_MIXER, MIXER_CHANNELS, MOTION_OPTIONS, QUALITY_OPTIONS, readCustomPresets(), RENDERER_OPTIONS, SCALE_REFERENCE_OPTIONS (+48 more)

### Community 3 - "primitives.ts"
Cohesion: 0.04
Nodes (52): archGeo(), buildTreeGeometry(), buildTreeLodGeometry(), cableDir, cableEnd, cableMid, cableStart, cableUp (+44 more)

### Community 4 - "PlacesOverlay.tsx"
Cohesion: 0.16
Nodes (16): @phosphor-icons/react@2.1.10, @phosphor-icons/react, placeCardCondition(), PlacesOverlay(), PlacesOverlayProps, QUICK_TIMES, WEATHER_MODES, ANIMATED_BY_CONDITION (+8 more)

### Community 5 - "App.tsx"
Cohesion: 0.09
Nodes (34): App(), INITIAL_GLOBE, readInitialLandmarkIndex(), readSettings(), readStoredEggs(), readStoredNotes(), readStoredSavedPlaces(), readStoredSet() (+26 more)

### Community 6 - "placesSliceBuilders.ts"
Cohesion: 0.11
Nodes (36): getGrassMaterial(), BESPOKE_INTERIORS, BespokeInteriorContext, createCutawayWaterTopMaterial(), createCutawayWaterWallMaterial(), createSliceMistMaterial(), CutawayWaterOptions, getOrlandoMuralTexture() (+28 more)

### Community 7 - "placesShaders.ts"
Cohesion: 0.15
Nodes (19): bindVolumetricFogUniforms(), patchPlacesVolumetricFog(), PlacesSliceEmitterSpec, WaterConfluenceSpec, WaterTideSpec, CLOUD_FRAGMENT, CLOUD_VERTEX, NOISE_GLSL (+11 more)

### Community 8 - "InfoDrawer.tsx"
Cohesion: 0.08
Nodes (36): formatCoords(), InfoDrawer(), InfoDrawerProps, SearchSheet(), EASTER_EGGS, EasterEgg, EasterEggKind, LANDMARK_DETAILS (+28 more)

### Community 9 - "dioramaKit.ts"
Cohesion: 0.06
Nodes (41): accentFor(), addLampWaterReflections(), addWetRoadStreaks(), AnchorKind, CorniceBandSpec, DioramaFx, DoorSurroundSpec, FacadeWindowSpec (+33 more)

### Community 10 - "animalKit.ts"
Cohesion: 0.10
Nodes (26): advanceAnimalTime(), AnimalLodSpec, AnimalMember, AnimalPose, AnimalScaffold, AnimalScaffoldSpec, animalSeasonForMonth(), AnimalVec3 (+18 more)

### Community 11 - "wildlife.ts"
Cohesion: 0.29
Nodes (8): IDLES, KINDS, SEASONS, WILDLIFE, WildlifeSpot, AnimalIdle, AnimalKind, AnimalSeason

### Community 12 - "CitylitEngine"
Cohesion: 0.07
Nodes (3): CitylitEngine, fitDioramaShadowBounds(), NoteCategory

### Community 13 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowImportingTsExtensions, isolatedModules, jsx, lib, module, moduleDetection, moduleResolution (+10 more)

### Community 14 - "motion.ts"
Cohesion: 0.07
Nodes (37): motion@14.14.0, motion, react, ambientAudio, AudioVisualizerBar(), AudioVisualizerBarProps, DARK_PALETTE, LIGHT_PALETTE (+29 more)

### Community 15 - "osmService.ts"
Cohesion: 0.14
Nodes (17): cacheKey(), fallbackPatch(), formatCoordinates(), GEO_CACHE, loadElevation(), loadOsmPlace(), LocalPoint, MEMORY_CACHE (+9 more)

### Community 16 - "placesScene.ts"
Cohesion: 0.14
Nodes (23): OsmArea, OsmPlaceData, centroid(), clamp(), createOsmSlice(), createRibbon(), OsmSliceResult, polygonShape() (+15 more)

### Community 17 - "LandmarkCard.tsx"
Cohesion: 0.08
Nodes (28): GalleryDialog(), GalleryModal(), GalleryModalProps, bodySlideVariants, CAMERA_PRESETS, CARDINALS, getCategoryMeta(), headerSlideVariants (+20 more)

### Community 18 - "ScaleRulerModal.tsx"
Cohesion: 0.12
Nodes (22): barWidth(), REFERENCE_OPTIONS, RulerRow, RulerScale, RulerSort, SCALE_OPTIONS, ScaleRulerModal(), ScaleRulerModalProps (+14 more)

### Community 19 - "applyDissolveToShader"
Cohesion: 0.20
Nodes (10): addSquareWaterPlate(), windowPaneMaterial(), applyDissolveToShader(), cascadeize(), flagWindy(), installDissolveShader(), interiorParallaxShader(), lights() (+2 more)

### Community 20 - "PassportModal.tsx"
Cohesion: 0.11
Nodes (24): GlobeOverlay(), GlobeOverlayProps, CATEGORY_COLORS, PASSPORT_TABS, PassportModal(), PassportModalProps, PassportTab, ProvinceRing() (+16 more)

### Community 21 - "package.json"
Cohesion: 0.15
Nodes (14): recharts@3.11.0, workbox-window@7.4.1, description, devDependencies, playwright@^1.65.1, puppeteer@^25.18.1, name, private (+6 more)

### Community 22 - "dependencies"
Cohesion: 0.12
Nodes (17): dependencies, n8ao@2.1.0, oxfmt@0.79.0, oxlint@1.94.0, react@19.3.1, react-dom@19.3.1, three@0.187.0, @types/node@^24.0.0 (+9 more)

### Community 23 - "globeScene.ts"
Cohesion: 0.11
Nodes (29): three, AFRICA_POLYS, ENCLAVE_POLYS, GLOBE_NEIGHBOR_LABELS, GLOBE_PROVINCES, NEIGHBOR_POLYS, PROVINCE_STYLE, ProvinceGlobeEntry (+21 more)

### Community 24 - "AmbientAudioController"
Cohesion: 0.14
Nodes (4): AmbientAudioController, UnfoldAccordion(), SiteProfile, AmbientSiteProfile

### Community 25 - "server.js"
Cohesion: 0.20
Nodes (6): express@5.3.0, express, app, __dirname, distDir, __filename

### Community 26 - "CitylitEngine.ts"
Cohesion: 0.06
Nodes (43): clamp01(), liveWeatherVisual(), boundsFitPlinth(), clamp(), fitBoundsToPlinth(), PlanarBounds, PLINTH_FRAME_WIDTH, PLINTH_HALF_EXTENT (+35 more)

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
Cohesion: 0.05
Nodes (51): dayIndex(), daysInMonth(), entryIntensity(), EVENT_PRIORITY, formatWhen(), getSkyEvent(), getUpcomingSkyEvents(), MONTH_LABELS (+43 more)

### Community 31 - "scripts"
Cohesion: 0.15
Nodes (13): scripts, build, dev, format, format:check, lint, preview, qa:capture (+5 more)

### Community 32 - "applyDioramaUpgrade"
Cohesion: 0.11
Nodes (20): addDioramaClouds(), addEdgeWaterfall(), addScaleReference(), addSoaringBirds(), addStandUnderside(), addTreeRing(), applyDioramaUpgrade(), buildSpatialSources() (+12 more)

### Community 33 - "with"
Cohesion: 0.11
Nodes (17): jobs, verify, name, on, pull_request, push, branches, name (+9 more)

### Community 34 - "siteVisuals.ts"
Cohesion: 0.24
Nodes (10): blendHex(), DEFAULT_BY_BIOME, getSiteVisualProfile(), normalizeSiteVisualKey(), REGIONAL_BLEND_WEIGHTS, RegionalColourField, SITE_VISUALS_MAP, SitePointLightSpec (+2 more)

### Community 35 - "SceneRenderer.ts"
Cohesion: 0.10
Nodes (15): createDitherPass(), createMiniaturePass(), DitherShader, fallbackDepth, MiniatureGradeOptions, MiniatureShader, MiniatureTuning, createSceneRenderer() (+7 more)

### Community 36 - "ambientAudio.ts"
Cohesion: 0.14
Nodes (15): BIOME_HAPTIC_PATTERNS, clamp01(), equalPower(), FilterBand, REGION_HAPTIC_ACCENTS, smoothBell(), smoothstep(), SpatialEmitter (+7 more)

### Community 37 - "overrides"
Cohesion: 0.33
Nodes (5): allowBuilds, puppeteer, overrides, three, workbox-build>glob

### Community 38 - "capture-contact-sheets.mjs"
Cohesion: 0.09
Nodes (21): CDP, clickAria(), listTargets(), run(), sleep(), acquirePageTarget(), captureHour(), CdpSession (+13 more)

### Community 39 - "windowLights.ts"
Cohesion: 0.22
Nodes (12): bake(), createWindowFacade(), FacadeRecord, facades, hash01(), OCCUPANCY_KEYFRAMES, tmpLit, updateWindowLights() (+4 more)

### Community 40 - "placesClouds.ts"
Cohesion: 0.33
Nodes (5): CloudAssets, CloudPuffInstance, createCloudPuffMesh(), createSliceCloudLayer(), SliceCloudLayer

### Community 41 - "globalIllumination.ts"
Cohesion: 0.24
Nodes (9): attachEquirect(), buildProbeData(), Equirect, HORIZ_DIRS, installGI(), probeGrid, probeOrigin, probeSize (+1 more)

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
Nodes (50): buildThemedInterior(), bx(), co(), colonnade(), compactShell(), cy(), emptyMats(), fBench() (+42 more)

### Community 50 - "windParticles.ts"
Cohesion: 0.31
Nodes (8): GlobeController, BIOME_PALETTES, createLeafWispTexture(), createWindParticles(), seeded(), WindParticlesController, WindParticlesUpdateOptions, QualityIndex

### Community 51 - "prepareCanvasTexture"
Cohesion: 0.16
Nodes (25): getBrushedNormalTexture(), getBrushedRoughnessTexture(), getCanvasBumpTexture(), getCanvasNormalTexture(), getPlasterBumpTexture(), getPlasterNormalTexture(), getRoofBumpTexture(), getRoofNormalTexture() (+17 more)

### Community 52 - ".setQualityIndex"
Cohesion: 0.13
Nodes (3): readCachedBenchmark(), MiniaturePass, QualitySetting

### Community 53 - "webgpuCompat.ts"
Cohesion: 0.25
Nodes (7): ALPHA_UNIFORMS, COLOR_UNIFORMS, INTENSITY_UNIFORMS, TSLModule, UniformLink, UV_MAP_KEYS, WebGPUModule

### Community 54 - "three"
Cohesion: 0.15
Nodes (9): createWebGLRendererSelection(), GPUCapableNavigator, readRendererPreference(), selectRenderer(), AnyRenderer, PMREMResult, RendererBackend, RendererPreference (+1 more)

### Community 55 - "season.ts"
Cohesion: 0.33
Nodes (9): getSeasonMonth(), isSpeciesBlooming(), monthToSeasonWeights(), normalizeMonth(), PLANT_SPECIES, PlantSpecies, PlantSpeciesInfo, SeasonWeights (+1 more)

### Community 56 - "nativeHost.ts"
Cohesion: 0.31
Nodes (6): detectNativeHost(), hasCinematicHost(), isHost(), NativeCinematicHost, nativeHostUrl(), Window

### Community 61 - "LandmarkBiome"
Cohesion: 0.28
Nodes (3): extractRegionName(), AtmosphereSite, LandmarkBiome

### Community 64 - ".constructor"
Cohesion: 0.09
Nodes (17): BIOME_BOUNCE_COLORS, bounceDayTmp, bounceMixTmp, bounceNightTmp, configureDioramaShadow(), createBounceLight(), createRimLight(), DIORAMA_SHADOW_EXTENT (+9 more)

### Community 66 - ".showLandmarkImmediate"
Cohesion: 0.15
Nodes (3): setContactShadowFade(), SwayItem, WetMaterialEntry

### Community 69 - "createWebGPUCompat"
Cohesion: 0.41
Nodes (12): createWebGPUCompat(), convert(), findAlphaUniform(), findColorUniform(), findIntensityUniform(), tryGroundSheen(), tryHorizonRing(), trySkyMaterial() (+4 more)

### Community 72 - "addCraftedRim"
Cohesion: 0.60
Nodes (5): addCraftedRim(), addSquareRim(), getRimMaterial(), paintRadial(), paintStrata()

### Community 73 - "addSiteMotion"
Cohesion: 0.50
Nodes (4): addSiteMotion(), addWeatherFx(), stream(), normalMapsActive()

## Knowledge Gaps
- **12 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `three` connect `globeScene.ts` to `landmarksB.ts`, `getSoftTexture`, `citylit.ts`, `primitives.ts`, `placesSliceBuilders.ts`, `placesShaders.ts`, `dioramaKit.ts`, `animalKit.ts`, `placesScene.ts`, `package.json`, `dependencies`, `CitylitEngine.ts`, `SceneRenderer.ts`, `windowLights.ts`, `placesClouds.ts`, `globalIllumination.ts`, `siteAtmosphere.ts`, `vehicleLightKit.ts`, `placesInteriors.ts`, `windParticles.ts`, `prepareCanvasTexture`, `webgpuCompat.ts`, `three`, `.constructor`?**
  _High betweenness centrality (0.204) - this node is a cross-community bridge._
- **Should `landmarksB.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.10931567328918322 - nodes in this community are weakly interconnected._
- **Why does `CitylitEngine` connect `CitylitEngine` to `getSoftTexture`, `citylit.ts`, `App.tsx`, `animalKit.ts`, `motion.ts`, `placesScene.ts`, `ScaleRulerModal.tsx`, `CitylitEngine.ts`, `albedoAudit.ts`, `siteVisuals.ts`, `SceneRenderer.ts`, `.frame`, `siteAtmosphere.ts`, `contact-sheet.ts`, `windParticles.ts`, `.setQualityIndex`, `three`, `.constructor`, `.showLandmarkImmediate`?**
  _High betweenness centrality (0.114) - this node is a cross-community bridge._
- **Should `getSoftTexture` be split into smaller, more focused modules?**
  _Cohesion score 0.1341991341991342 - nodes in this community are weakly interconnected._
- **Why does `puppeteer` connect `package.json` to `capture-contact-sheets.mjs`?**
  _High betweenness centrality (0.050) - this node is a cross-community bridge._
- **Should `citylit.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05874125874125874 - nodes in this community are weakly interconnected._
- **Should `primitives.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.04262753319357093 - nodes in this community are weakly interconnected._