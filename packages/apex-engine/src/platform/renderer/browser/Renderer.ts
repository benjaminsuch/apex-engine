import { WorkerThread } from '../../../platform/worker/browser';

import { IRenderer } from '../common';

export class Renderer implements IRenderer {
  declare readonly _injectibleService: undefined;

  private static instance?: Renderer;

  public static getInstance() {
    if (!this.instance) {
      throw new Error(`No instance of Renderer available.`);
    }
    return this.instance;
  }

  private readonly renderWorker = new WorkerThread('./workers/renderWorker.js');

  private readonly messageChannel = new MessageChannel();

  constructor() {
    if (typeof window === 'undefined') {
      throw new Error(`Cannot create an instance of Renderer: "window" is undefined.`);
    }

    if (Renderer.instance) {
      throw new Error(`An instance of the renderer already exists.`);
    }

    this.messageChannel.port1.addEventListener('message', this.handleRenderMessage.bind(this));

    Renderer.instance = this;
  }

  public async init() {
    const canvas = document.getElementById('canvas') as HTMLCanvasElement | undefined;

    if (canvas) {
      const offscreenCanvas = canvas.transferControlToOffscreen();
      const messagePort = this.messageChannel.port2;

      this.renderWorker.postMessage({ type: 'init', canvas: offscreenCanvas, messagePort }, [
        offscreenCanvas,
        messagePort
      ]);
    }

    document.body.style.margin = '0';
    document.body.style.overflow = 'hidden';

    window.addEventListener('resize', this.handleWindowResize.bind(this));
  }

  public send(message: any, transferList?: Transferable[]) {
    this.messageChannel.port1.postMessage(message, transferList);
  }

  private handleRenderMessage(event: MessageEvent) {
    console.log('message received:', event);
  }

  private handleWindowResize() {
    const { innerHeight, innerWidth } = window;

    this.renderWorker.postMessage({ type: 'resize', height: innerHeight, width: innerWidth });

    /*if (this.camera instanceof PerspectiveCamera) {
      this.camera.aspect = innerWidth / innerHeight;
      this.camera.updateProjectionMatrix();
      this.camera.updateMatrixWorld();
    }

    if (this.camera instanceof OrthographicCamera) {
      this.camera.left = innerWidth / 2;
      this.camera.right = innerWidth / -2;
      this.camera.top = innerHeight / 2;
      this.camera.bottom = innerHeight / -2;
    }*/
  }
}
