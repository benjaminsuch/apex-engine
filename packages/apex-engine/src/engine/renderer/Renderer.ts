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

import { InstantiationService, ServiceCollection } from '../../platform/di/common';
import { ConsoleLogger, IConsoleLogger } from '../../platform/logging/common';
import { TripleBuffer } from '../../platform/memory/common';
import type { TRenderRPCMessage, TRenderSceneProxyMessage } from '../../platform/rendering/common';
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
    flags: Uint8Array,
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

  public static readonly RENDER_FLAGS = new Uint8Array(
    new SharedArrayBuffer(Uint8Array.BYTES_PER_ELEMENT)
  ).fill(0x6);

  private readonly webGLRenderer: WebGLRenderer;

  private readonly byteView: Uint8Array;

  private readonly buffer: ArrayBuffer;

  private readonly dataView: DataView;

  private readonly tripleBuffer: TripleBuffer;

  public readonly scene: Scene = new Scene();

  public readonly camera: Camera;

  public frameId: number = 0;

  public isInitialized: boolean = false;

  constructor(
    canvas: OffscreenCanvas,
    private readonly GAME_FLAGS: Uint8Array,
    private readonly messagePort: MessagePort,
    public readonly proxyManager: RenderProxyManager,
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

    this.buffer = new ArrayBuffer(Uint32Array.BYTES_PER_ELEMENT);
    this.byteView = new Uint8Array(this.buffer);
    this.dataView = new DataView(this.buffer);
    this.tripleBuffer = new TripleBuffer(Renderer.RENDER_FLAGS, this.byteView.length);

    Renderer.instance = this;
    console.log('Renderer', this);
  }

  public init() {
    if (this.isInitialized) {
      this.logger.warn(this.constructor.name, `Already initialized.`);
      return;
    }

    this.messagePort.addEventListener('message', this);
    this.messagePort.start();
    this.messagePort.postMessage({ type: 'running', data: this.tripleBuffer });

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

    TripleBuffer.swapReadBufferFlags(this.GAME_FLAGS);

    this.proxyManager.tick({ id: this.frameId, delta: 0, elapsed: time });
    this.webGLRenderer.render(this.scene, this.camera);

    this.dataView.setUint32(0, this.frameId, true);
    this.tripleBuffer.copyToWriteBuffer(this.byteView);

    TripleBuffer.swapWriteBufferFlags(this.tripleBuffer.flags);
  }
}
