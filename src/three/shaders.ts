import * as THREE from 'three';

export const WU = {
  t: { value: 0 },
  sun: { value: 1 },
  sky: { value: new THREE.Color('#3b6490') },
  wind: { value: 1 },
  lit: { value: 0 },
  dy: { value: 100 },
};

function applyDissolveToShader(shader: THREE.WebGLProgramParametersWithUniforms): void {
  if (
    !shader.vertexShader.includes('#include <begin_vertex>') ||
    !shader.fragmentShader.includes('#include <alphatest_fragment>')
  ) {
    return;
  }
  shader.uniforms.uDY = WU.dy;
  shader.vertexShader = shader.vertexShader
    .replace('#include <common>', '#include <common>\nvarying vec3 vWD;uniform float uDY;')
    .replace(
      '#include <begin_vertex>',
      '#include <begin_vertex>\nvWD=(modelMatrix*vec4(transformed,1.)).xyz;'
    );
  shader.fragmentShader = shader.fragmentShader
    .replace('#include <common>', '#include <common>\nvarying vec3 vWD;uniform float uDY;')
    .replace(
      '#include <alphatest_fragment>',
      `#include <alphatest_fragment>
if(uDY<90.&&vWD.y>uDY&&dot(vWD.xz,vWD.xz)<110.&&vWD.y<14.)discard;diffuseColor.rgb+=vec3(1.,.75,.35)*smoothstep(uDY-.3,uDY,vWD.y)*step(vWD.y,uDY)*(uDY<90.?2.:0.);`
    );
}

let dissolveInstalled = false;

export function installDissolveShader(): void {
  if (dissolveInstalled) return;
  dissolveInstalled = true;

  THREE.Material.prototype.onBeforeCompile = function (shader) {
    if (
      (this as THREE.Material & { isSpriteMaterial?: boolean }).isSpriteMaterial ||
      (this as THREE.Material & { isPointsMaterial?: boolean }).isPointsMaterial ||
      (this as THREE.Material & { isLineBasicMaterial?: boolean }).isLineBasicMaterial
    ) {
      return;
    }
    applyDissolveToShader(shader);
  };
}

let softTextureCache: THREE.CanvasTexture | null = null;

export function getSoftTexture(): THREE.CanvasTexture {
  if (softTextureCache) return softTextureCache;
  const c = document.createElement('canvas');
  c.width = 64;
  c.height = 64;
  const ctx = c.getContext('2d');
  if (ctx) {
    const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.4, 'rgba(255,255,255,.5)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 64, 64);
  }
  softTextureCache = new THREE.CanvasTexture(c);
  return softTextureCache;
}

export function waterize(mat: THREE.MeshStandardMaterial): THREE.MeshStandardMaterial {
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uWT = WU.t;
    shader.uniforms.uSI = WU.sun;
    shader.uniforms.uSky = WU.sky;
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vW;')
      .replace(
        '#include <begin_vertex>',
        '#include <begin_vertex>\nvW=(modelMatrix*vec4(transformed,1.)).xyz;'
      );
    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        '#include <common>\nvarying vec3 vW;uniform float uWT,uSI;uniform vec3 uSky;'
      )
      .replace(
        '#include <normal_fragment_maps>',
        `#include <normal_fragment_maps>
{vec2 q=vW.xz;float a=q.x*3.+uWT*1.3,b=q.y*2.4-uWT*1.1,c=(q.x+q.y)*5.+uWT*2.;vec3 pn=vec3(cos(a)*.15+cos(c)*.1,0.,cos(b)*.15+cos(c)*.1);normal=normalize(normal+(viewMatrix*vec4(pn,0.)).xyz*.7);}`
      )
      .replace(
        '#include <opaque_fragment>',
        `{float fr=pow(1.-max(dot(normalize(vViewPosition),normal),0.),3.);outgoingLight=mix(outgoingLight,uSky,fr*.5);float sp=pow(max(0.,sin(vW.x*9.+uWT*3.)*sin(vW.z*8.-uWT*2.5)),14.);outgoingLight+=vec3(1.,.95,.8)*sp*.7*uSI;}
#include <opaque_fragment>`
      );
    applyDissolveToShader(shader);
  };
  mat.customProgramCacheKey = () => 'water';
  return mat;
}

export function windy(mat: THREE.MeshStandardMaterial): THREE.MeshStandardMaterial {
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uWT = WU.t;
    shader.uniforms.uWd = WU.wind;
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nuniform float uWT,uWd;')
      .replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
{vec3 wp=(modelMatrix*vec4(transformed,1.)).xyz;float k=max(position.y+.3,0.);transformed.x+=(sin(uWT*1.8+wp.x*.9+wp.z*.7)*.05+sin(uWT*7.+wp.x*5.)*.012)*uWd*k;transformed.z+=cos(uWT*1.5+wp.z*.8)*.035*uWd*k;}`
      );
    applyDissolveToShader(shader);
  };
  mat.customProgramCacheKey = () => 'wind';
  return mat;
}

export function lights(mat: THREE.MeshStandardMaterial): THREE.MeshStandardMaterial {
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uWT = WU.t;
    shader.uniforms.uLit = WU.lit;
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vW;')
      .replace(
        '#include <begin_vertex>',
        '#include <begin_vertex>\nvW=(modelMatrix*vec4(transformed,1.)).xyz;'
      );
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vW;uniform float uWT,uLit;')
      .replace(
        '#include <emissivemap_fragment>',
        `#include <emissivemap_fragment>
{vec3 cc=floor(vW*2.5);float hh=fract(sin(dot(cc,vec3(12.9898,78.233,37.719)))*43758.5453);float on=smoothstep(hh*.8,hh*.8+.2,uLit);totalEmissiveRadiance*=mix(.3,1.,on)*(.88+.12*sin(uWT*(3.+hh*5.)+hh*30.));}`
      );
    applyDissolveToShader(shader);
  };
  mat.customProgramCacheKey = () => 'lights';
  return mat;
}

export const SKY_NOISE_GLSL = `
float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1.,0.)),f.x),mix(h(i+vec2(0.,1.)),h(i+vec2(1.,1.)),f.x),f.y);}
float fbm(vec2 p){float a=.5,s=0.;for(int i=0;i<4;i++){s+=a*n(p);p=p*2.03+vec2(17.,9.);a*=.5;}return s;}
`;
