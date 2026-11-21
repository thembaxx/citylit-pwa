import * as THREE from 'three';

/**
 * Global illumination (GI) for the diorama/places scenes: an irradiance probe
 * volume (a `Data3DTexture`) built once from the sky HDRI, sampled per
 * fragment in physical-material shaders as an additional ambient bounce light.
 *
 * The probes are irradiance estimates: for each world-space probe point we
 * sample the equirectangular sky environment along +Y and the horizontal
 * directions, weighting the up-hemisphere heavily so clouds and horizon
 * light bounce onto surfaces.
 */

const probeOrigin = new THREE.Vector3(-3.2, -0.6, -3.2);
const probeSize = new THREE.Vector3(6.4, 4.0, 6.4);
const probeGrid = new THREE.Vector3(7, 7, 5);
const giIntensity = 0.58;

interface Equirect {
  data: Float32Array;
  width: number;
  height: number;
}

/** Horizontal directions used for the horizontal irradiance term (dir, weight). */
const HORIZ_DIRS: Array<[number, number, number, number]> = [
  [1, 0, 0, 0.28],
  [-1, 0, 0, 0.28],
  [0, 0, 1, 0.15],
  [0, 0, -1, 0.15],
];

let giTexture: THREE.Data3DTexture | null = null;

function sampleEquirect(eq: Equirect, dir: THREE.Vector3): THREE.Color {
  const u = 0.5 + Math.atan2(dir.z, dir.x) / (2 * Math.PI);
  const v = 0.5 - Math.asin(Math.min(1, Math.max(-1, dir.y))) / Math.PI;
  const x = Math.min(eq.width - 1, Math.max(0, Math.floor(u * eq.width)));
  const y = Math.min(eq.height - 1, Math.max(0, Math.floor(v * eq.height)));
  const o = (y * eq.width + x) * 4;
  const r = eq.data[o];
  const g = eq.data[o + 1];
  const b = eq.data[o + 2];
  return new THREE.Color(r, g, b);
}

function buildProbeData(eq: Equirect): Uint8Array {
  const gx = Math.max(1, Math.round(probeGrid.x));
  const gy = Math.max(1, Math.round(probeGrid.y));
  const gz = Math.max(1, Math.round(probeGrid.z));
  // Data3DTexture defaults to UnsignedByteType; matching that avoids a
  // texSubImage3D type mismatch (and the float-linear filter requirement).
  const data = new Uint8Array(gx * gy * gz * 4);
  const tmp = new THREE.Vector3();
  for (let z = 0; z < gz; z++) {
    for (let y = 0; y < gy; y++) {
      for (let x = 0; x < gx; x++) {
        let ir = 0;
        let ig = 0;
        let ib = 0;
        // Up hemisphere: the dominant contributor for bounce light.
        const up = sampleEquirect(eq, new THREE.Vector3(0, 1, 0));
        ir += up.r * 0.5;
        ig += up.g * 0.5;
        ib += up.b * 0.5;
        for (const [dx, dy, dz, w] of HORIZ_DIRS) {
          const c = sampleEquirect(eq, tmp.set(dx, dy, dz));
          ir += c.r * w;
          ig += c.g * w;
          ib += c.b * w;
        }
        const o = (z * gy * gx + y * gx + x) * 4;
        data[o] = Math.round(Math.min(1, ir) * 255);
        data[o + 1] = Math.round(Math.min(1, ig) * 255);
        data[o + 2] = Math.round(Math.min(1, ib) * 255);
        data[o + 3] = 255;
      }
    }
  }
  return data;
}

export function installGI(): void {
  if (giTexture) return;
  giTexture = new THREE.Data3DTexture(null, probeGrid.x, probeGrid.y, probeGrid.z);
  giTexture.format = THREE.RGBAFormat;
  giTexture.type = THREE.UnsignedByteType;
  giTexture.minFilter = THREE.LinearFilter;
  giTexture.magFilter = THREE.LinearFilter;
  // Register the global material patch the same way installDissolveShader
  // does: append to the shared onBeforeCompile wrapper chain.
  const orig = THREE.Material.prototype.onBeforeCompile;
  THREE.Material.prototype.onBeforeCompile = function (
    this: THREE.Material,
    shader: any,
    renderer?: any
  ) {
    if (orig) orig.call(this, shader, renderer);
    if (!giTexture) return;
    if (!(this as THREE.Material & { isMeshPhysicalMaterial?: boolean; isMeshStandardMaterial?: boolean }).isMeshPhysicalMaterial) {
      if (!(this as THREE.Material & { isMeshStandardMaterial?: boolean }).isMeshStandardMaterial) return;
    }
    const frag = shader.fragmentShader as string;
    if (!frag.includes('#include <opaque_fragment>')) return;
    if (frag.includes('probeGI')) return;
    const defs = `
      uniform sampler3D tGI;
      uniform vec3 uGIOrigin;
      uniform vec3 uGISize;
      uniform float uGIIntensity;
      varying vec3 vGIWorldPos;
      vec3 probeGI(vec3 wp) {
        vec3 uv = (wp - uGIOrigin) / uGISize + 0.5;
        return texture(tGI, clamp(uv, 0.0, 1.0)).rgb;
      }
    `;
    shader.fragmentShader = defs + frag
      .replace('#include <opaque_fragment>', (m: string) => m + `\ngl_FragColor.rgb += probeGI(vGIWorldPos.xyz) * uGIIntensity;`);
    const vert = shader.vertexShader as string;
    if (vert.includes('varying vec3 vViewPosition;')) {
      shader.vertexShader = vert
        .replace('varying vec3 vViewPosition;', 'varying vec3 vViewPosition;\nvarying vec3 vGIWorldPos;')
        .replace(
          '#include <project_vertex>',
          '#include <project_vertex>\n\tvGIWorldPos = ( modelMatrix * vec4( transformed, 1.0 ) ).xyz;'
        );
    }
    const u = shader.uniforms as Record<string, any>;
    u.tGI = { value: giTexture };
    u.uGIOrigin = { value: probeOrigin };
    u.uGISize = { value: probeSize };
    u.uGIIntensity = { value: giIntensity };
  };
}

export function attachEquirect(hdrTex: THREE.Texture): void {
  if (!giTexture) return;
  const img = hdrTex.image as { data?: Float32Array | Uint16Array; width?: number; height?: number } | undefined;
  if (!img?.data) return;
  const w = img.width ?? hdrTex.width ?? 4096;
  const h = img.height ?? hdrTex.height ?? 2048;
  // Copy (downsample) the equirect into a Float32 RGB array for CPU sampling.
  const src = img.data;
  const out = new Float32Array(w * h * 4);
  for (let i = 0; i < w * h; i++) {
    const o = i * 4;
    if (src instanceof Float32Array) {
      out[o] = src[o];
      out[o + 1] = src[o + 1];
      out[o + 2] = src[o + 2];
    } else if (src instanceof Uint16Array) {
      // HDR loaders store half-float RGBE payloads.
      out[o] = THREE.DataUtils.fromHalfFloat(src[o]);
      out[o + 1] = THREE.DataUtils.fromHalfFloat(src[o + 1]);
      out[o + 2] = THREE.DataUtils.fromHalfFloat(src[o + 2]);
    } else {
      out[o] = src[o] / 255;
      out[o + 1] = src[o + 1] / 255;
      out[o + 2] = src[o + 2] / 255;
    }
  }
  const data = buildProbeData({ data: out, width: w, height: h });
  giTexture.image = { data, width: probeGrid.x, height: probeGrid.y, depth: probeGrid.z };
  giTexture.needsUpdate = true;
}
