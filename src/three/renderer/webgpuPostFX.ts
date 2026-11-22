import * as THREE from 'three';
import type { RenderPipeline, WebGPURenderer } from 'three/webgpu';
import type { MiniatureGradeOptions } from '../postfx';

type TSL = typeof import('three/tsl');
type BloomModule = typeof import('three/addons/tsl/display/BloomNode.js');
type SSAOModule = typeof import('three/addons/tsl/display/SSAONode.js');
type DOFModule = typeof import('three/addons/tsl/display/DepthOfFieldNode.js');

type WebGPUModule = typeof import('three/webgpu');

const makeUniforms = (tsl: TSL) => ({
  saturation: tsl.uniform(1.05),
  contrast: tsl.uniform(1),
  shadowLift: tsl.uniform(0),
  shadowTint: tsl.uniform(new THREE.Vector3(0.95, 0.98, 1.06)),
  highlightTint: tsl.uniform(new THREE.Vector3(1.05, 1.01, 0.95)),
  vignette: tsl.uniform(0.2),
  aoIntensity: tsl.uniform(0.85),
  focus: tsl.uniform(9),
  focalLength: tsl.uniform(1.2),
  bokeh: tsl.uniform(0.5),
});
type Uniforms = ReturnType<typeof makeUniforms>;

/** TSL counterpart of the WebGL miniature/post chain, in linear HDR. */
export class WebGPUPostFX {
  private readonly pipeline: RenderPipeline;
  private readonly tsl: TSL;
  private readonly bloomModule: BloomModule;
  private readonly ssaoModule: SSAOModule | null;
  private readonly dofModule: DOFModule | null;
  private scene: THREE.Object3D | null = null;
  private camera: THREE.Camera | null = null;
  private qualityIndex = 1;
  private readonly u: Uniforms;

  constructor(
    webgpu: WebGPUModule,
    renderer: WebGPURenderer,
    tsl: TSL,
    bloomModule: BloomModule,
    ssaoModule?: SSAOModule,
    dofModule?: DOFModule
  ) {
    this.tsl = tsl;
    this.bloomModule = bloomModule;
    this.ssaoModule = ssaoModule ?? null;
    this.dofModule = dofModule ?? null;
    this.pipeline = new webgpu.RenderPipeline(renderer);
    this.u = makeUniforms(tsl);
  }

  setQualityIndex(index: number): void {
    if (index === this.qualityIndex) return;
    this.qualityIndex = index;
    this.rebuild();
  }

  setGrade(grade: MiniatureGradeOptions, vignette?: number): void {
    if (vignette !== undefined) this.u.vignette.value = vignette;
    if (grade.saturation !== undefined) this.u.saturation.value = grade.saturation;
    if (grade.contrast !== undefined) this.u.contrast.value = grade.contrast;
    if (grade.shadowLift !== undefined) this.u.shadowLift.value = grade.shadowLift;
    if (grade.shadowTint) (this.u.shadowTint.value as THREE.Vector3).set(...grade.shadowTint);
    if (grade.highlightTint)
      (this.u.highlightTint.value as THREE.Vector3).set(...grade.highlightTint);
  }

  setFocus(distance: number): void {
    const value = Number.isFinite(distance) ? THREE.MathUtils.clamp(distance, 0.5, 60) : 9;
    if (Math.abs(this.u.focus.value - value) > 0.01) this.u.focus.value = value;
  }

  setAperture(aperture: number): void {
    // Wider miniature aperture (lower f-number) means a softer bokeh disc.
    this.u.bokeh.value = THREE.MathUtils.clamp(0.18 + aperture * 0.42, 0.1, 1.2);
    this.u.focalLength.value = THREE.MathUtils.clamp(0.6 + aperture * 0.6, 0.4, 1.6);
  }

  render(scene: THREE.Object3D, camera: THREE.Camera): void {
    if (scene !== this.scene || camera !== this.camera) this.rebuild(scene, camera);
    this.pipeline.render();
  }

  dispose(): void {
    this.pipeline.dispose();
  }

  private rebuild(
    scene: THREE.Object3D | null = this.scene,
    camera: THREE.Camera | null = this.camera
  ): void {
    if (!scene || !camera) return;
    this.scene = scene;
    this.camera = camera;
    const tsl = this.tsl;
    const highFx = this.qualityIndex === 0;

    const scenePass = tsl.pass(scene, camera, {
      type: THREE.HalfFloatType,
      samples: highFx ? 4 : 0,
    });
    const color = scenePass.getTextureNode('output');
    let rgb = color.rgb;

    // DoF blurs the beauty pass before grading, matching the WebGL order.
    if (highFx && this.dofModule) {
      const blurred = this.dofModule.dof(
        color,
        scenePass.getViewZNode(),
        this.u.focus,
        this.u.focalLength,
        this.u.bokeh
      );
      rgb = tsl.vec4(blurred as unknown as ReturnType<TSL['vec4']>).rgb;
    }

    if (highFx && this.ssaoModule) {
      const depth = scenePass.getTextureNode('depth');
      const normalPass = tsl.pass(scene, camera, { type: THREE.HalfFloatType });
      normalPass.setMRT(tsl.mrt({ output: tsl.vec4(tsl.normalView, 1) }));
      const normal = normalPass.getTextureNode('output');
      const ao = this.ssaoModule.ssao(depth, normal, camera);
      const aoValue = ao.getTextureNode().sample(tsl.screenUV).r;
      const aoMix = tsl.float(1).sub(this.u.aoIntensity).add(aoValue.mul(this.u.aoIntensity));
      rgb = rgb.mul(aoMix);
    }

    if (this.qualityIndex < 2) {
      const glow = this.bloomModule.bloom(color, 0.18, 0.62, 0.9);
      rgb = rgb.add(glow.rgb.mul(0.85));
    }

    const lum = tsl.luminance(rgb);
    rgb = tsl.mix(tsl.vec3(lum), rgb, this.u.saturation);
    rgb = rgb.sub(0.1).mul(this.u.contrast).add(0.1).max(0);
    const tint = tsl.mix(
      this.u.shadowTint,
      this.u.highlightTint,
      tsl.smoothstep(0.14, 0.86, lum)
    );
    rgb = rgb.mul(tint);
    const darkBand = tsl
      .smoothstep(0.004, 0.026, lum)
      .mul(tsl.float(1).sub(tsl.smoothstep(0.075, 0.24, lum)));
    rgb = rgb.add(darkBand.mul(this.u.shadowLift));

    const dist = tsl.screenUV.sub(tsl.vec2(0.5)).length();
    const vignette = tsl.smoothstep(0.28, 0.78, dist).mul(this.u.vignette);
    rgb = rgb.mul(tsl.float(1).sub(vignette));

    this.pipeline.outputNode = tsl.vec4(rgb, color.a);
    this.pipeline.needsUpdate = true;
  }
}
