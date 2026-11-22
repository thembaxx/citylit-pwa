import * as THREE from 'three';
import { liveWeatherVisual, WEATHER_CONDITIONS } from '../data/weatherData';
import { monthToSeasonWeights, type SeasonWeights } from '../lib/season';
import type { LiveWeatherSample, ThemeSetting, WeatherConditionKey } from '../types/citylit';
import { getSoftTexture, SKY_NOISE_GLSL, WU } from './shaders';
import { solarHalfDay } from './streetLights';

export interface WeatherTargetState {
  sky: THREE.Color;
  cover: number;
  rain: number;
  fog: number;
  wind: number;
  storm: number;
  night: number;
  timeOfDay: number;
}

export interface WeatherSceneController {
  root: THREE.Group;
  starPoints: THREE.Points;
  clouds: THREE.InstancedMesh;
  sunDisc: THREE.Mesh;
  moonDisc: THREE.Mesh;
  rainLines: THREE.LineSegments;
  stormCurtain: THREE.Mesh;
  groundShadow: THREE.InstancedMesh;
  sunGlowColor: THREE.Color;
  skyTopColor: THREE.Color;
  current: WeatherTargetState;
  target: WeatherTargetState;
  applyCondition: (key: WeatherConditionKey, night: boolean, timeOfDay?: number) => void;
  /** Drive the scene from a real observation using continuous values. */
  applyLiveSample: (sample: LiveWeatherSample, timeOfDay: number) => void;
  setSeasonMonth: (month: number, immediate?: boolean) => void;
  setTheme: (theme: ThemeSetting, immediate?: boolean) => void;
  /** Blend subtle per-landmark atmospheric sky zenith & horizon tints. */
  setSiteSkyTint: (topHex: string, horizonHex: string, immediate?: boolean) => void;
  triggerRainbow: (duration?: number) => void;
  setHidden: (hidden: boolean) => void;
  update: (
    dt: number,
    elapsed: number,
    options: {
      qualityIndex: number;
      motionScale: number;
      keyLight: THREE.DirectionalLight;
      fillLight: THREE.DirectionalLight;
      hemiLight: THREE.HemisphereLight;
      scene: THREE.Scene;
      renderer: THREE.WebGLRenderer;
      onThunder?: () => void;
    }
  ) => void;
}

