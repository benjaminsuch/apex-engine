import { ACESFilmicToneMapping, BufferAttribute, BufferGeometry, DirectionalLight, HemisphereLight, LineBasicMaterial, LineSegments, type Object3D, PCFSoftShadowMap, PerspectiveCamera, Scene, WebGLRenderer } from 'three';

import { IInstantiationService } from '../../platform/di/common/InstantiationService';
import { IConsoleLogger } from '../../platform/logging/common/ConsoleLogger';
import { EProxyThread, type IProxyConstructionData } from '../core/class/specifiers/proxy';
import { TripleBuffer } from '../core/memory/TripleBuffer';
import { Flags } from '../Flags';
import { RenderingInfo } from '../renderer/RenderingInfo';
import { RenderProxyManager } from '../renderer/RenderProxyManager';
import { TickManager } from '../TickManager';
import { type RenderWorkerTaskJSON } from './RenderTaskManager';

interface RenderWorkerInitMessageData {
  canvas: OffscreenCanvas;
  flags: Uint8Array[];
  initialHeight: number;
  initialWidth: number;
  physicsPort: MessagePort;
}

export class RenderWorker {
  private frameId: number = 0;

  private readonly info: RenderingInfo;

  /**
   * Will be set during the `init` phase and will listen to incoming messages,
   * to update the physics debugging lines.
   */
  private physicsPort: MessagePort | null = null;

  private renderer!: WebGLRenderer;

  private scene: Scene;

  private readonly tickManager: TickManager;

  public camera: PerspectiveCamera;

  public isInitialized: boolean = false;

  public readonly proxyManager: RenderProxyManager;

  constructor(
    @IInstantiationService private readonly instantiationService: IInstantiationService,
    @IConsoleLogger private readonly logger: IConsoleLogger
  ) {
    this.tickManager = this.instantiationService.createInstance(TickManager);
    this.proxyManager = this.instantiationService.createInstance(RenderProxyManager, this);

    this.camera = new PerspectiveCamera();
    this.scene = new Scene();

    this.info = this.instantiationService.createInstance(RenderingInfo, Flags.RENDER_FLAGS, undefined);
    this.info.init();
  }

  public init({ canvas, flags, initialHeight, initialWidth, physicsPort }: RenderWorkerInitMessageData): void {
    if (this.isInitialized) {
      this.logger.error(this.constructor.name, `Already initialized`);
      return;
    }

    Flags.GAME_FLAGS = flags[0];
    Flags.RENDER_FLAGS = flags[1];

    this.renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true });
    this.renderer.toneMapping = ACESFilmicToneMapping;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = PCFSoftShadowMap;

    this.physicsPort = physicsPort;

    const hemiLight = new HemisphereLight(0xffffff, 0x8d8d8d, 1);
    hemiLight.position.set(0, 20, 0);

    this.scene.add(hemiLight);

    const dirLight = new DirectionalLight(0xffffff, 3);
    dirLight.castShadow = false;
    dirLight.position.set(5, 10, 25);

    this.scene.add(dirLight);

    this.setSize(initialWidth, initialHeight);

    const lines = new LineSegments(
      new BufferGeometry(),
      new LineBasicMaterial({ color: 0xffffff, vertexColors: true })
    );
    lines.visible = true;

    this.scene.add(lines);

    this.physicsPort.addEventListener('message', (event) => {
      const { colors, vertices } = event.data;
      const position = lines.geometry.getAttribute('position');
      const color = lines.geometry.getAttribute('color');

      if (position instanceof BufferAttribute) {
        position.copyArray(event.data.vertices);
        position.needsUpdate = true;
      }
      if (!position) {
        lines.geometry.setAttribute('position', new BufferAttribute(vertices, 3));
      }
      if (color instanceof BufferAttribute) {
        color.copyArray(event.data.colors);
        color.needsUpdate = true;
      }
      if (!color) {
        lines.geometry.setAttribute('color', new BufferAttribute(colors, 4));
      }
    });
    this.physicsPort.start();

    this.isInitialized = true;
    console.log('RenderWorker', this);
  }

  public createProxies(stack: IProxyConstructionData[]): void {
    this.logger.debug('Create proxies:', stack.slice(0));
    this.proxyManager.registerProxies(stack);
  }

  public start(): void {
    this.renderer.setAnimationLoop(async time => this.tick(time));
  }

  public setSize(width: number, height: number): void {
    this.renderer.setSize(width, height, false);

    if (this.camera instanceof PerspectiveCamera) {
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
    }
  }

  public async tick(time: number): Promise<void> {
    ++this.frameId;

    const then = performance.now();
    const delta = (then - time) / 1000;
    const tickContext = { id: this.frameId, delta, elapsed: time };

    TripleBuffer.swapReadBufferFlags(Flags.GAME_FLAGS);

    this.tickManager.startTick(tickContext);
    await this.tickManager.runAllTicks();
    this.tickManager.endTick();

    this.info.tick(tickContext);
    this.renderer.render(this.scene, this.camera);

    TripleBuffer.swapWriteBufferFlags(Flags.RENDER_FLAGS);
  }

  public addSceneObject(child: Object3D): void {
    this.scene.add(child);
  }

  public receiveTasks(tasks: RenderWorkerTaskJSON[]): void {
    if (tasks.length > 0) {
      let task: RenderWorkerTaskJSON | undefined;

      while (task = tasks.shift()) {
        const proxy = this.proxyManager.getProxy(task.target, EProxyThread.Game);

        if (proxy) {
          const descriptor = proxy.target[task.name as keyof typeof proxy];

          if (typeof descriptor === 'function') {
            (descriptor as Function).apply(proxy.target, task.params);
          }
        }
      }
    }
  }
}
