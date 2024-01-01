import * as Comlink from 'comlink';

import { type IInjectibleService, InstantiationService } from '../../platform/di/common/InstantiationService';
import RenderWorker from './RenderWorker?worker';

export class RenderWorkerContext implements IRenderWorkerContext {
  declare readonly _injectibleService: undefined;

  private readonly worker: Worker;

  private readonly comlink: Comlink.Remote<IRenderWorkerContext>;

  private canvas?: HTMLCanvasElement;

  private isInitialized = false;

  constructor() {
    this.worker = new RenderWorker();
    this.comlink = Comlink.wrap<IRenderWorkerContext>(this.worker);
  }

  public async init(flags: Uint8Array[]): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    this.canvas = document.getElementById('canvas') as HTMLCanvasElement | undefined;

    if (this.canvas) {
      const offscreenCanvas = this.canvas.transferControlToOffscreen();

      this.worker.postMessage(
        {
          type: 'init',
          canvas: offscreenCanvas,
          initialHeight: this.canvas.clientHeight,
          initialWidth: this.canvas.clientWidth,
          flags,
        },
        [offscreenCanvas]
      );
    }

    this.isInitialized = true;

    return new Promise<void>((resolve, reject) => {
      resolve();
    });
  }

  public start(): void {
    this.comlink.start();
  }

  public setSize(height: number, width: number): void {
    this.comlink.setSize(height, width);
  }
}

export interface IRenderWorkerContext extends IInjectibleService {
  setSize(height: number, width: number): void;
  start(): void;
}

export const IRenderWorkerContext = InstantiationService.createDecorator<IRenderWorkerContext>('RenderWorkerContext');
