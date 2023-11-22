import 'reflect-metadata';
import {
  ACESFilmicToneMapping,
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

import { InstantiationService, ServiceCollection } from '../../di/common';
import { ConsoleLogger, IConsoleLogger } from '../../logging/common';
import { TripleBuffer } from '../../memory/common';

export type TRenderMessageType = 'init' | 'proxy' | 'rpc' | 'set-camera' | 'viewport-resize';

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
}>;

export type TRenderSceneProxyMessage = TRenderMessage<'proxy', TRenderSceneProxyCreateData>;

export type TRenderRPCData = TRenderMessageData<{
  id: number;
  action: string;
  params: unknown[];
}>;

export type TRenderRPCMessage = TRenderMessage<'rpc', TRenderRPCData>;

export interface IRenderer {
  readonly _injectibleService: undefined;
  init(flags: Uint8Array): void;
  send<T extends TRenderMessage<TRenderMessageType, TRenderMessageData>>(
    message: T,
    transferList?: Transferable[]
  ): void;
}

export const IRenderer = InstantiationService.createDecorator<IRenderer>('renderer');

const createProxyMessages: TRenderSceneProxyCreateData[] = [];
const rpcMessages: TRenderRPCData[] = [];

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
    messagePort: MessagePort,
    components: Record<string, TClass>
  ): Renderer {
    const logger = new ConsoleLogger();
    const services = new ServiceCollection([IConsoleLogger, logger]);
    const instantiationService = new InstantiationService(services);

    return instantiationService.createInstance(Renderer, canvas, flags, messagePort, components);
  }

  private readonly proxyInstancesRegistry: Map<number, InstanceType<TClass>> = new Map();

  private readonly proxyInstances: InstanceType<TClass>[] = [];

  private readonly webGLRenderer: WebGLRenderer;

  private readonly scene: Scene = new Scene();

  private readonly camera: Camera;

  constructor(
    canvas: OffscreenCanvas,
    private readonly flags: Uint8Array,
    private readonly messagePort: MessagePort,
    private readonly components: Record<string, TClass>,
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

    this.scene.add(floor);

    Renderer.instance = this;
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

    switch (event.data.type) {
      case 'proxy':
        createProxyMessages.push(event.data);
        break;
      case 'rpc':
        rpcMessages.push(event.data);
        break;
    }
  }

  private tick(time: number) {
    TripleBuffer.swapReadBufferFlags(this.flags);

    for (let i = 0; i < createProxyMessages.length; ++i) {
      const { constructor, id, tb } = createProxyMessages[i];

      if (
        this.createProxyInstance(
          id,
          constructor,
          new TripleBuffer(tb.flags, tb.byteLength, tb.buffers)
        )
      ) {
        createProxyMessages.splice(i, 1);
        i--;
      }
    }

    for (let i = 0; i < rpcMessages.length; ++i) {
      const { id, action, params } = rpcMessages[i];
      const instance = this.proxyInstancesRegistry.get(id);

      if (instance) {
        instance[action]?.(...params);
        rpcMessages.splice(i, 1);
        i--;
      } else {
        this.logger.warn(
          `Unable to execute RPC "${action}": RPC instance with id "${id}" not found.`
        );
      }
    }

    for (let i = 0; i < this.proxyInstances.length; ++i) {
      this.proxyInstances[i].tick(time);
    }

    this.webGLRenderer.render(this.scene, this.camera);
  }

  private createProxyInstance(
    id: TRenderSceneProxyCreateData['id'],
    constructor: TRenderSceneProxyCreateData['constructor'],
    tb: TripleBuffer
  ) {
    const Constructor = this.components[constructor as keyof typeof this.components] as TClass;

    if (!Constructor) {
      throw new Error(`Constructor (${constructor}) not found for proxy with id "${id}".`);
    }

    const instance = new Constructor(id, tb);

    this.scene.add(instance.mesh);
    this.proxyInstancesRegistry.set(id, instance);
    this.proxyInstances.push(instance);

    return true;
  }
}