export function createWeatherScene(scene: THREE.Scene): WeatherSceneController {
  const root = new THREE.Group();
  scene.add(root);

  const skyMat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    uniforms: {
      t: { value: 0 },
      top: { value: new THREE.Color('#27476e') },
      bot: { value: new THREE.Color('#0c0e16') },
      uSiteHor: { value: new THREE.Color('#6fa6cc') },
      uPol: WU.pollution,
      uSiteWeight: { value: 0.24 },
      cv: { value: 0.2 },
      uCirrus: { value: 0.16 },
      uCumulus: { value: 0.12 },
      uSkyStorm: { value: 0 },
      uFlash: { value: 0 },
      nt: { value: 0 },
      sunDir: { value: new THREE.Vector3(0.5, 0.8, 0.3) },
      glow: { value: new THREE.Color('#ff9d5c') },
      hor: { value: 0 },
      rb: { value: 0 },
    },
    vertexShader:
      'varying vec3 v;void main(){v=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader: /* glsl */ `
      varying vec3 v;
      uniform float t, uSiteWeight, cv, uCirrus, uCumulus, uSkyStorm, uFlash, nt, hor, rb, uPol;
      uniform vec3 top, bot, uSiteHor, sunDir, glow;
      ${SKY_NOISE_GLSL}
      void main() {
        float y = clamp(v.y, 0.0, 1.0);
        vec3 botBlend = mix(bot, uSiteHor * (0.28 + (1.0 - nt) * 0.44), uSiteWeight * 0.65);
        vec3 col = mix(botBlend, top, pow(y, 0.55));
        vec3 d = normalize(v), sd = normalize(sunDir);
        float sdDot = max(0.0, dot(d, sd));
        float sunUp = smoothstep(-0.02, 0.08, sd.y);
        float horMask = smoothstep(-0.22, 0.02, v.y);

        // Subtle atmospheric horizon scattering belt so foreground dioramas pop cleanly.
        float horBand = pow(1.0 - y, 5.2) * horMask;
        col += mix(uSiteHor * 0.22, glow * 0.32, hor) * horBand * (1.0 - nt * 0.55) * uSiteWeight;

        // Clear-night Milky Way dust diagonal & gentle upper-sky airglow.
        if (nt > 0.04 && v.y > 0.02) {
          float bandCoord = d.x * 0.64 - d.y * 0.52 + d.z * 0.56;
          float bandMask = exp(-bandCoord * bandCoord * 13.0) * smoothstep(0.04, 0.45, d.y);
          float mwNoise = fbm(d.xz * 3.4 + vec2(d.y * 2.1, t * 0.002));
          float dustRift = smoothstep(0.32, 0.78, mwNoise);
          vec3 mwCol = mix(vec3(0.16, 0.24, 0.44), vec3(0.28, 0.34, 0.58), mwNoise);
          col += mwCol * bandMask * dustRift * nt * (1.0 - cv * 0.85) * 0.42;
        }

        // City light pollution: a warm dome hugging the horizon that grows with
        // the share of lit windows, so a full CBD glows harder than an empty one.
        if (nt > 0.04) {
          float polBand = pow(1.0 - y, 6.5) * horMask;
          vec3 polCol = mix(vec3(0.30, 0.38, 0.58), vec3(1.0, 0.62, 0.30), uSiteWeight);
          col += polCol * polBand * nt * uPol * 0.6;
        }

        // Warm directional horizon & Mie-like solar bloom
        col += glow * (hor * pow(1.0 - y, 4.0) * (0.45 + 0.55 * sdDot) + pow(sdDot, 18.0) * 0.35) * sunUp * horMask;
        float sp = pow(sdDot, 420.0) * (1.0 - cv * 0.85) * sunUp;
        col += mix(vec3(1.0, 0.96, 0.88), glow, hor) * sp * 1.5;

        // Dual skybox cloud layers: high wispy cirrus + lower billowy cumulus/nimbus
        if (v.y > 0.02 && (uCirrus > 0.01 || uCumulus > 0.01 || cv > 0.01)) {
          vec2 p = v.xz / (v.y + 0.18);
          float altMask = smoothstep(0.02, 0.22, v.y);

          // Layer 1: High-altitude wispy cirrus streaks
          float cirNoise = fbm(vec2(p.x * 1.55 + t * 0.022, p.y * 0.95 + t * 0.008));
          float cirMask = smoothstep(0.66 - uCirrus * 0.32, 0.90 - uCirrus * 0.22, cirNoise) * altMask * uCirrus;
          vec3 cirCol = mix(vec3(0.92, 0.95, 1.0), vec3(0.34, 0.39, 0.52), nt * 0.72) + glow * hor * 0.58;
          col = mix(col, cirCol, cirMask * 0.56);

          // Layer 2: Lower cumulus/nimbus cloud deck with storm under-belly & lightning scatter
          float cumNoise = fbm(p * 0.74 + vec2(t * 0.011, -t * 0.004));
          float cumMask = smoothstep(0.62 - uCumulus * 0.44, 0.86 - uCumulus * 0.32, cumNoise) * altMask * uCumulus;
          vec3 cumDay = mix(vec3(0.90, 0.93, 0.97), vec3(0.28, 0.31, 0.38), uSkyStorm * 0.78);
          vec3 cumCol = mix(cumDay, vec3(0.18, 0.22, 0.33), nt * 0.78 + cv * 0.22);
          cumCol += glow * hor * (0.48 * (1.0 - uSkyStorm * 0.65));
          cumCol += vec3(0.65, 0.76, 1.0) * uFlash * smoothstep(0.35, 0.85, cumNoise) * 0.85;
          col = mix(col, cumCol, cumMask * 0.84);
        }

        if (rb > 0.01) {
          float ang = acos(clamp(dot(d, -sd), -1.0, 1.0));
          float r = smoothstep(0.045, 0.0, abs(ang - 0.73)) * smoothstep(0.0, 0.12, v.y);
          float h = clamp((ang - 0.685) / 0.09, 0.0, 1.0);
          vec3 rc = clamp(abs(mod(h * 5.0 + vec3(0.0, 4.0, 2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0);
          col += rc * r * rb * 0.22;
        }
        gl_FragColor = vec4(col, 1.0);
      }
    `,
  });

  const skyDome = new THREE.Mesh(new THREE.SphereGeometry(75, 32, 24), skyMat);
  skyDome.frustumCulled = false;
  root.add(skyDome);

  // Subtle golden-hour atmospheric sun-shaft cones during dawn/dusk/misty hours.
  const sunShaftMat = new THREE.MeshBasicMaterial({
    color: '#ffd49c',
    transparent: true,
    opacity: 0,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
  });
  sunShaftMat.userData.noDissolve = true;
  const sunShaftGroup = new THREE.Group();
  const shaftSpecs = [
    { x: -1.8, z: -0.6, rTop: 0.45, rBot: 3.1, h: 16, tilt: 0.08 },
    { x: 0.9, z: 1.2, rTop: 0.55, rBot: 3.6, h: 18, tilt: -0.06 },
    { x: 2.3, z: -1.4, rTop: 0.38, rBot: 2.6, h: 15, tilt: 0.04 },
  ];
  for (let i = 0; i < shaftSpecs.length; i++) {
    const sp = shaftSpecs[i];
    const shaft = new THREE.Mesh(
      new THREE.CylinderGeometry(sp.rTop, sp.rBot, sp.h, 16, 1, true),
      sunShaftMat
    );
    shaft.position.set(sp.x, 4.2, sp.z);
    shaft.rotation.z = sp.tilt;
    shaft.renderOrder = 2;
    shaft.userData.noShadow = true;
    shaft.userData.cannotReceiveAO = true;
    sunShaftGroup.add(shaft);
  }
  sunShaftGroup.visible = false;
  root.add(sunShaftGroup);

  const cloudShadowCount = 14;
  const cloudShadowGeo = new THREE.PlaneGeometry(1, 1);
  cloudShadowGeo.rotateX(-Math.PI / 2);
  const cloudShadowMat = new THREE.MeshBasicMaterial({
    map: getSoftTexture(),
    color: '#050811',
    transparent: true,
    opacity: 0.12,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  });
  cloudShadowMat.userData.noDissolve = true;
  const groundShadow = new THREE.InstancedMesh(cloudShadowGeo, cloudShadowMat, cloudShadowCount);
  groundShadow.castShadow = false;
  groundShadow.receiveShadow = false;
  groundShadow.renderOrder = 1;
  groundShadow.frustumCulled = false;
  groundShadow.userData.noShadow = true;
  groundShadow.userData.cannotReceiveAO = true;
  root.add(groundShadow);

  const stMat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    uniforms: { t: { value: 0 }, st: { value: 0 }, fl: { value: 0 } },
    vertexShader:
      'varying vec2 u;void main(){u=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader: `varying vec2 u;uniform float t,st,fl;${SKY_NOISE_GLSL}void main(){float a=u.x*6.28318;vec2 p=vec2(cos(a),sin(a))*2.5;float c=fbm(p+vec2(t*.04,u.y*3.));float k=smoothstep(.35,.85,u.y);float s=smoothstep(.3,.75,c)*k;vec3 col=mix(vec3(.08,.1,.14),vec3(.6,.7,1.),fl*smoothstep(.2,.9,c));gl_FragColor=vec4(col,s*st*.85);}`,
  });
  const stormCurtain = new THREE.Mesh(new THREE.CylinderGeometry(36, 36, 26, 48, 1, true), stMat);
  stormCurtain.position.y = 14;
  root.add(stormCurtain);

  const stp = new Float32Array(1200);
  const stc = new Float32Array(1200);
  const starPal = [new THREE.Color('#fff'), new THREE.Color('#cfe4ff'), new THREE.Color('#ffe0bd')];
  for (let i = 0; i < 400; i++) {
    const a = Math.random() * 6.28;
    const z = Math.random() * 0.8 + 0.1;
    const r = Math.sqrt(1 - z * z);
    stp[i * 3] = r * Math.cos(a) * 65;
    stp[i * 3 + 1] = z * 65;
    stp[i * 3 + 2] = r * Math.sin(a) * 65;
    const cc = starPal[i % 3];
    stc[i * 3] = cc.r;
    stc[i * 3 + 1] = cc.g;
    stc[i * 3 + 2] = cc.b;
  }
  const starGeo = new THREE.BufferGeometry()
    .setAttribute('position', new THREE.BufferAttribute(stp, 3))
    .setAttribute('color', new THREE.BufferAttribute(stc, 3));
  const starMat = new THREE.PointsMaterial({
    size: 0.7,
    map: getSoftTexture(),
    vertexColors: true,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const starPoints = new THREE.Points(starGeo, starMat);
  root.add(starPoints);

  const sunMat = new THREE.MeshBasicMaterial({
    color: '#fff4c8',
    fog: false,
    transparent: true,
    opacity: 1,
    depthWrite: false,
  });
  const sunDisc = new THREE.Mesh(new THREE.SphereGeometry(2.1, 16, 12), sunMat);
  root.add(sunDisc);

  const moonMat = new THREE.MeshBasicMaterial({
    color: '#eaf1ff',
    fog: false,
    transparent: true,
    opacity: 0,
    depthWrite: false,
  });
  const moonDisc = new THREE.Mesh(new THREE.SphereGeometry(1.1, 16, 12), moonMat);
  root.add(moonDisc);

  const moonHaloMat = new THREE.SpriteMaterial({
    map: getSoftTexture(),
    color: '#9ec4ff',
    transparent: true,
    opacity: 0,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    fog: false,
  });
  moonHaloMat.userData.noDissolve = true;
  const moonHalo = new THREE.Sprite(moonHaloMat);
  moonHalo.scale.set(9.5, 9.5, 1);
  moonDisc.add(moonHalo);

  const cloudMat = new THREE.MeshStandardMaterial({
    color: '#ffffff',
    roughness: 1,
    transparent: true,
    opacity: 0.85,
  });
  cloudMat.userData.noDissolve = true;

  interface CloudSpec {
    a: number;
    r: number;
    y: number;
    s: number;
    puffs: Array<{ ox: number; oy: number; oz: number; sx: number; sy: number; sz: number }>;
  }
  const cloudSpecs: CloudSpec[] = [];
  let totalCloudPuffs = 0;
  for (let i = 0; i < 14; i++) {
    const k = 3 + (i % 3);
    const a = i * 0.45;
    const rad = 16 + (i % 4) * 5;
    const puffs: CloudSpec['puffs'] = [];
    for (let j = 0; j < k; j++) {
      const pu = 1 + ((i + j) % 3) * 0.4;
      puffs.push({
        ox: (j - 1) * 1.1,
        oy: (j % 2) * 0.25,
        oz: (((i * j) % 3) - 1) * 0.4,
        sx: 1.5 * pu,
        sy: 0.55 * pu,
        sz: 1.1 * pu,
      });
    }
    totalCloudPuffs += k;
    cloudSpecs.push({ a, r: rad, y: 11 + (i % 4) * 2.2, s: 0.015 + (i % 3) * 0.01, puffs });
  }
  const cloudPuffGeo = new THREE.SphereGeometry(1, 10, 8);
  const clouds = new THREE.InstancedMesh(cloudPuffGeo, cloudMat, totalCloudPuffs);
  clouds.castShadow = false;
  clouds.receiveShadow = false;
  clouds.frustumCulled = false;
  clouds.userData.noShadow = true;
  clouds.userData.cannotReceiveAO = true;
  root.add(clouds);

  const RN = 450;
  const rainPos = new Float32Array(RN * 6);
  const rainSeed = new Float32Array(RN * 8);
  for (let i = 0; i < RN; i++) {
    const x = (Math.random() - 0.5) * 28;
    const y = Math.random() * 18;
    const z = (Math.random() - 0.5) * 28;
    rainPos.set([x, y, z, x, y - 0.65, z], i * 6);
    rainSeed.set([x, y, z, 0, x, y, z, 1], i * 8);
  }
  const rainGeo = new THREE.BufferGeometry()
    .setAttribute('position', new THREE.BufferAttribute(rainPos, 3))
    .setAttribute('aSeed', new THREE.BufferAttribute(rainSeed, 4));
  const rainMat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: {
      uTime: { value: 0 },
      uWind: { value: 1 },
      uOpacity: { value: 0 },
      uColor: { value: new THREE.Color('#bcd4ff') },
    },
    vertexShader: /* glsl */ `
      attribute vec4 aSeed;
      uniform float uTime;
      uniform float uWind;
      varying float vFade;
      void main() {
        float fall = mod(aSeed.y - uTime * 19.0, 18.0);
        float driftX = mod(aSeed.x + uTime * uWind * 1.4 + 14.0, 28.0) - 14.0;
        vec3 p = vec3(driftX, fall, aSeed.z);
        if (aSeed.w > 0.5) {
          p.x += uWind * 0.08;
          p.y -= 0.65;
        }
        vFade = smoothstep(0.0, 1.5, fall) * smoothstep(18.0, 15.5, fall);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uOpacity;
      uniform vec3 uColor;
      varying float vFade;
      void main() {
        gl_FragColor = vec4(uColor, uOpacity * vFade);
      }
    `,
  });
  const rainLines = new THREE.LineSegments(rainGeo, rainMat);
  rainLines.frustumCulled = false;
  root.add(rainLines);

  const current: WeatherTargetState = {
    sky: new THREE.Color('#27476e'),
    cover: 0.2,
    rain: 0,
    fog: 0,
    wind: 1,
    storm: 0,
    night: 0,
    timeOfDay: 13,
  };
  const target: WeatherTargetState = {
    sky: new THREE.Color('#27476e'),
    cover: 0.2,
    rain: 0,
    fog: 0,
    wind: 1,
    storm: 0,
    night: 0,
    timeOfDay: 13,
  };

  let lightningFlash = 0;
  let thunderTimer = 3;
  let rainbowTimer = 0;
  const themeTarget = { daylight: 0, studio: 0 };
  const themeCurrent = { daylight: 0, studio: 0 };

  const csPos = new THREE.Vector3();
  const csQuat = new THREE.Quaternion();
  const csScale = new THREE.Vector3();
  const csMatrix = new THREE.Matrix4();
  const daylightBgCol = new THREE.Color('#a8d8ec');
  const daylightSkyTopCol = new THREE.Color('#77bde0');
  const daylightSkyBotCol = new THREE.Color('#cfeaf6');
  const daylightStormBgCol = new THREE.Color('#7d98ad');
  const daylightNightBgCol = new THREE.Color('#131b2c');
  const studioBgCol = new THREE.Color('#f7f7f4');
  const studioKeyPos = new THREE.Vector3(9, 13, 7);
  const studioKeyCol = new THREE.Color('#fffaf0');
  const studioFillCol = new THREE.Color('#e9efff');
  const studioHemiSky = new THREE.Color('#ffffff');
  const studioHemiGround = new THREE.Color('#cdd2d8');

  const skyTmp = new THREE.Color();
  const skyDarkTmp = new THREE.Color();
  const daylightBgTmp = new THREE.Color();
  const botTmp = new THREE.Color();
  const fogTmp = new THREE.Color();
  const sunGlowTmp = new THREE.Color();
  const sunColTmp = new THREE.Color();
  const sunGoldTmp = new THREE.Color('#ffb85c');
  const sunRedTmp = new THREE.Color('#ff5e3a');
  const dayColTmp = new THREE.Color('#fff5dd');
  const nightSkyTmp = new THREE.Color('#090d1a');
  const duskSkyTmp = new THREE.Color('#2a233d');
  const fogDayTmp = new THREE.Color('#b6bcc4');
  const fogNightTmp = new THREE.Color('#0e1320');
  const botDayTmp = new THREE.Color('#141923');
  const botNightTmp = new THREE.Color('#060810');
  const dayTopTmp = new THREE.Color();

  // Endpoints for sky tinting from a real cloud-cover reading.
  const liveClearSky = new THREE.Color('#3b6490');
  const liveOvercastSky = new THREE.Color('#4d5560');
  const liveStormSky = new THREE.Color('#232733');
  // Overcast shifts the ground-layer fog toward a warm ochre cast.
  const overcastFogWarm = new THREE.Color('#908560');

  // Southern Hemisphere seasonal lighting palette helpers (zero-GC pre-allocated)
  const initialSeason = monthToSeasonWeights(new Date().getMonth() + 1);
  const seasonCurrent: SeasonWeights = { ...initialSeason };
  const seasonTarget: SeasonWeights = { ...initialSeason };
  const summerKeyCol = new THREE.Color('#ffe2a8');
  const winterKeyCol = new THREE.Color('#d2e0f3');
  const autumnKeyTint = new THREE.Color('#ffd096');
  const summerGlowCol = new THREE.Color('#ffaf4d');
  const winterGlowCol = new THREE.Color('#9cb5d8');
  const summerFillCol = new THREE.Color('#5a84c6');
  const winterFillCol = new THREE.Color('#6c7f99');
  const summerHemiSky = new THREE.Color('#eaf2ff');
  const winterHemiSky = new THREE.Color('#b4c8e0');
  const summerHemiGround = new THREE.Color('#342414');
  const winterHemiGround = new THREE.Color('#161b24');
  const summerFogDay = new THREE.Color('#cabea3');
  const winterFogDay = new THREE.Color('#97a5b7');
  const summerSkyTint = new THREE.Color('#2f649d');
  const winterSkyTint = new THREE.Color('#475c74');
  const springSkyTint = new THREE.Color('#3970a8');
  const seasonSkyTmp = new THREE.Color();
  const seasonGlowTmp = new THREE.Color();
  const seasonFillTmp = new THREE.Color();
  const seasonHemiSkyTmp = new THREE.Color();
  const seasonHemiGroundTmp = new THREE.Color();

  // Wind direction from the live observation, in degrees (the direction it comes FROM).
  const windDirTmp = new THREE.Vector2(1, 0);
  const sunDirTargetTmp = new THREE.Vector3(0.5, 0.8, 0.3);
  const cloudTargetCol = new THREE.Color('#ffffff');
  const dayKeyPosTmp = new THREE.Vector3(12, 18, 10);
  const keyPosTarget = new THREE.Vector3(12, 18, 10);
  const keyColorTarget = new THREE.Color('#fff5dd');
  const nightKeyCol = new THREE.Color('#b8d0ff');
  const nightKeyPos = new THREE.Vector3(-10, 14, -8);
  const rainDayCol = new THREE.Color('#c7dcff');
  const rainNightCol = new THREE.Color('#7c94bf');
  const rainTargetCol = new THREE.Color('#c7dcff');
  const bgTargetCol = new THREE.Color('#0c0e16');
  const fogTargetCol = new THREE.Color('#97a5b7');
  const sunShaftTargetCol = new THREE.Color('#ffd49c');
  const siteTopCurrent = new THREE.Color('#27476e');
  const siteTopTarget = new THREE.Color('#27476e');
  const siteHorCurrent = new THREE.Color('#6fa6cc');
  const siteHorTarget = new THREE.Color('#6fa6cc');
  let windDirectionDeg = 0;
  let animTime = 0;

  const applyCondition = (key: WeatherConditionKey, night: boolean, timeOfDay?: number) => {
    const cond = WEATHER_CONDITIONS[key] ?? WEATHER_CONDITIONS.sun;
    target.sky.set(cond.sky);
    target.cover = cond.cover;
    target.rain = cond.rain;
    target.fog = cond.fog;
    target.wind = cond.wind;
    target.storm = cond.storm;
    target.night = night ? 1 : 0;
    if (timeOfDay !== undefined) {
      target.timeOfDay = timeOfDay;
    } else {
      target.timeOfDay = night ? 22 : 13;
    }
  };

  const applyLiveSample = (sample: LiveWeatherSample, timeOfDay: number) => {
    const visual = liveWeatherVisual(sample);
    target.sky
      .copy(liveClearSky)
      .lerp(liveOvercastSky, visual.cover)
      .lerp(liveStormSky, visual.storm * 0.7);
    target.cover = visual.cover;
    target.rain = visual.rain;
    target.fog = visual.fog;
    target.wind = visual.wind;
    target.storm = visual.storm;
    target.night = sample.isDay ? 0 : 1;
    target.timeOfDay = timeOfDay;
    windDirectionDeg = sample.windDirection;
  };

  const setSeasonMonth = (month: number, immediate = false) => {
    const next = monthToSeasonWeights(month);
    seasonTarget.warmth = next.warmth;
    seasonTarget.autumn = next.autumn;
    seasonTarget.spring = next.spring;
    if (immediate) {
      seasonCurrent.warmth = next.warmth;
      seasonCurrent.autumn = next.autumn;
      seasonCurrent.spring = next.spring;
    }
  };

  const setTheme = (theme: ThemeSetting, immediate = false) => {
    themeTarget.daylight = theme === 'daylight' ? 1 : 0;
    themeTarget.studio = theme === 'studio' ? 1 : 0;
    if (immediate) {
      themeCurrent.daylight = themeTarget.daylight;
      themeCurrent.studio = themeTarget.studio;
    }
  };

  const setSiteSkyTint = (topHex: string, horizonHex: string, immediate = false) => {
    siteTopTarget.set(topHex);
    siteHorTarget.set(horizonHex);
    if (immediate) {
      siteTopCurrent.copy(siteTopTarget);
      siteHorCurrent.copy(siteHorTarget);
    }
  };

  const triggerRainbow = (duration = 12) => {
    rainbowTimer = duration;
  };

  const setHidden = (hidden: boolean) => {
    root.visible = !hidden;
  };

  const update: WeatherSceneController['update'] = (
    dt,
    elapsed,
    { qualityIndex, motionScale, keyLight, fillLight, hemiLight, scene: s, renderer, onThunder }
  ) => {
    const safeDt = Math.max(0, dt);
    animTime += safeDt * motionScale;
    const tk = motionScale === 0 ? 1 : 1 - Math.exp(-safeDt * 4.5);
    const skyLerp = motionScale === 0 ? 1 : 1 - Math.exp(-safeDt * 2.2);
    const lightLerp = motionScale === 0 ? 1 : 1 - Math.exp(-safeDt * 2.8);
    themeCurrent.daylight += (themeTarget.daylight - themeCurrent.daylight) * tk;
    themeCurrent.studio += (themeTarget.studio - themeCurrent.studio) * tk;
    const wDay = themeCurrent.daylight;
    const wStudio = themeCurrent.studio;
    const wDark = Math.max(0, 1 - wDay - wStudio);

    skyDome.visible = wStudio < 0.995;
    const k = motionScale === 0 ? 1 : 1 - Math.exp(-safeDt * 1.8);
    const sk = motionScale === 0 ? 1 : 1 - Math.exp(-safeDt * 0.55);
    current.sky.lerp(target.sky, k);
    current.cover += (target.cover - current.cover) * k;
    current.rain += (target.rain - current.rain) * k;
    current.fog += (target.fog - current.fog) * k;
    current.wind += (target.wind - current.wind) * k;
    current.storm += (target.storm - current.storm) * k;
    current.night += (target.night - current.night) * k;
    let dHour = target.timeOfDay - current.timeOfDay;
    if (dHour > 12) dHour -= 24;
    else if (dHour < -12) dHour += 24;
    current.timeOfDay = (((current.timeOfDay + dHour * k) % 24) + 24) % 24;

    seasonCurrent.warmth += (seasonTarget.warmth - seasonCurrent.warmth) * sk;
    seasonCurrent.autumn += (seasonTarget.autumn - seasonCurrent.autumn) * sk;
    seasonCurrent.spring += (seasonTarget.spring - seasonCurrent.spring) * sk;

    const hr = current.timeOfDay;
    // Season-dependent solar arc: winter days are short and the sun stays low,
    // summer days run long and climb high. Lamp ignition and the window
    // schedule read the same curve, so the whole scene agrees on sunset.
    const arc = ((hr - 12) / solarHalfDay(seasonCurrent.warmth)) * (Math.PI / 2);
    const rawAlt = Math.cos(arc);
    const alt = rawAlt;
    const sx = Math.sin(arc) * 32;
    const sy = alt * 34;
    const sz = 18;
    const hor = Math.max(0, 1 - Math.abs(alt) * 3.5);
    const day = Math.max(0, Math.min(1, alt * 2.5 + 0.35));

    sunDisc.position.set(sx, sy, sz);
    const sunTargetOpacity =
      THREE.MathUtils.smoothstep(sy, -3.5, 2.5) * (1 - current.cover * 0.72) * (1 - wStudio);
    sunMat.opacity += (sunTargetOpacity - sunMat.opacity) * skyLerp;
    sunDisc.visible = wStudio < 0.99 && sunMat.opacity > 0.005 && !renderer.xr.isPresenting;

    moonDisc.position.set(-sx * 0.85, Math.max(12, -sy * 0.7 + 14), -16);
    const moonTargetOpacity =
      THREE.MathUtils.smoothstep(day, 0.72, 0.18) * (1 - current.cover * 0.75) * (1 - wStudio);
    moonMat.opacity += (moonTargetOpacity - moonMat.opacity) * skyLerp;
    moonHaloMat.opacity = moonMat.opacity * 0.36;
    moonDisc.visible = wStudio < 0.99 && moonMat.opacity > 0.005;

    if (current.storm > 0.4) {
      thunderTimer -= safeDt;
      if (thunderTimer < 0) {
        lightningFlash = 1.6;
        thunderTimer = 2.5 + Math.random() * 5;
        onThunder?.();
      }
    }
    lightningFlash = Math.max(0, lightningFlash - safeDt * 6);

    siteTopCurrent.lerp(siteTopTarget, skyLerp);
    siteHorCurrent.lerp(siteHorTarget, skyLerp);

    seasonSkyTmp
      .copy(winterSkyTint)
      .lerp(summerSkyTint, seasonCurrent.warmth)
      .lerp(springSkyTint, seasonCurrent.spring * 0.28);
    dayTopTmp
      .copy(current.sky)
      .lerp(seasonSkyTmp, 0.38)
      .lerp(siteTopCurrent, 0.24 * (1 - current.storm * 0.6) * (1 - wStudio))
      .lerp(duskSkyTmp, hor * (0.58 + 0.14 * seasonCurrent.warmth));
    skyTmp.copy(dayTopTmp).lerp(nightSkyTmp, 1 - day);
    skyDarkTmp.copy(skyTmp).multiplyScalar(0.5);

    if (wDay > 0.001) {
      dayTopTmp.lerp(daylightSkyTopCol, 0.68 * (1 - current.storm * 0.5) * wDay);
    }
    skyTmp
      .copy(dayTopTmp)
      .lerp(nightSkyTmp, 1 - day)
      .lerp(studioBgCol, wStudio);

    // Smooth linear interpolation across all skybox colors & dual cloud layer uniforms
    skyMat.uniforms.top.value.lerp(skyTmp, skyLerp);
    skyMat.uniforms.uSiteHor.value.copy(siteHorCurrent);
    skyMat.uniforms.uSiteWeight.value = 0.26 * (1 - wStudio) * (1 - current.storm * 0.55);

    botTmp
      .copy(botDayTmp)
      .lerp(daylightSkyBotCol, wDay)
      .lerp(botNightTmp, 1 - day)
      .lerp(studioBgCol, wStudio);
    skyMat.uniforms.bot.value.lerp(botTmp, skyLerp);
    skyMat.uniforms.t.value = animTime;

    const targetCover = current.cover * (1 - wStudio);
    const targetCirrus =
      THREE.MathUtils.clamp(0.18 + targetCover * 0.72 - current.storm * 0.25, 0, 1) * (1 - wStudio);
    const targetCumulus =
      THREE.MathUtils.clamp((targetCover - 0.12) * 1.15 + current.storm * 0.35, 0, 1) *
      (1 - wStudio);
    const targetStorm = current.storm * (1 - wStudio);
    const targetNight = (1 - day) * (1 - wStudio);
    skyMat.uniforms.cv.value += (targetCover - skyMat.uniforms.cv.value) * skyLerp;
    skyMat.uniforms.uCirrus.value += (targetCirrus - skyMat.uniforms.uCirrus.value) * skyLerp;
    skyMat.uniforms.uCumulus.value += (targetCumulus - skyMat.uniforms.uCumulus.value) * skyLerp;
    skyMat.uniforms.uSkyStorm.value += (targetStorm - skyMat.uniforms.uSkyStorm.value) * skyLerp;
    skyMat.uniforms.uFlash.value = lightningFlash * (1 - wStudio);
    skyMat.uniforms.nt.value += (targetNight - skyMat.uniforms.nt.value) * skyLerp;

    sunDirTargetTmp.set(sx, sy, sz).normalize();
    skyMat.uniforms.sunDir.value.lerp(sunDirTargetTmp, skyLerp).normalize();

    seasonGlowTmp.copy(winterGlowCol).lerp(summerGlowCol, seasonCurrent.warmth);
    sunGlowTmp
      .copy(sunGoldTmp)
      .lerp(seasonGlowTmp, 0.45)
      .lerp(sunRedTmp, Math.max(0, 0.5 - alt) * (1.4 + 0.6 * seasonCurrent.warmth));
    skyMat.uniforms.glow.value.lerp(sunGlowTmp, skyLerp);
    const targetHor = hor * (1 - current.cover * 0.5) * (1 - wStudio);
    skyMat.uniforms.hor.value += (targetHor - skyMat.uniforms.hor.value) * skyLerp;

    rainbowTimer = Math.max(0, rainbowTimer - safeDt);
    const targetRb = Math.min(1, rainbowTimer / 2) * day * (1 - wStudio);
    skyMat.uniforms.rb.value += (targetRb - skyMat.uniforms.rb.value) * skyLerp;

    // Volumetric sun shafts aligned with sun direction during golden hour / misty sunrise
    const shaftOpacity =
      THREE.MathUtils.smoothstep(sy, -2.0, 2.0) *
      (hor * 0.08 + current.fog * hor * 0.07) *
      (1 - current.storm * 0.85) *
      (1 - current.cover * 0.55) *
      (1 - wStudio);
    sunShaftMat.opacity += (shaftOpacity - sunShaftMat.opacity) * skyLerp;
    sunShaftGroup.visible = wStudio < 0.98 && sunShaftMat.opacity > 0.003;
    if (sunShaftGroup.visible) {
      sunShaftTargetCol.copy(sunGlowTmp).lerp(dayColTmp, 0.38);
      sunShaftMat.color.lerp(sunShaftTargetCol, skyLerp);
      sunShaftGroup.rotation.y = Math.atan2(sx, sz);
      sunShaftGroup.rotation.x = THREE.MathUtils.clamp((1 - alt) * 0.35, 0.08, 0.42);
    }

    daylightBgTmp
      .copy(daylightBgCol)
      .lerp(daylightStormBgCol, Math.min(1, current.cover * 0.35 + current.storm * 0.55))
      .lerp(daylightNightBgCol, 1 - day);
    bgTargetCol.setRGB(
      skyDarkTmp.r * wDark + daylightBgTmp.r * wDay + studioBgCol.r * wStudio,
      skyDarkTmp.g * wDark + daylightBgTmp.g * wDay + studioBgCol.g * wStudio,
      skyDarkTmp.b * wDark + daylightBgTmp.b * wDay + studioBgCol.b * wStudio
    );
    (s.background as THREE.Color).lerp(bgTargetCol, skyLerp);

    fogDayTmp.copy(winterFogDay).lerp(summerFogDay, seasonCurrent.warmth);
    if (wDay > 0.001) {
      fogDayTmp.lerp(daylightBgCol, 0.72 * wDay);
    }
    fogTmp
      .copy(fogDayTmp)
      .lerp(fogNightTmp, 1 - day)
      .lerp(studioBgCol, wStudio);
    const fogDensity =
      (0.008 + current.fog * 0.032) * wDark + (0.0018 + current.fog * 0.0085) * wDay;
    if (s.fog instanceof THREE.FogExp2) {
      s.fog.density += (fogDensity - s.fog.density) * Math.max(k, tk);
      fogTargetCol
        .copy(fogTmp)
        .lerp(
          sunGlowTmp,
          hor * (1 - wStudio) * (0.18 + 0.14 * seasonCurrent.warmth) * (1 - wDay * 0.65)
        );
      // Warm the overcast fog: thick cloud bands give the ground layer a
      // subtle ochre cast instead of the flat gray of clear-sky fog.
      fogTargetCol.lerp(overcastFogWarm, Math.min(1, Math.max(0, current.cover - 0.4) * 1.2));
      s.fog.color.lerp(fogTargetCol, skyLerp);
    }

    const starTargetOpacity =
      (1 - wStudio) * Math.max(0, 1 - day - 0.15) * (1 - current.cover * 0.85) * 0.9;
    starMat.opacity += (starTargetOpacity - starMat.opacity) * skyLerp;
    starPoints.rotation.y = elapsed * 0.002 * motionScale;

    cloudTargetCol
      .set('#ffffff')
      .lerp(sunGlowTmp, hor * (0.45 + 0.25 * seasonCurrent.warmth))
      .lerp(fogNightTmp, 1 - day);
    cloudMat.color.lerp(cloudTargetCol, skyLerp);
    const cloudTargetOpacity = current.cover * 0.85 * (1 - wStudio);
    cloudMat.opacity += (cloudTargetOpacity - cloudMat.opacity) * skyLerp;
    clouds.visible = wStudio < 0.995 && cloudMat.opacity > 0.025;
    const showShadows = cloudMat.opacity > 0.04 && day > 0.12;
    groundShadow.visible = wStudio < 0.995 && showShadows;
    const cloudShadowTargetOpacity = Math.min(0.18, current.cover * 0.16 * day) * (1 - wStudio);
    cloudShadowMat.opacity += (cloudShadowTargetOpacity - cloudShadowMat.opacity) * skyLerp;
    let puffIdx = 0;
    const updateClouds = clouds.visible;
    for (let i = 0; i < cloudSpecs.length; i++) {
      const c = cloudSpecs[i];
      c.a += safeDt * c.s * current.wind * motionScale;
      const cx = Math.cos(c.a) * c.r;
      const cz = Math.sin(c.a) * c.r;
      if (updateClouds) {
        for (let j = 0; j < c.puffs.length; j++) {
          const p = c.puffs[j];
          csPos.set(cx + p.ox, c.y + p.oy, cz + p.oz);
          csScale.set(p.sx, p.sy, p.sz);
          csMatrix.compose(csPos, csQuat, csScale);
          clouds.setMatrixAt(puffIdx++, csMatrix);
        }
      }
      if (showShadows && i < cloudShadowCount) {
        const sc = 3.8 + (i % 3) * 1.15;
        csPos.set(cx * 0.34 - sx * 0.02, 0.045, cz * 0.34 - sz * 0.02);
        csScale.set(sc * 1.15, 1, sc * 0.85);
        csMatrix.compose(csPos, csQuat, csScale);
        groundShadow.setMatrixAt(i, csMatrix);
      }
    }
    if (updateClouds) {
      clouds.instanceMatrix.needsUpdate = true;
    }
    if (showShadows) {
      groundShadow.instanceMatrix.needsUpdate = true;
    }

    dayColTmp
      .copy(winterKeyCol)
      .lerp(summerKeyCol, seasonCurrent.warmth)
      .lerp(autumnKeyTint, seasonCurrent.autumn * 0.22);
    sunColTmp.copy(dayColTmp).lerp(sunGlowTmp, hor * (0.75 + 0.2 * seasonCurrent.warmth));
    const seasonalIntensityScale = 0.88 + 0.22 * seasonCurrent.warmth;
    const dayBlend = THREE.MathUtils.smoothstep(day, 0.05, 0.45);
    dayKeyPosTmp.set(sx * 0.45, Math.max(3, sy * 0.45), sz * 0.55);
    keyPosTarget.copy(nightKeyPos).lerp(dayKeyPosTmp, dayBlend);
    keyColorTarget.copy(nightKeyCol).lerp(sunColTmp, dayBlend);
    const dayKeyIntensity =
      3.05 * seasonalIntensityScale * day * (1 - current.cover * 0.5) * (0.68 + 0.32 * (1 - hor));
    let keyIntensityTarget = THREE.MathUtils.lerp(1.45, dayKeyIntensity, dayBlend);

    seasonFillTmp.copy(winterFillCol).lerp(summerFillCol, seasonCurrent.warmth);
    let fillTarget = (1.35 + 0.12 * seasonCurrent.warmth) * day + 0.85 * (1 - day) + hor * 0.3;

    seasonHemiSkyTmp.copy(winterHemiSky).lerp(summerHemiSky, seasonCurrent.warmth);
    seasonHemiGroundTmp.copy(winterHemiGround).lerp(summerHemiGround, seasonCurrent.warmth);
    let hemiTarget = (1.05 + 0.12 * seasonCurrent.warmth) * day + 0.7 * (1 - day);

    // Fold studio preset continuously into light targets before exponential smoothing.
    if (wStudio > 0.001) {
      keyPosTarget.lerp(studioKeyPos, wStudio);
      keyColorTarget.lerp(studioKeyCol, wStudio);
      keyIntensityTarget = THREE.MathUtils.lerp(keyIntensityTarget, 3.1, wStudio);
      seasonFillTmp.lerp(studioFillCol, wStudio);
      fillTarget = THREE.MathUtils.lerp(fillTarget, 1.3, wStudio);
      seasonHemiSkyTmp.lerp(studioHemiSky, wStudio);
      seasonHemiGroundTmp.lerp(studioHemiGround, wStudio);
      hemiTarget = THREE.MathUtils.lerp(hemiTarget, 0.95, wStudio);
    }

    keyLight.position.lerp(keyPosTarget, lightLerp);
    keyLight.color.lerp(keyColorTarget, lightLerp);
    const prevKeyBase = Math.max(0, keyLight.intensity - lightningFlash * 4.2);
    const smoothedKeyBase = prevKeyBase + (keyIntensityTarget - prevKeyBase) * lightLerp;
    keyLight.intensity = smoothedKeyBase + lightningFlash * 4.2;

    fillLight.color.lerp(seasonFillTmp, lightLerp);
    fillLight.intensity += (fillTarget - fillLight.intensity) * lightLerp;

    hemiLight.color.lerp(seasonHemiSkyTmp, lightLerp);
    hemiLight.groundColor.lerp(seasonHemiGroundTmp, lightLerp);
    hemiLight.intensity += (hemiTarget - hemiLight.intensity) * lightLerp;

    const rainCount = Math.floor((qualityIndex > 1 ? 150 : RN) * current.rain);
    rainGeo.setDrawRange(0, rainCount * 2);
    const rainTargetOpacity = current.rain * 0.42 * (1 - wStudio);
    rainMat.uniforms.uOpacity.value +=
      (rainTargetOpacity - rainMat.uniforms.uOpacity.value) * skyLerp;
    rainMat.uniforms.uWind.value += (current.wind - rainMat.uniforms.uWind.value) * skyLerp;
    rainTargetCol
      .copy(rainNightCol)
      .lerp(rainDayCol, day)
      .lerp(sunGlowTmp, hor * 0.25 * (1 - wStudio));
    rainMat.uniforms.uColor.value.lerp(rainTargetCol, skyLerp);
    rainLines.visible = wStudio < 0.995 && rainMat.uniforms.uOpacity.value > 0.008;
    if (rainLines.visible) {
      rainMat.uniforms.uTime.value = animTime;
    }

    stMat.uniforms.t.value = animTime;
    const stormCurtainTarget = current.storm * (1 - wStudio);
    stMat.uniforms.st.value += (stormCurtainTarget - stMat.uniforms.st.value) * skyLerp;
    stMat.uniforms.fl.value = lightningFlash * (1 - wStudio);
    stormCurtain.visible = wStudio < 0.995 && stMat.uniforms.st.value > 0.02;

    const targetSun = day * (1 - current.cover * 0.65);
    const targetSunHor = hor * (1 - wStudio);
    const targetLit = Math.min(1, Math.max(0, (1 - day) * 1.4 + current.cover * 0.3));
    WU.sun.value += (targetSun - WU.sun.value) * lightLerp;
    WU.sunHor.value += (targetSunHor - WU.sunHor.value) * skyLerp;
    // Drive the shared seasonal uniforms that morph foliage and terrain colours.
    // These are already eased by `seasonCurrent` above, so the transition is smooth.
    WU.season.value = seasonCurrent.warmth;
    WU.seasonAutumn.value = seasonCurrent.autumn;
    WU.seasonSpring.value = seasonCurrent.spring;
    WU.sky.value.copy(skyMat.uniforms.top.value);
    WU.wind.value = current.wind;
    WU.fog.value = current.fog;
    // Ease the sway direction toward the real wind bearing so direction changes aren't a snap.
    const windRad = ((windDirectionDeg + 180) * Math.PI) / 180;
    windDirTmp.set(Math.sin(windRad), -Math.cos(windRad));
    WU.windDir.value.lerp(windDirTmp, sk).normalize();
    WU.rain.value = current.rain;
    WU.lit.value += (targetLit - WU.lit.value) * lightLerp;
  };

  return {
    root,
    starPoints,
    clouds,
    sunDisc,
    moonDisc,
    rainLines,
    stormCurtain,
    groundShadow,
    sunGlowColor: skyMat.uniforms.glow.value,
    skyTopColor: skyMat.uniforms.top.value,
    current,
    target,
    applyCondition,
    applyLiveSample,
    setSeasonMonth,
    setTheme,
    setSiteSkyTint,
    triggerRainbow,
    setHidden,
    update,
  };
}
