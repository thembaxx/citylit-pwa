import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {
  AFRICA_POLYS,
  ENCLAVE_POLYS,
  GLOBE_NEIGHBOR_LABELS,
  GLOBE_PROVINCES,
  NEIGHBOR_POLYS,
} from '../data/globeData';
import { LANDMARKS } from '../data/landmarks';
import {
  easeInOutCubic,
  easeOutCubic,
  GLOBE_RADIUS,
  latLonToVec3,
  mulberry32,
  pointInPoly,
  provinceVisitRatio,
  slerpDirection,
} from '../lib/globeMath';
import { getSoftTexture } from './shaders';
import type { QualityIndex } from '../types/citylit';

export { latLonToVec3 } from '../lib/globeMath';

const DEFAULT_LAT = -28.5;
const DEFAULT_LON = 24.5;
const DEFAULT_ZOOM = 11;
const OVERVIEW_ZOOM = 9.7;
const PROVINCE_ZOOM = 7.2;
const UP = new THREE.Vector3(0, 1, 0);

type DimMaterial = THREE.PointsMaterial | THREE.LineBasicMaterial;

export interface GlobeController {
  group: THREE.Group;
  camera: THREE.PerspectiveCamera;
  controls: OrbitControls;
  pins: THREE.Mesh[];
  isOpen: boolean;
  open: (visited: Set<number>, province?: string) => void;
  close: () => void;
  flyTo: (lat: number, lon: number, zoom?: number) => void;
  flyToProvince: (provinceName: string) => void;
  refreshPinColors: (visited: Set<number>) => void;
  setActiveProvince: (provinceName: string) => void;
  update: (dt: number, elapsed: number, motionScale: number) => void;
  hoverPin: (ndcX: number, ndcY: number, radiusPx?: number) => number | null;
  clearHover: () => void;
  pickPin: (ndcX: number, ndcY: number, radiusPx?: number) => number | null;
  zoomBy: (factor: number) => void;
  resetView: () => void;
  cancelFly: () => void;
  setAspect: (aspect: number) => void;
  setQuality: (index: QualityIndex) => void;
  dispose: () => void;
}

