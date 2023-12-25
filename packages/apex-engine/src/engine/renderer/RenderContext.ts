import { type IInjectibleService, InstantiationService } from '../../platform/di/common';
import { AbstractWorkerInitiator } from '../AbstractWorkerInitiator';
import RenderWorker from './RenderWorker?worker';

export class RenderContext extends AbstractWorkerInitiator implements IInjectibleService {
  declare readonly _injectibleService: undefined;

  constructor() {
    super(new RenderWorker());
  }

  public async init() {
    return Promise.all([this.workerReady(), new Promise<void>((resolve, reject) => {
      resolve();
    })]);
  }
}

export interface IRenderContext extends IInjectibleService {}

export const IRenderContext = InstantiationService.createDecorator<IRenderContext>('RenderContext');
