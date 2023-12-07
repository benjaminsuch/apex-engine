import { IInstatiationService } from '../../di/common';
import { IConsoleLogger } from '../../logging/common';
import { TripleBuffer } from '../../memory/common';
import {
  IRenderPlatform,
  RenderingInfo,
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

  private renderingInfo?: RenderingInfo;

  public getRenderingInfo() {
    if (!this.renderingInfo) {
      throw new Error(
        `The rendering info is not available yet. The renderer has most likely not finished his initialization or is not running.`
      );
    }
    return this.renderingInfo;
  }

  constructor(
    private readonly renderWorker: Worker,
    @IInstatiationService private readonly instantiationService: IInstatiationService,
    @IConsoleLogger private readonly logger: IConsoleLogger
  ) {
    if (typeof window === 'undefined') {
      throw new Error(`Cannot create an instance of Renderer: "window" is undefined.`);
    }

    if (BrowserRenderPlatform.instance) {
      throw new Error(`An instance of the renderer already exists.`);
    }

    BrowserRenderPlatform.instance = this;
  }

  public async init(flags: Uint8Array[]) {
    if (this.isInitialized) {
      return;
    }

    this.messageChannel.port1.onmessage = event => this.handleRendererMessage(event);
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

  public handleRendererMessage(event: MessageEvent) {
    console.log('render message', event);
    if (typeof event.data !== 'object') {
      return;
    }

    if (event.data.type === 'running') {
      const { flags, byteLength, buffers, byteViews } = event.data.data;
      console.log('flags from message', flags);
      this.renderingInfo = this.instantiationService.createInstance(
        RenderingInfo,
        flags,
        new TripleBuffer(flags, byteLength, buffers, byteViews),
        this.messageChannel.port1
      );
    }
  }

  private handleWindowResize() {}
}
