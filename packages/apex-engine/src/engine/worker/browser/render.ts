import * as Comlink from 'comlink';
import { ACESFilmicToneMapping, BufferAttribute, BufferGeometry, type Camera, Color, DirectionalLight, Fog, HemisphereLight, LineBasicMaterial, LineSegments, PCFSoftShadowMap, PerspectiveCamera, Scene, WebGLRenderer } from 'three';

import { WorkerMain } from '../../../launch/browser/WorkerMain';
import { InstantiationService } from '../../../platform/di/common/InstantiationService';
import { ServiceCollection } from '../../../platform/di/common/ServiceCollection';
import { ConsoleLogger, IConsoleLogger } from '../../../platform/logging/common/ConsoleLogger';
import { type SceneComponentProxy } from '../../components/SceneComponent';
import { type IProxyConstructionData } from '../../core/class/specifiers/proxy';
import { TripleBuffer } from '../../core/memory/TripleBuffer';
import { Flags } from '../../Flags';
import { RenderingInfo } from '../../renderer/RenderingInfo';
import { RenderProxyManager } from '../../renderer/RenderProxyManager';
import { ETickGroup, TickManager } from '../../TickManager';

new WorkerMain();
export interface IInternalRenderWorkerContext {
  camera: Camera;
  frameId: number;
  physicsPort: MessagePort;
  proxyManager: RenderProxyManager;
  renderingInfo: RenderingInfo;
  scene: Scene;
  tickManager: TickManager;
  webGLRenderer: WebGLRenderer;
  createProxies(proxies: IProxyConstructionData[]): void;
  setSize(height: number, width: number): void;
  start(): void;
  tick(time: number): void;
}

const services = new ServiceCollection();
const logger = new ConsoleLogger();

services.set(IConsoleLogger, logger);

const instantiationService = new InstantiationService(services);

const context: IInternalRenderWorkerContext = {
  camera: new PerspectiveCamera(),
  frameId: 0,
  physicsPort: null!,
  proxyManager: null!,
  renderingInfo: null!,
  scene: new Scene(),
  tickManager: null!,
  webGLRenderer: null!,
  createProxies(proxies) {
    logger.debug('Creating proxies:', proxies);

    for (let i = 0; i < proxies.length; ++i) {
      const { constructor, id, tb, args, thread } = proxies[i];
      const ProxyConstructor = this.proxyManager.getProxyConstructor(constructor);

      if (!ProxyConstructor) {
        logger.warn(`Constructor (${constructor}) not found for proxy "${id}".`);
        return;
      }

      const proxy = instantiationService.createInstance(
        ProxyConstructor,
        args,
        new TripleBuffer(tb.flags, tb.byteLength, tb.buffers),
        id,
        thread,
        this
      ) as SceneComponentProxy;

      this.proxyManager.registerProxy(proxy);
      this.scene.add(proxy.sceneObject);
    }
  },
  start() {
    this.webGLRenderer.setAnimationLoop(time => this.tick(time));
  },
  setSize(this, width, height): void {
    this.webGLRenderer.setSize(width, height, false);

    if (this.camera instanceof PerspectiveCamera) {
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
    }
  },
  tick(time): void {
    ++this.frameId;

    const tickContext = { id: this.frameId, delta: 0, elapsed: time };

    TripleBuffer.swapReadBufferFlags(Flags.GAME_FLAGS);

    this.tickManager.startTick(tickContext);
    this.tickManager.runTickGroup(ETickGroup.PrePhysics);
    this.tickManager.runTickGroup(ETickGroup.DuringPhysics);
    this.tickManager.runTickGroup(ETickGroup.PostPhysics);
    this.tickManager.endTick();

    this.renderingInfo.tick(tickContext);
    this.webGLRenderer.render(this.scene, this.camera);

    TripleBuffer.swapWriteBufferFlags(Flags.RENDER_FLAGS);
  },
};

self.addEventListener('message', onInit);

function onInit(event: MessageEvent): void {
  if (typeof event.data !== 'object') {
    return;
  }

  if (event.data.type === 'init') {
    self.removeEventListener('message', onInit);

    const { canvas, flags, initialHeight, initialWidth, physicsPort } = event.data;

    Flags.GAME_FLAGS = flags[0];
    Flags.RENDER_FLAGS = flags[1];

    context.webGLRenderer = new WebGLRenderer({ canvas, antialias: true, alpha: true });
    context.webGLRenderer.toneMapping = ACESFilmicToneMapping;
    context.webGLRenderer.shadowMap.enabled = true;
    context.webGLRenderer.shadowMap.type = PCFSoftShadowMap;

    context.scene.background = new Color(0xa0a0a0);
    context.scene.fog = new Fog(0xa0a0a0, 65, 75);

    const hemiLight = new HemisphereLight(0xffffff, 0x8d8d8d, 1);
    hemiLight.position.set(0, 20, 0);

    context.scene.add(hemiLight);

    const dirLight = new DirectionalLight(0xffffff, 3);
    dirLight.castShadow = false;
    dirLight.position.set(5, 10, 25);

    context.scene.add(dirLight);
    context.setSize(initialWidth, initialHeight);

    context.physicsPort = physicsPort;
    context.tickManager = instantiationService.createInstance(TickManager);
    context.proxyManager = instantiationService.createInstance(RenderProxyManager);
    context.renderingInfo = instantiationService.createInstance(RenderingInfo, Flags.RENDER_FLAGS, undefined);
    context.renderingInfo.init();

    console.log('Render worker:', context);

    const lines = new LineSegments(
      new BufferGeometry(),
      new LineBasicMaterial({ color: 0xffffff, vertexColors: true })
    );

    context.scene.add(lines);

    context.physicsPort.addEventListener('message', (event) => {
      // console.log('message from physics:', event.data);
      lines.visible = true;
      lines.geometry.setAttribute('position', new BufferAttribute(event.data.vertices, 3));
      lines.geometry.setAttribute('color', new BufferAttribute(event.data.colors, 4));
    });
    context.physicsPort.start();
  }
}

Comlink.expose(context);
