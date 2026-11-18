/**
 * THROWAWAY PROTOTYPE — interactive side-by-side lighting comparison.
 * LEFT  = today's citylit WebGL approach (IBL + hemi/key/fill + shadow maps + bloom-style emissive).
 * RIGHT = ThreeRT-style physical lighting, APPROXIMATED in three.js (no path tracer on this machine).
 */
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import report from './parity.json';
import { buildMountain, type MountainRefs } from './mountain';

interface Panel {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  controls: OrbitControls;
  refs: MountainRefs;
  pmrem?: THREE.PMREMGenerator;
  envTex?: THREE.Texture;
}

const params = {
  sunAlt: 28,
  azimuth: 100,
  emissive: 0.35,
  wetness: 0,
  cloud: 0.5,
  quality: 'high',
};

function makePanel(host: HTMLElement, physical: boolean): Panel {
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setSize(host.clientWidth, host.clientHeight);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = physical ? 1.0 : 1.08;
  renderer.shadowMap.enabled = !physical;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  host.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(physical ? '#101824' : '#0e0f13');
  scene.fog = new THREE.FogExp2(physical ? '#b9c9d8' : '#0e0f13', physical ? 0.008 : 0.01);

  const camera = new THREE.PerspectiveCamera(42, host.clientWidth / host.clientHeight, 0.2, 200);
  camera.position.set(11.5, 6.2, 13);
  camera.lookAt(0, 1.5, 0);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 1.5, 0);
  controls.enableDamping = true;
  controls.enablePan = false;
  controls.minDistance = 6;
  controls.maxDistance = 30;

  let pmrem: THREE.PMREMGenerator | undefined;
  let envTex: THREE.Texture | undefined;
  if (!physical) {
    pmrem = new THREE.PMREMGenerator(renderer);
    envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = envTex;
    scene.environmentIntensity = 0.45;
  }

  const refs = buildMountain(physical);
  scene.add(refs.root);
  if (refs.fill) scene.add(refs.fill);
  scene.add(refs.sun, refs.hemi);
  return { renderer, scene, camera, controls, refs, pmrem, envTex };
}

const left = makePanel(document.getElementById('view-today')!, false);
const right = makePanel(document.getElementById('view-three')!, true);

function applyParams(): void {
  const alt = THREE.MathUtils.degToRad(params.sunAlt);
  const az = THREE.MathUtils.degToRad(params.azimuth);
  const sunPos = new THREE.Vector3(
    20 * Math.cos(alt) * Math.cos(az),
    20 * Math.sin(alt),
    20 * Math.cos(alt) * Math.sin(az)
  );
  // Low sun = warm + dimmer, mirroring a physical atmosphere.
  const warm = 1 - THREE.MathUtils.smoothstep(params.sunAlt, 4, 32);
  const sunColor = new THREE.Color('#fff5dd').lerp(new THREE.Color('#ff9a52'), warm * 0.8);

  for (const p of [left, right]) {
    p.refs.sun.position.copy(sunPos);
    p.refs.sun.color.copy(sunColor);
    // SkyAtmosphere contributes real sky radiance; approximate with a stronger hemisphere term.
    p.refs.hemi.intensity = p === right ? 0.9 + params.sunAlt / 90 * 0.8 : 1;
    p.refs.ringMat.emissiveIntensity = params.emissive;
    for (const m of p.refs.cloudMats) m.opacity = params.cloud * 0.9;
    if (p.refs.ringLight) p.refs.ringLight.intensity = params.emissive * 18;

    if (p === left) {
      // Today: wetness is faked by tweaking roughness / env intensity.
      p.refs.groundMats.forEach((m, i) => {
        m.roughness = [0.95, 0.93, 0.88][i] * (1 - params.wetness * 0.6);
        m.envMapIntensity = 0.45 + params.wetness * 0.85;
      });
      p.renderer.setPixelRatio(
        params.quality === 'high' ? Math.min(devicePixelRatio, 2) : params.quality === 'balanced' ? 1.3 : 1
      );
    } else {
      // ThreeRT: wetness is an engine environment flag (real reflections).
      p.refs.groundMats.forEach((m, i) => {
        m.roughness = [0.95, 0.93, 0.88][i] * (1 - params.wetness * 0.75);
      });
      (p.scene.fog as THREE.FogExp2).density = 0.004 + params.cloud * 0.012 + params.wetness * 0.004;
    }
  }
  renderState();
}

