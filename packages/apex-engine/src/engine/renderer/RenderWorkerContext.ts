import * as Comlink from 'comlink';

import { type IInjectibleService, IInstantiationService, InstantiationService } from '../../platform/di/common/InstantiationService';
import { getTargetId } from '../core/class/decorators';
import { type IProxyConstructionData, type IProxyOrigin, type TProxyOriginConstructor } from '../core/class/specifiers/proxy';
import { TripleBuffer } from '../core/memory/TripleBuffer';
import { type IEnqueuedProxy } from '../ProxyManager';
import { type IInternalRenderWorkerContext } from './Render.worker';
import RenderWorker from './Render.worker?worker';
import { RenderingInfo } from './RenderingInfo';

export class RenderWorkerContext implements IRenderWorkerContext {
  declare readonly _injectibleService: undefined;

  private readonly worker: Worker;

  private readonly comlink: Comlink.Remote<IInternalRenderWorkerContext>;

  private canvas?: HTMLCanvasElement;

  private rendererInfo?: RenderingInfo;

  public getRenderingInfo(): RenderingInfo {
    if (!this.rendererInfo) {
      throw new Error(
        `The renderer1 info is not available yet. The renderer has most likely not finished his initialization or is not running.1`
      );
    }
    return this.rendererInfo;
  }

  private isInitialized = false;

  constructor(@IInstantiationService private readonly instantiationService: IInstantiationService) {
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
      let timeoutId = setTimeout(() => {
        reject(`Render-Worker initialization failed.`);
      }, 30000);

      this.worker.onmessage = (event): void => {
        if (typeof event.data !== 'object') {
          return;
        }

        const { type, data } = event.data;

        if (type === 'init-response') {
          const { flags, byteLength, buffers, byteViews } = data;

          this.rendererInfo = this.instantiationService.createInstance(
            RenderingInfo,
            flags,
            new TripleBuffer(flags, byteLength, buffers, byteViews)
          );

          clearTimeout(timeoutId);
          resolve();
        }
      };
    });
  }

  public createProxies(proxies: IEnqueuedProxy<IProxyOrigin>[]): Promise<void> {
    const data: IProxyConstructionData[] = [];

    for (let i = 0; i < proxies.length; ++i) {
      const { target, args } = proxies[i];

      data[i] = {
        constructor: (target.constructor as TProxyOriginConstructor).proxyClassName,
        id: getTargetId(target) as number,
        tb: target.tripleBuffer,
        args,
      };
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
  getRenderingInfo(): RenderingInfo;
  setSize(height: number, width: number): Promise<void>;
  start(): Promise<void>;
}

export const IRenderWorkerContext = InstantiationService.createDecorator<IRenderWorkerContext>('RenderWorkerContext');
