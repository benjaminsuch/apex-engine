import {
  ACESFilmicToneMapping,
  PCFSoftShadowMap,
  PerspectiveCamera,
  Scene,
  Vector2,
  WebGLRenderer
} from 'three';

import { InstantiationService } from '../../di/common';
import { IConsoleLogger } from '../../logging/common';

export interface TRenderWorkerInitData {
  canvas: OffscreenCanvas;
  initialCanvasHeight: number;
  initialCanvasWidth: number;
  messagePort: MessagePort;
}

export interface IRenderer {
  readonly _injectibleService: undefined;
  init(): void;
}

export const IRenderer = InstantiationService.createDecorator<IRenderer>('renderer');

export class Renderer {
  public readonly webGLRenderer: WebGLRenderer;

  public camera: PerspectiveCamera | null = null;

  private readonly scene: Scene = new Scene();

  constructor(canvas: OffscreenCanvas, @IConsoleLogger private readonly logger: IConsoleLogger) {
    this.webGLRenderer = new WebGLRenderer({ canvas, antialias: true, alpha: true });
  }

  public init() {
    this.logger.debug(this.constructor.name, 'Initialize');
    this.webGLRenderer.shadowMap.type = PCFSoftShadowMap;
    this.webGLRenderer.toneMapping = ACESFilmicToneMapping;
  }

  public start() {
    this.logger.debug(this.constructor.name, 'Start');
    this.webGLRenderer.setAnimationLoop(() => this.tick());
  }

  public setSize(height: number, width: number) {
    this.webGLRenderer.setSize(width, height, false);

    if (!this.camera) {
      this.logger.warn(`The renderer has no camera proxy assigned.`);
      return;
    }

    this.updateCameraProjection(height, width);
  }

  public updateCameraProjection(height?: number, width?: number) {
    if (!this.camera) {
      return;
    }

    if (!width || !height) {
      [width, height] = this.webGLRenderer.getSize(new Vector2());
    }

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.camera.updateMatrixWorld();
  }

  private tick() {
    if (this.camera) {
      this.webGLRenderer.render(this.scene, this.camera);
    }
  }
}
