import { ACESFilmicToneMapping, PCFSoftShadowMap, Scene, sRGBEncoding, WebGLRenderer } from 'three';

import { InstantiationService } from '../../di/common';

export interface IRenderer {
  readonly _injectibleService: undefined;
  init(): void;
  send(message: any, transferList?: Transferable[]): void;
}

export const IRenderer = InstantiationService.createDecorator<IRenderer>('renderer');

export class Renderer {
  private readonly webGLRenderer: WebGLRenderer;

  private readonly scene: Scene = new Scene();

  constructor(canvas: OffscreenCanvas) {
    this.webGLRenderer = new WebGLRenderer({ canvas, antialias: true, alpha: true });
  }

  public init() {
    this.webGLRenderer.shadowMap.type = PCFSoftShadowMap;
    this.webGLRenderer.outputEncoding = sRGBEncoding;
    this.webGLRenderer.toneMapping = ACESFilmicToneMapping;
  }

  public start() {
    this.webGLRenderer.setAnimationLoop(() => this.tick());
  }

  private tick() {}
}
