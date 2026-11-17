import * as THREE from 'three';
import { WEATHER_CONDITIONS } from '../data/weatherData';
import type { WeatherConditionKey } from '../types/citylit';
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
  groundShadow: THREE.Mesh;
  current: WeatherTargetState;
  target: WeatherTargetState;
  applyCondition: (key: WeatherConditionKey, night: boolean, timeOfDay?: number) => void;
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
      cv: { value: 0.2 },
      nt: { value: 0 },
      sunDir: { value: new THREE.Vector3(0.5, 0.8, 0.3) },
      glow: { value: new THREE.Color('#ff9d5c') },
      hor: { value: 0 },
      rb: { value: 0 },
    },
    vertexShader:
      'varying vec3 v;void main(){v=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader: `varying vec3 v;uniform float t,cv,nt,hor,rb;uniform vec3 top,bot,sunDir,glow;${SKY_NOISE_GLSL}void main(){float y=clamp(v.y,0.,1.);vec3 col=mix(bot,top,pow(y,.55));vec3 d=normalize(v),sd=normalize(sunDir);float sdDot=max(0.,dot(d,sd));col+=glow*(hor*pow(1.-y,4.)*(.45+.55*sdDot)+pow(sdDot,18.)*.35);float sp=pow(sdDot,420.)*(1.-cv*.85);col+=mix(vec3(1.,.96,.88),glow,hor)*sp*1.5;if(v.y>.03){vec2 p=v.xz/(v.y+.18);float c=fbm(p*.9+vec2(t*.015,t*.006));float f=smoothstep(.65-cv*.4,.88-cv*.3,c)*smoothstep(.03,.2,v.y)*cv;vec3 cCol=mix(vec3(.88,.91,.96),vec3(.25,.28,.36),nt*.7+cv*.3)+glow*hor*.45;col=mix(col,cCol,f*.8);}if(rb>.01){float ang=acos(clamp(dot(d,-sd),-1.,1.));float r=smoothstep(.045,0.,abs(ang-.73))*smoothstep(0.,.12,v.y);float h=clamp((ang-.685)/.09,0.,1.);vec3 rc=clamp(abs(mod(h*5.+vec3(0.,4.,2.),6.)-3.)-1.,0.,1.);col+=rc*r*rb*.22;}gl_FragColor=vec4(col,1.);}`,
  });

  const skyDome = new THREE.Mesh(new THREE.SphereGeometry(75, 32, 24), skyMat);
  skyDome.frustumCulled = false;
  root.add(skyDome);

  const gshMat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: { t: { value: 0 }, op: { value: 0 } },
    vertexShader:
      'varying vec2 v;void main(){v=position.xy;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader: `varying vec2 v;uniform float t,op;${SKY_NOISE_GLSL}void main(){float d=length(v);if(d>9.)discard;float s=smoothstep(.35,.75,fbm(v*.18+vec2(t*.04,t*.02)));gl_FragColor=vec4(0.,0.,0.,s*op*(1.-smoothstep(6.,9.,d)));}`,
  });
  const groundShadow = new THREE.Mesh(new THREE.PlaneGeometry(18, 18), gshMat);
  groundShadow.rotation.x = -Math.PI / 2;
  groundShadow.position.y = 0.04;
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
    const k = Math.min(1, dt * 1.5);
    current.sky.lerp(target.sky, k);
    current.cover += (target.cover - current.cover) * k;
    current.rain += (target.rain - current.rain) * k;
    current.fog += (target.fog - current.fog) * k;
    current.wind += (target.wind - current.wind) * k;
    current.storm += (target.storm - current.storm) * k;
    current.night += (target.night - current.night) * k;
    current.timeOfDay += (target.timeOfDay - current.timeOfDay) * k;

    const hr = current.timeOfDay;
    const alt = Math.sin(((hr - 6) * Math.PI) / 12);
    const sx = -Math.cos(((hr - 6) * Math.PI) / 12) * 32;
    const sy = alt * 34;
    const sz = 18;
    const hor = Math.max(0, 1 - Math.abs(alt) * 3.5);
    const day = Math.max(0, Math.min(1, alt * 2.5 + 0.35));

    sunDisc.position.set(sx, sy, sz);
    sunDisc.visible = sy > -2 && !renderer.xr.isPresenting;
    moonDisc.position.set(-sx * 0.85, Math.max(12, -sy * 0.7 + 14), -16);
    moonDisc.visible = day < 0.7;

    if (current.storm > 0.4) {
      thunderTimer -= dt;
      if (thunderTimer < 0) {
        lightningFlash = 1.6;
        thunderTimer = 2.5 + Math.random() * 5;
        onThunder?.();
      }
    }
    lightningFlash = Math.max(0, lightningFlash - dt * 6);

    dayTopTmp.copy(current.sky).lerp(duskSkyTmp, hor * 0.65);
    skyTmp.copy(dayTopTmp).lerp(nightSkyTmp, 1 - day);
    skyMat.uniforms.top.value.copy(skyTmp);

    botTmp.copy(botDayTmp).lerp(botNightTmp, 1 - day);
    skyMat.uniforms.bot.value.copy(botTmp);
    skyMat.uniforms.t.value = elapsed * motionScale;
    skyMat.uniforms.cv.value = current.cover;
    skyMat.uniforms.nt.value = 1 - day;
    skyMat.uniforms.sunDir.value.set(sx, sy, sz).normalize();

    sunGlowTmp.copy(sunGoldTmp).lerp(sunRedTmp, Math.max(0, 0.5 - alt) * 2);
    skyMat.uniforms.glow.value.copy(sunGlowTmp);
    skyMat.uniforms.hor.value = hor * (1 - current.cover * 0.5);

    rainbowTimer = Math.max(0, rainbowTimer - dt);
    skyMat.uniforms.rb.value = Math.min(1, rainbowTimer / 2) * day;

    skyDarkTmp.copy(skyTmp).multiplyScalar(0.5);
    (s.background as THREE.Color).copy(skyDarkTmp);

    fogTmp.copy(fogDayTmp).lerp(fogNightTmp, 1 - day);
    const fogDensity = 0.008 + current.fog * 0.032;
    if (s.fog instanceof THREE.FogExp2) {
      s.fog.density += (fogDensity - s.fog.density) * k;
      s.fog.color.copy(fogTmp).lerp(sunGlowTmp, hor * 0.25);
    }

    starMat.opacity = Math.max(0, 1 - day - 0.15) * (1 - current.cover * 0.85) * 0.9;
    starPoints.rotation.y = elapsed * 0.002 * motionScale;

    cloudMat.color
      .set('#ffffff')
      .lerp(sunGlowTmp, hor * 0.6)
      .lerp(fogNightTmp, 1 - day);
    cloudMat.opacity = current.cover * 0.85;
    clouds.visible = current.cover > 0.06;
    clouds.children.forEach((c) => {
      c.userData.a += dt * (c.userData.s as number) * current.wind * motionScale;
      c.position.x = Math.cos(c.userData.a as number) * (c.userData.r as number);
      c.position.z = Math.sin(c.userData.a as number) * (c.userData.r as number);
    });

    sunColTmp.copy(dayColTmp).lerp(sunGlowTmp, hor * 0.9);
    if (day > 0.15) {
      keyLight.position.set(sx * 0.45, Math.max(3, sy * 0.45), sz * 0.55);
      keyLight.color.copy(sunColTmp);
      keyLight.intensity =
        (3.4 * day * (1 - current.cover * 0.6) + lightningFlash * 4) * (0.55 + 0.45 * (1 - hor));
    } else {
      keyLight.position.set(-10, 14, -8);
      keyLight.color.set('#b8d0ff');
      keyLight.intensity = 1.6 + lightningFlash * 4;
    }

    fillLight.intensity = 0.8 * day + 0.55 * (1 - day) + hor * 0.35;
    hemiLight.intensity = 1.0 * day + 0.6 * (1 - day);

    const rainCount = Math.floor((qualityIndex > 1 ? 150 : RN) * current.rain);
    rainGeo.setDrawRange(0, rainCount * 2);
    rainLines.visible = current.rain > 0.03;
    rainMat.opacity = current.rain * 0.42;
    if (rainLines.visible) {
      for (let i = 0; i < rainCount; i++) {
        const j = i * 6;
        rainPos[j] += dt * current.wind * 1.4;
        rainPos[j + 1] -= dt * 19;
        if (rainPos[j + 1] < 0) {
          rainPos[j + 1] = 18;
          rainPos[j] = (Math.random() - 0.5) * 28;
        }
        rainPos[j + 3] = rainPos[j] + current.wind * 0.08;
        rainPos[j + 4] = rainPos[j + 1] - 0.65;
      }
      rainGeo.attributes.position.needsUpdate = true;
    }

    gshMat.uniforms.t.value = elapsed * motionScale;
    gshMat.uniforms.op.value = current.cover * 0.14 * day;
    stMat.uniforms.t.value = elapsed * motionScale;
    stMat.uniforms.st.value = current.storm;
    stMat.uniforms.fl.value = lightningFlash;
    stormCurtain.visible = current.storm > 0.03;

    WU.t.value = elapsed * motionScale;
    WU.sun.value = day * (1 - current.cover * 0.65);
    WU.sky.value.copy(skyTmp);
    WU.wind.value = current.wind;
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
    triggerRainbow,
    setHidden,
    update,
  };
}
