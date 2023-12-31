import * as Comlink from 'comlink';

import { type IInjectibleService, InstantiationService } from '../../platform/di/common/InstantiationService';
import RenderWorker from './RenderWorker?worker';

export class RenderWorkerContext implements IRenderWorkerContext {
  declare readonly _injectibleService: undefined;

  private readonly worker: Worker;

  private readonly comlink: Comlink.Remote<IRenderWorkerContext>;

  constructor() {
    this.worker = new RenderWorker();
    this.comlink = Comlink.wrap<IRenderWorkerContext>(this.worker);
  }

  public async init(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      resolve();
    });
  }
}

export interface IRenderWorkerContext extends IInjectibleService {}

export const IRenderWorkerContext = InstantiationService.createDecorator<IRenderWorkerContext>('RenderWorkerContext');
