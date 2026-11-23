import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import type { LocalPoint, OsmArea, OsmBuilding, OsmPlaceData } from '../services/osmService';
import { addStreetLampSet, type StreetLampSpec } from './builders/dioramaKit';
import { instancedMeshes, type InstanceTransform } from './builders/primitives';
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

/* ------------------------------------------------------------------ */
/* OSM tag-driven dressing                                             */
/*                                                                      */
/* osmService currently exposes `kind`, `height` and `width`. The tag    */
/* reader below also accepts the raw `roof:shape`, `building:colour` and  */
/* `building:levels` fields when the service starts forwarding them, so  */
/* this file needs no change at that point. Until then, kind and height  */
/* (already derived from building:levels) drive the same vocabulary.     */
/* ------------------------------------------------------------------ */

type RoofShape = 'gable' | 'hip' | 'flat' | 'dome';

function readTag(obj: object, key: string, camel: string): string | undefined {
  const bag = obj as Record<string, unknown>;
  const raw = bag[key] ?? bag[camel] ?? (bag.tags as Record<string, string> | undefined)?.[key];
  return typeof raw === 'string' || typeof raw === 'number' ? String(raw) : undefined;
}

function roofInfo(building: OsmBuilding): { shape: RoofShape; colour: string; peak: number } {
  const tag = (readTag(building, 'roof:shape', 'roofShape') ?? '').toLowerCase();
  const colour = readTag(building, 'building:colour', 'buildingColour');
  const levelsTag = Number(readTag(building, 'building:levels', 'buildingLevels'));
  const levels = Number.isFinite(levelsTag) && levelsTag > 0
    ? levelsTag
    : Math.max(1, Math.round(building.height / 3));
  const kind = building.kind ?? '';
  const shape: RoofShape = tag.includes('dome')
    ? 'dome'
    : tag.includes('flat') || kind === 'commercial' || kind === 'retail' || kind === 'industrial'
      ? 'flat'
      : tag.includes('hip')
        ? 'hip'
        : 'gable';
  const palette: Record<RoofShape, string> = {
    gable: kind === 'church' || kind === 'cathedral' ? '#7d5a46' : '#8f5f45',
    hip: '#6d5946',
    flat: '#8c8880',
    dome: '#b0a486',
  };
  return {
    shape,
    colour: colour ?? palette[shape],
    peak: 0.12 + Math.min(4, levels) * 0.024,
  };
}

function roofGeometry(shape: RoofShape): THREE.BufferGeometry {
  // Every variant has its footprint centred on X/Z and its base at Y=0, so a
  // single instance transform built from the OSM outline seats it on the wall.
  if (shape === 'gable') {
    const profile = new THREE.Shape();
    profile.moveTo(-0.5, 0);
    profile.lineTo(0, 0.5);
    profile.lineTo(0.5, 0);
    profile.closePath();
    const geo = new THREE.ExtrudeGeometry(profile, { depth: 1, bevelEnabled: false });
    geo.translate(0, 0, -0.5);
    return geo;
  }
  if (shape === 'hip') {
    const geo = new THREE.ConeGeometry(0.71, 0.5, 4);
    geo.rotateY(Math.PI / 4);
    geo.translate(0, 0.25, 0);
    return geo;
  }
  if (shape === 'dome') {
    return new THREE.SphereGeometry(0.5, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2);
  }
  return new THREE.BoxGeometry(1, 0.08, 1).translate(0, 0.04, 0);
}

function roadFootprints(path: readonly LocalPoint[], units: number) {
  let total = 0;
  const lengths: number[] = [];
  for (let i = 0; i < path.length - 1; i++) {
    const dx = (path[i + 1].x - path[i].x) * units;
    const dz = (path[i + 1].z - path[i].z) * units;
    const len = Math.hypot(dx, dz);
    lengths.push(len);
    total += len;
  }
  return { lengths, total };
}

