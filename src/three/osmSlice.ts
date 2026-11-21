import * as THREE from 'three';
import type { LocalPoint, OsmArea, OsmPlaceData } from '../services/osmService';
import {
  SLICE_HALF,
  type BuiltPlaceSlice,
  type PlaceSliceSpec,
  type SliceSharedAssets,
} from './placesSliceBuilders';

/**
 * Turns an on-demand OSM patch into a stylised isometric diorama slice.
 *
 * This mirrors WorldCraft's data-driven approach — real footprints, roads and
 * elevation drive geometry that is generated only when a coordinate is visited —
 * while keeping the painterly, small-scale look of Citylit's existing places.
 * The OSM service already handles fetching, caching and offline fallback.
 */

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

interface OsmSliceResult {
  built: BuiltPlaceSlice;
}

function centroid(points: readonly LocalPoint[]): LocalPoint {
  if (!points.length) return { x: 0, z: 0 };
  const sum = points.reduce((acc, p) => ({ x: acc.x + p.x, z: acc.z + p.z }), { x: 0, z: 0 });
  return { x: sum.x / points.length, z: sum.z / points.length };
}

function polygonShape(points: readonly LocalPoint[], units: number): THREE.Shape | null {
  if (points.length < 3) return null;
  const shape = new THREE.Shape();
  points.forEach((p, i) => {
    // The shape lives in XY; rotating -90° about X maps Y onto -Z.
    const x = p.x * units;
    const y = -p.z * units;
    if (i === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  });
  shape.closePath();
  return shape;
}

function createRibbon(path: readonly LocalPoint[], width: number, units: number, heightAt: (x: number, z: number) => number): THREE.BufferGeometry | null {
  if (path.length < 2) return null;
  const positions: number[] = [];
  const indices: number[] = [];
  const half = (width * units) / 2;

  for (let i = 0; i < path.length - 1; i++) {
    const a = { x: path[i].x * units, z: path[i].z * units };
    const b = { x: path[i + 1].x * units, z: path[i + 1].z * units };
    const dx = b.x - a.x;
    const dz = b.z - a.z;
    const len = Math.hypot(dx, dz);
    if (len < 1e-4) continue;
    const px = (-dz / len) * half;
    const pz = (dx / len) * half;
    const yA = Math.max(heightAt(a.x + px, a.z + pz), heightAt(a.x - px, a.z - pz)) + 0.018;
    const yB = Math.max(heightAt(b.x + px, b.z + pz), heightAt(b.x - px, b.z - pz)) + 0.018;
    const base = positions.length / 3;
    positions.push(
      a.x + px, yA, a.z + pz,
      a.x - px, yA, a.z - pz,
      b.x + px, yB, b.z + pz,
      b.x - px, yB, b.z - pz
    );
    indices.push(base, base + 2, base + 1, base + 1, base + 2, base + 3);
  }

  if (!positions.length) return null;
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

export function createOsmSlice(
  shared: SliceSharedAssets,
  data: OsmPlaceData,
  seed: number
): OsmSliceResult {
  const root = new THREE.Group();
  root.name = 'osm-coordinate-slice';
  const units = SLICE_HALF / data.radiusM;
  const exaggeration = 2.5;
  const localGeometries: THREE.BufferGeometry[] = [];
  const localMaterials: THREE.Material[] = [];
  const disposables: Array<{ dispose: () => void }> = [];

  const sampleRelief = (gx: number, gz: number): number => {
    const x0 = Math.floor(gx);
    const z0 = Math.floor(gz);
    const x1 = Math.min(x0 + 1, 4);
    const z1 = Math.min(z0 + 1, 4);
    const tx = gx - x0;
    const tz = gz - z0;
    const row0 = data.relief[z0] ?? [0, 0, 0, 0, 0];
    const row1 = data.relief[z1] ?? row0;
    const a = THREE.MathUtils.lerp(row0[x0] ?? 0, row0[x1] ?? 0, tx);
    const b = THREE.MathUtils.lerp(row1[x0] ?? 0, row1[x1] ?? 0, tx);
    return THREE.MathUtils.lerp(a, b, tz);
  };

  // Overpass returns whole ways that merely touch the search circle; their
  // outlying nodes would float beyond the physical slice. Keep only features
  // fully inside the patch.
  const withinPatch = (points: readonly LocalPoint[]): boolean =>
    points.every(
      (p) =>
        Math.abs(p.x) <= data.radiusM * 0.98 && Math.abs(p.z) <= data.radiusM * 0.98
    );

  const heightAt = (x: number, z: number): number => {
    const gx = clamp(((x / SLICE_HALF + 1) / 2) * 4, 0, 4);
    const gz = clamp(((z / SLICE_HALF + 1) / 2) * 4, 0, 4);
    return clamp(sampleRelief(gx, gz) * units * exaggeration, -0.42, 0.42);
  };

  // Terrain heightfield with height/slope-driven vertex colours.
  const segments = 40;
  const positions: number[] = [];
  const colors: number[] = [];
  const indices: number[] = [];
  const low = new THREE.Color('#5c6647');
  const high = new THREE.Color('#9a9067');
  const tmp = new THREE.Color();
  for (let row = 0; row <= segments; row++) {
    for (let col = 0; col <= segments; col++) {
      const x = (col / segments) * 2 * SLICE_HALF - SLICE_HALF;
      const z = (row / segments) * 2 * SLICE_HALF - SLICE_HALF;
      const h = heightAt(x, z);
      positions.push(x, h, z);
      const slope = Math.abs(heightAt(x + 0.08, z) - heightAt(x - 0.08, z)) +
        Math.abs(heightAt(x, z + 0.08) - heightAt(x, z - 0.08));
      const t = clamp(0.42 + h * 0.8 + slope * 0.6, 0, 1);
      tmp.copy(low).lerp(high, t);
      colors.push(tmp.r, tmp.g, tmp.b);
    }
  }
  for (let row = 0; row < segments; row++) {
    for (let col = 0; col < segments; col++) {
      const a = row * (segments + 1) + col;
      const b = a + 1;
      const c = a + segments + 1;
      const d = c + 1;
      indices.push(a, c, b, b, c, d);
    }
  }
  const terrainGeo = new THREE.BufferGeometry();
  terrainGeo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  terrainGeo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  terrainGeo.setIndex(indices);
  terrainGeo.computeVertexNormals();
  localGeometries.push(terrainGeo);
  const terrainMat = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.95,
    metalness: 0,
    side: THREE.DoubleSide,
  });
  localMaterials.push(terrainMat);
  root.add(new THREE.Mesh(terrainGeo, terrainMat));

  // Cutaway base so the patch reads as a physical slice, like the other places.
  const baseGeo = new THREE.BoxGeometry(SLICE_HALF * 2, 0.16, SLICE_HALF * 2);
  const baseMat = new THREE.MeshStandardMaterial({ color: '#4a3f36', roughness: 1 });
  localGeometries.push(baseGeo);
  localMaterials.push(baseMat);
  const base = new THREE.Mesh(baseGeo, baseMat);
  base.position.y = -0.1;
  root.add(base);

  // Water and green polygons sit just above the sampled terrain.
  const addArea = (area: OsmArea, color: string, lift: number) => {
    const shape = polygonShape(area.outline, units);
    if (!shape) return;
    const geo = new THREE.ShapeGeometry(shape);
    geo.rotateX(-Math.PI / 2);
    const mat = new THREE.MeshStandardMaterial({
      color,
      roughness: 0.6,
      metalness: 0,
      transparent: true,
      opacity: 0.92,
      side: THREE.DoubleSide,
    });
    localGeometries.push(geo);
    localMaterials.push(mat);
    const mesh = new THREE.Mesh(geo, mat);
    const c = centroid(area.outline);
    // Shape vertices are already in slice coordinates; only lift in Y.
    mesh.position.set(0, heightAt(c.x * units, c.z * units) + lift, 0);
    root.add(mesh);
  };
  const greenAreas = data.green.filter((a) => withinPatch(a.outline));
  data.water
    .filter((a) => withinPatch(a.outline))
    .forEach((area) => addArea(area, '#3a7392', 0.026));
  greenAreas.forEach((area) => addArea(area, '#5b7b4a', 0.012));

  // Roads as flat ribbons following the real OSM centre lines.
  const roadMat = new THREE.MeshStandardMaterial({
    color: '#6b6c73',
    roughness: 1,
    side: THREE.DoubleSide,
  });
  localMaterials.push(roadMat);
  data.roads.filter((road) => withinPatch(road.path)).forEach((road) => {
    const geo = createRibbon(road.path, road.width, units, heightAt);
    if (!geo) return;
    localGeometries.push(geo);
    root.add(new THREE.Mesh(geo, roadMat));
  });

  // Extruded building footprints. Height comes from OSM levels where present.
  const buildingMats = new Map<string, THREE.MeshStandardMaterial>();
  let buildingCount = 0;
  data.buildings.filter((b) => withinPatch(b.outline)).forEach((building) => {
    const shape = polygonShape(building.outline, units);
    if (!shape) return;
    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: Math.max(0.04, building.height * units),
      bevelEnabled: false,
    });
    geo.rotateX(-Math.PI / 2);
    localGeometries.push(geo);
    const tone = building.kind === 'church' || building.kind === 'cathedral' ? '#c9b58b' : '#b8aa93';
    let mat = buildingMats.get(tone);
    if (!mat) {
      mat = new THREE.MeshStandardMaterial({ color: tone, roughness: 0.88 });
      buildingMats.set(tone, mat);
      localMaterials.push(mat);
    }
    const mesh = new THREE.Mesh(geo, mat);
    const c = centroid(building.outline);
    // Shape vertices are already in slice coordinates; only lift in Y.
    mesh.position.set(0, heightAt(c.x * units, c.z * units), 0);
    root.add(mesh);
    buildingCount++;
  });

  // A few instanced trees inside green patches keep the miniature alive.
  const treePositions: THREE.Vector3[] = [];
  greenAreas.forEach((area) => {
    const c = centroid(area.outline);
    if (treePositions.length >= 48) return;
    const count = Math.min(12, 48 - treePositions.length);
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + seed;
      const radius = SLICE_HALF * (0.1 + ((i % 3) + 1) * 0.055);
      const x = clamp(c.x * units + Math.cos(angle) * radius, -1.35, 1.35);
      const z = clamp(c.z * units + Math.sin(angle) * radius, -1.35, 1.35);
      treePositions.push(new THREE.Vector3(x, heightAt(x, z) + 0.11, z));
    }
  });
  if (treePositions.length) {
    const foliageMat = new THREE.MeshStandardMaterial({ color: '#4e6b3f', roughness: 1 });
    localMaterials.push(foliageMat);
    const trees = new THREE.InstancedMesh(shared.foliageGeo, foliageMat, treePositions.length);
    const matrix = new THREE.Matrix4();
    treePositions.forEach((p, i) => {
      matrix.makeScale(0.09, 0.14, 0.09);
      matrix.setPosition(p);
      trees.setMatrixAt(i, matrix);
    });
    trees.instanceMatrix.needsUpdate = true;
    root.add(trees);
    disposables.push({ dispose: () => trees.dispose() });
  }

  // Square selection frame (kept as a Standard material — placesScene tweaks its emissive).
  const ringShape = new THREE.Shape();
  ringShape.moveTo(-2.47, -2.47);
  ringShape.lineTo(2.47, -2.47);
  ringShape.lineTo(2.47, 2.47);
  ringShape.lineTo(-2.47, 2.47);
  ringShape.closePath();
  const ringHole = new THREE.Path();
  ringHole.moveTo(-2.42, -2.42);
  ringHole.lineTo(-2.42, 2.42);
  ringHole.lineTo(2.42, 2.42);
  ringHole.lineTo(2.42, -2.42);
  ringHole.closePath();
  ringShape.holes.push(ringHole);
  const ringGeo = new THREE.ShapeGeometry(ringShape).rotateX(-Math.PI / 2);
  const ringMat = new THREE.MeshStandardMaterial({
    color: '#e8b04a',
    emissive: '#e8b04a',
    emissiveIntensity: 0.45,
    transparent: true,
    opacity: 0.55,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  localGeometries.push(ringGeo);
  localMaterials.push(ringMat);
  const ringMesh = new THREE.Mesh(ringGeo, ringMat);
  ringMesh.position.y = 0.01;
  ringMesh.renderOrder = 1;
  ringMesh.userData.noShadow = true;
  ringMesh.userData.cannotReceiveAO = true;
  root.add(ringMesh);

  const hitBox = new THREE.Mesh(
    new THREE.BoxGeometry(3.2, 1.8, 3.2),
    new THREE.MeshBasicMaterial({ visible: false })
  );
  hitBox.position.y = 0.45;
  hitBox.userData.landmarkIndex = -1;
  hitBox.userData.sliceIndex = seed;
  localGeometries.push(hitBox.geometry);
  localMaterials.push(hitBox.material as THREE.Material);

  const cloudGroup = new THREE.Group();
  root.add(cloudGroup);

  const spec: PlaceSliceSpec = {
    landmarkName: 'Coordinate Explorer',
    landmarkIndex: -1,
    province: 'Explorer',
    gridPos: [0, 0],
    subtitle: `${data.center.lat.toFixed(4)}, ${data.center.lon.toFixed(4)} · ${data.source === 'osm' ? 'OpenStreetMap' : 'offline fallback'}`,
  };

  const built: BuiltPlaceSlice = {
    spec,
    root,
    hitBox,
    ringMesh,
    cloudGroup,
    waterMats: [],
    glowMats: [],
    dispose: () => {
      localGeometries.forEach((g) => g.dispose());
      localMaterials.forEach((m) => m.dispose());
      disposables.forEach((d) => d.dispose());
    },
  };

  root.userData.osmStats = {
    buildings: buildingCount,
    roads: data.roads.length,
    water: data.water.length,
    green: data.green.length,
    elevation: Math.round(data.elevationM),
  };

  return { built };
}
