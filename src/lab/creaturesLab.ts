/**
 * Dev-only creature Lab (`?lab=creatures`).
 *
 * A turntable + orbit-inspect view of every species with the full animation-state
 * selector (idle, walk, run, fly, swim, eat, react), LOD selector (0/1/2),
 * wind/time-of-day sliders (driving live sun/sky lighting), wireframe + overdraw
 * toggles, live instance/triangle/draw-call/FPS counters and 1x / 0.25x speed.
 * Excluded from production: `main.tsx` only dynamic-imports this module under
 * `import.meta.env.DEV`.
 */
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { CreatureEffectsPool } from '../three/creatures/effects';
import { CREATURE_ENV, setCreatureEnvironment } from '../three/creatures/env';
import { CreatureField } from '../three/creatures/field';
import type { SpeciesId } from '../three/creatures/habitat';
import {
  CREATURE_ANIM_STATES,
  updateCreatureUniforms,
  type CreatureAnimState,
} from '../three/creatures/material';
import { SPECIES, SPECIES_IDS, type SpeciesLod } from '../three/creatures/species';

const ZONE_BY_SPECIES: Record<SpeciesId, 'ground' | 'air' | 'water'> = {
  gull: 'air',
  penguin: 'ground',
  fish: 'water',
  dolphin: 'water',
  whale: 'water',
  gemsbok: 'ground',
  meerkat: 'ground',
  vulture: 'air',
  butterfly: 'air',
  bat: 'air',
};

const ACCENT = '#8fd6b4';

function styleButton(button: HTMLButtonElement, active: boolean): void {
  button.style.background = active ? ACCENT : 'rgba(255,255,255,0.08)';
  button.style.color = active ? '#10201a' : '#e7ece9';
}

const SKY_DAWN = new THREE.Color('#3b3140');
const SKY_DAY = new THREE.Color('#203344');
const SKY_DUSK = new THREE.Color('#3e2d34');
const SKY_NIGHT = new THREE.Color('#0c1118');
const KEY_DAY = new THREE.Color('#fff2dc');
const KEY_WARM = new THREE.Color('#ffb67a');
const KEY_NIGHT = new THREE.Color('#7ca3d6');
const tmpSky = new THREE.Color();
const tmpKey = new THREE.Color();

