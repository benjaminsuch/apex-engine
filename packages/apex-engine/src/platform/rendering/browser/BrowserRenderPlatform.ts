import { IConsoleLogger } from '../../logging/common';
import { TripleBuffer } from '../../memory/common';
import type {
  IRenderPlatform,
  TRenderMessage,
  TRenderMessageData,
  TRenderMessageType
} from '../common';

export interface BrowserRenderPlatformOptions {
  multithreaded?: boolean;
}

export class BrowserRenderPlatform implements IRenderPlatform {
  declare readonly _injectibleService: undefined;

  private static instance?: BrowserRenderPlatform;

  public static getInstance() {
    if (!this.instance) {
      throw new Error(`No instance of BrowserRenderer available.`);
    }
    return this.instance;
  }

  private readonly messageChannel = new MessageChannel();

  private canvas?: HTMLCanvasElement;

  private isInitialized = false;

  private rendererInfoBuffer?: TripleBuffer;

  private rendererInfoViews?: [DataView, DataView, DataView];

  public getRendererInfo() {
    if (!this.rendererInfoBuffer || !this.rendererInfoViews) {
      console.log('render info not set yet');
      // throw new Error(`Renderer info has not been set yet.`);
      return { currentFrame: 0 };
    }

    const idx = this.rendererInfoBuffer.getReadBufferIndex();
    const view = this.rendererInfoViews[idx];
    const currentFrame = view.getUint32(0, true);

    return { currentFrame };
  }

  public RENDER_FLAGS: Uint8Array = new Uint8Array(
    new SharedArrayBuffer(Uint8Array.BYTES_PER_ELEMENT)
  ).fill(0x6);

  constructor(
    private readonly renderWorker: Worker,
    @IConsoleLogger private readonly logger: IConsoleLogger
  ) {
    if (typeof window === 'undefined') {
      throw new Error(`Cannot create an instance of Renderer: "window" is undefined.`);
    }

    if (BrowserRenderPlatform.instance) {
      throw new Error(`An instance of the renderer already exists.`);
    }

    this.messageChannel.port1.addEventListener('message', event => this.handleEvent(event));
    this.messageChannel.port1.start();

    BrowserRenderPlatform.instance = this;
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
  }

  public send<T extends TRenderMessage<TRenderMessageType, TRenderMessageData>>(
    message: T,
    transferList: Transferable[] = []
  ) {
    this.messageChannel.port1.postMessage(message, transferList);
  }

  public handleEvent(event: MessageEvent) {
    if (typeof event.data !== 'object') {
      return;
    }

    if (event.data.type === 'running') {
      this.handleRendererRunning(event.data.data);
    }
  }

  private handleRendererRunning(data: any) {
    if (this.rendererInfoBuffer) {
      this.logger.warn(this.constructor.name, `Renderer info has already been set. Aborting.`);
      return;
    }

    const { flags, byteLength, buffers, byteViews } = data;

    this.RENDER_FLAGS = flags;
    this.rendererInfoBuffer = new TripleBuffer(flags, byteLength, buffers, byteViews);
    this.rendererInfoViews = [
      new DataView(this.rendererInfoBuffer.buffers[0]),
      new DataView(this.rendererInfoBuffer.buffers[1]),
      new DataView(this.rendererInfoBuffer.buffers[2])
    ];
  }

  private handleWindowResize() {}
}