function bindSlider(id: string, key: keyof typeof params): void {
  const el = document.getElementById(id) as HTMLInputElement;
  el.addEventListener('input', () => {
    (params as any)[key] = parseFloat(el.value);
    applyParams();
  });
}
bindSlider('sunAlt', 'sunAlt');
bindSlider('emissive', 'emissive');
bindSlider('wetness', 'wetness');
bindSlider('cloud', 'cloud');
(document.getElementById('quality') as HTMLSelectElement).addEventListener('change', (e) => {
  params.quality = (e.target as HTMLSelectElement).value;
  applyParams();
});
document.querySelectorAll<HTMLButtonElement>('[data-preset]').forEach((btn) => {
  btn.addEventListener('click', () => {
    params.sunAlt = parseFloat(btn.dataset.preset!);
    (document.getElementById('sunAlt') as HTMLInputElement).value = String(params.sunAlt);
    applyParams();
  });
});
document.querySelectorAll<HTMLButtonElement>('[data-tab]').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('[data-tab]').forEach((b) => b.classList.remove('active'));
    document.querySelectorAll('.walk').forEach((p) => p.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(`walk-${btn.dataset.tab}`)!.classList.add('active');
  });
});

function renderState(): void {
  const facts = {
    sunAltitudeDeg: params.sunAlt,
    // 90,000 lux is the ThreeRT hello-world sun from the README.
    threeRT_sunLux: Math.round((report.sunLight?.intensity ?? 90000) * (0.3 + params.sunAlt / 90)),
    threeRT_sky: report.environment?.skyType,
    emissiveRingIntensity: params.emissive,
    emissiveIsLightSource: params.emissive > 0,
    wetness: params.wetness,
    wetnessImpl:
      params.wetness > 0
        ? 'TODAY: roughness + envMapIntensity hack · ThreeRT: environment.wetness (real reflections)'
        : 'dry',
    quality: params.quality,
    qualityImpl:
      params.quality === 'high'
        ? 'TODAY: pixelRatio 2 + shadows · ThreeRT: preset "cinematic" + spp'
        : params.quality === 'balanced'
          ? 'TODAY: pixelRatio 1.3 · ThreeRT: preset "preview"'
          : 'TODAY: pixelRatio 1, no shadows · ThreeRT: lower spp + denoise',
    bindableObjects: report.binding?.counts?.objects,
    recordedEngineCalls: report.engineCallCounts,
  };
  document.getElementById('state')!.textContent = JSON.stringify(facts, null, 2);
  document.getElementById('sunAlt-out')!.textContent = `${params.sunAlt}°`;
  document.getElementById('emissive-out')!.textContent = params.emissive.toFixed(2);
  document.getElementById('wetness-out')!.textContent = params.wetness.toFixed(2);
  document.getElementById('cloud-out')!.textContent = params.cloud.toFixed(2);
}

function renderReport(): void {
  document.getElementById('report-facts')!.innerHTML = `
    <div><b>${report.binding?.counts?.objects}</b> objects bound</div>
    <div><b>${report.sunLight?.intensity?.toLocaleString()}</b> ${report.sunLight?.unit} sun</div>
    <div><b>${report.environment?.skyType}</b> sky</div>
    <div><b>${report.volumeObjects?.length ?? 0}</b> volumetric fog object</div>
    <div><b>${report.emissiveMaterials?.length ?? 0}</b> emissive material</div>`;
  document.getElementById('port-map')!.innerHTML = (report.citylitPortMap as any[])
    .map(
      (r) =>
        `<tr><td>${r.citylit}</td><td>${r.threeRT}</td><td><span class="tag ${r.status.split(' ')[0]}">${r.status}</span></td></tr>`
    )
    .join('');
  document.getElementById('caveats')!.innerHTML = (report.caveats as string[])
    .map((c) => `<li>${c}</li>`)
    .join('');
}
renderReport();
applyParams();

function animate(): void {
  requestAnimationFrame(animate);
  left.controls.update();
  right.controls.update();
  left.renderer.render(left.scene, left.camera);
  right.renderer.render(right.scene, right.camera);
}
animate();

const resize = () => {
  for (const [host, p] of [
    [document.getElementById('view-today')!, left],
    [document.getElementById('view-three')!, right],
  ] as [HTMLElement, Panel][]) {
    const w = host.clientWidth;
    const h = host.clientHeight;
    p.camera.aspect = w / h;
    p.camera.updateProjectionMatrix();
    p.renderer.setSize(w, h);
  }
};
window.addEventListener('resize', resize);
resize();
