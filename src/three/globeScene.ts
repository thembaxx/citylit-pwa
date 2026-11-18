import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {
  AFRICA_POLY,
  ENCLAVE_POLYS,
  GLOBE_NEIGHBOR_LABELS,
  GLOBE_PROVINCES,
  NEIGHBOR_POLYS,
} from '../data/globeData';
import { LANDMARKS } from '../data/landmarks';
import { getSoftTexture } from './shaders';

const GLOBE_RADIUS = 5;

export function latLonToVec3(lat: number, lon: number, radius = GLOBE_RADIUS): THREE.Vector3 {
  const phi = ((90 - lat) * Math.PI) / 180;
  const theta = ((lon + 180) * Math.PI) / 180;
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
}

function pointInPoly(x: number, y: number, poly: readonly number[]): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 2; i < poly.length; j = i, i += 2) {
    const xi = poly[i];
    const yi = poly[i + 1];
    const xj = poly[j];
    const yj = poly[j + 1];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
}

export interface GlobeController {
  group: THREE.Group;
  camera: THREE.PerspectiveCamera;
  controls: OrbitControls;
  pins: THREE.Mesh[];
  isOpen: boolean;
  open: (visited: Set<number>) => void;
  close: () => void;
  flyTo: (lat: number, lon: number, zoom?: number) => void;
  flyToProvince: (provinceName: string) => void;
  refreshPinColors: (visited: Set<number>) => void;
  update: (dt: number, elapsed: number, motionScale: number) => void;
  pickPin: (ndcX: number, ndcY: number) => number | null;
  zoomBy: (factor: number) => void;
  setAspect: (aspect: number) => void;
  dispose: () => void;
}

