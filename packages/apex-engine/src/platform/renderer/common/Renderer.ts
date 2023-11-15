import { ACESFilmicToneMapping, PCFSoftShadowMap, WebGLRenderer } from 'three';

import { InstantiationService, ServiceCollection } from '../../di/common';
import { ConsoleLogger, IConsoleLogger } from '../../logging/common';
import { TripleBuffer } from '../../memory/common';

export type TRenderMessageType = 'init' | 'proxy' | 'set-camera' | 'viewport-resize';

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

export type TTripleBufferData = Pick<
  TripleBuffer,
  'buffers' | 'byteLength' | 'byteViews' | 'flags'
>;

export type TRenderSceneProxyCreateData = TRenderMessageData<{
  action: 'create';
  origin: string;
  id: number;
  tb: Pick<TripleBuffer, 'buffers' | 'byteLength' | 'byteViews' | 'flags'>;
}>;

export type TRenderSceneProxyDisposeData = TRenderMessageData<{
  action: 'dispose';
  id: number;
}>;

export type TRenderSceneProxyMessage = TRenderMessage<
  'proxy',
  TRenderSceneProxyCreateData | TRenderSceneProxyDisposeData
>;

export type TRenderSceneProxyDestroyData = TRenderMessageData<{
  uuid: any;
}>;

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

export const createProxyMessages: TRenderSceneProxyCreateData[] = [];

export class Renderer {
  private static instance?: Renderer;

  public static getInstance() {
    if (!this.instance) {
      throw new Error(`No instance created yet`);
    }
    return this.instance;
  }

  public static create(
    canvas: OffscreenCanvas,
    flags: Uint8Array,
    messagePort: MessagePort
  ): Renderer {
    const logger = new ConsoleLogger();
    const services = new ServiceCollection([IConsoleLogger, logger]);
    const instantiationService = new InstantiationService(services);

    return instantiationService.createInstance(Renderer, canvas, flags, messagePort);
  }

  private readonly webGLRenderer: WebGLRenderer;

  constructor(
    canvas: OffscreenCanvas,
    private readonly flags: Uint8Array,
    private readonly messagePort: MessagePort,
    @IConsoleLogger private readonly logger: IConsoleLogger
  ) {
    this.webGLRenderer = new WebGLRenderer({ canvas, antialias: true, alpha: true });
    this.webGLRenderer.shadowMap.type = PCFSoftShadowMap;
    this.webGLRenderer.toneMapping = ACESFilmicToneMapping;

    Renderer.instance = this;
  }

  public init() {
    this.messagePort.addEventListener('message', this);
    this.messagePort.start();
  }

  public start() {
    this.logger.debug(this.constructor.name, 'Start');
    this.webGLRenderer.setAnimationLoop(() => this.tick());
  }

  public setSize(height: number, width: number) {
    this.webGLRenderer.setSize(width, height, false);
  }

  public handleEvent(event: MessageEvent<TRenderSceneProxyMessage>) {
    if (typeof event.data !== 'object') {
      return;
    }

    this.logger.debug('render.worker:', 'onMessage', event.data);
  }

  private tick() {
    TripleBuffer.swapReadBufferFlags(this.flags);
  }
}
