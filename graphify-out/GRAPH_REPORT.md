# Graph Report - citylit-pwa  (2026-11-22)

## Corpus Check
- 111 files · ~273,626 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 10 file(s) not represented in the graph (top: .woff2 4, (none) 2, .css 2)

## Summary
- 1380 nodes · 4215 edges · 68 communities (57 shown, 11 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 121 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `9ee76b1a`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- landmarksB.ts
- albedoAudit.ts
- citylit.ts
- primitives.ts
- InfoDrawer.tsx
- App.tsx
- placesSliceBuilders.ts
- placesShaders.ts
- SearchSheet.tsx
- dioramaKit.ts
- CitylitEngine.ts
- TopBar.tsx
- CitylitEngine
- compilerOptions
- ambientAudio.ts
- osmService.ts
- osmSlice.ts
- motion.ts
- SettingsModal.tsx
- shaders.ts
- PassportModal.tsx
- package.json
- dependencies
- globeScene.ts
- AmbientAudioController
- server.js
- .frame
- .oxfmtrc.json
- .oxlintrc.json
- vite.config.ts
- animalKit.ts
- scripts
- .frame
- with
- globalIllumination.ts
- .isStudio
- applyDioramaUpgrade
- overrides
- capture-contact-sheets.mjs
- windowLights.ts
- placesClouds.ts
- citylit.ts
- .showLandmarkImmediate
- tailwindcss@4.3.5
- run
- contact-sheet.ts
- recharts
- vehicleLightKit.ts
- placesInteriors.ts
- PlacesOverlay.tsx
- season.ts
- markSharedGeo
- react-dom
- applyDissolveToShader
- windy
- nativeHost.ts
- windParticles.ts
- placesScene.ts
- addLampWaterReflections
- oxfmt@0.79.0
- addCraftedRim
- addSiteMotion
- @types/react@19.3.0
- @ui-sdk/react
- waterize
- addDioramaClouds
- addStandUnderside

## God Nodes (most connected - your core abstractions)
1. `CitylitEngine` - 109 edges
2. `add()` - 84 edges
3. `C()` - 62 edges
4. `CB()` - 62 edges
5. `M()` - 62 edges
6. `R()` - 60 edges
7. `MStone()` - 56 edges
8. `addStreetLampSet()` - 50 edges
9. `instancedMeshes()` - 41 edges
10. `App()` - 40 edges

## Surprising Connections (you probably didn't know these)
- `BespokeInteriorContext` --references--> `SliceSharedAssets`  [EXTRACTED]
  src/three/placesInteriors.ts → src/three/placesSliceBuilders.ts
- `CompassProps` --references--> `CitylitEngine`  [EXTRACTED]
  src/components/Compass.tsx → src/three/CitylitEngine.ts
- `CitylitEngine` --references--> `GlobeController`  [EXTRACTED]
  src/three/CitylitEngine.ts → src/three/globeScene.ts
- `CitylitEngine` --references--> `HorizonSceneryController`  [EXTRACTED]
  src/three/CitylitEngine.ts → src/three/horizonScenery.ts
- `CitylitEngine` --references--> `NightPalette`  [EXTRACTED]
  src/three/CitylitEngine.ts → src/three/nightPalette.ts

## Import Cycles
- None detected.

## Communities (68 total, 11 thin omitted)

### Community 0 - "landmarksB.ts"
Cohesion: 0.12
Nodes (142): headingYaw(), leftLaneOffset(), registerBeacons(), getAnimalSeasonMonth(), addAnchor(), addBaseScatter(), addBollards(), addDeck() (+134 more)

### Community 1 - "albedoAudit.ts"
Cohesion: 0.05
Nodes (55): ALBEDO_CONTRACT, AlbedoAudit, AlbedoBand, auditAlbedo(), auditHeroLuminance(), clamp(), DEFAULT_SATURATION_REDUCTION, GRADE_GUARDRAILS (+47 more)

### Community 2 - "citylit.ts"
Cohesion: 0.12
Nodes (26): PresetKey, TIME_PRESETS, WARNING_STYLE, WeatherWidget(), WeatherWidgetProps, buildLiveForecast(), conditionFromCode(), ExtremeWeatherWarning (+18 more)

### Community 3 - "primitives.ts"
Cohesion: 0.04
Nodes (43): archGeo(), cableDir, cableEnd, cableMid, cableStart, cableUp, contactShadowBatches, contactShadowMaterials (+35 more)

### Community 4 - "InfoDrawer.tsx"
Cohesion: 0.15
Nodes (16): formatCoords(), InfoDrawer(), InfoDrawerProps, UnfoldAccordion(), LANDMARK_DETAILS, LandmarkDetail, revealVariants, cleanCaption() (+8 more)

### Community 5 - "App.tsx"
Cohesion: 0.10
Nodes (31): App(), INITIAL_GLOBE, readInitialLandmarkIndex(), readSettings(), readStoredNotes(), readStoredSavedPlaces(), readStoredSet(), BootSplash() (+23 more)

### Community 6 - "placesSliceBuilders.ts"
Cohesion: 0.15
Nodes (27): getSeasonMonth(), createCutawayWaterTopMaterial(), createCutawayWaterWallMaterial(), createSliceMistMaterial(), CutawayWaterOptions, getOrlandoMuralTexture(), addInstancedFlowers(), addInstancedRocks() (+19 more)

### Community 7 - "placesShaders.ts"
Cohesion: 0.15
Nodes (19): bindVolumetricFogUniforms(), patchPlacesVolumetricFog(), PlacesSliceEmitterSpec, WaterConfluenceSpec, WaterTideSpec, CLOUD_FRAGMENT, CLOUD_VERTEX, NOISE_GLSL (+11 more)

### Community 8 - "SearchSheet.tsx"
Cohesion: 0.16
Nodes (22): GlobeOverlay(), GlobeOverlayProps, SearchSheet(), SearchSheetProps, LANDMARK_TAGS, LANDMARKS, PROVINCES, usePWAInstall() (+14 more)

### Community 9 - "dioramaKit.ts"
Cohesion: 0.07
Nodes (28): accentFor(), AnchorKind, CorniceBandSpec, DioramaFx, DoorSurroundSpec, FacadeWindowSpec, FALLBACK_PROFILE, getLampBulbMat() (+20 more)

### Community 10 - "CitylitEngine.ts"
Cohesion: 0.07
Nodes (38): clamp01(), liveWeatherVisual(), boundsFitPlinth(), clamp(), fitBoundsToPlinth(), PlanarBounds, PLINTH_FRAME_WIDTH, PLINTH_HALF_EXTENT (+30 more)

### Community 11 - "TopBar.tsx"
Cohesion: 0.21
Nodes (11): AudioVisualizerBar(), AudioVisualizerBarProps, DARK_PALETTE, LIGHT_PALETTE, IconButton(), IconButtonProps, TopBar(), TopBarProps (+3 more)

### Community 12 - "CitylitEngine"
Cohesion: 0.08
Nodes (5): CompassProps, SwayItem, WetMaterialEntry, CitylitEngine, QualitySetting

### Community 13 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowImportingTsExtensions, isolatedModules, jsx, lib, module, moduleDetection, moduleResolution (+10 more)

### Community 14 - "ambientAudio.ts"
Cohesion: 0.07
Nodes (31): react, ambientAudio, BIOME_HAPTIC_PATTERNS, FilterBand, REGION_HAPTIC_ACCENTS, SpatialEmitter, SpatialListener, UI_CUE_CATEGORY (+23 more)

### Community 15 - "osmService.ts"
Cohesion: 0.14
Nodes (17): cacheKey(), fallbackPatch(), GEO_CACHE, loadElevation(), loadOsmPlace(), LocalPoint, MEMORY_CACHE, OsmArea (+9 more)

### Community 16 - "osmSlice.ts"
Cohesion: 0.17
Nodes (15): OsmPlaceData, centroid(), clamp(), createOsmSlice(), createRibbon(), OsmSliceResult, polygonShape(), BespokeInteriorContext (+7 more)

### Community 17 - "motion.ts"
Cohesion: 0.11
Nodes (16): GalleryDialog(), GalleryModal(), GalleryModalProps, applyRubberBand(), EASE_IN_OUT, modalVariants, panelVariants, project() (+8 more)

### Community 18 - "SettingsModal.tsx"
Cohesion: 0.13
Nodes (20): motion, BUILTIN_MIXER_PRESETS, DEFAULT_MIXER, MIXER_CHANNELS, MOTION_OPTIONS, QUALITY_OPTIONS, readCustomPresets(), SettingsModal() (+12 more)

### Community 19 - "shaders.ts"
Cohesion: 0.15
Nodes (27): getRoofDirtMap(), MSteel(), getBrushedNormalTexture(), getBrushedRoughnessTexture(), getCanvasBumpTexture(), getCanvasNormalTexture(), getPlasterBumpTexture(), getPlasterNormalTexture() (+19 more)

### Community 20 - "PassportModal.tsx"
Cohesion: 0.12
Nodes (23): CATEGORY_COLORS, PASSPORT_TABS, PassportModal(), PassportModalProps, PassportTab, ProvinceRing(), ProvinceRingProps, ProvinceStatRow (+15 more)

### Community 21 - "package.json"
Cohesion: 0.14
Nodes (13): oxlint@1.94.0, @types/node@^24.0.0, @types/react-dom@19.3.0, workbox-window@7.4.1, description, name, private, type (+5 more)

### Community 22 - "dependencies"
Cohesion: 0.13
Nodes (15): dependencies, goeist@0.1.0, motion@14.14.0, n8ao@2.1.0, @phosphor-icons/react@2.1.10, react@19.3.1, three@0.187.0, @types/three@0.187.0 (+7 more)

### Community 23 - "globeScene.ts"
Cohesion: 0.11
Nodes (29): three, AFRICA_POLYS, ENCLAVE_POLYS, GLOBE_NEIGHBOR_LABELS, GLOBE_PROVINCES, NEIGHBOR_POLYS, PROVINCE_STYLE, ProvinceGlobeEntry (+21 more)

### Community 24 - "AmbientAudioController"
Cohesion: 0.06
Nodes (28): AmbientAudioController, clamp01(), equalPower(), extractRegionName(), smoothBell(), smoothstep(), SiteProfile, SKY_NOISE_GLSL (+20 more)

### Community 25 - "server.js"
Cohesion: 0.20
Nodes (6): express@5.3.0, express, app, __dirname, distDir, __filename

### Community 26 - ".frame"
Cohesion: 0.08
Nodes (22): BIOME_BOUNCE_COLORS, bounceDayTmp, bounceMixTmp, bounceNightTmp, configureDioramaShadow(), createBounceLight(), createRimLight(), DIORAMA_SHADOW_EXTENT (+14 more)

### Community 27 - ".oxfmtrc.json"
Cohesion: 0.22
Nodes (8): ignorePatterns, printWidth, $schema, semi, singleQuote, tabWidth, trailingComma, useTabs

### Community 28 - ".oxlintrc.json"
Cohesion: 0.22
Nodes (8): categories, correctness, suspicious, ignorePatterns, plugins, rules, react/react-in-jsx-scope, $schema

### Community 29 - "vite.config.ts"
Cohesion: 0.20
Nodes (8): @tailwindcss/vite@4.3.5, vite@8.3.8, vite-plugin-pwa@2.0.0, @vitejs/plugin-react@6.3.0, @tailwindcss/vite, vite, vite-plugin-pwa, @vitejs/plugin-react

### Community 30 - "animalKit.ts"
Cohesion: 0.10
Nodes (26): advanceAnimalTime(), AnimalIdle, AnimalKind, AnimalLodSpec, AnimalMember, AnimalPose, AnimalScaffold, AnimalScaffoldSpec (+18 more)

### Community 31 - "scripts"
Cohesion: 0.17
Nodes (12): scripts, build, dev, format, format:check, lint, preview, qa:capture (+4 more)

### Community 32 - ".frame"
Cohesion: 0.12
Nodes (4): updateWetSurfaces(), updateBounceLightMood(), updateRimLight(), MiniaturePass

### Community 33 - "with"
Cohesion: 0.11
Nodes (17): jobs, verify, name, on, pull_request, push, branches, name (+9 more)

### Community 34 - "globalIllumination.ts"
Cohesion: 0.24
Nodes (9): attachEquirect(), buildProbeData(), Equirect, HORIZ_DIRS, installGI(), probeGrid, probeOrigin, probeSize (+1 more)

### Community 36 - "applyDioramaUpgrade"
Cohesion: 0.14
Nodes (15): addEdgeWaterfall(), addSoaringBirds(), addTreeRing(), applyDioramaUpgrade(), buildSpatialSources(), getSiteProfile(), hasSiteProfile(), keyAngle() (+7 more)

### Community 37 - "overrides"
Cohesion: 0.50
Nodes (3): overrides, three, workbox-build>glob

### Community 38 - "capture-contact-sheets.mjs"
Cohesion: 0.11
Nodes (18): CDP, clickAria(), listTargets(), run(), sleep(), acquirePageTarget(), captureHour(), CdpSession (+10 more)

### Community 39 - "windowLights.ts"
Cohesion: 0.22
Nodes (12): bake(), createWindowFacade(), FacadeRecord, facades, hash01(), OCCUPANCY_KEYFRAMES, tmpLit, updateWindowLights() (+4 more)

### Community 40 - "placesClouds.ts"
Cohesion: 0.33
Nodes (5): CloudAssets, CloudPuffInstance, createCloudPuffMesh(), createSliceCloudLayer(), SliceCloudLayer

### Community 41 - "citylit.ts"
Cohesion: 0.18
Nodes (15): bodySlideVariants, CAMERA_PRESETS, CARDINALS, getCategoryMeta(), headerSlideVariants, LandmarkCard(), LandmarkCardProps, nextBearingSummary() (+7 more)

### Community 42 - ".showLandmarkImmediate"
Cohesion: 0.18
Nodes (4): resetSceneDynamicLists(), setContactShadowFade(), EngineCallbacks, PlacesSelectionInfo

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

### Community 50 - "PlacesOverlay.tsx"
Cohesion: 0.21
Nodes (13): @phosphor-icons/react, placeCardCondition(), PlacesOverlay(), PlacesOverlayProps, QUICK_TIMES, WEATHER_MODES, ANIMATED_BY_CONDITION, WeatherIcon() (+5 more)

### Community 51 - "season.ts"
Cohesion: 0.36
Nodes (8): isSpeciesBlooming(), monthToSeasonWeights(), normalizeMonth(), PLANT_SPECIES, PlantSpecies, PlantSpeciesInfo, SeasonWeights, setSeasonMonth()

### Community 52 - "markSharedGeo"
Cohesion: 0.33
Nodes (6): getLampBulbGeo(), getLampConeGeo(), getLampHaloGeo(), getLampHardwareGeo(), getLampPoolGeo(), markSharedGeo()

### Community 54 - "applyDissolveToShader"
Cohesion: 0.25
Nodes (8): windowPaneMaterial(), applyDissolveToShader(), cascadeize(), flagWindy(), installDissolveShader(), interiorParallaxShader(), lights(), wetPuddleShader()

### Community 55 - "windy"
Cohesion: 0.20
Nodes (11): buildTreeGeometry(), buildTreeLodGeometry(), crownGeo(), finalizeTreeBatch(), getGrassMaterial(), mergeTreeParts(), treeGeometry(), treeLodGeometry() (+3 more)

### Community 56 - "nativeHost.ts"
Cohesion: 0.31
Nodes (6): detectNativeHost(), hasCinematicHost(), isHost(), NativeCinematicHost, nativeHostUrl(), Window

### Community 57 - "windParticles.ts"
Cohesion: 0.31
Nodes (8): GlobeController, BIOME_PALETTES, createLeafWispTexture(), createWindParticles(), seeded(), WindParticlesController, WindParticlesUpdateOptions, QualityIndex

### Community 58 - "placesScene.ts"
Cohesion: 0.20
Nodes (14): createPlacesScene(), ExplorerInfo, HERO_CAM, HERO_TARGET, createPlacesShaderEnv(), createPlacesVolumetricFogLayer(), createPlacesWeatherParticles(), createSliceCloudMaterial() (+6 more)

### Community 59 - "addLampWaterReflections"
Cohesion: 0.40
Nodes (5): addLampWaterReflections(), addWetRoadStreaks(), getLampReflectionGeo(), getLampReflectionMat(), getWetRoadMat()

### Community 61 - "addCraftedRim"
Cohesion: 0.60
Nodes (5): addCraftedRim(), addSquareRim(), getRimMaterial(), paintRadial(), paintStrata()

### Community 62 - "addSiteMotion"
Cohesion: 0.50
Nodes (4): addSiteMotion(), addWeatherFx(), stream(), normalMapsActive()

## Knowledge Gaps
- **11 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `three` connect `globeScene.ts` to `landmarksB.ts`, `albedoAudit.ts`, `citylit.ts`, `primitives.ts`, `placesSliceBuilders.ts`, `placesShaders.ts`, `dioramaKit.ts`, `CitylitEngine.ts`, `osmSlice.ts`, `shaders.ts`, `package.json`, `dependencies`, `AmbientAudioController`, `.frame`, `animalKit.ts`, `globalIllumination.ts`, `windowLights.ts`, `placesClouds.ts`, `vehicleLightKit.ts`, `placesInteriors.ts`, `windParticles.ts`, `placesScene.ts`?**
  _High betweenness centrality (0.156) - this node is a cross-community bridge._
- **Should `landmarksB.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.11666666666666667 - nodes in this community are weakly interconnected._
- **Why does `CitylitEngine` connect `CitylitEngine` to `.frame`, `albedoAudit.ts`, `citylit.ts`, `.isStudio`, `App.tsx`, `citylit.ts`, `CitylitEngine.ts`, `.showLandmarkImmediate`, `TopBar.tsx`, `contact-sheet.ts`, `ambientAudio.ts`, `osmSlice.ts`, `windy`, `AmbientAudioController`, `windParticles.ts`, `.frame`, `animalKit.ts`?**
  _High betweenness centrality (0.099) - this node is a cross-community bridge._
- **Should `albedoAudit.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05200341005967604 - nodes in this community are weakly interconnected._
- **Why does `AmbientAudioController` connect `AmbientAudioController` to `ambientAudio.ts`?**
  _High betweenness centrality (0.031) - this node is a cross-community bridge._
- **Should `citylit.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.11954022988505747 - nodes in this community are weakly interconnected._
- **Should `primitives.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.044444444444444446 - nodes in this community are weakly interconnected._