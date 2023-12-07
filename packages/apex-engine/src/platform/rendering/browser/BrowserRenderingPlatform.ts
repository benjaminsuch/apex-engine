import { IInstatiationService } from '../../di/common';
import { IConsoleLogger } from '../../logging/common';
import { TripleBuffer } from '../../memory/common';
import {
  RenderingInfo,
  type IRenderPlatform,
  type TRenderMessage,
  type TRenderMessageData,
  type TRenderMessageType
} from '../common';

export interface BrowserRenderingPlatformOptions {
  multithreaded?: boolean;
}

export class BrowserRenderingPlatform implements IRenderPlatform {
  declare readonly _injectibleService: undefined;

  private static instance?: BrowserRenderingPlatform;

  public static getInstance() {
    if (!this.instance) {
      throw new Error(`No instance of BrowserRenderer available.`);
    }
    return this.instance;
  }

  private readonly messageChannel = new MessageChannel();

  private canvas?: HTMLCanvasElement;

  private isInitialized = false;

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

    if (BrowserRenderingPlatform.instance) {
      throw new Error(`An instance of the renderer already exists.`);
    }

    BrowserRenderingPlatform.instance = this;
  }

  public async init(flags: Uint8Array[]) {
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

    return new Promise<void>(resolve => {
      this.messageChannel.port1.onmessage = event => {
        if (typeof event.data !== 'object') {
          return;
        }

        if (event.data.type === 'running') {
          const { flags, byteLength, buffers, byteViews } = event.data.data;

          this.renderingInfo = this.instantiationService.createInstance(
            RenderingInfo,
            flags,
            new TripleBuffer(flags, byteLength, buffers, byteViews),
            this.messageChannel.port1
          );

          resolve();
        }
      };
    });
  }

  public send<T extends TRenderMessage<TRenderMessageType, TRenderMessageData>>(
    message: T,
    transferList: Transferable[] = []
  ) {
    this.messageChannel.port1.postMessage(message, transferList);
  }

  private handleWindowResize() {}
}
