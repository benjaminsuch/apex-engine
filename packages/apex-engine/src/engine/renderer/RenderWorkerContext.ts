import * as Comlink from 'comlink';

import { type IInjectibleService, InstantiationService } from '../../platform/di/common/InstantiationService';
import { getTargetId } from '../core/class/decorators';
import { type IProxyData, type IProxyOrigin } from '../core/class/specifiers/proxy';
import { type IEnqueuedProxy } from '../ProxyManager';
import { type IInternalRenderWorkerContext } from './RenderWorker';
import RenderWorker from './RenderWorker?worker';

export class RenderWorkerContext implements IRenderWorkerContext {
  declare readonly _injectibleService: undefined;

  private readonly worker: Worker;

  private readonly comlink: Comlink.Remote<IInternalRenderWorkerContext>;

  private canvas?: HTMLCanvasElement;

  private isInitialized = false;

  constructor() {
    this.worker = new RenderWorker();
    this.comlink = Comlink.wrap<IInternalRenderWorkerContext>(this.worker);
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

  public createProxies(proxies: IEnqueuedProxy<IProxyOrigin>[]): Promise<void> {
    const data: IProxyData[] = [];

    for (let i = 0; i < proxies.length; ++i) {
      const { target, args } = proxies[i];
      data[i] = { id: getTargetId(target) as number, tb: target.tripleBuffer, args };
    }

    return this.comlink.createProxies(data);
  }

  public start(): Promise<void> {
    return this.comlink.start();
  }

  public setSize(height: number, width: number): Promise<void> {
    return this.comlink.setSize(height, width);
  }
}

export interface IRenderWorkerContext extends IInjectibleService {
  createProxies(proxies: IEnqueuedProxy<IProxyOrigin>[]): Promise<void>;
  setSize(height: number, width: number): Promise<void>;
  start(): Promise<void>;
}

export const IRenderWorkerContext = InstantiationService.createDecorator<IRenderWorkerContext>('RenderWorkerContext');
