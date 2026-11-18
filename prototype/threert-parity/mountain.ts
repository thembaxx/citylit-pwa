/**
 * THROWAWAY PROTOTYPE — a deliberately simplified Table Mountain, built twice
 * from the same geometry recipe so only the LIGHTING differs between panels.
 * Stand-in for src/three/builders/landmarksA.ts::table().
 */
import * as THREE from 'three';

export interface MountainRefs {
  root: THREE.Group;
  sun: THREE.DirectionalLight;
  fill: THREE.DirectionalLight | null;
  hemi: THREE.HemisphereLight;
  ringMat: THREE.MeshStandardMaterial;
  ringLight: THREE.PointLight | null;
  cloudMats: THREE.MeshStandardMaterial[];
  groundMats: THREE.MeshStandardMaterial[];
  massifMat: THREE.MeshStandardMaterial;
}

export function buildMountain(physical: boolean): MountainRefs {
  const root = new THREE.Group();

  const stone = new THREE.MeshStandardMaterial({ color: '#9a7d58', roughness: 0.93, metalness: 0.02 });
  const grass = new THREE.MeshStandardMaterial({ color: '#436333', roughness: 0.95 });
  const plinthMat = new THREE.MeshStandardMaterial({ color: '#1a1c24', roughness: 0.88 });

  const plinth = new THREE.Mesh(new THREE.CylinderGeometry(8.5, 9, 0.5, 72), plinthMat);
  plinth.position.y = -0.25;
  plinth.receiveShadow = true;
  root.add(plinth);

  const massif = new THREE.Mesh(new THREE.CylinderGeometry(3.6, 4.2, 2.4, 12, 1), stone);
  massif.position.set(0, 1.45, 0);
  massif.castShadow = true;
  massif.receiveShadow = true;
  root.add(massif);

  // Lion's Head / Devil's Peak flanks.
  const lump = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 1), grass.clone());
  lump.scale.set(1.5, 1.15, 1.3);
  lump.position.set(-4.9, 1.0, 1.9);
  lump.castShadow = true;
  root.add(lump);
  const lump2 = lump.clone();
  lump2.material = grass.clone();
  lump2.scale.set(1.6, 1.0, 1.3);
  lump2.position.set(4.6, 0.8, 0.8);
  root.add(lump2);

  // Tablecloth puffs.
  const cloudMats: THREE.MeshStandardMaterial[] = [];
  const cloudGeo = new THREE.IcosahedronGeometry(0.52, 2);
  for (let i = 0; i < 12; i++) {
    const mat = new THREE.MeshStandardMaterial({
      color: '#f4f8ff',
      roughness: 1,
      transparent: true,
      opacity: 0.5,
      depthWrite: false,
    });
    cloudMats.push(mat);
    const puff = new THREE.Mesh(cloudGeo, mat);
    const x = -3 + i * 0.55;
    puff.position.set(x, 2.8 + (i % 3) * 0.1, Math.sqrt(Math.max(0.4, 12 - x * x)) * 0.5);
    puff.scale.set(1.3, 0.6, 1);
    root.add(puff);
  }

  const ringMat = new THREE.MeshStandardMaterial({
    color: '#e8b04a',
    emissive: '#e8b04a',
    emissiveIntensity: 0.35,
    roughness: 0.4,
  });
  const ring = new THREE.Mesh(new THREE.TorusGeometry(8.52, 0.035, 8, 96).rotateX(Math.PI / 2), ringMat);
  ring.position.y = 0.01;
  root.add(ring);

  const ground = new THREE.Mesh(new THREE.CircleGeometry(9, 64).rotateX(-Math.PI / 2), grass);
  ground.position.y = 0.01;
  ground.receiveShadow = true;
  root.add(ground);

  const sun = new THREE.DirectionalLight('#fff5dd', 3.4);
  sun.position.set(12, 18, 10);
  sun.castShadow = !physical; // ThreeRT traces shadows from every light; no shadow maps.
  if (!physical) {
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.camera.left = -10;
    sun.shadow.camera.right = 10;
    sun.shadow.camera.top = 10;
    sun.shadow.camera.bottom = -10;
  }
  const hemi = new THREE.HemisphereLight('#d9e7ff', '#1b1610', physical ? 0.75 : 1);
  const fill = physical ? null : new THREE.DirectionalLight('#4a72b0', 0.8);
  if (fill) fill.position.set(-12, 8, -10);

  let ringLight: THREE.PointLight | null = null;
  if (physical) {
    // The emissive ring is a real light source in ThreeRT. Approximate that here.
    ringLight = new THREE.PointLight('#ffbe52', 6, 16, 2);
    ringLight.position.set(0, 0.35, 0);
    root.add(ringLight);
  }

  return {
    root,
    sun,
    fill,
    hemi,
    ringMat,
    ringLight,
    cloudMats,
    groundMats: [grass, stone, plinthMat],
    massifMat: stone,
  };
}
