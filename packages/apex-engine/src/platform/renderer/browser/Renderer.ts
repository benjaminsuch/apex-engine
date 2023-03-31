import {
  IRenderer,
  type TRenderMessage,
  type TRenderMessageData,
  type TRenderMessageType
} from '../common';

export class Renderer implements IRenderer {
  declare readonly _injectibleService: undefined;

  private static instance?: Renderer;

  public static getInstance() {
    if (!this.instance) {
      throw new Error(`No instance of Renderer available.`);
    }
    return this.instance;
  }

  private readonly renderWorker = new Worker('./workers/renderWorker.js', { type: 'module' });

  private readonly messageChannel = new MessageChannel();

  private canvas?: HTMLCanvasElement;

  private isInitialized = false;

  constructor() {
    if (typeof window === 'undefined') {
      throw new Error(`Cannot create an instance of Renderer: "window" is undefined.`);
    }

    if (Renderer.instance) {
      throw new Error(`An instance of the renderer already exists.`);
    }

    this.messageChannel.port1.addEventListener('message', event => {
      console.log('Renderer received message:', event);
    });

    Renderer.instance = this;
  }

  public async init() {
    if (this.isInitialized) {
      return;
    }

    this.canvas = document.getElementById('canvas') as HTMLCanvasElement | undefined;

    if (this.canvas) {
      const offscreenCanvas = this.canvas.transferControlToOffscreen();
      const messagePort = this.messageChannel.port2;

      // The init message has to be sent via `postMessage` (to deliver `messagePort`)
      this.renderWorker.postMessage(
        {
          type: 'init',
          canvas: offscreenCanvas,
          initialCanvasHeight: this.canvas.clientHeight,
          initialCanvasWidth: this.canvas.clientWidth,
          messagePort
        },
        [offscreenCanvas, messagePort]
      );
    }

    window.addEventListener('resize', this.handleWindowResize.bind(this));

    this.isInitialized = true;
  }

  /**
   * Sends messages to the render worker.
   *
   * @param message
   * @param transferList
   */
  public send<T extends TRenderMessage<TRenderMessageType, TRenderMessageData>>(
    message: T,
    transferList: Transferable[] = []
  ) {
    console.log('post message to renderWorker:', message);
    this.messageChannel.port1.postMessage(message, transferList);
  }

  private handleWindowResize() {
    if (this.canvas) {
      const { clientHeight, clientWidth } = this.canvas;
      this.send({ type: 'viewport-resize', height: clientHeight, width: clientWidth });
    }
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