export function createGlobeScene(
  rendererDom: HTMLElement,
  initialAspect: number,
  isSoftwareGl: boolean,
  qualityIndex: QualityIndex = 0
): GlobeController {
  // Quality 0 is highest detail, 2 is lowest (also forced for software GL).
  const detailFor = (q: QualityIndex) => (q === 0 ? 1 : q === 1 ? 0.72 : 0.5);
  let detail = detailFor(qualityIndex);
  let stepScale = 1 / detail;
  const clampZoom = (z: number) =>
    Math.max(controls.minDistance, Math.min(controls.maxDistance, z));

  const camera = new THREE.PerspectiveCamera(42, initialAspect, 0.1, 100);
  camera.position.copy(latLonToVec3(DEFAULT_LAT, DEFAULT_LON, DEFAULT_ZOOM));

  const controls = new OrbitControls(camera, rendererDom);
  controls.enableDamping = !isSoftwareGl;
  controls.enablePan = false;
  // Zoom is handled by the engine (wheel + pinch) so we can ease it consistently
  // and avoid OrbitControls and our custom handler fighting over the distance.
  controls.enableZoom = false;
  controls.minDistance = 6.2;
  controls.maxDistance = 16;
  controls.rotateSpeed = 0.6;
  controls.enabled = false;

  const group = new THREE.Group();
  group.visible = false;

  // Ocean sphere with a gentle Fresnel limb so the disc reads as a lit globe.
  const sphere = new THREE.Mesh(
    new THREE.SphereGeometry(GLOBE_RADIUS, Math.max(24, Math.round(48 * detail)), Math.max(18, Math.round(36 * detail))),
    new THREE.ShaderMaterial({
      vertexShader:
        'varying vec3 N,V;void main(){N=normalize(normalMatrix*normal);vec4 p=modelViewMatrix*vec4(position,1.);V=normalize(-p.xyz);gl_Position=projectionMatrix*p;}',
      fragmentShader:
        'varying vec3 N,V;void main(){float f=pow(1.-abs(dot(N,V)),2.2);vec3 base=vec3(.043,.063,.094);vec3 col=base+vec3(.018,.045,.085)*f;gl_FragColor=vec4(col,1.);}',
    })
  );
  group.add(sphere);

  // Tighter glow atmosphere rim
  const atmosphere = new THREE.Mesh(
    new THREE.SphereGeometry(GLOBE_RADIUS * 1.045, Math.max(20, Math.round(40 * detail)), Math.max(14, Math.round(28 * detail))),
    new THREE.ShaderMaterial({
      side: THREE.BackSide,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexShader:
        'varying vec3 N,V;void main(){N=normalize(normalMatrix*normal);vec4 p=modelViewMatrix*vec4(position,1.);V=normalize(-p.xyz);gl_Position=projectionMatrix*p;}',
      fragmentShader:
        'varying vec3 N,V;void main(){float f=pow(1.-abs(dot(N,V)),4.);gl_FragColor=vec4(.28,.55,.95,f*.55);}',
    })
  );
  group.add(atmosphere);

  // Deterministic starfield backdrop
  const buildStarPositions = (count: number): number[] => {
    const rand = mulberry32(0x5a17c1);
    const pos: number[] = [];
    for (let i = 0; i < count; i++) {
      const a = rand() * 6.283;
      const z = rand() * 2 - 1;
      const r = Math.sqrt(1 - z * z);
      pos.push(r * Math.cos(a) * 35, z * 35, r * Math.sin(a) * 35);
    }
    return pos;
  };
  const starCountFor = (d: number) => Math.max(180, Math.round(600 * d));
  const starField = new THREE.Points(
    new THREE.BufferGeometry().setAttribute(
      'position',
      new THREE.Float32BufferAttribute(buildStarPositions(starCountFor(detail)), 3)
    ),
    new THREE.PointsMaterial({ color: '#9ab4e0', size: 0.14, transparent: true, opacity: 0.7 })
  );
  group.add(starField);

  // Anything whose opacity is dimmed when a single province is selected.
  const dimmable: { mat: DimMaterial; base: number; provinceIndex: number }[] = [];
  const track = (mat: DimMaterial, provinceIndex: number) => {
    dimmable.push({ mat, base: mat.opacity, provinceIndex });
  };

  // Dot-matrix landmass generator. Sources are kept so a quality change can
  // rebuild the point clouds without recreating materials or group children.
  type DotParams = {
    poly: readonly number[];
    step: number;
    radius: number;
    exclude?: readonly (readonly number[])[];
  };
  const dotSources: { params: DotParams; points: THREE.Points }[] = [];

  const buildDotPositions = (params: DotParams, scale: number): number[] => {
    const { poly, step, radius, exclude } = params;
    let x0 = 999;
    let x1 = -999;
    let y0 = 999;
    let y1 = -999;
    for (let i = 0; i < poly.length; i += 2) {
      x0 = Math.min(x0, poly[i]);
      x1 = Math.max(x1, poly[i]);
      y0 = Math.min(y0, poly[i + 1]);
      y1 = Math.max(y1, poly[i + 1]);
    }
    const pts: number[] = [];
    const s = step * scale;
    for (let y = y0; y <= y1; y += s) {
      for (let x = x0; x <= x1; x += s) {
        if (pointInPoly(x, y, poly) && (!exclude || !exclude.some((ex) => pointInPoly(x, y, ex)))) {
          const p = latLonToVec3(y, x, radius);
          pts.push(p.x, p.y, p.z);
        }
      }
    }
    return pts;
  };

  const addPolyDots = (
    poly: readonly number[],
    step: number,
    color: string,
    size: number,
    opacity: number,
    radius = GLOBE_RADIUS + 0.015,
    exclude?: readonly (readonly number[])[],
    additive = false,
    provinceIndex = -1
  ): THREE.Points => {
    const mat = new THREE.PointsMaterial({
      color,
      size,
      map: getSoftTexture(),
      transparent: true,
      opacity,
      depthWrite: false,
      blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
    });
    const params: DotParams = { poly, step, radius, exclude };
    const points = new THREE.Points(
      new THREE.BufferGeometry().setAttribute(
        'position',
        new THREE.Float32BufferAttribute(buildDotPositions(params, stepScale), 3)
      ),
      mat
    );
    dotSources.push({ params, points });
    track(mat, provinceIndex);
    group.add(points);
    return points;
  };

  AFRICA_POLYS.forEach((poly) => addPolyDots(poly, 0.85, '#4a6c9c', 0.075, 0.62));
  NEIGHBOR_POLYS.forEach((poly) => addPolyDots(poly, 0.45, '#5f83b2', 0.055, 0.7));
  ENCLAVE_POLYS.forEach((poly) =>
    addPolyDots(poly, 0.16, '#0d1422', 0.05, 0.98, GLOBE_RADIUS + 0.021)
  );
  const provinceDots = GLOBE_PROVINCES.map((pv, i) =>
    addPolyDots(pv.poly, 0.18, pv.color, 0.052, 1, GLOBE_RADIUS + 0.02, ENCLAVE_POLYS, true, i)
  );
  const provinceDotMats = provinceDots.map((dots, i) => ({
    mat: dots.material as THREE.PointsMaterial,
    baseColor: new THREE.Color(GLOBE_PROVINCES[i].color),
  }));

  const addPolyBorder = (
    poly: readonly number[],
    color: string,
    opacity: number,
    radius = GLOBE_RADIUS + 0.018,
    provinceIndex = -1
  ): THREE.Line => {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i < poly.length; i += 2) {
      pts.push(latLonToVec3(poly[i + 1], poly[i], radius));
    }
    if (pts.length) pts.push(pts[0].clone());
    const mat = new THREE.LineBasicMaterial({ color, transparent: true, opacity });
    const line = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(pts),
      mat
    );
    track(mat, provinceIndex);
    group.add(line);
    return line;
  };

  // Lat/lon grid lines
  const gridVerts: number[] = [];
  for (let lat = -80; lat <= 80; lat += 20) {
    for (let lon = -180; lon < 180; lon += 10) {
      const a = latLonToVec3(lat, lon, GLOBE_RADIUS + 0.005);
      const b = latLonToVec3(lat, lon + 10, GLOBE_RADIUS + 0.005);
      gridVerts.push(a.x, a.y, a.z, b.x, b.y, b.z);
    }
  }
  for (let lon = -180; lon < 180; lon += 20) {
    for (let lat = -80; lat < 80; lat += 10) {
      const a = latLonToVec3(lat, lon, GLOBE_RADIUS + 0.005);
      const b = latLonToVec3(lat + 10, lon, GLOBE_RADIUS + 0.005);
      gridVerts.push(a.x, a.y, a.z, b.x, b.y, b.z);
    }
  }
  group.add(
    new THREE.LineSegments(
      new THREE.BufferGeometry().setAttribute(
        'position',
        new THREE.Float32BufferAttribute(gridVerts, 3)
      ),
      new THREE.LineBasicMaterial({ color: '#1a2740', transparent: true, opacity: 0.45 })
    )
  );

  AFRICA_POLYS.forEach((poly) => addPolyBorder(poly, '#3d5885', 0.6, GLOBE_RADIUS + 0.015));
  NEIGHBOR_POLYS.forEach((poly) => addPolyBorder(poly, '#2f4568', 0.45, GLOBE_RADIUS + 0.016));
  GLOBE_PROVINCES.forEach((pv, i) =>
    addPolyBorder(pv.poly, '#f0bc58', 0.72, GLOBE_RADIUS + 0.025, i)
  );
  ENCLAVE_POLYS.forEach((poly) => addPolyBorder(poly, '#d99a3e', 0.85, GLOBE_RADIUS + 0.028));

  // Canvas sprite text labels
  const labelSprites: THREE.Sprite[] = [];
  const labelTextures: THREE.Texture[] = [];
  const addLabel = (
    text: string,
    lat: number,
    lon: number,
    color: string,
    scale: number,
    fontSize: number
  ) => {
    const canvas = document.createElement('canvas');
    const font = `600 ${fontSize}px system-ui, sans-serif`;
    const probe = document.createElement('canvas').getContext('2d');
    let textWidth = 512;
    if (probe) {
      probe.font = font;
      textWidth = Math.ceil(probe.measureText(text).width) + 24;
    }
    canvas.width = textWidth;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.font = font;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.strokeStyle = 'rgba(7,10,16,.92)';
      ctx.lineWidth = 7;
      ctx.strokeText(text, textWidth / 2, 64);
      ctx.fillStyle = color;
      ctx.fillText(text, textWidth / 2, 64);
    }
    const texture = new THREE.CanvasTexture(canvas);
    labelTextures.push(texture);
    const sprite = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
        depthWrite: false,
        opacity: 0.95,
      })
    );
    sprite.position.copy(latLonToVec3(lat, lon, GLOBE_RADIUS + 0.09));
    sprite.scale.set((scale * textWidth) / 512, scale / 4, 1);
    sprite.userData.base = { x: (scale * textWidth) / 512, y: scale / 4 };
    sprite.userData.label = text;
    labelSprites.push(sprite);
    group.add(sprite);
    return sprite;
  };

  // Sprites are sized in world units, so both a short viewport and a distant
  // camera shrink them. Scale towards a roughly constant on-screen size.
  let labelDistanceScale = 1;
  const fitLabels = () => {
    const short = window.innerHeight < 640;
    const viewportK = Math.min(1.95, Math.max(1, 840 / Math.max(320, window.innerHeight)));
    const k = viewportK * labelDistanceScale;
    labelSprites.forEach((s) => {
      const base = s.userData.base as { x: number; y: number };
      const name = s.userData.label as string;
      // The enclave labels sit inside South Africa and collide with the
      // province labels once the map gets small, so drop them on short screens.
      s.visible = !(short && (name === 'Lesotho' || name === 'Eswatini'));
      s.scale.set(base.x * k, base.y * k, 1);
    });
  };

  GLOBE_PROVINCES.forEach((pv) =>
    addLabel(pv.name.toUpperCase(), pv.lat, pv.lon, '#ffe8ba', 0.5, 26)
  );
  GLOBE_NEIGHBOR_LABELS.forEach(([name, lon, lat]) =>
    addLabel(name, lat, lon, name.includes('Ocean') ? '#7da6d8' : '#b7cbe8', 0.78, 32)
  );
  fitLabels();

  // Pulsing landmark pins
  const pinGeo = new THREE.SphereGeometry(0.022, 10, 8);
  const pinSuppressed: boolean[] = new Array(LANDMARKS.length).fill(false);
  const pins: THREE.Mesh[] = LANDMARKS.map((lm, i) => {
    const pin = new THREE.Mesh(
      pinGeo,
      new THREE.MeshBasicMaterial({ color: '#ffcf6a', transparent: true, opacity: 1 })
    );
    const pos = latLonToVec3(lm.coords[0], lm.coords[1], GLOBE_RADIUS + 0.05);
    pin.position.copy(pos);
    pin.userData = { i, p: i * 0.7 };
    group.add(pin);
    return pin;
  });

  const refreshPinColors = (visited: Set<number>) => {
    pins.forEach((pin, idx) => {
      const mat = pin.material as THREE.MeshBasicMaterial;
      mat.color.set(visited.has(idx) ? '#7dffb0' : '#ffcf6a');
    });
    // Tint each province towards green in proportion to how many of its
    // landmarks have been visited — a subtle completion heat-map on the globe.
    provinceDotMats.forEach(({ mat, baseColor }, i) => {
      const ratio = provinceVisitRatio(GLOBE_PROVINCES[i].name, LANDMARKS, visited);
      mat.color.copy(baseColor).lerp(new THREE.Color('#7dffb0'), ratio * 0.5);
    });
  };

  const setActiveProvince = (provinceName: string) => {
    const idx = provinceName === 'All' ? -1 : GLOBE_PROVINCES.findIndex((p) => p.name === provinceName);
    dimmable.forEach((entry) => {
      if (idx === -1) {
        entry.mat.opacity = entry.base;
      } else if (entry.provinceIndex === idx) {
        entry.mat.opacity = Math.min(1, entry.base * 1.35);
      } else {
        entry.mat.opacity =
          entry.base * (entry.provinceIndex >= 0 ? 0.16 : 0.4);
      }
    });
  };

  let flyFrom = new THREE.Vector3();
  let flyGoal: THREE.Vector3 | null = null;
  let flyT = 0;
  let flyDuration = 0.8;
  let zoomTarget: number | null = null;
  let hoveredPinIdx: number | null = null;
  let reveal = 0;
  let idleTime = 0;

  const cancelFly = () => {
    flyGoal = null;
    zoomTarget = null;
    idleTime = 0;
  };

  const flyTo = (lat: number, lon: number, zoom = 7.4) => {
    const goal = latLonToVec3(lat, lon, clampZoom(zoom));
    flyFrom.copy(camera.position);
    flyGoal = goal;
    flyT = 0;
    const angle = flyFrom.clone().normalize().angleTo(goal.clone().normalize());
    const radiusDelta = Math.abs(flyFrom.length() - goal.length());
    flyDuration = THREE.MathUtils.clamp(0.35 + angle * 0.55 + radiusDelta * 0.06, 0.35, 1.25);
    idleTime = 0;
  };

  const flyToProvince = (provinceName: string) => {
    setActiveProvince(provinceName);
    const pv = GLOBE_PROVINCES.find((p) => p.name === provinceName);
    if (pv) {
      flyTo(pv.lat, pv.lon, PROVINCE_ZOOM);
    } else {
      flyTo(DEFAULT_LAT, DEFAULT_LON, OVERVIEW_ZOOM);
    }
  };

  const resetView = () => {
    setActiveProvince('All');
    flyTo(DEFAULT_LAT, DEFAULT_LON, DEFAULT_ZOOM);
  };

  const open = (visited: Set<number>, province = 'All') => {
    controller.isOpen = true;
    group.visible = true;
    idleTime = 0;
    hoveredPinIdx = null;
    refreshPinColors(visited);
    setActiveProvince(province);
    flyTo(-28.9, 24.8, OVERVIEW_ZOOM);
  };

  const close = () => {
    controller.isOpen = false;
    hoveredPinIdx = null;
    cancelFly();
  };

  const update = (dt: number, elapsed: number, motionScale: number) => {
    // Smooth reveal / conceal instead of a hard visibility toggle.
    const target = controller.isOpen ? 1 : 0;
    if (reveal !== target) {
      const step = motionScale === 0 ? 1 : dt / 0.42;
      reveal = THREE.MathUtils.clamp(reveal + Math.sign(target - reveal) * step, 0, 1);
      if (!controller.isOpen && reveal === 0) group.visible = false;
    }
    group.scale.setScalar(0.86 + 0.14 * easeOutCubic(reveal));
    if (!controller.isOpen && reveal === 0) return;

    if (flyGoal) {
      flyT += motionScale === 0 ? 1 : dt / flyDuration;
      const t = easeInOutCubic(Math.min(1, flyT));
      const fromDir = flyFrom.clone().normalize();
      const toDir = flyGoal.clone().normalize();
      const dir = slerpDirection(fromDir, toDir, t);
      const radius = THREE.MathUtils.lerp(flyFrom.length(), flyGoal.length(), t);
      camera.position.copy(dir.multiplyScalar(clampZoom(radius)));
      if (flyT >= 1) flyGoal = null;
      idleTime = 0;
    } else if (zoomTarget !== null) {
      const len = camera.position.length();
      if (Math.abs(len - zoomTarget) < 0.01) {
        camera.position.setLength(zoomTarget);
        zoomTarget = null;
      } else {
        const k = motionScale === 0 ? 1 : Math.min(1, dt * 10);
        camera.position.setLength(THREE.MathUtils.lerp(len, zoomTarget, k));
      }
      idleTime = 0;
    } else {
      idleTime += dt;
      // A barely-there idle drift keeps the globe feeling alive. It never runs
      // with reduced motion and stops as soon as the user interacts.
      if (motionScale > 0 && idleTime > 2.5 && camera.position.length() > 8.5) {
        camera.position.applyAxisAngle(UP, dt * 0.02);
      }
    }

    // Screen size of a world-space sprite is inversely proportional to camera
    // distance; compensate so labels stay legible at the overview zoom and
    // don't balloon when flying in to a province.
    const distanceK = THREE.MathUtils.clamp(camera.position.length() / 9.7, 0.62, 1.55);
    if (Math.abs(distanceK - labelDistanceScale) > 0.004) {
      labelDistanceScale = distanceK;
      fitLabels();
    }

    declutterPins();
    pins.forEach((pin, idx) => {
      const phase = (pin.userData.p as number) + elapsed * 2.5 * motionScale;
      const baseScale = 1 + 0.35 * Math.sin(phase);
      const suppressed = pinSuppressed[idx] && hoveredPinIdx !== idx;
      pin.scale.setScalar(
        hoveredPinIdx === idx
          ? Math.max(baseScale, 1.55)
          : baseScale * (suppressed ? 0.6 : 1)
      );
      (pin.material as THREE.MeshBasicMaterial).opacity = suppressed ? 0.5 : 1;
    });
    controls.update();
  };

  const raycaster = new THREE.Raycaster();
  const hoverVec = new THREE.Vector2();
  const worldPos = new THREE.Vector3();
  const ndc = new THREE.Vector3();
  const pxPerNdcX = () => window.innerWidth / 2;
  const pxPerNdcY = () => window.innerHeight / 2;

  /** De-emphasise pins that collapse onto each other at the current zoom. */
  const declutterPins = () => {
    const screen = pins.map((pin) => {
      pin.getWorldPosition(worldPos);
      ndc.copy(worldPos).project(camera);
      return {
        x: (ndc.x + 1) * pxPerNdcX(),
        y: (1 - ndc.y) * pxPerNdcY(),
        behind: ndc.z > 1,
      };
    });
    pinSuppressed.fill(false);
    for (let i = 0; i < screen.length; i++) {
      if (screen[i].behind) continue;
      for (let j = 0; j < i; j++) {
        if (screen[j].behind) continue;
        if (Math.hypot(screen[i].x - screen[j].x, screen[i].y - screen[j].y) < 20) {
          pinSuppressed[i] = true;
          break;
        }
      }
    }
  };

  /** True when the pin is on the camera-facing hemisphere (not hidden behind the sphere). */
  const isNearSide = (pin: THREE.Mesh): boolean => {
    pin.getWorldPosition(worldPos);
    return worldPos.dot(camera.position) > 0;
  };

  /** Raycast first, then fall back to a generous screen-space radius (touch friendly). */
  const pickPinAt = (ndcX: number, ndcY: number, radiusPx: number): number | null => {
    if (!controller.isOpen) return null;
    group.updateMatrixWorld();
    hoverVec.set(ndcX, ndcY);
    raycaster.setFromCamera(hoverVec, camera);
    for (const hit of raycaster.intersectObjects(pins, false)) {
      if (isNearSide(hit.object as THREE.Mesh)) {
        return (hit.object.userData.i as number) ?? null;
      }
    }

    let best: number | null = null;
    let bestDist = radiusPx;
    for (const pin of pins) {
      if (!isNearSide(pin)) continue;
      pin.getWorldPosition(worldPos);
      ndc.copy(worldPos).project(camera);
      if (ndc.z > 1) continue;
      const sx = (ndc.x + 1) * pxPerNdcX();
      const sy = (1 - ndc.y) * pxPerNdcY();
      const dx = sx - (ndcX + 1) * pxPerNdcX();
      const dy = sy - (1 - ndcY) * pxPerNdcY();
      const dist = Math.hypot(dx, dy);
      if (dist < bestDist) {
        bestDist = dist;
        best = pin.userData.i as number;
      }
    }
    return best;
  };

  const hoverPin = (ndcX: number, ndcY: number, radiusPx = 14): number | null => {
    if (!controller.isOpen) {
      hoveredPinIdx = null;
      return null;
    }
    hoveredPinIdx = pickPinAt(ndcX, ndcY, radiusPx);
    return hoveredPinIdx;
  };

  const clearHover = () => {
    hoveredPinIdx = null;
  };

  const pickPin = (ndcX: number, ndcY: number, radiusPx = 14): number | null =>
    pickPinAt(ndcX, ndcY, radiusPx);

  const zoomBy = (factor: number) => {
    if (!controller.isOpen) return;
    flyGoal = null;
    idleTime = 0;
    zoomTarget = clampZoom(camera.position.length() * factor);
  };

  const setAspect = (aspect: number) => {
    camera.aspect = aspect;
    camera.updateProjectionMatrix();
    fitLabels();
  };

  let appliedQuality = qualityIndex;
  const setQuality = (index: QualityIndex) => {
    if (index === appliedQuality) return;
    appliedQuality = index;
    detail = detailFor(index);
    stepScale = 1 / detail;
    dotSources.forEach(({ params, points }) => {
      points.geometry.dispose();
      points.geometry = new THREE.BufferGeometry().setAttribute(
        'position',
        new THREE.Float32BufferAttribute(buildDotPositions(params, stepScale), 3)
      );
    });
    starField.geometry.dispose();
    starField.geometry = new THREE.BufferGeometry().setAttribute(
      'position',
      new THREE.Float32BufferAttribute(buildStarPositions(starCountFor(detail)), 3)
    );
  };

  const dispose = () => {
    controls.dispose();
    const geometries = new Set<THREE.BufferGeometry>();
    const materials = new Set<THREE.Material>();
    group.traverse((obj) => {
      // Sprite geometry is shared internally by Three.js — don't dispose it.
      if (!(obj as THREE.Sprite).isSprite) {
        const geo = (obj as THREE.Mesh).geometry;
        if (geo) geometries.add(geo);
      }
      const mat = (obj as THREE.Mesh).material;
      if (mat) {
        (Array.isArray(mat) ? mat : [mat]).forEach((m) => materials.add(m));
      }
    });
    geometries.forEach((g) => g.dispose());
    materials.forEach((m) => m.dispose());
    labelTextures.forEach((t) => t.dispose());
    group.parent?.remove(group);
  };

  const controller: GlobeController = {
    group,
    camera,
    controls,
    pins,
    isOpen: false,
    open,
    close,
    flyTo,
    flyToProvince,
    refreshPinColors,
    setActiveProvince,
    update,
    hoverPin,
    clearHover,
    pickPin,
    zoomBy,
    resetView,
    cancelFly,
    setAspect,
    setQuality,
    dispose,
  };

  return controller;
}
