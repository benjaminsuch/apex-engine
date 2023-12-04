import 'reflect-metadata';
import {
  ACESFilmicToneMapping,
  BoxGeometry,
  Camera,
  Color,
  DirectionalLight,
  Fog,
  HemisphereLight,
  LinearToneMapping,
  Mesh,
  MeshPhongMaterial,
  PCFSoftShadowMap,
  PerspectiveCamera,
  PlaneGeometry,
  Scene,
  WebGLRenderer
} from 'three';

import { IInstatiationService, InstantiationService, ServiceCollection } from '../../di/common';
import { ConsoleLogger, IConsoleLogger } from '../../logging/common';
import { TripleBuffer } from '../../memory/common';

export interface IRenderTickContext {
  id: number;
  elapsed: number;
}

export interface IRenderProxyManager {
  //todo: Improve types
  readonly components: Record<string, TClass>;
  currentTick: IRenderTickContext;
  tick(tick: IRenderTickContext): void;
  queueTask<T extends new (...args: any[]) => RenderProxyTask<any>>(
    TaskConstructor: T,
    //todo: Re-add `never` to `? R : any`
    ...args: [T extends typeof RenderProxyTask<infer R> ? R : any, ...any[]]
  ): boolean;
  registerProxy(proxy: InstanceType<TClass>): boolean;
  getProxy(id: number): InstanceType<TClass> | void;
}

export abstract class RenderProxyTask<Data> {
  constructor(
    public readonly data: Data,
    @IInstatiationService protected readonly instantiationService: IInstatiationService,
    @IConsoleLogger protected readonly logger: IConsoleLogger
  ) {}

  public abstract run(proxyManager: IRenderProxyManager): boolean;
}

class RenderCreateProxyInstanceTask extends RenderProxyTask<TRenderSceneProxyCreateData> {
  constructor(
    public override readonly data: TRenderSceneProxyCreateData,
    private readonly renderer: Renderer,
    @IInstatiationService protected override readonly instantiationService: IInstatiationService,
    @IConsoleLogger protected override readonly logger: IConsoleLogger
  ) {
    super(data, instantiationService, logger);
  }

  public run(proxyManager: IRenderProxyManager) {
    const { constructor, id, messagePort, tb, tick } = this.data;
    const ProxyConstructor = proxyManager.components[constructor] as TClass;

    if (!ProxyConstructor) {
      this.logger.warn(`Constructor (${constructor}) not found for proxy with id "${id}".`);
      return false;
    }

    if (proxyManager.currentTick.id !== tick) {
      //todo: `IS_DEV` does not exist in worker environment (this needs to be fixed in abt/cli.ts).
      this.logger.info(
        this.constructor.name,
        `The render tick (${proxyManager.currentTick.id}) does not match the game tick (${tick}). The task will be deferred to the next tick.`
      );
      return false;
    }

    return proxyManager.registerProxy(
      this.instantiationService.createInstance(
        ProxyConstructor,
        new TripleBuffer(tb.flags, tb.byteLength, tb.buffers),
        id,
        messagePort,
        this.renderer
      )
    );
  }
}

export type TRenderMessageType =
  | 'init'
  | 'proxy'
  | 'ref'
  | 'rpc'
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

export type TTripleBufferData = Pick<
  TripleBuffer,
  'buffers' | 'byteLength' | 'byteViews' | 'flags'
>;

export type TRenderSceneProxyCreateData = TRenderMessageData<{
  constructor: string;
  id: number;
  tb: Pick<TripleBuffer, 'buffers' | 'byteLength' | 'byteViews' | 'flags'>;
  messagePort?: MessagePort;
  tick: number;
}>;

export type TRenderSceneProxyMessage = TRenderMessage<'proxy', TRenderSceneProxyCreateData>;

export type TRenderRPCData = TRenderMessageData<{
  name: string;
  params: unknown[];
  tick: number;
}>;

export type TRenderRPCMessage = TRenderMessage<'rpc', TRenderRPCData>;