export function createGlobeScene(
  rendererDom: HTMLElement,
  initialAspect: number,
  isSoftwareGl: boolean
): GlobeController {
  const camera = new THREE.PerspectiveCamera(42, initialAspect, 0.1, 100);
  camera.position.copy(latLonToVec3(-28.5, 24.5, 11));

  const controls = new OrbitControls(camera, rendererDom);
  controls.enableDamping = !isSoftwareGl;
  controls.enablePan = false;
  controls.minDistance = 6.2;
  controls.maxDistance = 16;
  controls.rotateSpeed = 0.6;
  controls.enabled = false;

  const group = new THREE.Group();
  group.visible = false;

  // Base ocean sphere
  const sphere = new THREE.Mesh(
    new THREE.SphereGeometry(GLOBE_RADIUS, 48, 36),
    new THREE.MeshBasicMaterial({ color: '#0b1018' })
  );
  group.add(sphere);

  // Subtle glow atmosphere rim
  const atmosphere = new THREE.Mesh(
    new THREE.SphereGeometry(GLOBE_RADIUS * 1.07, 40, 28),
    new THREE.ShaderMaterial({
      side: THREE.BackSide,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexShader:
        'varying vec3 N,V;void main(){N=normalize(normalMatrix*normal);vec4 p=modelViewMatrix*vec4(position,1.);V=normalize(-p.xyz);gl_Position=projectionMatrix*p;}',
      fragmentShader:
        'varying vec3 N,V;void main(){float f=pow(1.-abs(dot(N,V)),3.);gl_FragColor=vec4(.28,.55,.95,f*.45);}',
    })
  );
  group.add(atmosphere);

  // Starfield backdrop
  const starPositions: number[] = [];
  for (let i = 0; i < 600; i++) {
    const a = Math.random() * 6.283;
    const z = Math.random() * 2 - 1;
    const r = Math.sqrt(1 - z * z);
    starPositions.push(r * Math.cos(a) * 35, z * 35, r * Math.sin(a) * 35);
  }
  const starField = new THREE.Points(
    new THREE.BufferGeometry().setAttribute(
      'position',
      new THREE.Float32BufferAttribute(starPositions, 3)
    ),
    new THREE.PointsMaterial({ color: '#9ab4e0', size: 0.14, transparent: true, opacity: 0.7 })
  );
  group.add(starField);

  // Dot-matrix landmass generator
  const addPolyDots = (
    poly: readonly number[],
    step: number,
    color: string,
    size: number,
    opacity: number,
    radius = GLOBE_RADIUS + 0.015,
    exclude?: readonly (readonly number[])[],
    additive = false
  ) => {
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
    for (let y = y0; y <= y1; y += step) {
      for (let x = x0; x <= x1; x += step) {
        if (pointInPoly(x, y, poly) && (!exclude || !exclude.some((ex) => pointInPoly(x, y, ex)))) {
          const p = latLonToVec3(y, x, radius);
          pts.push(p.x, p.y, p.z);
        }
      }
    }
    const points = new THREE.Points(
      new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(pts, 3)),
      new THREE.PointsMaterial({
        color,
        size,
        map: getSoftTexture(),
        transparent: true,
        opacity,
        depthWrite: false,
        blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
      })
    );
    group.add(points);
  };

  addPolyDots(AFRICA_POLY, 0.85, '#4a6c9c', 0.075, 0.62);
  NEIGHBOR_POLYS.forEach((poly) => addPolyDots(poly, 0.45, '#5f83b2', 0.055, 0.7));
  ENCLAVE_POLYS.forEach((poly) =>
    addPolyDots(poly, 0.16, '#0d1422', 0.05, 0.98, GLOBE_RADIUS + 0.021)
  );
  GLOBE_PROVINCES.forEach((pv) =>
    addPolyDots(pv.poly, 0.18, pv.color, 0.052, 1, GLOBE_RADIUS + 0.02, ENCLAVE_POLYS, true)
  );

  const addPolyBorder = (
    poly: readonly number[],
    color: string,
    opacity: number,
    radius = GLOBE_RADIUS + 0.018
  ) => {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i < poly.length; i += 2) {
      pts.push(latLonToVec3(poly[i + 1], poly[i], radius));
    }
    if (pts.length) pts.push(pts[0].clone());
    group.add(
      new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(pts),
        new THREE.LineBasicMaterial({ color, transparent: true, opacity })
      )
    );
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

  addPolyBorder(AFRICA_POLY, '#3d5885', 0.6, GLOBE_RADIUS + 0.015);
  NEIGHBOR_POLYS.forEach((poly) => addPolyBorder(poly, '#2f4568', 0.45, GLOBE_RADIUS + 0.016));
  GLOBE_PROVINCES.forEach((pv) => addPolyBorder(pv.poly, '#f0bc58', 0.72, GLOBE_RADIUS + 0.025));
  ENCLAVE_POLYS.forEach((poly) => addPolyBorder(poly, '#d99a3e', 0.85, GLOBE_RADIUS + 0.028));

  // Canvas sprite text labels
  const labelSprites: THREE.Sprite[] = [];
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
    const sprite = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: new THREE.CanvasTexture(canvas),
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

  // Sprites are sized in world units, so short (landscape) viewports shrink them.
  // Grow them back towards a constant on-screen size when the viewport is short.
  const fitLabels = () => {
    const short = window.innerHeight < 640;
    const k = Math.min(1.95, Math.max(1, 840 / Math.max(320, window.innerHeight)));
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
  const pinGeo = new THREE.SphereGeometry(0.018, 10, 8);
  const pins: THREE.Mesh[] = LANDMARKS.map((lm, i) => {
    const pin = new THREE.Mesh(pinGeo, new THREE.MeshBasicMaterial({ color: '#ffcf6a' }));
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
  };

  let flyGoal: THREE.Vector3 | null = null;
  let isOpen = false;

  const flyTo = (lat: number, lon: number, zoom = 7.4) => {
    flyGoal = latLonToVec3(lat, lon, zoom);
  };

  const flyToProvince = (provinceName: string) => {
    const pv = GLOBE_PROVINCES.find((p) => p.name === provinceName);
    if (pv) {
      flyTo(pv.lat, pv.lon, 7.2);
    } else {
      flyTo(-28.5, 24.5, 9.6);
    }
  };

  const open = (visited: Set<number>) => {
    isOpen = true;
    controller.isOpen = true;
    group.visible = true;
    controls.enabled = true;
    refreshPinColors(visited);
    flyTo(-28.9, 24.8, 9.7);
  };

  const close = () => {
    isOpen = false;
    controller.isOpen = false;
    group.visible = false;
    controls.enabled = false;
  };

  const update = (dt: number, elapsed: number, motionScale: number) => {
    if (!isOpen) return;
    if (flyGoal) {
      camera.position.lerp(flyGoal, Math.min(1, dt * 4));
      if (camera.position.distanceTo(flyGoal) < 0.05) {
        flyGoal = null;
      }
    }
    pins.forEach((pin) => {
      const phase = (pin.userData.p as number) + elapsed * 2.5 * motionScale;
      pin.scale.setScalar(1 + 0.35 * Math.sin(phase));
    });
    controls.update();
  };

  const raycaster = new THREE.Raycaster();
  const pickPin = (ndcX: number, ndcY: number): number | null => {
    if (!isOpen) return null;
    raycaster.setFromCamera(new THREE.Vector2(ndcX, ndcY), camera);
    const hits = raycaster.intersectObjects(pins, false);
    if (!hits.length) return null;
    const hit = hits[0].object;
    return typeof hit.userData.i === 'number' ? hit.userData.i : null;
  };

  const zoomBy = (factor: number) => {
    if (!isOpen) return;
    flyGoal = null;
    camera.position.setLength(
      Math.max(
        controls.minDistance,
        Math.min(controls.maxDistance, camera.position.length() * factor)
      )
    );
  };

  const setAspect = (aspect: number) => {
    camera.aspect = aspect;
    camera.updateProjectionMatrix();
    fitLabels();
  };

  const dispose = () => {
    controls.dispose();
  };

  const controller: GlobeController = {
    group,
    camera,
    controls,
    pins,
    isOpen,
    open,
    close,
    flyTo,
    flyToProvince,
    refreshPinColors,
    update,
    pickPin,
    zoomBy,
    setAspect,
    dispose,
  };

  return controller;
}
