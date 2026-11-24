import { chromium } from 'playwright';

const browser = await chromium.launch({
  headless: true,
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
const page = await browser.newPage({ viewport: { width: 1200, height: 800 } });
await page.goto('http://127.0.0.1:3002/?creatures=on#boulders-beach', {
  waitUntil: 'load',
  timeout: 60_000,
});
await page.waitForTimeout(9000);
const info = await page.evaluate(() => {
  const engine = window.citylitEngine;
  const group = engine?.scene?.getObjectByName('creatures:Boulders Beach');
  if (!group) return { error: 'missing' };
  const camera = engine.camera;
  const rows = [];
  for (const fg of group.children) {
    for (const mesh of fg.children) {
      if (!mesh.isInstancedMesh || mesh.material?.type !== 'MeshStandardMaterial') continue;
      const m = mesh.instanceMatrix.array;
      const v = camera.position.clone();
      v.set(m[12], m[13], m[14]);
      fg.localToWorld(v);
      const world = v.toArray();
      const dist = v.distanceTo(camera.position);
      v.project(camera);
      const sphere = mesh.geometry.boundingSphere;
      const radius = sphere ? sphere.radius : 0;
      const px = (radius * Math.hypot(m[0], m[1], m[2]) * 800) / (2 * dist * Math.tan((camera.fov * Math.PI) / 360));
      rows.push({
        count: mesh.count,
        groupVisible: fg.visible,
        scale: [m[0], m[5], m[10]].map((n) => Number(n.toFixed(3))),
        world: world.map((n) => Number(n.toFixed(2))),
        ndc: [Number(v.x.toFixed(2)), Number(v.y.toFixed(2)), Number(v.z.toFixed(3))],
        radius: Number(radius.toFixed(3)),
        px: Number(px.toFixed(1)),
        colorAttr: Boolean(mesh.geometry.attributes.color),
        instanceColor: Boolean(mesh.instanceColor),
        renderOrder: mesh.renderOrder,
        layersMask: mesh.layers.mask,
        cameraLayers: camera.layers.mask,
      });
      break;
    }
  }
  return {
    cameraDistance: engine.camera.position.length(),
    fov: camera.fov,
    calls: engine.renderer?.info?.render?.calls ?? null,
    triangles: engine.renderer?.info?.render?.triangles ?? null,
    rows,
  };
});
console.log(JSON.stringify(info, null, 2));
await browser.close();
