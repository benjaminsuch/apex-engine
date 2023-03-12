import { ACESFilmicToneMapping, PCFSoftShadowMap, sRGBEncoding, WebGLRenderer } from 'three';

export class Renderer {
  private readonly webGLRenderer: WebGLRenderer;

  constructor(canvas: OffscreenCanvas) {
    this.webGLRenderer = new WebGLRenderer({ canvas, antialias: true, alpha: true });

    this.webGLRenderer.shadowMap.type = PCFSoftShadowMap;
    this.webGLRenderer.outputEncoding = sRGBEncoding;
    this.webGLRenderer.toneMapping = ACESFilmicToneMapping;
  }
}
