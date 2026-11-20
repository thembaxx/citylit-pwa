import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {
  createPlacesShaderEnv,
  createPlacesVolumetricFogLayer,
  createPlacesWeatherParticles,
  createSliceCloudMaterial,
  createStrataTerrainMaterial,
} from './placesShaders';
import {
  buildPlaceSlice,
  createSliceSharedAssets,
  PLACE_SLICE_SPECS,
  type BuiltPlaceSlice,
  type PlaceSliceSpec,
} from './placesSliceBuilders';
import { getSoftTexture, WU } from './shaders';
import type { OsmPlaceData } from '../services/osmService';
import { createOsmSlice } from './osmSlice';

export type PlacesWeatherMode = 'auto' | 'rain' | 'snow' | 'fog';

export interface ExplorerInfo {
  label: string;
  detail: string;
  stats: { buildings: number; roads: number; water: number; green: number; elevation: number };
}

export interface PlacesSelectionInfo {
  sliceIndex: number;
  landmarkIndex: number;
  province: string;
  subtitle: string;
  /** Present for on-demand coordinate slices (landmarkIndex is -1). */
  explorer?: ExplorerInfo;
}

export interface PlacesController {
  group: THREE.Group;
  camera: THREE.PerspectiveCamera;
  controls: OrbitControls;
  isOpen: boolean;
  slices: BuiltPlaceSlice[];
  /** Generate and select a diorama slice from an OSM patch; replaces the previous explorer slice. */
  addOsmSlice: (data: OsmPlaceData) => PlacesSelectionInfo;
  removeOsmSlice: () => void;
  open: (visited: Set<number>, province?: string, activeLandmarkIndex?: number) => void;
  close: () => void;
  flyToProvince: (provinceName: string) => void;
  selectSlice: (sliceIndex: number, focusCamera?: boolean) => void;
  stepSlice: (dir: 1 | -1, provinceName: string) => PlacesSelectionInfo;
  refreshVisited: (visited: Set<number>) => void;
  hoverAt: (ndcX: number, ndcY: number) => number | null;
  pickAt: (ndcX: number, ndcY: number) => PlacesSelectionInfo | null;
  getSelectedInfo: () => PlacesSelectionInfo;
  zoomBy: (factor: number) => void;
  resetOverview: () => void;
  setWeatherMode: (mode: PlacesWeatherMode) => void;
  getWeatherMode: () => PlacesWeatherMode;
  update: (
    dt: number,
    elapsed: number,
    motionScale: number,
    keyLight: THREE.DirectionalLight,
    fog: THREE.Fog | THREE.FogExp2 | null,
    weatherState?: { rain: number; wind: number; cover: number; night: number },
    pixelRatio?: number
  ) => void;
  setAspect: (aspect: number) => void;
  dispose: () => void;
}

const HERO_TARGET = new THREE.Vector3(0, 0.72, 0);
const HERO_CAM = new THREE.Vector3(4.9, 3.6, 5.5);

