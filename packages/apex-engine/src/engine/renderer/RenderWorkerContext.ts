import * as Comlink from 'comlink';

import { type IInjectibleService, IInstantiationService, InstantiationService } from '../../platform/di/common/InstantiationService';
import { IWorkerManager } from '../../platform/worker/common/WorkerManager';
import { getTargetId } from '../core/class/decorators';
import { EProxyThread, type IProxyConstructionData, type IProxyOrigin, type TProxyOriginConstructor } from '../core/class/specifiers/proxy';
import { TripleBuffer } from '../core/memory/TripleBuffer';
import { RenderingInfo } from './RenderingInfo';
import { type AnyRenderWorkerTask } from './RenderTaskManager';
import { type RenderWorker } from './RenderWorker';

export class RenderWorkerContext implements IRenderWorkerContext {
  declare readonly _injectibleService: undefined;

  private readonly worker: Worker;

  private readonly comlink: Comlink.Remote<RenderWorker>;

  private canvas?: HTMLCanvasElement;

  private rendererInfo?: RenderingInfo;

  public getRenderingInfo(): RenderingInfo {
    if (!this.rendererInfo) {
      throw new Error(
        `The renderer info is not available yet. The renderer has most likely not finished his initialization or is not running.`
      );
    }
    return this.rendererInfo;
  }

  public isInitialized = false;

  constructor(
    @IInstantiationService private readonly instantiationService: IInstantiationService,
    @IWorkerManager private readonly workerManager: IWorkerManager
  ) {
    this.worker = this.workerManager.renderWorker;
    this.comlink = Comlink.wrap<RenderWorker>(this.worker);
  }

  public async init(flags: Uint8Array[], physicsPort: MessagePort): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      // @todo: A temporary try/catch to prevent the engine from crashing in nodejs environment -> Remove
      this.canvas = document.getElementById('canvas') as HTMLCanvasElement | undefined;
    } catch {
      if (IS_NODE) {
        return Promise.resolve();
      }
    }

    if (this.canvas) {
      const offscreenCanvas = this.canvas.transferControlToOffscreen();

      this.worker.postMessage(
        {
          type: 'init',
          canvas: offscreenCanvas,
          initialHeight: this.canvas.clientHeight,
          initialWidth: this.canvas.clientWidth,
          flags,
          physicsPort,
        },
        [offscreenCanvas, physicsPort]
      );

      window.addEventListener('resize', () => this.setSize(window.innerWidth, window.innerHeight));
    }

    return new Promise<void>((resolve, reject) => {
      let timeoutId = setTimeout(() => {
        this.worker.removeEventListener('message', handleInitResponse);
        reject(`Render-Worker initialization failed.`);
      }, 5_000);

      const handleInitResponse = (event: MessageEvent): void => {
        if (typeof event.data !== 'object') {
          return;
        }

        const { type, data } = event.data;

        if (type === 'init-response') {
          const { flags, byteLength, buffers, byteViews } = data;

          this.isInitialized = true;
          this.rendererInfo = this.instantiationService.createInstance(
            RenderingInfo,
            flags,
            new TripleBuffer(flags, byteLength, buffers, byteViews)
          );

          clearTimeout(timeoutId);
          this.worker.removeEventListener('message', handleInitResponse);
          resolve();
        }
      };

      this.worker.addEventListener('message', handleInitResponse);
    });
  }

  public createProxies(stack: IProxyConstructionData[]): Promise<void> {
    return this.comlink.createProxies(stack);
  }

  public start(): Promise<void> {
    return this.comlink.start();
  }

  public setSize(width: number, height: number): Promise<void> {
    return this.comlink.setSize(width, height);
  }

  public sendTasks(tasks: AnyRenderWorkerTask[]): Promise<void> {
    return this.comlink.receiveTasks(tasks.map(task => task.toJSON()));
  }
}

export interface IRenderWorkerContext extends IInjectibleService {
  createProxies(stack: IProxyConstructionData[]): Promise<void>;
  getRenderingInfo(): RenderingInfo;
  sendTasks(tasks: AnyRenderWorkerTask[]): Promise<void>;
  setSize(width: number, height: number): Promise<void>;
  start(): Promise<void>;
}

export const IRenderWorkerContext = InstantiationService.createDecorator<IRenderWorkerContext>('RenderWorkerContext');
