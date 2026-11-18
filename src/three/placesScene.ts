import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {
  createSliceCloudMaterial,
  createStrataTerrainMaterial,
  createPlacesShaderEnv,
} from './placesShaders';
import {
  buildPlaceSlice,
  createSliceSharedAssets,
  PLACE_SLICE_SPECS,
  type BuiltPlaceSlice,
  type PlaceSliceSpec,
} from './placesSliceBuilders';
import { WU } from './shaders';

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
  update: (
    dt: number,
    elapsed: number,
    motionScale: number,
    keyLight: THREE.DirectionalLight,
    fog: THREE.Fog | THREE.FogExp2 | null
  ) => void;
  setAspect: (aspect: number) => void;
  dispose: () => void;
}

const OVERVIEW_TARGET = new THREE.Vector3(0.4, 0.4, 1.2);
const OVERVIEW_CAM = new THREE.Vector3(14.5, 17.5, 21.5);

export function createPlacesScene(
  rendererDom: HTMLElement,
  initialAspect: number,
  isSoftwareGl: boolean
): PlacesController {
  const camera = new THREE.PerspectiveCamera(40, initialAspect, 0.2, 180);
  camera.position.copy(OVERVIEW_CAM);

  const controls = new OrbitControls(camera, rendererDom);
  controls.enableDamping = !isSoftwareGl;
  controls.dampingFactor = 0.065;
  controls.enablePan = true;
  controls.screenSpacePanning = false;
  controls.panSpeed = 0.85;
  controls.rotateSpeed = 0.68;
  controls.zoomSpeed = 0.95;
  controls.minDistance = 4.2;
  controls.maxDistance = 38;
  controls.minPolarAngle = 0.28;
  controls.maxPolarAngle = 1.18;
  controls.target.copy(OVERVIEW_TARGET);
  controls.enabled = false;

  const group = new THREE.Group();
  group.name = 'places-archipelago';
  group.visible = false;

  const env = createPlacesShaderEnv();
  const terrainMat = createStrataTerrainMaterial();
  const cloudMat = createSliceCloudMaterial();
  const shared = createSliceSharedAssets(env, terrainMat, cloudMat);

  // Subtle floating cartographic brass compass ring & latitude/longitude lines underneath
  const cartoGroup = new THREE.Group();
  cartoGroup.position.y = -0.18;
  group.add(cartoGroup);

  const ringGeo = new THREE.RingGeometry(15.6, 15.72, 96);
  ringGeo.rotateX(-Math.PI / 2);
  const ringMat = new THREE.MeshBasicMaterial({
    color: '#e8b04a',
    transparent: true,
    opacity: 0.22,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  cartoGroup.add(new THREE.Mesh(ringGeo, ringMat));

  const gridVerts: number[] = [];
  for (let gx = -16; gx <= 16; gx += 4) {
    gridVerts.push(gx, 0, -12, gx, 0, 12);
  }
  for (let gz = -12; gz <= 12; gz += 4) {
    gridVerts.push(-16, 0, gz, 16, 0, gz);
  }
  const gridGeo = new THREE.BufferGeometry().setAttribute(
    'position',
    new THREE.Float32BufferAttribute(gridVerts, 3)
  );
  const gridMat = new THREE.LineBasicMaterial({
    color: '#88a4cc',
    transparent: true,
    opacity: 0.14,
  });
  cartoGroup.add(new THREE.LineSegments(gridGeo, gridMat));

  // Subtle atmospheric studio table/sea gradient below the floating slice archipelago
  const backdropGeo = new THREE.CircleGeometry(72, 64);
  backdropGeo.rotateX(-Math.PI / 2);
  const backdropMat = new THREE.ShaderMaterial({
    depthWrite: false,
    uniforms: {
      uSky: WU.sky,
      uSun: WU.sun,
      uLit: WU.lit,
    },
    vertexShader: `varying vec2 vPos; void main() { vPos = position.xz; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `
uniform vec3 uSky;
uniform float uSun;
uniform float uLit;
varying vec2 vPos;
void main() {
  float d = clamp(length(vPos) / 48.0, 0.0, 1.0);
  vec3 dayCenter = mix(vec3(0.11, 0.15, 0.22), uSky * 0.42 + vec3(0.06, 0.08, 0.12), 0.55);
  vec3 duskCenter = vec3(0.14, 0.10, 0.16);
  vec3 nightCenter = vec3(0.04, 0.05, 0.09);
  vec3 centerCol = mix(dayCenter, duskCenter, clamp((1.0 - uSun) * (1.0 - uLit), 0.0, 1.0));
  centerCol = mix(centerCol, nightCenter, clamp(uLit, 0.0, 1.0));
  vec3 edgeCol = centerCol * 0.45;
  vec3 col = mix(centerCol, edgeCol, pow(d, 0.85));
  gl_FragColor = vec4(col, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`,
  });
  const backdropMesh = new THREE.Mesh(backdropGeo, backdropMat);
  backdropMesh.position.y = -0.34;
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

  const hitBoxes = slices.map((s) => s.hitBox);

  let isOpen = false;
  let activeProvince = 'All';
  let selectedSliceIndex = 0;
  let hoveredSliceIndex: number | null = null;
  let visitedSet = new Set<number>();

  let flyGoalCam: THREE.Vector3 | null = null;
  let flyGoalTarget: THREE.Vector3 | null = null;
  const flyTargetTmp = new THREE.Vector3();
  const flyCamTmp = new THREE.Vector3();
  const raycaster = new THREE.Raycaster();
  const pointerVec = new THREE.Vector2();
  const cloudTintTmp = new THREE.Color('#ffffff');
  const cloudNightTmp = new THREE.Color('#28344d');
  const cloudWarmTmp = new THREE.Color('#ffd3a6');

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
    const dist = closeUp ? 5.6 : Math.max(9.5, Math.min(25, span * 1.1 + 7.5));
    flyTargetTmp.set(cx, 0.55, cz);
    flyCamTmp.set(cx + dist * 0.56, dist * 0.68, cz + dist * 0.8);
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

  const update: PlacesController['update'] = (dt, elapsed, motionScale, keyLight, fog) => {
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

    // Clamp manual pan within archipelago bounds
    controls.target.x = Math.max(-15.5, Math.min(15.5, controls.target.x));
    controls.target.z = Math.max(-12.5, Math.min(13.5, controls.target.z));
    controls.target.y = Math.max(0.1, Math.min(2.2, controls.target.y));
    controls.update();

    // Keep custom water & cloud GLSL shader uniforms locked to live CitylitEngine sky/season/weather
    env.sunDir.value.copy(keyLight.position).normalize();
    env.sunColor.value.copy(keyLight.color);
    if (fog instanceof THREE.FogExp2) {
      env.fogColor.value.copy(fog.color);
      env.fogDensity.value = fog.density;
    } else if (fog instanceof THREE.Fog) {
      env.fogColor.value.copy(fog.color);
      env.fogDensity.value = 0.008;
    }

    const litStrength = WU.lit.value;
    cloudTintTmp
      .set('#f8fbff')
      .lerp(cloudWarmTmp, (1 - WU.sun.value) * 0.45)
      .lerp(cloudNightTmp, Math.max(0, litStrength - 0.15) * 0.72);
    cloudMat.color.copy(cloudTintTmp);
    cloudMat.opacity = 0.78 + Math.min(0.18, WU.rain.value * 0.15);

    shared.waterTopMats.forEach((mat) => {
      mat.uniforms.uFogDensity.value = env.fogDensity.value;
    });
    shared.waterWallMats.forEach((mat) => {
      mat.uniforms.uFogDensity.value = env.fogDensity.value;
    });

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
    shared.dispose();
    terrainMat.dispose();
    cloudMat.dispose();
    ringGeo.dispose();
    ringMat.dispose();
    gridGeo.dispose();
    gridMat.dispose();
    backdropGeo.dispose();
    backdropMat.dispose();
    shared.foliageGeo.dispose();
    shared.trunkGeo.dispose();
    shared.rockGeo.dispose();
    shared.boxGeo.dispose();
    shared.coneGeo.dispose();
    shared.sphereGeo.dispose();
    shared.cylinderGeo.dispose();
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
    update,
    setAspect,
    dispose,
  };

  return controller;
}
