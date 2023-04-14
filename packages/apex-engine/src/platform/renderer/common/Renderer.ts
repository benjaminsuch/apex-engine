import {
  ACESFilmicToneMapping,
  PCFSoftShadowMap,
  PerspectiveCamera,
  Scene,
  sRGBEncoding,
  WebGLRenderer
} from 'three';

import { type SceneProxy } from '../../../engine/SceneProxy';
import { InstantiationService } from '../../di/common';

export type TRenderMessageType = 'init' | 'init-scene-proxy' | 'viewport-resize';

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

export type TRenderSceneProxyInitData = TRenderMessageData<{ component: Record<string, any> }>;

export type TRenderSceneProxyInitMessage = TRenderMessage<
  'init-scene-proxy',
  TRenderSceneProxyInitData
>;

export interface IRenderer {
  readonly _injectibleService: undefined;
  init(): void;
  send<T extends TRenderMessage<TRenderMessageType, TRenderMessageData>>(
    message: T,
    transferList?: Transferable[]
  ): void;
}

export const IRenderer = InstantiationService.createDecorator<IRenderer>('renderer');

export class Renderer {
  public readonly webGLRenderer: WebGLRenderer;

  private readonly camera: PerspectiveCamera = new PerspectiveCamera();

  private readonly scene: Scene = new Scene();

  private readonly proxies: SceneProxy[] = [];

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

  public setSize(height: number, width: number) {
    this.webGLRenderer.setSize(width, height, false);
  }

  public addSceneProxy(proxy: SceneProxy) {
    this.proxies.push(proxy);
    this.scene.add(proxy.mesh);
  }

  private tick() {
    for (const proxy of this.proxies) {
      proxy.tick();
    }

    this.webGLRenderer.render(this.scene, this.camera);
  }
}