export function mountCreaturesLab(root: HTMLElement): void {
  root.innerHTML = '';
  root.style.cssText =
    'position:fixed;inset:0;background:#101418;color:#e7ece9;font:13px/1.4 system-ui,sans-serif;overflow:hidden;';

  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block;';
  root.appendChild(canvas);

  // Avoid backdrop-filter over an active WebGL canvas so software/compositor stays crisp.
  const panel = document.createElement('div');
  panel.style.cssText =
    'position:absolute;top:14px;left:14px;width:268px;max-height:calc(100vh - 28px);overflow-y:auto;' +
    'padding:14px;border-radius:14px;background:rgba(16,20,24,0.92);' +
    'border:1px solid rgba(255,255,255,0.12);display:flex;flex-direction:column;gap:9px;';
  root.appendChild(panel);

  const title = document.createElement('div');
  title.textContent = 'Creature Lab';
  title.style.cssText = 'font-weight:650;font-size:15px;letter-spacing:0.01em;';
  panel.appendChild(title);

  const subtitle = document.createElement('div');
  subtitle.textContent = 'Dev only · ?lab=creatures';
  subtitle.style.cssText = 'font-size:11px;opacity:0.6;margin-top:-6px;';
  panel.appendChild(subtitle);

  const selectStyle =
    'width:100%;padding:6px;border-radius:8px;background:#1b2228;color:#e7ece9;border:1px solid #2d3841;';

  const speciesRow = document.createElement('div');
  speciesRow.style.cssText = 'display:flex;gap:6px;align-items:center;';
  const prevBtn = smallButton('‹');
  prevBtn.style.flex = '0 0 32px';
  const speciesSelect = document.createElement('select');
  speciesSelect.style.cssText = `${selectStyle};flex:1;`;
  for (const id of SPECIES_IDS) {
    const option = document.createElement('option');
    option.value = id;
    option.textContent = SPECIES[id].label;
    speciesSelect.appendChild(option);
  }
  const nextBtn = smallButton('›');
  nextBtn.style.flex = '0 0 32px';
  speciesRow.append(prevBtn, speciesSelect, nextBtn);
  panel.appendChild(labelled('Species', speciesRow));

  const stateSelect = document.createElement('select');
  stateSelect.style.cssText = selectStyle;
  const autoOpt = document.createElement('option');
  autoOpt.value = 'auto';
  autoOpt.textContent = 'Auto (state machine)';
  stateSelect.appendChild(autoOpt);
  for (const st of CREATURE_ANIM_STATES) {
    const node = document.createElement('option');
    node.value = st;
    node.textContent = st;
    stateSelect.appendChild(node);
  }
  panel.appendChild(labelled('Animation state', stateSelect));

  const lodRow = document.createElement('div');
  lodRow.style.cssText = 'display:flex;gap:6px;';
  const lodButtons: HTMLButtonElement[] = ([0, 1, 2] as SpeciesLod[]).map((lod) => {
    const b = smallButton(`LOD ${lod}`);
    lodRow.appendChild(b);
    return b;
  });
  panel.appendChild(labelled('Level of detail', lodRow));

  const wind = slider('Wind', 0, 4, 0.6, 0.1, (value) => {
    setCreatureEnvironment({ wind: value });
  });
  panel.appendChild(wind.node);

  const hour = slider('Time of day', 0, 24, 12, 0.5, (value) => {
    setCreatureEnvironment({ hour: value, night: value < 6 || value >= 19 ? 1 : 0 });
    applyLightingForHour(value);
  });
  panel.appendChild(hour.node);

  const toggles = document.createElement('div');
  toggles.style.cssText = 'display:flex;gap:6px;';
  panel.appendChild(toggles);
  const wireButton = smallButton('Wire');
  const overdrawButton = smallButton('Overdraw');
  const spinButton = smallButton('Spin');
  toggles.append(wireButton, overdrawButton, spinButton);

  const speedRow = document.createElement('div');
  speedRow.style.cssText = 'display:flex;gap:6px;align-items:center;';
  const speedLabel = document.createElement('span');
  speedLabel.textContent = 'Speed';
  speedLabel.style.cssText = 'opacity:0.65;flex:1;';
  speedRow.appendChild(speedLabel);
  const speedFull = smallButton('1×');
  const speedQuarter = smallButton('0.25×');
  speedRow.append(speedFull, speedQuarter);
  panel.appendChild(speedRow);

  const counters = document.createElement('div');
  counters.style.cssText =
    'font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:11px;line-height:1.55;' +
    'background:rgba(255,255,255,0.05);border-radius:8px;padding:8px;white-space:pre;';
  panel.appendChild(counters);

  const actionRow = document.createElement('div');
  actionRow.style.cssText = 'display:flex;gap:6px;';
  const reactButton = smallButton('Trigger react');
  const captureButton = smallButton('Freeze @ 3s');
  actionRow.append(reactButton, captureButton);
  panel.appendChild(actionRow);

  /* -------------------------- renderer + scene ------------------------- */

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.25;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(SKY_DAY);
  scene.fog = new THREE.Fog(SKY_DAY, 8, 22);

  const pmrem = new THREE.PMREMGenerator(renderer);
  const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environment = envTex;

  const camera = new THREE.PerspectiveCamera(38, 1, 0.05, 60);
  camera.position.set(1.9, 1.45, 2.85);

  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = 0.06;
  controls.target.set(0, 0.35, 0);
  controls.minDistance = 0.9;
  controls.maxDistance = 8.5;
  controls.maxPolarAngle = Math.PI * 0.49;

  const hemi = new THREE.HemisphereLight('#cfe4f2', '#2a2a24', 1.1);
  scene.add(hemi);
  const key = new THREE.DirectionalLight('#fff2dc', 2.2);
  key.position.set(4, 6, 5);
  scene.add(key);
  const rim = new THREE.DirectionalLight('#9fc7e8', 0.95);
  rim.position.set(-5, 3, -4);
  scene.add(rim);

  const turntable = new THREE.Group();
  scene.add(turntable);

  const plinth = new THREE.Mesh(
    new THREE.CylinderGeometry(1.35, 1.4, 0.12, 48),
    new THREE.MeshStandardMaterial({ color: '#2b3339', roughness: 0.7, metalness: 0.1 })
  );
  plinth.position.y = -0.06;
  turntable.add(plinth);
  const grid = new THREE.GridHelper(4, 16, '#2f3b44', '#212a31');
  grid.position.y = 0.001;
  turntable.add(grid);

  const effects = new CreatureEffectsPool(0);
  turntable.add(effects.group);

  const overdrawMaterial = new THREE.MeshBasicMaterial({
    color: '#ffffff',
    transparent: true,
    opacity: 0.09,
    blending: THREE.AdditiveBlending,
    depthTest: false,
    depthWrite: false,
  });

  function applyLightingForHour(h: number): void {
    const norm = ((h % 24) + 24) % 24;
    const sunElev = Math.sin(((norm - 6) / 12) * Math.PI); // +1 noon, 0 at 6/18, -1 midnight
    const dayness = THREE.MathUtils.smoothstep(sunElev, -0.25, 0.35);
    const horizon = Math.exp(-Math.pow(sunElev * 3.2, 2)); // peaks near 6h / 18h
    const isMorning = norm < 12;

    if (sunElev >= 0) {
      tmpSky.copy(SKY_DAY).lerp(isMorning ? SKY_DAWN : SKY_DUSK, horizon * 0.85);
      tmpKey.copy(KEY_DAY).lerp(KEY_WARM, horizon * 0.8);
    } else {
      tmpSky.copy(SKY_NIGHT).lerp(isMorning ? SKY_DAWN : SKY_DUSK, horizon * 0.85);
      tmpKey.copy(KEY_NIGHT).lerp(KEY_WARM, horizon * 0.65);
    }

    if (!overdraw) {
      (scene.background as THREE.Color).copy(tmpSky);
      if (scene.fog instanceof THREE.Fog) scene.fog.color.copy(tmpSky);
    }
    key.color.copy(tmpKey);
    key.intensity = 0.55 + 1.85 * dayness;
    const az = ((norm - 6) / 12) * Math.PI;
    key.position.set(Math.cos(az) * 5, 1.4 + Math.max(0, sunElev) * 5.2, Math.sin(az) * 4 + 2);
    hemi.intensity = 0.45 + 0.75 * dayness;
    rim.intensity = 0.65 + 0.45 * (1 - dayness);
  }

  let field: CreatureField | null = null;
  let currentLod: SpeciesLod = 0;
  let wireframe = false;
  let overdraw = false;
  let autoSpin = true;
  let speed = 1;
  let simTime = 0;
  let stateOverride: CreatureAnimState | null = null;

  const zonedScale = (species: SpeciesId): [number, number] => {
    if (species === 'whale') return [0.5, 0.56];
    if (species === 'dolphin') return [0.86, 0.96];
    if (species === 'fish') return [1.7, 2];
    if (species === 'butterfly' || species === 'bat') return [2.8, 3.2];
    if (species === 'meerkat' || species === 'penguin') return [2.3, 2.6];
    return [1, 1.15];
  };

  const buildField = (species: SpeciesId): void => {
    if (field) {
      turntable.remove(field.group);
      field.dispose();
      field = null;
    }
    const zone = ZONE_BY_SPECIES[species];
    field = new CreatureField({
      species,
      count: 5,
      seed: `lab:${species}`,
      innerRadius: 0.55,
      outerRadius: 1.0,
      zone,
      groundY: zone === 'water' ? 0.02 : 0,
      scaleRange: zonedScale(species),
      tier: currentLod,
      lod: currentLod,
      effects,
      minSeparation: 0.28,
    });
    turntable.add(field.group);
    field.setStateOverride(stateOverride);
    field.setWireframe(wireframe);
  };

  const syncLodButtons = (): void => {
    lodButtons.forEach((b, idx) => styleButton(b, idx === currentLod));
  };

  setCreatureEnvironment({ tier: 0, software: false, month: 1, wind: 0.6, hour: 12 });
  applyLightingForHour(12);
  buildField('gull');
  syncLodButtons();

  /* ------------------------------ controls ----------------------------- */

  const stepSpecies = (delta: number): void => {
    const idx = SPECIES_IDS.indexOf(speciesSelect.value as SpeciesId);
    const nextIdx = (idx + delta + SPECIES_IDS.length) % SPECIES_IDS.length;
    speciesSelect.value = SPECIES_IDS[nextIdx];
    buildField(SPECIES_IDS[nextIdx]);
    updateCounters();
  };

  prevBtn.addEventListener('click', () => stepSpecies(-1));
  nextBtn.addEventListener('click', () => stepSpecies(1));

  speciesSelect.addEventListener('change', () => {
    buildField(speciesSelect.value as SpeciesId);
    updateCounters();
  });

  stateSelect.addEventListener('change', () => {
    stateOverride =
      stateSelect.value === 'auto' ? null : (stateSelect.value as CreatureAnimState);
    field?.setStateOverride(stateOverride);
    updateCounters();
  });

  lodButtons.forEach((btn, idx) => {
    btn.addEventListener('click', () => {
      currentLod = idx as SpeciesLod;
      setCreatureEnvironment({ tier: currentLod });
      syncLodButtons();
      buildField(speciesSelect.value as SpeciesId);
      updateCounters();
    });
  });

  wireButton.addEventListener('click', () => {
    wireframe = !wireframe;
    field?.setWireframe(wireframe);
    styleButton(wireButton, wireframe);
  });

  overdrawButton.addEventListener('click', () => {
    overdraw = !overdraw;
    styleButton(overdrawButton, overdraw);
    scene.overrideMaterial = overdraw ? overdrawMaterial : null;
    if (overdraw) {
      scene.background = new THREE.Color('#05070a');
      if (scene.fog instanceof THREE.Fog) scene.fog.color.set('#05070a');
    } else {
      applyLightingForHour(CREATURE_ENV.hour);
    }
  });

  spinButton.addEventListener('click', () => {
    autoSpin = !autoSpin;
    styleButton(spinButton, autoSpin);
  });

  speedFull.addEventListener('click', () => {
    speed = 1;
    styleButton(speedFull, true);
    styleButton(speedQuarter, false);
  });
  speedQuarter.addEventListener('click', () => {
    speed = 0.25;
    styleButton(speedFull, false);
    styleButton(speedQuarter, true);
  });
  styleButton(speedFull, true);
  styleButton(wireButton, false);
  styleButton(overdrawButton, false);
  styleButton(spinButton, true);

  reactButton.addEventListener('click', () => {
    field?.triggerReaction(undefined, 1.5);
  });

  captureButton.addEventListener('click', () => {
    if (!field) return;
    simTime = 3;
    field.advanceForCapture(3);
    effects.update(0.1);
    updateCounters();
  });

  let last = performance.now();
  let frameMs = 0;
  let updateMs = 0;
  let fpsSmoothed = 60;
  let frames = 0;

  const resize = (): void => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    renderer.setSize(width, height, false);
    camera.aspect = width / Math.max(1, height);
    camera.updateProjectionMatrix();
  };
  window.addEventListener('resize', resize);
  resize();

  const updateCounters = (): void => {
    const stats = field?.stats();
    const fxStats = effects.stats();
    const info = renderer.info.render;
    counters.textContent = [
      `species    ${speciesSelect.value} (LOD ${currentLod})`,
      `instances  ${stats?.instances ?? 0}`,
      `triangles  ${info.triangles}`,
      `draw calls ${info.calls} (fx:${fxStats.drawCalls})`,
      `fps        ${fpsSmoothed.toFixed(0)} (${frameMs.toFixed(2)} ms)`,
      `update     ${updateMs.toFixed(2)} ms`,
      `motion     ${CREATURE_ENV.motion.toFixed(2)} · wind ${CREATURE_ENV.wind.toFixed(1)}`,
    ].join('\n');
  };

  let rafId = 0;
  const loop = (): void => {
    const now = performance.now();
    const realDt = Math.min(0.1, (now - last) / 1000);
    last = now;
    if (realDt > 0.0005) {
      const instFps = 1 / realDt;
      fpsSmoothed = fpsSmoothed * 0.9 + instFps * 0.1;
    }
    const dt = realDt * speed;
    simTime += dt;
    updateCreatureUniforms(simTime, CREATURE_ENV.motion, CREATURE_ENV.wind);

    const start = performance.now();
    const camDist = camera.position.distanceTo(turntable.position);
    field?.update(dt, simTime, camDist);
    effects.update(dt);
    if (autoSpin) turntable.rotation.y += realDt * 0.22;
    controls.update();
    updateMs = performance.now() - start;

    renderer.render(scene, camera);
    frameMs = performance.now() - now;

    frames++;
    if (frames % 12 === 0) updateCounters();
    rafId = requestAnimationFrame(loop);
  };
  rafId = requestAnimationFrame(loop);

  // QA hook: headless probes read these instead of screen-scraping the panel.
  (window as unknown as Record<string, unknown>).creatureLabStats = () => ({
    ...(field?.stats() ?? { instances: 0, triangles: 0, drawCalls: 0, lod: currentLod }),
    calls: renderer.info.render.calls,
    renderedTriangles: renderer.info.render.triangles,
    fps: Math.round(fpsSmoothed),
    wind: CREATURE_ENV.wind,
    hour: CREATURE_ENV.hour,
    motion: CREATURE_ENV.motion,
    effects: effects.stats(),
  });

  window.addEventListener('keydown', (event) => {
    const tag = (event.target as HTMLElement | null)?.tagName;
    if (tag === 'SELECT' || tag === 'INPUT') return;
    if (event.key === 'w') wireButton.click();
    if (event.key === 'o') overdrawButton.click();
    if (event.key === 's') (speed === 1 ? speedQuarter : speedFull).click();
    if (event.key === 'r') reactButton.click();
    if (event.key === ' ') {
      event.preventDefault();
      spinButton.click();
    }
    if (event.key === 'ArrowLeft') stepSpecies(-1);
    if (event.key === 'ArrowRight') stepSpecies(1);
  });

  window.addEventListener(
    'beforeunload',
    () => {
      cancelAnimationFrame(rafId);
      controls.dispose();
      effects.dispose();
      field?.dispose();
      envTex.dispose();
      pmrem.dispose();
      renderer.dispose();
    },
    { once: true }
  );
}

