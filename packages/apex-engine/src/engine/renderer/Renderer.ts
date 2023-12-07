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

import {
  IInstatiationService,
  InstantiationService,
  ServiceCollection
} from '../../platform/di/common';
import { ConsoleLogger, IConsoleLogger } from '../../platform/logging/common';
import { TripleBuffer } from '../../platform/memory/common';
import {
  RenderingInfo,
  type TRenderRPCMessage,
  type TRenderSceneProxyMessage
} from '../../platform/rendering/common';
import { GameEngine } from '../GameEngine';
import { RenderProxyManager } from '../ProxyManager';
import { RenderCreateProxyInstanceTask } from './tasks';

export interface IRenderTickContext {
  id: number;
  elapsed: number;
}

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
    flags: Uint8Array[],
    messagePort: MessagePort,
    ProxyManagerClass: typeof RenderProxyManager
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

  public isInitialized: boolean = false;

  public readonly renderingInfo: RenderingInfo;

  constructor(
    canvas: OffscreenCanvas,
    flags: Uint8Array[],
    private readonly messagePort: MessagePort,
    public readonly proxyManager: RenderProxyManager,
    @IInstatiationService private readonly instantiationService: IInstatiationService,
    @IConsoleLogger private readonly logger: IConsoleLogger
  ) {
    GameEngine.GAME_FLAGS = flags[0];
    GameEngine.RENDER_FLAGS = flags[1];

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

    this.renderingInfo = this.instantiationService.createInstance(
      RenderingInfo,
      GameEngine.RENDER_FLAGS,
      undefined,
      this.messagePort
    );

    Renderer.instance = this;
    console.log('Renderer', this);
  }

  public init() {
    this.logger.debug(this.constructor.name, `Initialize`);

    if (this.isInitialized) {
      this.logger.warn(this.constructor.name, `Already initialized`);
      return;
    }

    this.messagePort.addEventListener('message', this);
    this.messagePort.start();

    this.renderingInfo.init();

    this.isInitialized = true;
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

    // if (this.frameId < 61) {
    //   console.log('render tick:', this.frameId);
    // }

    TripleBuffer.swapReadBufferFlags(GameEngine.GAME_FLAGS);

    const context = { id: this.frameId, delta: 0, elapsed: time };

    this.renderingInfo.tick(context);
    this.proxyManager.tick(context);
    this.webGLRenderer.render(this.scene, this.camera);

    TripleBuffer.swapWriteBufferFlags(GameEngine.RENDER_FLAGS);
  }
}
