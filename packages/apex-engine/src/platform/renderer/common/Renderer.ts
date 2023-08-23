import { ACESFilmicToneMapping, PCFSoftShadowMap, Scene, Vector2, WebGLRenderer } from 'three';

import {
  CameraSceneProxy,
  type CameraProxyConstructorData,
  type SceneProxy,
  type SceneProxyConstructorData
} from '../../../engine';
import { InstantiationService } from '../../di/common';
import { IConsoleLogger } from '../../logging/common';

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
  component: SceneProxyConstructorData;
}>;

export type TRenderSceneProxyInitMessage = TRenderMessage<
  'init-scene-proxy',
  TRenderSceneProxyInitData
>;

export type TRenderSceneProxyDestroyData = TRenderMessageData<{
  uuid: SceneProxyConstructorData['uuid'];
}>;

export type TRenderSceneProxyDestroyMessage = TRenderMessage<
  'destroy-scene-proxy',
  TRenderSceneProxyDestroyData
>;

export type TRenderSetCameraData = TRenderMessageData<{ camera: CameraProxyConstructorData }>;

export type TRenderSetCameraMessage = TRenderMessage<'set-camera', TRenderSetCameraData>;

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

  public camera: CameraSceneProxy | null = null;

  private readonly scene: Scene = new Scene();

  private readonly proxyObjects: SceneProxy[] = [];

  constructor(canvas: OffscreenCanvas, @IConsoleLogger private readonly logger: IConsoleLogger) {
    this.webGLRenderer = new WebGLRenderer({ canvas, antialias: true, alpha: true });
  }

  public init() {
    this.webGLRenderer.shadowMap.type = PCFSoftShadowMap;
    this.webGLRenderer.toneMapping = ACESFilmicToneMapping;
  }

  public start() {
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

  public addSceneProxy(proxy: SceneProxy) {
    this.proxyObjects.push(proxy);
    this.scene.add(proxy.sceneObject);
  }

  public getSceneProxy<T extends SceneProxy>(uuid: T['uuid']): T | undefined {
    return this.proxyObjects.find(proxy => proxy.uuid === uuid) as T | undefined;
  }

  public removeSceneProxy(uuidOrProxy: SceneProxy['uuid'] | SceneProxy) {
    const proxy = typeof uuidOrProxy === 'string' ? this.getSceneProxy(uuidOrProxy) : uuidOrProxy;

    if (proxy) {
      proxy.dispose();
      this.scene.remove(proxy.sceneObject);

      if (this.camera?.uuid === proxy.uuid) {
        this.camera = null;
      }
    }
  }

  private tick() {
    if (this.camera) {
      for (const proxy of this.proxyObjects) {
        proxy.tick();
      }

      this.webGLRenderer.render(this.scene, this.camera.sceneObject);
    }
  }
}
