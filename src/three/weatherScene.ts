import * as THREE from 'three';
import { liveWeatherVisual, WEATHER_CONDITIONS } from '../data/weatherData';
import type { LiveWeatherSample, ThemeSetting, WeatherConditionKey } from '../types/citylit';
import { getSoftTexture, SKY_NOISE_GLSL, WU } from './shaders';

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
  clouds: THREE.Group;
  sunDisc: THREE.Mesh;
  moonDisc: THREE.Mesh;
  rainLines: THREE.LineSegments;
  stormCurtain: THREE.Mesh;
  groundShadow: THREE.InstancedMesh;
  current: WeatherTargetState;
  target: WeatherTargetState;
  applyCondition: (key: WeatherConditionKey, night: boolean, timeOfDay?: number) => void;
  /** Drive the scene from a real observation using continuous values. */
  applyLiveSample: (sample: LiveWeatherSample, timeOfDay: number) => void;
  setSeasonMonth: (month: number, immediate?: boolean) => void;
  setTheme: (theme: ThemeSetting) => void;
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

interface SeasonWeights {
  warmth: number;
  autumn: number;
  spring: number;
}

function monthToSeasonWeights(month: number): SeasonWeights {
  const clamped = Math.max(1, Math.min(12, month));
  const angle = ((clamped - 1) / 12) * Math.PI * 2;
  return {
    warmth: (Math.cos(angle) + 1) * 0.5,
    autumn: Math.max(0, Math.sin(angle)),
    spring: Math.max(0, -Math.sin(angle)),
  };
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
      cv: { value: 0.2 },
      nt: { value: 0 },
      sunDir: { value: new THREE.Vector3(0.5, 0.8, 0.3) },
      glow: { value: new THREE.Color('#ff9d5c') },
      hor: { value: 0 },
      rb: { value: 0 },
    },
    vertexShader:
      'varying vec3 v;void main(){v=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader: `varying vec3 v;uniform float t,cv,nt,hor,rb;uniform vec3 top,bot,sunDir,glow;${SKY_NOISE_GLSL}void main(){float y=clamp(v.y,0.,1.);vec3 col=mix(bot,top,pow(y,.55));vec3 d=normalize(v),sd=normalize(sunDir);float sdDot=max(0.,dot(d,sd));float sunUp=smoothstep(-.02,.08,sd.y);float horMask=smoothstep(-.22,.02,v.y);col+=glow*(hor*pow(1.-y,4.)*(.45+.55*sdDot)+pow(sdDot,18.)*.35)*sunUp*horMask;float sp=pow(sdDot,420.)*(1.-cv*.85)*sunUp;col+=mix(vec3(1.,.96,.88),glow,hor)*sp*1.5;if(v.y>.03){vec2 p=v.xz/(v.y+.18);float c=fbm(p*.9+vec2(t*.015,t*.006));float f=smoothstep(.65-cv*.4,.88-cv*.3,c)*smoothstep(.03,.2,v.y)*cv;vec3 cCol=mix(vec3(.88,.91,.96),vec3(.25,.28,.36),nt*.7+cv*.3)+glow*hor*.45;col=mix(col,cCol,f*.8);}if(rb>.01){float ang=acos(clamp(dot(d,-sd),-1.,1.));float r=smoothstep(.045,0.,abs(ang-.73))*smoothstep(0.,.12,v.y);float h=clamp((ang-.685)/.09,0.,1.);vec3 rc=clamp(abs(mod(h*5.+vec3(0.,4.,2.),6.)-3.)-1.,0.,1.);col+=rc*r*rb*.22;}gl_FragColor=vec4(col,1.);}`,
  });

  const skyDome = new THREE.Mesh(new THREE.SphereGeometry(75, 32, 24), skyMat);
  skyDome.frustumCulled = false;
  root.add(skyDome);

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

  const sunDisc = new THREE.Mesh(
    new THREE.SphereGeometry(2.1, 16, 12),
    new THREE.MeshBasicMaterial({ color: '#fff4c8', fog: false })
  );
  root.add(sunDisc);

  const moonDisc = new THREE.Mesh(
    new THREE.SphereGeometry(1.1, 16, 12),
    new THREE.MeshBasicMaterial({ color: '#dde7ff', fog: false })
  );
  root.add(moonDisc);

  const clouds = new THREE.Group();
  root.add(clouds);
  const cloudMat = new THREE.MeshStandardMaterial({
    color: '#ffffff',
    roughness: 1,
    transparent: true,
    opacity: 0.85,
  });
  for (let i = 0; i < 14; i++) {
    const g = new THREE.Group();
    const k = 3 + (i % 3);
    for (let j = 0; j < k; j++) {
      const m = new THREE.Mesh(new THREE.SphereGeometry(1 + ((i + j) % 3) * 0.4, 10, 8), cloudMat);
      m.position.set((j - 1) * 1.1, (j % 2) * 0.25, (((i * j) % 3) - 1) * 0.4);
      m.scale.set(1.5, 0.55, 1.1);
      g.add(m);
    }
    const a = i * 0.45;
    const rad = 16 + (i % 4) * 5;
    g.position.set(Math.cos(a) * rad, 11 + (i % 4) * 2.2, Math.sin(a) * rad);
    g.userData = { a, r: rad, s: 0.015 + (i % 3) * 0.01 };
    clouds.add(g);
  }

  const RN = 450;
  const rainPos = new Float32Array(RN * 6);
  const rainGeo = new THREE.BufferGeometry().setAttribute(
    'position',
    new THREE.BufferAttribute(rainPos, 3)
  );
  const rainMat = new THREE.LineBasicMaterial({
    color: '#bcd4ff',
    transparent: true,
    opacity: 0,
  });
  const rainLines = new THREE.LineSegments(rainGeo, rainMat);
  rainLines.frustumCulled = false;
  root.add(rainLines);
  for (let i = 0; i < RN; i++) {
    const x = (Math.random() - 0.5) * 28;
    const y = Math.random() * 18;
    const z = (Math.random() - 0.5) * 28;
    rainPos.set([x, y, z, x, y - 0.65, z], i * 6);
  }

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
  let activeTheme: ThemeSetting = 'dark';

  const csPos = new THREE.Vector3();
  const csQuat = new THREE.Quaternion();
  const csScale = new THREE.Vector3();
  const csMatrix = new THREE.Matrix4();
  const daylightBgCol = new THREE.Color('#a8d8ec');
  const daylightSkyTopCol = new THREE.Color('#77bde0');
  const daylightSkyBotCol = new THREE.Color('#cfeaf6');
  const daylightStormBgCol = new THREE.Color('#7d98ad');
  const daylightNightBgCol = new THREE.Color('#131b2c');

  const skyTmp = new THREE.Color();
  const skyDarkTmp = new THREE.Color();
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
  let windDirectionDeg = 0;

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

  const setTheme = (theme: ThemeSetting) => {
    activeTheme = theme;
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
    const studio = activeTheme === 'studio';
    skyDome.visible = !studio;
    const k = Math.max(0, Math.min(1, safeDt * 1.5));
    const sk = 1 - Math.exp(-safeDt * 0.45);
    current.sky.lerp(target.sky, k);
    current.cover += (target.cover - current.cover) * k;
    current.rain += (target.rain - current.rain) * k;
    current.fog += (target.fog - current.fog) * k;
    current.wind += (target.wind - current.wind) * k;
    current.storm += (target.storm - current.storm) * k;
    current.night += (target.night - current.night) * k;
    current.timeOfDay += (target.timeOfDay - current.timeOfDay) * k;

    seasonCurrent.warmth += (seasonTarget.warmth - seasonCurrent.warmth) * sk;
    seasonCurrent.autumn += (seasonTarget.autumn - seasonCurrent.autumn) * sk;
    seasonCurrent.spring += (seasonTarget.spring - seasonCurrent.spring) * sk;

    const hr = current.timeOfDay;
    const rawAlt = Math.sin(((hr - 6) * Math.PI) / 12);
    const alt = rawAlt + (seasonCurrent.warmth - 0.5) * 0.12 * Math.max(0, rawAlt);
    const sx = -Math.cos(((hr - 6) * Math.PI) / 12) * 32;
    const sy = alt * 34;
    const sz = 18;
    const hor = Math.max(0, 1 - Math.abs(alt) * 3.5);
    const day = Math.max(0, Math.min(1, alt * 2.5 + 0.35));

    sunDisc.position.set(sx, sy, sz);
    sunDisc.visible = !studio && sy > -2 && !renderer.xr.isPresenting;
    moonDisc.position.set(-sx * 0.85, Math.max(12, -sy * 0.7 + 14), -16);
    moonDisc.visible = !studio && day < 0.7;

    if (current.storm > 0.4) {
      thunderTimer -= safeDt;
      if (thunderTimer < 0) {
        lightningFlash = 1.6;
        thunderTimer = 2.5 + Math.random() * 5;
        onThunder?.();
      }
    }
    lightningFlash = Math.max(0, lightningFlash - safeDt * 6);

    seasonSkyTmp
      .copy(winterSkyTint)
      .lerp(summerSkyTint, seasonCurrent.warmth)
      .lerp(springSkyTint, seasonCurrent.spring * 0.28);
    dayTopTmp
      .copy(current.sky)
      .lerp(seasonSkyTmp, 0.38)
      .lerp(duskSkyTmp, hor * (0.58 + 0.14 * seasonCurrent.warmth));
    if (activeTheme === 'daylight') {
      dayTopTmp.lerp(daylightSkyTopCol, 0.72 * (1 - current.storm * 0.5));
    }
    skyTmp.copy(dayTopTmp).lerp(nightSkyTmp, 1 - day);
    skyMat.uniforms.top.value.copy(skyTmp);

    botTmp
      .copy(activeTheme === 'daylight' ? daylightSkyBotCol : botDayTmp)
      .lerp(botNightTmp, 1 - day);
    skyMat.uniforms.bot.value.copy(botTmp);
    skyMat.uniforms.t.value = elapsed * motionScale;
    skyMat.uniforms.cv.value = current.cover;
    skyMat.uniforms.nt.value = 1 - day;
    skyMat.uniforms.sunDir.value.set(sx, sy, sz).normalize();

    seasonGlowTmp.copy(winterGlowCol).lerp(summerGlowCol, seasonCurrent.warmth);
    sunGlowTmp
      .copy(sunGoldTmp)
      .lerp(seasonGlowTmp, 0.45)
      .lerp(sunRedTmp, Math.max(0, 0.5 - alt) * (1.4 + 0.6 * seasonCurrent.warmth));
    skyMat.uniforms.glow.value.copy(sunGlowTmp);
    skyMat.uniforms.hor.value = hor * (1 - current.cover * 0.5);

    rainbowTimer = Math.max(0, rainbowTimer - safeDt);
    skyMat.uniforms.rb.value = Math.min(1, rainbowTimer / 2) * day;

    if (studio) {
      (s.background as THREE.Color).set('#f7f7f4');
    } else if (activeTheme === 'daylight') {
      skyDarkTmp
        .copy(daylightBgCol)
        .lerp(daylightStormBgCol, Math.min(1, current.cover * 0.35 + current.storm * 0.55))
        .lerp(daylightNightBgCol, 1 - day);
      (s.background as THREE.Color).copy(skyDarkTmp);
    } else {
      skyDarkTmp.copy(skyTmp).multiplyScalar(0.5);
      (s.background as THREE.Color).copy(skyDarkTmp);
    }

    fogDayTmp.copy(winterFogDay).lerp(summerFogDay, seasonCurrent.warmth);
    if (activeTheme === 'daylight') {
      fogDayTmp.lerp(daylightBgCol, 0.72);
    }
    fogTmp.copy(fogDayTmp).lerp(fogNightTmp, 1 - day);
    const fogDensity = studio
      ? 0
      : activeTheme === 'daylight'
        ? 0.0018 + current.fog * 0.0085
        : 0.008 + current.fog * 0.032;
    if (s.fog instanceof THREE.FogExp2) {
      s.fog.density += (fogDensity - s.fog.density) * k;
      s.fog.color
        .copy(fogTmp)
        .lerp(
          sunGlowTmp,
          hor * (activeTheme === 'daylight' ? 0.08 : 0.18 + 0.14 * seasonCurrent.warmth)
        );
    }

    starMat.opacity = studio
      ? 0
      : Math.max(0, 1 - day - 0.15) * (1 - current.cover * 0.85) * 0.9;
    starPoints.rotation.y = elapsed * 0.002 * motionScale;

    cloudMat.color
      .set('#ffffff')
      .lerp(sunGlowTmp, hor * (0.45 + 0.25 * seasonCurrent.warmth))
      .lerp(fogNightTmp, 1 - day);
    cloudMat.opacity = current.cover * 0.85;
    clouds.visible = !studio && current.cover > 0.06;
    const showShadows = current.cover > 0.06 && day > 0.12;
    groundShadow.visible = !studio && showShadows;
    cloudShadowMat.opacity = Math.min(0.18, current.cover * 0.16 * day);
    for (let i = 0; i < clouds.children.length; i++) {
      const c = clouds.children[i];
      c.userData.a += safeDt * (c.userData.s as number) * current.wind * motionScale;
      const cx = Math.cos(c.userData.a as number) * (c.userData.r as number);
      const cz = Math.sin(c.userData.a as number) * (c.userData.r as number);
      c.position.x = cx;
      c.position.z = cz;
      if (showShadows && i < cloudShadowCount) {
        const sc = 3.8 + (i % 3) * 1.15;
        csPos.set(cx * 0.34 - sx * 0.02, 0.045, cz * 0.34 - sz * 0.02);
        csScale.set(sc * 1.15, 1, sc * 0.85);
        csMatrix.compose(csPos, csQuat, csScale);
        groundShadow.setMatrixAt(i, csMatrix);
      }
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
    if (day > 0.15) {
      keyLight.position.set(sx * 0.45, Math.max(3, sy * 0.45), sz * 0.55);
      keyLight.color.copy(sunColTmp);
      keyLight.intensity =
        (2.75 * seasonalIntensityScale * day * (1 - current.cover * 0.55) + lightningFlash * 4) *
        (0.55 + 0.45 * (1 - hor));
    } else {
      keyLight.position.set(-10, 14, -8);
      keyLight.color.set('#b8d0ff');
      keyLight.intensity = 1.45 + lightningFlash * 4;
    }

    seasonFillTmp.copy(winterFillCol).lerp(summerFillCol, seasonCurrent.warmth);
    fillLight.color.copy(seasonFillTmp);
    fillLight.intensity =
      (0.55 + 0.08 * seasonCurrent.warmth) * day + 0.45 * (1 - day) + hor * 0.28;

    seasonHemiSkyTmp.copy(winterHemiSky).lerp(summerHemiSky, seasonCurrent.warmth);
    seasonHemiGroundTmp.copy(winterHemiGround).lerp(summerHemiGround, seasonCurrent.warmth);
    hemiLight.color.copy(seasonHemiSkyTmp);
    hemiLight.groundColor.copy(seasonHemiGroundTmp);
    hemiLight.intensity = (0.36 + 0.08 * seasonCurrent.warmth) * day + 0.34 * (1 - day);

    // Studio/catalog look: flat, neutral, bright light that reads cleanly on white.
    if (studio) {
      keyLight.position.set(9, 13, 7);
      keyLight.color.set('#fffaf0');
      keyLight.intensity = 2.8;
      fillLight.color.set('#e9efff');
      fillLight.intensity = 1.0;
      hemiLight.color.set('#ffffff');
      hemiLight.groundColor.set('#cdd2d8');
      hemiLight.intensity = 0.75;
    }

    const rainCount = Math.floor((qualityIndex > 1 ? 150 : RN) * current.rain);
    rainGeo.setDrawRange(0, rainCount * 2);
    rainLines.visible = !studio && current.rain > 0.03;
    rainMat.opacity = current.rain * 0.42;
    if (rainLines.visible) {
      for (let i = 0; i < rainCount; i++) {
        const j = i * 6;
        rainPos[j] += safeDt * current.wind * 1.4;
        rainPos[j + 1] -= safeDt * 19;
        if (rainPos[j + 1] < 0) {
          rainPos[j + 1] = 18;
          rainPos[j] = (Math.random() - 0.5) * 28;
        }
        rainPos[j + 3] = rainPos[j] + current.wind * 0.08;
        rainPos[j + 4] = rainPos[j + 1] - 0.65;
      }
      rainGeo.attributes.position.needsUpdate = true;
    }

    stMat.uniforms.t.value = elapsed * motionScale;
    stMat.uniforms.st.value = current.storm;
    stMat.uniforms.fl.value = lightningFlash;
    stormCurtain.visible = !studio && current.storm > 0.03;

    WU.sun.value = day * (1 - current.cover * 0.65);
    WU.sky.value.copy(skyTmp);
    WU.wind.value = current.wind;
    // Ease the sway direction toward the real wind bearing so direction changes aren't a snap.
    const windRad = ((windDirectionDeg + 180) * Math.PI) / 180;
    windDirTmp.set(Math.sin(windRad), -Math.cos(windRad));
    WU.windDir.value.lerp(windDirTmp, sk).normalize();
    WU.rain.value = current.rain;
    WU.lit.value = Math.min(1, Math.max(0, (1 - day) * 1.4 + current.cover * 0.3));
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
    current,
    target,
    applyCondition,
    applyLiveSample,
    setSeasonMonth,
    setTheme,
    triggerRainbow,
    setHidden,
    update,
  };
}