function labelled(text: string, control: HTMLElement): HTMLElement {
  const wrap = document.createElement('label');
  wrap.style.cssText = 'display:flex;flex-direction:column;gap:4px;font-size:11px;';
  const span = document.createElement('span');
  span.textContent = text;
  span.style.opacity = '0.65';
  wrap.appendChild(span);
  wrap.appendChild(control);
  return wrap;
}

function slider(
  text: string,
  min: number,
  max: number,
  value: number,
  step: number,
  onInput: (value: number) => void
): { node: HTMLElement; input: HTMLInputElement } {
  const input = document.createElement('input');
  input.type = 'range';
  input.min = String(min);
  input.max = String(max);
  input.step = String(step);
  input.value = String(value);
  input.style.width = '100%';
  const readout = document.createElement('span');
  readout.style.cssText = 'font-variant-numeric:tabular-nums;opacity:0.85;';
  readout.textContent = value.toFixed(1);
  input.addEventListener('input', () => {
    const next = Number(input.value);
    readout.textContent = next.toFixed(1);
    onInput(next);
  });
  const wrap = document.createElement('label');
  wrap.style.cssText = 'display:flex;flex-direction:column;gap:4px;font-size:11px;';
  const head = document.createElement('span');
  head.style.cssText = 'display:flex;justify-content:space-between;opacity:0.65;';
  head.append(text, readout);
  wrap.append(head, input);
  return { node: wrap, input };
}

function smallButton(text: string): HTMLButtonElement {
  const button = document.createElement('button');
  button.type = 'button';
  button.textContent = text;
  button.style.cssText =
    'flex:1;padding:6px 8px;border-radius:8px;border:1px solid rgba(255,255,255,0.12);' +
    'background:rgba(255,255,255,0.08);color:#e7ece9;font:inherit;cursor:pointer;';
  return button;
}
