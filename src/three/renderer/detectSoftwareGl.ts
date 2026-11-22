/** WebGL2 software-renderer probe, used for capability gates (not tier selection). */
export function detectSoftwareGl(): boolean {
  try {
    const testCanvas = document.createElement('canvas');
    const gl = testCanvas.getContext('webgl2');
    let software = false;
    if (gl) {
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const rendererStr = ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : '';
      software = /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(String(rendererStr));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    }
    return software;
  } catch {
    return false;
  }
}
