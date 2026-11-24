/**
 * Dev-only creature Lab (`?lab=creatures`).
 *
 * A turntable per species with an animation-state picker, wind/time sliders,
 * wireframe and overdraw views, live instance/triangle/draw-call counters and
 * 1x / 0.25x speed. Excluded from production: `main.tsx` only dynamic-imports
 * this module under `import.meta.env.DEV`.
 */
import * as THREE from 'three';
import { CreatureField } from '../three/creatures/field';
import { SPECIES, SPECIES_IDS } from '../three/creatures/species';
import { setCreatureEnvironment, CREATURE_ENV } from '../three/creatures/env';
import { updateCreatureUniforms } from '../three/creatures/material';
import type { SpeciesId } from '../three/creatures/habitat';

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

const STATE_OPTIONS: ReadonlyArray<{ label: string; value: number }> = [
  { label: 'Idle / rest', value: 1 },
  { label: 'Graze / glide', value: 0.55 },
  { label: 'Walk / fly / swim', value: 0 },
];

const ACCENT = '#8fd6b4';

function styleButton(button: HTMLButtonElement, active: boolean): void {
  button.style.background = active ? ACCENT : 'rgba(255,255,255,0.06)';
  button.style.color = active ? '#10201a' : '#e7ece9';
}

export function mountCreaturesLab(root: HTMLElement): void {
  root.innerHTML = '';
  root.style.cssText =
    'position:fixed;inset:0;background:#101418;color:#e7ece9;font:13px/1.4 system-ui,sans-serif;overflow:hidden;';

  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block;';
  root.appendChild(canvas);

  const panel = document.createElement('div');
  panel.style.cssText =
    'position:absolute;top:14px;left:14px;width:250px;padding:14px;border-radius:14px;' +
    'background:rgba(16,20,24,0.82);backdrop-filter:blur(12px);border:1px solid rgba(255,255,255,0.09);' +
    'display:flex;flex-direction:column;gap:10px;';
  root.appendChild(panel);

  const title = document.createElement('div');
  title.textContent = 'Creature Lab';
  title.style.cssText = 'font-weight:650;font-size:15px;letter-spacing:0.01em;';
  panel.appendChild(title);

  const subtitle = document.createElement('div');
  subtitle.textContent = 'Dev only · ?lab=creatures';
  subtitle.style.cssText = 'font-size:11px;opacity:0.55;margin-top:-6px;';
  panel.appendChild(subtitle);

  const speciesSelect = document.createElement('select');
  speciesSelect.style.cssText =
    'width:100%;padding:6px;border-radius:8px;background:#1b2228;color:#e7ece9;border:1px solid #2d3841;';
  for (const id of SPECIES_IDS) {
    const option = document.createElement('option');
    option.value = id;
    option.textContent = SPECIES[id].label;
    speciesSelect.appendChild(option);
  }
  panel.appendChild(labelled('Species', speciesSelect));

  const stateSelect = document.createElement('select');
  stateSelect.style.cssText = speciesSelect.style.cssText;
  for (const option of STATE_OPTIONS) {
    const node = document.createElement('option');
    node.value = String(option.value);
    node.textContent = option.label;
    stateSelect.appendChild(node);
  }
  panel.appendChild(labelled('Animation state', stateSelect));

  const wind = slider('Wind', 0, 4, 0.6, 0.1, (value) => {
    setCreatureEnvironment({ wind: value });
  });
  panel.appendChild(wind.node);

  const hour = slider('Time of day', 0, 24, 12, 0.5, (value) => {
    setCreatureEnvironment({ hour: value, night: value < 6 || value >= 19 ? 1 : 0 });
  });
  panel.appendChild(hour.node);

  const toggles = document.createElement('div');
  toggles.style.cssText = 'display:flex;gap:6px;';
  panel.appendChild(toggles);
  const wireButton = smallButton('Wireframe');
  const overdrawButton = smallButton('Overdraw');
  toggles.appendChild(wireButton);
  toggles.appendChild(overdrawButton);

  const speedRow = document.createElement('div');
  speedRow.style.cssText = 'display:flex;gap:6px;align-items:center;';
  const speedLabel = document.createElement('span');
  speedLabel.textContent = 'Speed';
  speedLabel.style.cssText = 'opacity:0.6;flex:1;';
  speedRow.appendChild(speedLabel);
  const speedFull = smallButton('1×');
  const speedQuarter = smallButton('0.25×');
  speedRow.appendChild(speedFull);
  speedRow.appendChild(speedQuarter);
  panel.appendChild(speedRow);

  const counters = document.createElement('div');
  counters.style.cssText =
    'font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:11px;line-height:1.55;' +
    'background:rgba(255,255,255,0.04);border-radius:8px;padding:8px;white-space:pre;';
  panel.appendChild(counters);

  const captureButton = smallButton('Freeze @ 3s (capture)');
  captureButton.style.width = '100%';
  panel.appendChild(captureButton);

  /* -------------------------- renderer + scene ------------------------- */

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#101418');
  scene.fog = new THREE.Fog('#101418', 8, 18);

  const camera = new THREE.PerspectiveCamera(38, 1, 0.05, 60);
  camera.position.set(1.9, 1.85, 3.1);
  camera.lookAt(0, 0.5, 0);

  const hemi = new THREE.HemisphereLight('#cfe4f2', '#2a2a24', 1.1);
  scene.add(hemi);
  const key = new THREE.DirectionalLight('#fff2dc', 2.1);
  key.position.set(4, 6, 5);
  scene.add(key);
  const rim = new THREE.DirectionalLight('#9fc7e8', 0.9);
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

  const overdrawMaterial = new THREE.MeshBasicMaterial({
    color: '#ffffff',
    transparent: true,
    opacity: 0.09,
    blending: THREE.AdditiveBlending,
    depthTest: false,
    depthWrite: false,
  });

  let field: CreatureField | null = null;
  let wireframe = false;
  let overdraw = false;
  let speed = 1;
  let simTime = 0;
  let stateOverride: number | null = null;

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
      tier: 0,
      minSeparation: 0.28,
    });
    turntable.add(field.group);
    field.setStateOverride(stateOverride);
    field.setWireframe(wireframe);
  };

  const zonedScale = (species: SpeciesId): [number, number] => {
    if (species === 'whale') return [0.5, 0.56];
    if (species === 'dolphin') return [0.86, 0.96];
    if (species === 'fish') return [1.7, 2];
    if (species === 'butterfly' || species === 'bat') return [2.8, 3.2];
    if (species === 'meerkat' || species === 'penguin') return [2.3, 2.6];
    return [1, 1.15];
  };

  buildField('gull');
  setCreatureEnvironment({ tier: 0, software: false, month: 1 });

  /* ------------------------------ controls ----------------------------- */

  speciesSelect.addEventListener('change', () => {
    buildField(speciesSelect.value as SpeciesId);
    updateCounters();
  });

  stateSelect.addEventListener('change', () => {
    stateOverride = Number(stateSelect.value);
    field?.setStateOverride(stateOverride);
    updateCounters();
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
    renderer.setClearColor(overdraw ? '#05070a' : '#101418');
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
  styleButton(speedFull, true);

  captureButton.addEventListener('click', () => {
    if (!field) return;
    simTime = 3;
    field.advanceForCapture(3);
    updateCounters();
  });

  let last = performance.now();
  let frameMs = 0;
  let updateMs = 0;
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
    const info = renderer.info.render;
    counters.textContent = [
      `species    ${speciesSelect.value}`,
      `instances  ${stats?.instances ?? 0}`,
      `triangles  ${info.triangles}`,
      `draw calls ${info.calls}`,
      `frame      ${frameMs.toFixed(2)} ms`,
      `update     ${updateMs.toFixed(2)} ms`,
      `motion     ${CREATURE_ENV.motion.toFixed(2)}`,
    ].join('\n');
  };

  const loop = (): void => {
    const now = performance.now();
    const realDt = Math.min(0.1, (now - last) / 1000);
    last = now;
    const dt = realDt * speed;
    simTime += dt;
    updateCreatureUniforms(simTime, 1, CREATURE_ENV.wind);

    const start = performance.now();
    field?.update(dt, simTime, 6);
    turntable.rotation.y += realDt * 0.22;
    updateMs = performance.now() - start;

    renderer.render(scene, camera);
    frameMs = performance.now() - now;

    frames++;
    if (frames % 12 === 0) updateCounters();
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);

  // QA hook: headless probes read these instead of screen-scraping the panel.
  (window as unknown as Record<string, unknown>).creatureLabStats = () => ({
    ...(field?.stats() ?? { instances: 0, triangles: 0, drawCalls: 0 }),
    calls: renderer.info.render.calls,
    renderedTriangles: renderer.info.render.triangles,
  });

  // Keep keyboard shortcuts handy for captures.
  window.addEventListener('keydown', (event) => {
    if (event.key === 'w') wireButton.click();
    if (event.key === 'o') overdrawButton.click();
    if (event.key === 's') (speed === 1 ? speedQuarter : speedFull).click();
  });
}

