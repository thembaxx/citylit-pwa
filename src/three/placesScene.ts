import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {
  createPlacesShaderEnv,
  createPlacesVolumetricFogLayer,
  createPlacesWeatherParticles,
  createSliceCloudMaterial,
  createStrataTerrainMaterial,
  PLACES_VOLUMETRIC_FOG_GLSL,
} from './placesShaders';
import {
  buildPlaceSlice,
  createSliceSharedAssets,
  PLACE_SLICE_SPECS,
  type BuiltPlaceSlice,
  type PlaceSliceSpec,
} from './placesSliceBuilders';
import { WU } from './shaders';

export type PlacesWeatherMode = 'auto' | 'rain' | 'snow' | 'fog';

export interface PlacesSelectionInfo {
  sliceIndex: number;
  landmarkIndex: number;
  province: string;
  subtitle: string;
}

export interface PlacesController {
  group: THREE.Group;
  camera: THREE.PerspectiveCamera;
  controls: OrbitControls;
  isOpen: boolean;
  slices: BuiltPlaceSlice[];
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

const OVERVIEW_TARGET = new THREE.Vector3(1.2, 0.4, 1.5);
const OVERVIEW_CAM = new THREE.Vector3(21.5, 25.0, 31.5);

export function createPlacesScene(
  rendererDom: HTMLElement,
  initialAspect: number,
  isSoftwareGl: boolean
): PlacesController {
  const camera = new THREE.PerspectiveCamera(40, initialAspect, 0.2, 240);
  camera.position.copy(OVERVIEW_CAM);

  const controls = new OrbitControls(camera, rendererDom);
  controls.enableDamping = !isSoftwareGl;
  controls.dampingFactor = 0.065;
  controls.enablePan = true;
  controls.screenSpacePanning = false;
  controls.panSpeed = 0.9;
  controls.rotateSpeed = 0.68;
  controls.zoomSpeed = 0.98;
  controls.minDistance = 3.8;
  controls.maxDistance = 56;
  controls.minPolarAngle = 0.28;
  controls.maxPolarAngle = 1.18;
  controls.target.copy(OVERVIEW_TARGET);
  controls.enabled = false;

  const group = new THREE.Group();
  group.name = 'places-archipelago';
  group.visible = false;

  const env = createPlacesShaderEnv();
  const terrainMat = createStrataTerrainMaterial(env);
  const cloudMat = createSliceCloudMaterial(env);
  const shared = createSliceSharedAssets(env, terrainMat, cloudMat);

  // Subtle floating cartographic brass compass ring & latitude/longitude lines underneath
  const cartoGroup = new THREE.Group();
  cartoGroup.position.set(1.2, -0.22, 1.4);
  group.add(cartoGroup);

  const ringGeo = new THREE.RingGeometry(22.4, 22.58, 112);
  ringGeo.rotateX(-Math.PI / 2);
  const ringMat = new THREE.MeshBasicMaterial({
    color: '#e8b04a',
    transparent: true,
    opacity: 0.24,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  cartoGroup.add(new THREE.Mesh(ringGeo, ringMat));

  const innerRingGeo = new THREE.RingGeometry(14.8, 14.9, 96);
  innerRingGeo.rotateX(-Math.PI / 2);
  const innerRingMat = new THREE.MeshBasicMaterial({
    color: '#88a4cc',
    transparent: true,
    opacity: 0.12,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  cartoGroup.add(new THREE.Mesh(innerRingGeo, innerRingMat));

  const gridVerts: number[] = [];
  for (let gx = -24; gx <= 24; gx += 4) {
    gridVerts.push(gx, 0, -18, gx, 0, 18);
  }
  for (let gz = -18; gz <= 18; gz += 4) {
    gridVerts.push(-24, 0, gz, 24, 0, gz);
  }
  const gridGeo = new THREE.BufferGeometry().setAttribute(
    'position',
    new THREE.Float32BufferAttribute(gridVerts, 3)
  );
  const gridMat = new THREE.LineBasicMaterial({
    color: '#88a4cc',
    transparent: true,
    opacity: 0.12,
  });
  cartoGroup.add(new THREE.LineSegments(gridGeo, gridMat));

  // Atmospheric studio floor integrated with volumetric horizon haze
  const backdropGeo = new THREE.CircleGeometry(108, 64);
  backdropGeo.rotateX(-Math.PI / 2);
  const backdropMat = new THREE.ShaderMaterial({
    depthWrite: false,
    uniforms: {
      uSky: WU.sky,
      uSun: WU.sun,
      uLit: WU.lit,
      uVolSunDir: env.sunDir,
      uVolSunColor: env.sunColor,
      uVolFogColor: env.fogColor,
      uVolFogDeepColor: env.volFogDeepColor,
      uVolFogDensity: env.volFogDensity,
      uVolFocusPos: env.focusPos,
      uVolFocusClear: env.focusClear,
      uVolCamDist: env.camDist,
      uVolSun: WU.sun,
      uVolTime: WU.t,
    },
    vertexShader: `
varying vec2 vPos;
varying vec3 vWorldPos;
void main() {
  vPos = position.xz;
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vWorldPos = wp.xyz;
  gl_Position = projectionMatrix * viewMatrix * wp;
}`,
    fragmentShader: `
uniform vec3 uSky;
uniform float uSun;
uniform float uLit;
varying vec2 vPos;
varying vec3 vWorldPos;
${PLACES_VOLUMETRIC_FOG_GLSL}

void main() {
  float d = clamp(length(vPos) / 72.0, 0.0, 1.0);
  vec3 dayCenter = mix(vec3(0.11, 0.15, 0.22), uSky * 0.42 + vec3(0.06, 0.08, 0.12), 0.55);
  vec3 duskCenter = vec3(0.14, 0.10, 0.16);
  vec3 nightCenter = vec3(0.04, 0.05, 0.09);
  vec3 centerCol = mix(dayCenter, duskCenter, clamp((1.0 - uSun) * (1.0 - uLit), 0.0, 1.0));
  centerCol = mix(centerCol, nightCenter, clamp(uLit, 0.0, 1.0));
  vec3 edgeCol = centerCol * 0.48;
  vec3 col = mix(centerCol, edgeCol, pow(d, 0.85));
  col = plApplyVolumetricFog(col, vWorldPos);
  gl_FragColor = vec4(col, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`,
  });
  const backdropMesh = new THREE.Mesh(backdropGeo, backdropMat);
  backdropMesh.position.y = -0.38;
  group.add(backdropMesh);

  // Build all 24 sculpted isometric geological slice islands
  const slices: BuiltPlaceSlice[] = PLACE_SLICE_SPECS.map((spec, idx) => {
    const built = buildPlaceSlice(spec, shared, idx);
    built.root.traverse((obj) => {
      if (obj instanceof THREE.Mesh && obj !== built.hitBox && obj !== built.ringMesh) {
        if (obj.material === terrainMat) {
          obj.castShadow = !isSoftwareGl;
          obj.receiveShadow = !isSoftwareGl;
        }
      }
    });
    group.add(built.root);
    return built;
  });

  // Multi-layer drifting volumetric haze + GPU localized/archipelago weather particles
  const volumetricFogLayer = createPlacesVolumetricFogLayer(env);
  group.add(volumetricFogLayer.mesh);

  const weatherParticles = createPlacesWeatherParticles(PLACE_SLICE_SPECS, env);
  group.add(weatherParticles.points);

  const hitBoxes = slices.map((s) => s.hitBox);

  let isOpen = false;
  let activeProvince = 'All';
  let selectedSliceIndex = 0;
  let hoveredSliceIndex: number | null = null;
  let visitedSet = new Set<number>();
  let weatherMode: PlacesWeatherMode = 'auto';

  let flyGoalCam: THREE.Vector3 | null = null;
  let flyGoalTarget: THREE.Vector3 | null = null;
  const flyTargetTmp = new THREE.Vector3();
  const flyCamTmp = new THREE.Vector3();
  const raycaster = new THREE.Raycaster();
  const pointerVec = new THREE.Vector2();
  const cloudTintTmp = new THREE.Color('#ffffff');
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

  const focusCameraOnBounds = (matching: BuiltPlaceSlice[], closeUp: boolean) => {
    if (matching.length === 0) return;
    let cx = 0;
    let cz = 0;
    let minX = Infinity;
    let maxX = -Infinity;
    let minZ = Infinity;
    let maxZ = -Infinity;
    for (const s of matching) {
      const [gx, gz] = s.spec.gridPos;
      cx += gx;
      cz += gz;
      if (gx < minX) minX = gx;
      if (gx > maxX) maxX = gx;
      if (gz < minZ) minZ = gz;
      if (gz > maxZ) maxZ = gz;
    }
    cx /= matching.length;
    cz /= matching.length;

    const span = Math.max(maxX - minX, maxZ - minZ);
    const dist = closeUp ? 5.15 : Math.max(11.0, Math.min(34, span * 1.05 + 8.5));
    flyTargetTmp.set(cx, 0.62, cz);
    flyCamTmp.set(cx + dist * 0.56, dist * 0.66, cz + dist * 0.82);
    flyGoalTarget = flyTargetTmp.clone();
    flyGoalCam = flyCamTmp.clone();
  };

  const getSelectedInfo = (): PlacesSelectionInfo => {
    const s = slices[selectedSliceIndex] ?? slices[0];
    return {
      sliceIndex: selectedSliceIndex,
      landmarkIndex: s.spec.landmarkIndex,
      province: s.spec.province,
      subtitle: s.spec.subtitle,
    };
  };

  const selectSlice = (sliceIndex: number, focusCamera = true) => {
    if (sliceIndex < 0 || sliceIndex >= slices.length) return;
    selectedSliceIndex = sliceIndex;
    if (focusCamera) {
      focusCameraOnBounds([slices[sliceIndex]], true);
    }
  };

  const flyToProvince = (provinceName: string) => {
    activeProvince = provinceName;
    if (provinceName === 'All') {
      flyGoalTarget = OVERVIEW_TARGET.clone();
      flyGoalCam = OVERVIEW_CAM.clone();
      return;
    }
    const matching = slices.filter((s) => s.spec.province === provinceName);
    if (matching.length > 0) {
      if (!sliceMatchesProvince(slices[selectedSliceIndex].spec, provinceName)) {
        selectedSliceIndex = slices.indexOf(matching[0]);
      }
      focusCameraOnBounds(matching, matching.length === 1);
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
    selectSlice(list[nextPos].idx, true);
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
    activeProvince = province;

    if (activeLandmarkIndex !== undefined) {
      const matchIdx = slices.findIndex((s) => s.spec.landmarkIndex === activeLandmarkIndex);
      if (matchIdx >= 0) selectedSliceIndex = matchIdx;
    }

    if (province !== 'All') {
      flyToProvince(province);
    } else {
      camera.position.copy(OVERVIEW_CAM);
      controls.target.copy(OVERVIEW_TARGET);
      flyGoalCam = null;
      flyGoalTarget = null;
    }
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
    activeProvince = 'All';
    flyGoalTarget = OVERVIEW_TARGET.clone();
    flyGoalCam = OVERVIEW_CAM.clone();
  };

  const setWeatherMode = (mode: PlacesWeatherMode) => {
    weatherMode = mode;
  };

  const getWeatherMode = () => weatherMode;

  const hoverAt = (ndcX: number, ndcY: number): number | null => {
    if (!isOpen) return null;
    pointerVec.set(ndcX, ndcY);
    raycaster.setFromCamera(pointerVec, camera);
    const hits = raycaster.intersectObjects(hitBoxes, false);
    if (!hits.length) {
      hoveredSliceIndex = null;
      return null;
    }
    const idx = hits[0].object.userData.sliceIndex as number | undefined;
    hoveredSliceIndex = typeof idx === 'number' ? idx : null;
    return hoveredSliceIndex;
  };

  const pickAt = (ndcX: number, ndcY: number): PlacesSelectionInfo | null => {
    if (!isOpen) return null;
    pointerVec.set(ndcX, ndcY);
    raycaster.setFromCamera(pointerVec, camera);
    const hits = raycaster.intersectObjects(hitBoxes, false);
    if (!hits.length) return null;
    const idx = hits[0].object.userData.sliceIndex as number | undefined;
    if (typeof idx !== 'number') return null;
    selectSlice(idx, true);
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

    // Smooth camera fly interpolation
    if (flyGoalCam && flyGoalTarget) {
      const k = 1 - Math.exp(-dt * 4.5);
      camera.position.lerp(flyGoalCam, k);
      controls.target.lerp(flyGoalTarget, k);
      if (
        camera.position.distanceTo(flyGoalCam) < 0.04 &&
        controls.target.distanceTo(flyGoalTarget) < 0.04
      ) {
        flyGoalCam = null;
        flyGoalTarget = null;
      }
    }

    // Clamp manual pan within wider archipelago bounds
    controls.target.x = Math.max(-22.0, Math.min(22.0, controls.target.x));
    controls.target.z = Math.max(-16.5, Math.min(17.5, controls.target.z));
    controls.target.y = Math.max(0.1, Math.min(2.4, controls.target.y));
    controls.update();

    // Compute volumetric fog focus lens, depth haze, and weather particle intensities
    const camDist = camera.position.distanceTo(controls.target);
    env.camDist.value = camDist;
    env.focusPos.value.copy(controls.target);
    env.focusClear.value = THREE.MathUtils.clamp((16.0 - camDist) / 11.0, 0.08, 1.0);
    env.pixelRatio.value = pixelRatio;

    const liveRain = weatherState?.rain ?? WU.rain.value;
    const liveWind = weatherState?.wind ?? WU.wind.value;
    const liveCover = weatherState?.cover ?? 0.25;
    const liveNight = weatherState?.night ?? 0;

    let targetRain = liveRain;
    let targetSnow = 0;
    let targetWind = Math.max(0.45, liveWind);
    let targetFogDensity = 0.0155 + liveRain * 0.011 + liveCover * 0.0055;
    let targetAlpineSnow = 0.22 + liveCover * 0.26;

    if (weatherMode === 'rain') {
      targetRain = Math.max(liveRain, 0.92);
      targetSnow = 0;
      targetWind = Math.max(liveWind, 1.48);
      targetFogDensity = 0.025;
      targetAlpineSnow = 0.0;
    } else if (weatherMode === 'snow') {
      targetRain = 0;
      targetSnow = 0.98;
      targetWind = Math.max(liveWind, 1.15);
      targetFogDensity = 0.022;
      targetAlpineSnow = 1.0;
    } else if (weatherMode === 'fog') {
      targetRain = liveRain * 0.35;
      targetSnow = 0;
      targetWind = Math.max(0.45, liveWind * 0.85);
      targetFogDensity = 0.036;
      targetAlpineSnow = 0.18;
    }

    const weatherLerp = 1 - Math.exp(-dt * 5.0);
    env.rainIntensity.value += (targetRain - env.rainIntensity.value) * weatherLerp;
    env.snowIntensity.value += (targetSnow - env.snowIntensity.value) * weatherLerp;
    env.windStrength.value += (targetWind - env.windStrength.value) * weatherLerp;
    env.volFogDensity.value += (targetFogDensity - env.volFogDensity.value) * weatherLerp;
    env.alpineAmbientSnow.value += (targetAlpineSnow - env.alpineAmbientSnow.value) * weatherLerp;

    // Keep custom water, volumetric fog & cloud GLSL shader uniforms locked to live sky/weather
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
    cloudTintTmp
      .set('#f8fbff')
      .lerp(cloudWarmTmp, (1 - WU.sun.value) * 0.45)
      .lerp(cloudNightTmp, Math.max(0, litStrength - 0.15) * 0.72);
    cloudMat.color.copy(cloudTintTmp);
    cloudMat.opacity =
      0.78 + Math.min(0.18, Math.max(WU.rain.value, env.rainIntensity.value) * 0.15);

    // Update each slice's elevation, golden/emerald rim highlight & micro-animations
    const animTime = elapsed * motionScale;
    const liftK = 1 - Math.exp(-dt * 7.5);
    for (let i = 0; i < slices.length; i++) {
      const s = slices[i];
      const isSelected = i === selectedSliceIndex;
      const isHovered = i === hoveredSliceIndex;
      const isMatch = sliceMatchesProvince(s.spec, activeProvince);
      const isVisited = visitedSet.has(s.spec.landmarkIndex);

      const targetY = isSelected ? 0.28 : isHovered ? 0.15 : isMatch ? 0 : -0.22;
      s.root.position.y += (targetY - s.root.position.y) * liftK;

      const targetScale = isMatch ? (isSelected ? 1.03 : isHovered ? 1.015 : 1.0) : 0.9;
      const curScale = s.root.scale.x + (targetScale - s.root.scale.x) * liftK;
      s.root.scale.setScalar(curScale);

      const rimMat = s.ringMesh.material as THREE.MeshStandardMaterial;
      if (isSelected || isHovered || (isVisited && activeProvince === 'All')) {
        s.ringMesh.visible = true;
        rimMat.color.set(isSelected ? '#e8b04a' : isHovered ? '#ffd784' : '#7dffb0');
        rimMat.emissive.copy(rimMat.color);
        rimMat.opacity = isSelected ? 0.92 : isHovered ? 0.65 : 0.28;
        rimMat.emissiveIntensity = isSelected ? 0.85 : 0.35;
      } else {
        s.ringMesh.visible = false;
      }

      s.tick?.(animTime, litStrength);
    }
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
    ringGeo.dispose();
    ringMat.dispose();
    innerRingGeo.dispose();
    innerRingMat.dispose();
    gridGeo.dispose();
    gridMat.dispose();
    backdropGeo.dispose();
    backdropMat.dispose();
  };

  const controller: PlacesController = {
    group,
    camera,
    controls,
    isOpen,
    slices,
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
