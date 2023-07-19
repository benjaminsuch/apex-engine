import {
  ACESFilmicToneMapping,
  BoxGeometry,
  Mesh,
  MeshBasicMaterial,
  PCFSoftShadowMap,
  Scene,
  sRGBEncoding,
  WebGLRenderer
} from 'three';

import {
  CameraSceneProxy,
  type CameraProxyConstructorData,
  type SceneProxy,
  type SceneProxyConstructorData
} from '../../../engine';
import { InstantiationService } from '../../di/common';
import { IConsoleLogger } from '../../logging/common';

export type TRenderMessageType = 'init' | 'init-scene-proxy' | 'set-camera' | 'viewport-resize';

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

const box = new Mesh(new BoxGeometry(1, 1, 1), new MeshBasicMaterial({ color: 0x00ff00 }));
box.position.z = -5;
const boxGeom = new BoxGeometry(1, 1, 1);
console.log('BoxGeometry', boxGeom.toJSON());
console.log('MeshBasicMaterial', new MeshBasicMaterial({ color: 0x00ff00 }).toJSON());
export class Renderer {
  public readonly webGLRenderer: WebGLRenderer;

  public camera?: CameraSceneProxy;

  private readonly scene: Scene = new Scene();

  private readonly proxyObjects: SceneProxy[] = [];

  constructor(canvas: OffscreenCanvas, @IConsoleLogger private readonly logger: IConsoleLogger) {
    this.webGLRenderer = new WebGLRenderer({ canvas, antialias: true, alpha: true });
  }

  public init() {
    this.webGLRenderer.shadowMap.type = PCFSoftShadowMap;
    this.webGLRenderer.outputEncoding = sRGBEncoding;
    this.webGLRenderer.toneMapping = ACESFilmicToneMapping;
    //this.scene.add(box);
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

  private tick() {
    if (this.camera) {
      for (const proxy of this.proxyObjects) {
        proxy.tick();
      }

      this.webGLRenderer.render(this.scene, this.camera.sceneObject);
    }
  }
}
