import {
  IRenderer,
  type TRenderMessage,
  type TRenderMessageData,
  type TRenderMessageType,
  type TRenderWorkerInitMessage
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

    const canvas = document.getElementById('canvas') as HTMLCanvasElement | undefined;

    if (canvas) {
      const offscreenCanvas = canvas.transferControlToOffscreen();
      const messagePort = this.messageChannel.port2;

      // The init message has to be sent via `postMessage` (to deliver `messagePort`)
      this.renderWorker.postMessage({ type: 'init', canvas: offscreenCanvas, messagePort }, [
        offscreenCanvas,
        messagePort
      ]);
    }

    document.body.style.margin = '0';
    document.body.style.overflow = 'hidden';

    window.addEventListener('resize', event => {});

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
    transferList?: Transferable[]
  ) {
    console.log('post message to renderWorker:', message);
    this.messageChannel.port1.postMessage(message, transferList);
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
