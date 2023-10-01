import { ACESFilmicToneMapping, PCFSoftShadowMap, Scene, Vector2, WebGLRenderer } from 'three';

import { InstantiationService } from '../../di/common';
import { IConsoleLogger } from '../../logging/common';
import { TripleBuffer } from '../../memory/common';

export type TRenderMessageType =
  | 'destroy-scene-proxy'
  | 'init'
  | 'init-scene-proxy'
  | 'set-camera'
  | 'viewport-resize';

export type TRenderMessageData<T = { [k: string]: unknown }> = {
  [P in keyof T]: T[P];
};

export type TRenderMessage<Type extends TRenderMessageType, Data> = {
  type: Type;
} & (Data extends TRenderMessageData
  ? TRenderMessageData<Data>
  : `Invalid type: 'Data' has to be of type 'object'.`);

export interface TRenderWorkerInitData {
  canvas: OffscreenCanvas;
  initialCanvasHeight: number;
  initialCanvasWidth: number;
  messagePort: MessagePort;
  flags: Uint8Array;
}

export type TRenderWorkerInitMessage = TRenderMessage<'init', TRenderWorkerInitData>;

export type TRenderViewportResizeData = TRenderMessageData<{
  height: number;
  width: number;
}>;

export type TRenderViewportResizeMessage = TRenderMessage<
  'viewport-resize',
  TRenderViewportResizeData
>;

export type TRenderSceneProxyInitData = TRenderMessageData<{
  component: any;
}>;

export type TRenderSceneProxyInitMessage = TRenderMessage<
  'init-scene-proxy',
  TRenderSceneProxyInitData
>;

export type TRenderSceneProxyDestroyData = TRenderMessageData<{
  uuid: any;
}>;

export type TRenderSceneProxyDestroyMessage = TRenderMessage<
  'destroy-scene-proxy',
  TRenderSceneProxyDestroyData
>;

export type TRenderSetCameraData = TRenderMessageData<{ camera: any }>;

export type TRenderSetCameraMessage = TRenderMessage<'set-camera', TRenderSetCameraData>;

export interface IRenderer {
  readonly _injectibleService: undefined;
  init(flags: Uint8Array): void;
  send<T extends TRenderMessage<TRenderMessageType, TRenderMessageData>>(
    message: T,
    transferList?: Transferable[]
  ): void;
}

export const IRenderer = InstantiationService.createDecorator<IRenderer>('renderer');

export class Renderer {
  public readonly webGLRenderer: WebGLRenderer;

  public camera: any | null = null;

  private readonly scene: Scene = new Scene();

  private flags: Uint8Array | null = null;

  constructor(canvas: OffscreenCanvas, @IConsoleLogger private readonly logger: IConsoleLogger) {
    this.webGLRenderer = new WebGLRenderer({ canvas, antialias: true, alpha: true });
  }

  public init(flags: Uint8Array) {
    this.logger.debug(this.constructor.name, 'Initialize');
    this.webGLRenderer.shadowMap.type = PCFSoftShadowMap;
    this.webGLRenderer.toneMapping = ACESFilmicToneMapping;
    this.flags = flags;
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
  }

  private tick() {
    if (this.flags) {
      TripleBuffer.swapReadBufferFlags(this.flags);
    } else {
      this.logger.debug(this.constructor.name, `Missing triple buffer flags.`);
    }

    if (this.camera) {
      //this.webGLRenderer.render(this.scene, this.camera.sceneObject);
    }
  }
}
