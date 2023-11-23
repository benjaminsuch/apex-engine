import {
  IRenderer,
  type TRenderMessage,
  type TRenderMessageData,
  type TRenderMessageType
} from '../common';

export interface BrowserRendererOptions {
  multithreaded?: boolean;
}

export class BrowserRenderer implements IRenderer {
  declare readonly _injectibleService: undefined;

  private static instance?: BrowserRenderer;

  public static getInstance() {
    if (!this.instance) {
      throw new Error(`No instance of BrowserRenderer available.`);
    }
    return this.instance;
  }

  private readonly messageChannel = new MessageChannel();

  private canvas?: HTMLCanvasElement;

  private isInitialized = false;

  constructor(private readonly renderWorker: Worker) {
    if (typeof window === 'undefined') {
      throw new Error(`Cannot create an instance of Renderer: "window" is undefined.`);
    }

    if (BrowserRenderer.instance) {
      throw new Error(`An instance of the renderer already exists.`);
    }

    this.messageChannel.port1.addEventListener('message', event => {
      console.log('Renderer received message:', event);
    });

    BrowserRenderer.instance = this;
  }

  public async init(flags: Uint8Array) {
    if (this.isInitialized) {
      return;
    }

    this.canvas = document.getElementById('canvas') as HTMLCanvasElement | undefined;

    if (this.canvas) {
      const offscreenCanvas = this.canvas.transferControlToOffscreen();
      const messagePort = this.messageChannel.port2;

      this.renderWorker.postMessage(
        {
          type: 'init',
          canvas: offscreenCanvas,
          initialCanvasHeight: this.canvas.clientHeight,
          initialCanvasWidth: this.canvas.clientWidth,
          messagePort,
          flags
        },
        [offscreenCanvas, messagePort]
      );
    }

    window.addEventListener('resize', this.handleWindowResize.bind(this));

    this.isInitialized = true;

    window.addEventListener('resize', this.handleWindowResize.bind(this));
  }

  public send<T extends TRenderMessage<TRenderMessageType, TRenderMessageData>>(
    message: T,
    transferList: Transferable[] = []
  ) {
    this.messageChannel.port1.postMessage(message, transferList);
  }

  private handleWindowResize() {}
}
