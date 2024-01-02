import * as Comlink from 'comlink';
import { BoxGeometry, type Camera, Color, DirectionalLight, Fog, HemisphereLight, LinearToneMapping, Mesh, MeshPhongMaterial, PCFSoftShadowMap, PerspectiveCamera, Scene, WebGLRenderer } from 'three';

import { type IProxyData } from '../core/class/specifiers/proxy';
import { TripleBuffer } from '../core/memory/TripleBuffer';
import { Flags } from '../Flags';

export interface IInternalRenderWorkerContext {
  camera: Camera;
  frameId: number;
  scene: Scene;
  webGLRenderer: WebGLRenderer;
  createProxies(proxies: IProxyData[]): void;
  setSize(height: number, width: number): void;
  start(): void;
  tick(time: number): void;
}

const context: IInternalRenderWorkerContext = {
  camera: new PerspectiveCamera(),
  frameId: 0,
  scene: new Scene(),
  webGLRenderer: null!,
  createProxies(proxies) {
    console.log('create proxies from render-thread!', proxies);
  },
  start() {
    this.webGLRenderer.setAnimationLoop(time => this.tick(time));
  },
  setSize(this, height, width): void {
    this.webGLRenderer.setSize(width, height, false);
  },
  tick(time): void {
    ++this.frameId;

    const context = { id: this.frameId, delta: 0, elapsed: time };

    TripleBuffer.swapReadBufferFlags(Flags.GAME_FLAGS);

    this.webGLRenderer.render(this.scene, this.camera);

    TripleBuffer.swapWriteBufferFlags(Flags.RENDER_FLAGS);
  },
};

self.addEventListener('message', onInit);

function onInit(event: MessageEvent): void {
  if (typeof event.data !== 'object') {
    return;
  }

  const { type } = event.data;

  if (type === 'init') {
    self.removeEventListener('message', onInit);

    const { canvas, flags, initialHeight, initialWidth } = event.data;

    Flags.GAME_FLAGS = flags[0];
    Flags.RENDER_FLAGS = flags[1];

    context.webGLRenderer = new WebGLRenderer({ canvas, antialias: true, alpha: true });
    context.webGLRenderer.toneMapping = LinearToneMapping;
    context.webGLRenderer.shadowMap.type = PCFSoftShadowMap;

    context.camera.position.set(1, 15, -25);
    context.camera.lookAt(0, 0, 0);

    context.scene.background = new Color(0xa0a0a0);
    context.scene.fog = new Fog(0xa0a0a0, 65, 75);

    const hemiLight = new HemisphereLight(0xffffff, 0x8d8d8d, 3);
    hemiLight.position.set(0, 20, 0);

    context.scene.add(hemiLight);

    const dirLight = new DirectionalLight(0xffffff, 3);
    dirLight.castShadow = true;
    dirLight.shadow.camera.top = 2;
    dirLight.shadow.camera.bottom = -2;
    dirLight.shadow.camera.left = -2;
    dirLight.shadow.camera.right = 2;
    dirLight.shadow.camera.near = 0.1;
    dirLight.shadow.camera.far = 40;
    dirLight.position.set(-1, 2, 4);

    context.scene.add(dirLight);

    const cube = new Mesh(new BoxGeometry(1, 1, 1), new MeshPhongMaterial({ color: 0xeb4034, depthWrite: false }));
    cube.name = 'TestCube';
    cube.visible = true;

    context.scene.add(cube);

    context.setSize(initialHeight, initialWidth);
  }
}

Comlink.expose(context);