export function createPlacesScene(
  rendererDom: HTMLElement,
  initialAspect: number,
  isSoftwareGl: boolean
): PlacesController {
  const camera = new THREE.PerspectiveCamera(38, initialAspect, 0.25, 95);
  camera.position.copy(HERO_CAM);

  const controls = new OrbitControls(camera, rendererDom);
  controls.enableDamping = !isSoftwareGl;
  controls.dampingFactor = 0.065;
  controls.enablePan = true;
  controls.screenSpacePanning = false;
  controls.panSpeed = 0.65;
  controls.rotateSpeed = 0.68;
  controls.zoomSpeed = 0.95;
  controls.minDistance = 3.2;
  controls.maxDistance = 13.5;
  controls.minPolarAngle = 0.22;
  controls.maxPolarAngle = Math.PI * 0.485;
  controls.target.copy(HERO_TARGET);
  controls.enabled = false;

  const group = new THREE.Group();
  group.name = 'places-single-stage';
  group.visible = false;

  const env = createPlacesShaderEnv();
  const terrainMat = createStrataTerrainMaterial(env);
  const cloudMat = createSliceCloudMaterial(env);
  const shared = createSliceSharedAssets(env, terrainMat, cloudMat);

  // Compact single-slice cartographic stage base (soft ground contact + compass rings)
  const cartoGroup = new THREE.Group();
  cartoGroup.position.set(0, -0.06, 0);
  group.add(cartoGroup);

  const shadowDiscGeo = new THREE.PlaneGeometry(5.6, 5.6);
  shadowDiscGeo.rotateX(-Math.PI / 2);
  const shadowDiscMat = new THREE.MeshBasicMaterial({
    map: getSoftTexture(),
    color: '#050811',
    transparent: true,
    opacity: 0.34,
    depthWrite: false,
  });
  const shadowDisc = new THREE.Mesh(shadowDiscGeo, shadowDiscMat);
  shadowDisc.position.y = -0.02;
  shadowDisc.renderOrder = 0;
  shadowDisc.userData.noShadow = true;
  shadowDisc.userData.cannotReceiveAO = true;
  cartoGroup.add(shadowDisc);

  const ringGeo = new THREE.RingGeometry(2.42, 2.47, 96);
  ringGeo.rotateX(-Math.PI / 2);
  const ringMat = new THREE.MeshBasicMaterial({
    color: '#e8b04a',
    transparent: true,
    opacity: 0.28,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const outerRing = new THREE.Mesh(ringGeo, ringMat);
  outerRing.position.y = 0.005;
  outerRing.renderOrder = 1;
  outerRing.userData.noShadow = true;
  outerRing.userData.cannotReceiveAO = true;
  cartoGroup.add(outerRing);

  const innerRingGeo = new THREE.RingGeometry(1.94, 1.97, 96);
  innerRingGeo.rotateX(-Math.PI / 2);
  const innerRingMat = new THREE.MeshBasicMaterial({
    color: '#88a4cc',
    transparent: true,
    opacity: 0.16,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const innerRing = new THREE.Mesh(innerRingGeo, innerRingMat);
  innerRing.position.y = 0.002;
  innerRing.renderOrder = 1;
  innerRing.userData.noShadow = true;
  innerRing.userData.cannotReceiveAO = true;
  cartoGroup.add(innerRing);

  // Build all 24 sculpted isometric geological slices centered at (0, 0, 0); only 1 is visible at a time
  const slices: BuiltPlaceSlice[] = PLACE_SLICE_SPECS.map((spec, idx) => {
    const built = buildPlaceSlice(spec, shared, idx);
    built.root.position.set(0, 0, 0);
    built.root.visible = false;
    built.root.traverse((obj) => {
      if (obj instanceof THREE.Mesh && obj !== built.hitBox && obj !== built.ringMesh) {
        const mat = Array.isArray(obj.material) ? obj.material[0] : obj.material;
        const isCloud = obj.parent?.parent === built.cloudGroup;
        if (!isCloud && mat && !mat.transparent) {
          obj.castShadow = !isSoftwareGl;
          obj.receiveShadow = !isSoftwareGl;
        }
      }
    });
    group.add(built.root);
    return built;
  });

  // Non-intersecting lower base mist halo + GPU localized/stage weather particles
  const volumetricFogLayer = createPlacesVolumetricFogLayer(env);
  group.add(volumetricFogLayer.mesh);

  const weatherParticles = createPlacesWeatherParticles(PLACE_SLICE_SPECS, env);
  group.add(weatherParticles.points);

  let isOpen = false;
  let selectedSliceIndex = 0;
  let osmSliceIndex: number | null = null;
  let hoveredSliceIndex: number | null = null;
  let visitedSet = new Set<number>();
  let weatherMode: PlacesWeatherMode = 'auto';

  let flyGoalCam: THREE.Vector3 | null = null;
  let flyGoalTarget: THREE.Vector3 | null = null;
  const raycaster = new THREE.Raycaster();
  const pointerVec = new THREE.Vector2();
  const cloudNightTmp = new THREE.Color('#28344d');
  const cloudWarmTmp = new THREE.Color('#ffd3a6');
  const fogBaseTmp = new THREE.Color('#243044');
  const fogDeepTmp = new THREE.Color('#131b2b');
  const fogMistTintTmp = new THREE.Color('#42556d');
  const fogSnowTintTmp = new THREE.Color('#4f647e');
  const fogRainTintTmp = new THREE.Color('#2c3a4c');
  const fogNightTintTmp = new THREE.Color('#0c1322');

  const onControlsStart = () => {
    flyGoalCam = null;
    flyGoalTarget = null;
  };
  controls.addEventListener('start', onControlsStart);

  const sliceMatchesProvince = (spec: PlaceSliceSpec, prov: string) =>
    prov === 'All' || spec.province === prov;

  const showActiveSlice = (nextIndex: number, animateEntrance: boolean) => {
    if (nextIndex < 0 || nextIndex >= slices.length) return;
    selectedSliceIndex = nextIndex;
    env.activeSliceIndex.value = nextIndex;
    hoveredSliceIndex = null;
    for (let i = 0; i < slices.length; i++) {
      const s = slices[i];
      const active = i === nextIndex;
      s.root.visible = active;
      if (active) {
        s.root.position.set(0, 0, 0);
        s.root.scale.setScalar(animateEntrance ? 0.95 : 1.0);
      }
    }
  };

  const getSelectedInfo = (): PlacesSelectionInfo => {
    const s = slices[selectedSliceIndex] ?? slices[0];
    return {
      sliceIndex: selectedSliceIndex,
      landmarkIndex: s.spec.landmarkIndex,
      province: s.spec.province,
      subtitle: s.spec.subtitle,
      explorer:
        s.spec.landmarkIndex < 0
          ? {
              label: 'Coordinate Explorer',
              detail: s.spec.subtitle,
              stats: (s.root.userData.osmStats ?? {
                buildings: 0,
                roads: 0,
                water: 0,
                green: 0,
                elevation: 0,
              }) as ExplorerInfo['stats'],
            }
          : undefined,
    };
  };

  const removeOsmSlice = () => {
    if (osmSliceIndex === null) return;
    const removed = slices.splice(osmSliceIndex, 1)[0];
    group.remove(removed.root);
    removed.root.traverse((obj) => {
      if (obj instanceof THREE.Mesh && obj !== removed.hitBox && obj !== removed.ringMesh) {
        const mat = Array.isArray(obj.material) ? obj.material[0] : obj.material;
        if (mat && 'dispose' in mat) mat.dispose();
      }
    });
    removed.dispose();
    if (selectedSliceIndex >= slices.length) selectedSliceIndex = slices.length - 1;
    osmSliceIndex = null;
  };

  const addOsmSlice = (data: OsmPlaceData): PlacesSelectionInfo => {
    removeOsmSlice();
    const { built } = createOsmSlice(shared, data, slices.length);
    built.root.position.set(0, 0, 0);
    built.root.visible = false;
    built.root.traverse((obj) => {
      if (obj instanceof THREE.Mesh && obj !== built.hitBox && obj !== built.ringMesh) {
        const mat = Array.isArray(obj.material) ? obj.material[0] : obj.material;
        if (mat && !mat.transparent && !('isShaderMaterial' in mat)) {
          obj.castShadow = !isSoftwareGl;
          obj.receiveShadow = !isSoftwareGl;
        }
      }
    });
    group.add(built.root);
    slices.push(built);
    osmSliceIndex = slices.length - 1;
    selectSlice(osmSliceIndex, false);
    return getSelectedInfo();
  };

  const selectSlice = (sliceIndex: number, focusCamera = true) => {
    if (sliceIndex < 0 || sliceIndex >= slices.length) return;
    const changed = sliceIndex !== selectedSliceIndex;
    showActiveSlice(sliceIndex, changed);
    if (focusCamera) {
      flyGoalTarget = HERO_TARGET.clone();
      flyGoalCam = HERO_CAM.clone();
    }
  };

  const flyToProvince = (provinceName: string) => {
    if (provinceName === 'All') {
      flyGoalTarget = HERO_TARGET.clone();
      flyGoalCam = HERO_CAM.clone();
      return;
    }
    const matching = slices.filter((s) => s.spec.province === provinceName);
    if (matching.length > 0) {
      if (!sliceMatchesProvince(slices[selectedSliceIndex].spec, provinceName)) {
        const nextIdx = slices.indexOf(matching[0]);
        showActiveSlice(nextIdx, true);
      }
      flyGoalTarget = HERO_TARGET.clone();
      flyGoalCam = HERO_CAM.clone();
    }
  };

  const stepSlice = (dir: 1 | -1, provinceName: string): PlacesSelectionInfo => {
    const pool = slices
      .map((s, idx) => ({ s, idx }))
      .filter((entry) => sliceMatchesProvince(entry.s.spec, provinceName));
    const list = pool.length > 0 ? pool : slices.map((s, idx) => ({ s, idx }));
    const curPos = list.findIndex((e) => e.idx === selectedSliceIndex);
    const nextPos =
      curPos >= 0 ? (curPos + dir + list.length) % list.length : dir > 0 ? 0 : list.length - 1;
    showActiveSlice(list[nextPos].idx, true);
    return getSelectedInfo();
  };

  const refreshVisited = (visited: Set<number>) => {
    visitedSet = visited;
  };

  const open = (visited: Set<number>, province = 'All', activeLandmarkIndex?: number) => {
    isOpen = true;
    controller.isOpen = true;
    group.visible = true;
    controls.enabled = true;
    visitedSet = visited;

    if (activeLandmarkIndex !== undefined) {
      const matchIdx = slices.findIndex((s) => s.spec.landmarkIndex === activeLandmarkIndex);
      if (matchIdx >= 0) selectedSliceIndex = matchIdx;
    }

    if (province !== 'All' && !sliceMatchesProvince(slices[selectedSliceIndex].spec, province)) {
      const firstMatch = slices.findIndex((s) => s.spec.province === province);
      if (firstMatch >= 0) selectedSliceIndex = firstMatch;
    }

    showActiveSlice(selectedSliceIndex, false);
    camera.position.copy(HERO_CAM);
    controls.target.copy(HERO_TARGET);
    flyGoalCam = null;
    flyGoalTarget = null;
    controls.update();
  };

  const close = () => {
    isOpen = false;
    controller.isOpen = false;
    group.visible = false;
    controls.enabled = false;
    hoveredSliceIndex = null;
    flyGoalCam = null;
    flyGoalTarget = null;
  };

  const resetOverview = () => {
    flyGoalTarget = HERO_TARGET.clone();
    flyGoalCam = HERO_CAM.clone();
  };

  const setWeatherMode = (mode: PlacesWeatherMode) => {
    weatherMode = mode;
  };

  const getWeatherMode = () => weatherMode;

  const hoverAt = (ndcX: number, ndcY: number): number | null => {
    if (!isOpen) return null;
    const activeSlice = slices[selectedSliceIndex];
    if (!activeSlice) return null;
    pointerVec.set(ndcX, ndcY);
    raycaster.setFromCamera(pointerVec, camera);
    const hits = raycaster.intersectObject(activeSlice.hitBox, false);
    if (!hits.length) {
      hoveredSliceIndex = null;
      return null;
    }
    hoveredSliceIndex = selectedSliceIndex;
    return hoveredSliceIndex;
  };

  const pickAt = (ndcX: number, ndcY: number): PlacesSelectionInfo | null => {
    if (!isOpen) return null;
    const activeSlice = slices[selectedSliceIndex];
    if (!activeSlice) return null;
    pointerVec.set(ndcX, ndcY);
    raycaster.setFromCamera(pointerVec, camera);
    const hits = raycaster.intersectObject(activeSlice.hitBox, false);
    if (!hits.length) return null;
    return getSelectedInfo();
  };

  const zoomBy = (factor: number) => {
    if (!isOpen) return;
    flyGoalCam = null;
    flyGoalTarget = null;
    const offset = camera.position.clone().sub(controls.target);
    const nextLen = Math.max(
      controls.minDistance,
      Math.min(controls.maxDistance, offset.length() * factor)
    );
    offset.setLength(nextLen);
    camera.position.copy(controls.target).add(offset);
    controls.update();
  };

  const update: PlacesController['update'] = (
    dt,
    elapsed,
    motionScale,
    keyLight,
    fog,
    weatherState,
    pixelRatio = 1
  ) => {
    if (!isOpen) return;

    // Smooth camera reset / focus fly interpolation
    if (flyGoalCam && flyGoalTarget) {
      const k = motionScale === 0 ? 1 : 1 - Math.exp(-dt * 5.0);
      camera.position.lerp(flyGoalCam, k);
      controls.target.lerp(flyGoalTarget, k);
      if (
        camera.position.distanceTo(flyGoalCam) < 0.03 &&
        controls.target.distanceTo(flyGoalTarget) < 0.03
      ) {
        flyGoalCam = null;
        flyGoalTarget = null;
      }
    }

    // Keep pan tightly bounded around the single centered slice
    controls.target.x = Math.max(-1.8, Math.min(1.8, controls.target.x));
    controls.target.z = Math.max(-1.8, Math.min(1.8, controls.target.z));
    controls.target.y = Math.max(0.2, Math.min(2.0, controls.target.y));
    controls.update();

    // Update volumetric fog lens & weather particle intensities
    const camDist = camera.position.distanceTo(controls.target);
    env.camDist.value = camDist;
    env.focusPos.value.copy(HERO_TARGET);
    env.focusClear.value = THREE.MathUtils.clamp((11.5 - camDist) / 6.5, 0.2, 1.0);
    env.pixelRatio.value = pixelRatio;
    env.activeSliceIndex.value = selectedSliceIndex;

    const liveRain = weatherState?.rain ?? WU.rain.value;
    const liveWind = weatherState?.wind ?? WU.wind.value;
    const liveCover = weatherState?.cover ?? 0.25;
    const liveNight = weatherState?.night ?? 0;

    let targetRain = liveRain;
    let targetSnow = 0;
    let targetWind = Math.max(0.45, liveWind);
    let targetFogDensity = 0.0115 + liveRain * 0.009 + liveCover * 0.004;
    let targetAlpineSnow = 0.25 + liveCover * 0.26;

    if (weatherMode === 'rain') {
      targetRain = Math.max(liveRain, 0.92);
      targetSnow = 0;
      targetWind = Math.max(liveWind, 1.48);
      targetFogDensity = 0.021;
      targetAlpineSnow = 0.0;
    } else if (weatherMode === 'snow') {
      targetRain = 0;
      targetSnow = 0.98;
      targetWind = Math.max(liveWind, 1.15);
      targetFogDensity = 0.018;
      targetAlpineSnow = 1.0;
    } else if (weatherMode === 'fog') {
      targetRain = liveRain * 0.35;
      targetSnow = 0;
      targetWind = Math.max(0.45, liveWind * 0.85);
      targetFogDensity = 0.03;
      targetAlpineSnow = 0.18;
    }

    const weatherLerp = 1 - Math.exp(-dt * 5.0);
    env.rainIntensity.value += (targetRain - env.rainIntensity.value) * weatherLerp;
    env.snowIntensity.value += (targetSnow - env.snowIntensity.value) * weatherLerp;
    env.windStrength.value += (targetWind - env.windStrength.value) * weatherLerp;
    env.volFogDensity.value += (targetFogDensity - env.volFogDensity.value) * weatherLerp;
    env.alpineAmbientSnow.value += (targetAlpineSnow - env.alpineAmbientSnow.value) * weatherLerp;

    // Keep water, volumetric fog & cloud GLSL shader uniforms locked to live sky/weather
    env.sunDir.value.copy(keyLight.position).normalize();
    env.sunColor.value.copy(keyLight.color);
    if (fog instanceof THREE.FogExp2) {
      fogBaseTmp.copy(fog.color);
      env.fogDensity.value = fog.density;
    } else if (fog instanceof THREE.Fog) {
      fogBaseTmp.copy(fog.color);
      env.fogDensity.value = 0.009;
    } else {
      fogBaseTmp.set('#243044');
      env.fogDensity.value = 0.009;
    }

    if (weatherMode === 'fog') {
      fogBaseTmp.lerp(fogMistTintTmp, (1 - liveNight * 0.72) * 0.58);
    } else if (weatherMode === 'snow') {
      fogBaseTmp.lerp(fogSnowTintTmp, (1 - liveNight * 0.72) * 0.52);
    } else if (weatherMode === 'rain') {
      fogBaseTmp.lerp(fogRainTintTmp, (1 - liveNight * 0.65) * 0.45);
    }

    env.fogColor.value.copy(fogBaseTmp);
    fogDeepTmp
      .copy(fogBaseTmp)
      .multiplyScalar(0.62)
      .lerp(fogNightTintTmp, liveNight * 0.45);
    env.volFogDeepColor.value.copy(fogDeepTmp);

    const litStrength = WU.lit.value;
    const cloudTint = cloudMat.uniforms.uTint.value as THREE.Color;
    cloudTint
      .set('#f8fbff')
      .lerp(cloudWarmTmp, (1 - WU.sun.value) * 0.45)
      .lerp(cloudNightTmp, Math.max(0, litStrength - 0.15) * 0.72);

    // Update only the single active visible slice
    const s = slices[selectedSliceIndex];
    if (!s) return;

    const animTime = elapsed * motionScale;
    const scaleK = motionScale === 0 ? 1 : 1 - Math.exp(-dt * 12.0);
    const nextScale = s.root.scale.x + (1.0 - s.root.scale.x) * scaleK;
    s.root.scale.setScalar(nextScale);

    const isVisited = visitedSet.has(s.spec.landmarkIndex);
    const isHovered = hoveredSliceIndex === selectedSliceIndex;
    const rimMat = s.ringMesh.material as THREE.MeshStandardMaterial;
    if (isHovered || isVisited) {
      s.ringMesh.visible = true;
      rimMat.color.set(isHovered ? '#ffd784' : '#7dffb0');
      rimMat.emissive.copy(rimMat.color);
      rimMat.opacity = isHovered ? 0.72 : 0.42;
      rimMat.emissiveIntensity = isHovered ? 0.6 : 0.35;
    } else {
      s.ringMesh.visible = true;
      rimMat.color.set('#e8b04a');
      rimMat.emissive.set('#e8b04a');
      rimMat.opacity = 0.55;
      rimMat.emissiveIntensity = 0.45;
    }

    s.tick?.(animTime, litStrength);
  };

  const setAspect = (aspect: number) => {
    camera.aspect = aspect;
    camera.updateProjectionMatrix();
  };

  const dispose = () => {
    controls.removeEventListener('start', onControlsStart);
    controls.dispose();
    slices.forEach((s) => s.dispose());
    volumetricFogLayer.dispose();
    weatherParticles.dispose();
    shared.dispose();
    terrainMat.dispose();
    cloudMat.dispose();
    shadowDiscGeo.dispose();
    shadowDiscMat.dispose();
    ringGeo.dispose();
    ringMat.dispose();
    innerRingGeo.dispose();
    innerRingMat.dispose();
  };

  const controller: PlacesController = {
    group,
    camera,
    controls,
    isOpen,
    slices,
    addOsmSlice,
    removeOsmSlice,
    open,
    close,
    flyToProvince,
    selectSlice,
    stepSlice,
    refreshVisited,
    hoverAt,
    pickAt,
    getSelectedInfo,
    zoomBy,
    resetOverview,
    setWeatherMode,
    getWeatherMode,
    update,
    setAspect,
    dispose,
  };

  return controller;
}