export type TRenderRefMessage = TRenderMessage<'ref', { refId: number; parentId: number }>;

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
  private static instance?: Renderer;

  public static getInstance() {
    if (!this.instance) {
      throw new Error(`No instance created yet.`);
    }
    return this.instance;
  }

  public static create(
    canvas: OffscreenCanvas,
    flags: Uint8Array,
    messagePort: MessagePort,
    ProxyManagerClass: TClass<IRenderProxyManager>
  ): Renderer {
    const logger = new ConsoleLogger();
    const services = new ServiceCollection([IConsoleLogger, logger]);
    const instantiationService = new InstantiationService(services);

    return instantiationService.createInstance(
      Renderer,
      canvas,
      flags,
      messagePort,
      instantiationService.createInstance(ProxyManagerClass)
    );
  }

  private readonly webGLRenderer: WebGLRenderer;

  public readonly scene: Scene = new Scene();

  public readonly camera: Camera;

  public frameId: number = 0;

  constructor(
    canvas: OffscreenCanvas,
    private readonly flags: Uint8Array,
    private readonly messagePort: MessagePort,
    public readonly proxyManager: IRenderProxyManager,
    @IConsoleLogger private readonly logger: IConsoleLogger
  ) {
    this.webGLRenderer = new WebGLRenderer({ canvas, antialias: true, alpha: true });
    this.webGLRenderer.toneMapping = LinearToneMapping;
    this.webGLRenderer.shadowMap.type = PCFSoftShadowMap;
    this.webGLRenderer.toneMapping = ACESFilmicToneMapping;

    this.scene.background = new Color(0xa0a0a0);
    this.scene.fog = new Fog(0xa0a0a0, 65, 75);

    // Camera and light is temporary fixed in place here
    this.camera = new PerspectiveCamera();
    this.camera.position.set(1, 15, -25);
    this.camera.lookAt(0, 1, 15);

    const hemiLight = new HemisphereLight(0xffffff, 0x8d8d8d, 3);
    hemiLight.position.set(0, 20, 0);

    this.scene.add(hemiLight);

    const dirLight = new DirectionalLight(0xffffff, 3);
    dirLight.position.set(-3, 10, -10);
    dirLight.castShadow = true;
    dirLight.shadow.camera.top = 2;
    dirLight.shadow.camera.bottom = -2;
    dirLight.shadow.camera.left = -2;
    dirLight.shadow.camera.right = 2;
    dirLight.shadow.camera.near = 0.1;
    dirLight.shadow.camera.far = 40;
    dirLight.position.set(-1, 2, 4);

    this.scene.add(dirLight);

    const floor = new Mesh(
      new PlaneGeometry(100, 100),
      new MeshPhongMaterial({ color: 0xcbcbcb, depthWrite: false })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    floor.name = 'Floor';

    this.scene.add(floor);

    const cube = new Mesh(new BoxGeometry(1, 1, 1));
    cube.name = 'TestCube';
    this.scene.add(cube);

    Renderer.instance = this;
    console.log('Renderer', this);
  }

  public init() {
    this.messagePort.addEventListener('message', this);
    this.messagePort.start();
  }

  public start() {
    this.logger.debug(this.constructor.name, 'Start');
    this.webGLRenderer.setAnimationLoop(time => this.tick(time));
  }

  public setSize(height: number, width: number) {
    this.webGLRenderer.setSize(width, height, false);
  }

  public handleEvent(event: MessageEvent<TRenderSceneProxyMessage | TRenderRPCMessage>) {
    if (typeof event.data !== 'object') {
      return;
    }

    this.logger.debug('render.worker:', 'onMessage', event.data);

    const { type } = event.data;

    if (type === 'proxy') {
      this.proxyManager.queueTask(RenderCreateProxyInstanceTask, event.data, this);
    }
  }

  private tick(time: number) {
    ++this.frameId;

    TripleBuffer.swapReadBufferFlags(this.flags);

    this.proxyManager.tick({ id: this.frameId, elapsed: time });
    this.webGLRenderer.render(this.scene, this.camera);
  }
}