function pointOnRoad(
  path: readonly LocalPoint[],
  lengths: readonly number[],
  total: number,
  fraction: number,
  units: number
): { x: number; z: number; dx: number; dz: number } {
  const target = total * fraction;
  let walked = 0;
  for (let i = 0; i < lengths.length; i++) {
    if (walked + lengths[i] >= target || i === lengths.length - 1) {
      const t = lengths[i] > 1e-5 ? (target - walked) / lengths[i] : 0;
      const dx = (path[i + 1].x - path[i].x) * units;
      const dz = (path[i + 1].z - path[i].z) * units;
      return {
        x: (path[i].x + (path[i + 1].x - path[i].x) * t) * units,
        z: (path[i].z + (path[i + 1].z - path[i].z) * t) * units,
        dx,
        dz,
      };
    }
    walked += lengths[i];
  }
  const last = path[path.length - 1];
  return { x: last.x * units, z: last.z * units, dx: 1, dz: 0 };
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
  const roads = data.roads.filter((road) => withinPatch(road.path));
  roads.forEach((road) => {
    const geo = createRibbon(road.path, road.width, units, heightAt);
    if (!geo) return;
    localGeometries.push(geo);
    root.add(new THREE.Mesh(geo, roadMat));
  });

  // Lane markings, zebra crossings and sidewalk strips are all derived from
  // the real `highway=*` kind/width and batched into four instanced/merged
  // meshes — one per surface type, independent of the number of ways.
  const markingTransforms: InstanceTransform[] = [];
  const markingColors: THREE.ColorRepresentation[] = [];
  const sidewalkGeos: THREE.BufferGeometry[] = [];
  const majorRoads = roads.filter((r) => r.width >= 8);
  for (const road of roads) {
    const isMajor = road.width >= 8;
    const { lengths, total } = roadFootprints(road.path, units);
    if (total < 0.05) continue;
    const dashes = Math.min(24, Math.floor(total / 0.16));
    for (let i = 1; i < dashes; i += 2) {
      const p = pointOnRoad(road.path, lengths, total, i / dashes, units);
      markingTransforms.push({
        x: p.x,
        y: heightAt(p.x, p.z) + 0.027,
        z: p.z,
        ry: -Math.atan2(p.dz, p.dx),
        sx: 0.07,
        sy: 1,
        sz: 0.012,
      });
      markingColors.push(isMajor ? '#e8c45a' : '#dcdcd2');
    }
    if (isMajor) {
      // One zebra crossing near the middle of each arterial.
      const p = pointOnRoad(road.path, lengths, total, 0.5, units);
      const len = Math.hypot(p.dx, p.dz) || 1;
      const nx = -p.dz / len;
      const nz = p.dx / len;
      for (let s = -2; s <= 2; s++) {
        markingTransforms.push({
          x: p.x + nx * s * 0.055,
          y: heightAt(p.x, p.z) + 0.029,
          z: p.z + nz * s * 0.055,
          ry: -Math.atan2(p.dz, p.dx),
          sx: 0.03,
          sy: 1,
          sz: 0.035,
        });
        markingColors.push('#f2f1e6');
      }
      // Two raised sidewalk ribbons, offset beyond the carriageway edge.
      for (const side of [-1, 1]) {
        const offsetPath = road.path.map((node, i) => {
          const prev = road.path[Math.max(0, i - 1)];
          const next = road.path[Math.min(road.path.length - 1, i + 1)];
          const dx = next.x - prev.x;
          const dz = next.z - prev.z;
          const l = Math.hypot(dx, dz) || 1;
          const span = road.width * 0.5 + 0.18;
          return {
            x: node.x + (-dz / l) * side * span,
            z: node.z + (dx / l) * side * span,
          };
        });
        const strip = createRibbon(offsetPath, 0.3, units, (x, z) => heightAt(x, z) + 0.016);
        if (strip) sidewalkGeos.push(strip);
      }
    }
  }
  if (sidewalkGeos.length) {
    const merged = mergeGeometries(sidewalkGeos, false);
    sidewalkGeos.forEach((g) => g.dispose());
    if (merged) {
      localGeometries.push(merged);
      const walkMat = new THREE.MeshStandardMaterial({
        color: '#a9a49a',
        roughness: 0.95,
        side: THREE.DoubleSide,
      });
      localMaterials.push(walkMat);
      root.add(new THREE.Mesh(merged, walkMat));
    }
  }
  if (markingTransforms.length) {
    const dashGeo = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2);
    localGeometries.push(dashGeo);
    const markMat = new THREE.MeshStandardMaterial({
      roughness: 0.92,
      side: THREE.DoubleSide,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    });
    localMaterials.push(markMat);
    instancedMeshes(root, dashGeo, markMat, markingTransforms, markingColors);
  }

  // Street lamps sample the real centre lines; every hardware/bulb/pool batch
  // is instanced by addStreetLampSet and no point light is ever created here.
  const lampSpecs: StreetLampSpec[] = [];
  for (const road of majorRoads) {
    const { lengths, total } = roadFootprints(road.path, units);
    if (total < 0.6) continue;
    const slots = Math.min(3, Math.floor(total / 0.9));
    for (let k = 0; k < slots && lampSpecs.length < 16; k++) {
      const p = pointOnRoad(road.path, lengths, total, (k + 0.5) / slots, units);
      const len = Math.hypot(p.dx, p.dz) || 1;
      const side = k % 2 === 0 ? 1 : -1;
      const lx = p.x + (-p.dz / len) * side * 0.19;
      const lz = p.z + (p.dx / len) * side * 0.19;
      lampSpecs.push({
        x: lx,
        y: heightAt(lx, lz) + 0.012,
        z: lz,
        kind: road.kind === 'primary' || road.kind === 'secondary' ? 'cobra' : 'lantern',
        ry: -Math.atan2(p.dz, p.dx),
        scale: 0.52,
        color: '#ffd08a',
        poolRadius: 0.5,
      });
    }
  }
  if (lampSpecs.length) {
    addStreetLampSet(root, lampSpecs, { anchors: false, contactShadows: false });
  }

  // Extruded building footprints. Height comes from OSM levels where present.
  const buildingMats = new Map<string, THREE.MeshStandardMaterial>();
  const roofInstances: Array<{ shape: RoofShape; color: string; transform: InstanceTransform }> = [];
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

    const roof = roofInfo(building);
    let minX = Infinity;
    let maxX = -Infinity;
    let minZ = Infinity;
    let maxZ = -Infinity;
    for (const node of building.outline) {
      const px = node.x * units;
      const pz = node.z * units;
      if (px < minX) minX = px;
      if (px > maxX) maxX = px;
      if (pz < minZ) minZ = pz;
      if (pz > maxZ) maxZ = pz;
    }
    roofInstances.push({
      shape: roof.shape,
      color: roof.colour,
      transform: {
        x: (minX + maxX) * 0.5,
        y: heightAt(c.x * units, c.z * units) + Math.max(0.04, building.height * units) + 0.006,
        z: (minZ + maxZ) * 0.5,
        sx: Math.max(0.1, maxX - minX) * 1.04,
        sy: roof.peak,
        sz: Math.max(0.1, maxZ - minZ) * 1.04,
      },
    });
  });

  // One instanced mesh per roof shape; colour comes from building:colour (or
  // the kind-based palette) through per-instance colour, so tag variety costs
  // no extra draw calls.
  const roofMat = new THREE.MeshStandardMaterial({ roughness: 0.86, metalness: 0.02 });
  localMaterials.push(roofMat);
  (['gable', 'hip', 'flat', 'dome'] as const).forEach((shape) => {
    const group = roofInstances.filter((r) => r.shape === shape);
    if (!group.length) return;
    const geo = roofGeometry(shape);
    localGeometries.push(geo);
    instancedMeshes(
      root,
      geo,
      roofMat,
      group.map((r) => r.transform),
      group.map((r) => r.color)
    );
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
