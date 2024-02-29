import * as Comlink from 'comlink';
import { type Source } from 'three';

import { type IInjectibleService, IInstantiationService, InstantiationService } from '../../platform/di/common/InstantiationService';
import { IConsoleLogger } from '../../platform/logging/common/ConsoleLogger';
import { IWorkerManager } from '../../platform/worker/common/WorkerManager';
import { type IProxyConstructionData } from '../core/class/specifiers/proxy';
import { TripleBuffer } from '../core/memory/TripleBuffer';
import { RenderingInfo } from './RenderingInfo';
import { type AnyRenderWorkerTask } from './RenderTaskManager';
import { type RenderWorker } from './RenderWorker';

export class RenderWorkerContext implements IRenderWorkerContext {
  public static transferableImages: ImageBitmap[] = [];

  public static readonly sourceImageBitmapMappings: RenderWorker['sourceBitmapMappings'] = new Map();

  public static addTransferableSource(source: Source): void {
    // If a source with the given uuid already exists we can skipped the whole process
    if (this.sourceImageBitmapMappings.has(source.uuid)) {
      if (IS_DEV) {
        console.warn(`The source with id "${source.uuid}" has already been added and will be skipped.`);
      }
      return;
    }

    const idx = this.transferableImages.indexOf(source.data);

    // An ImageBitmap though, can be used by many sources, which is why we do separate check
    if (idx === -1) {
      this.transferableImages.push(source.data);
    }

    this.sourceImageBitmapMappings.set(source.uuid, source.data);
  }

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
    @IConsoleLogger private readonly logger: IConsoleLogger,
    @IWorkerManager private readonly workerManager: IWorkerManager
  ) {
    this.worker = this.workerManager.renderWorker;
    this.comlink = Comlink.wrap<RenderWorker>(this.worker);
  }

  public async init(flags: Uint8Array[], physicsPort: MessagePort): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    return new Promise<void>((resolve, reject) => {
      try {
        // @todo: A temporary try/catch to prevent the engine from crashing in nodejs environment -> Remove
        this.canvas = document.getElementById('canvas') as HTMLCanvasElement | undefined;
      } catch {
        if (IS_NODE) {
          return resolve();
        }
      }

      let timeoutId = setTimeout(() => {
        this.worker.removeEventListener('message', handleInitResponse);
        reject(`Render-Worker initialization failed.`);
      }, 30_000);

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

          RenderWorkerContext.transferableImages = [];

          clearTimeout(timeoutId);
          this.worker.removeEventListener('message', handleInitResponse);
          resolve();
        }
      };

      this.worker.addEventListener('message', handleInitResponse);

      if (this.canvas) {
        this.logger.info('Initialize RenderWorker');

        const offscreenCanvas = this.canvas.transferControlToOffscreen();

        this.worker.postMessage(
          {
            type: 'init',
            canvas: offscreenCanvas,
            initialHeight: this.canvas.clientHeight,
            initialWidth: this.canvas.clientWidth,
            flags,
            physicsPort,
            sourceBitmapMappings: RenderWorkerContext.sourceImageBitmapMappings,
          },
          [offscreenCanvas, physicsPort, ...RenderWorkerContext.transferableImages]
        );

        window.addEventListener('resize', () => this.setSize(window.innerWidth, window.innerHeight));
      }
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