function labelled(text: string, control: HTMLElement): HTMLElement {
  const wrap = document.createElement('label');
  wrap.style.cssText = 'display:flex;flex-direction:column;gap:4px;font-size:11px;';
  const span = document.createElement('span');
  span.textContent = text;
  span.style.opacity = '0.6';
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
  readout.style.cssText = 'font-variant-numeric:tabular-nums;opacity:0.8;';
  readout.textContent = value.toFixed(1);
  input.addEventListener('input', () => {
    const next = Number(input.value);
    readout.textContent = next.toFixed(1);
    onInput(next);
  });
  const wrap = document.createElement('label');
  wrap.style.cssText = 'display:flex;flex-direction:column;gap:4px;font-size:11px;';
  const head = document.createElement('span');
  head.style.cssText = 'display:flex;justify-content:space-between;opacity:0.6;';
  head.append(text, readout);
  wrap.append(head, input);
  return { node: wrap, input };
}

function smallButton(text: string): HTMLButtonElement {
  const button = document.createElement('button');
  button.type = 'button';
  button.textContent = text;
  button.style.cssText =
    'flex:1;padding:6px 8px;border-radius:8px;border:1px solid rgba(255,255,255,0.1);' +
    'background:rgba(255,255,255,0.06);color:#e7ece9;font:inherit;cursor:pointer;';
  return button;
}
