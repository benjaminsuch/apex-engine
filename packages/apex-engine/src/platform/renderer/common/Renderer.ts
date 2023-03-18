import { ACESFilmicToneMapping, PCFSoftShadowMap, Scene, sRGBEncoding, WebGLRenderer } from 'three';

import { type SceneComponent } from '../../../engine/components';
import { InstantiationService } from '../../di/common';

export type TRenderMessageType = 'component' | 'init';

export type TRenderMessageData<T = { [k: string]: unknown }> = {
  [P in keyof T]: T[P];
};

export type TRenderMessage<Type extends TRenderMessageType, Data> = {
  type: Type;
} & (Data extends TRenderMessageData
  ? TRenderMessageData<Data>
  : `Invalid type: 'Data' has to be of type 'object'.`);

export type TRenderComponentMessage = TRenderMessage<'component', { component: SceneComponent }>;

export type TRenderWorkerInitMessage = TRenderMessage<
  'init',
  { canvas: OffscreenCanvas; messagePort: MessagePort }
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
