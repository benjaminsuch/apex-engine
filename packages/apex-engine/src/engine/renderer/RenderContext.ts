import { type IInjectibleService, InstantiationService } from '../../platform/di/common/InstantiationService';
import RenderWorker from './RenderWorker?worker';

export class RenderContext implements IRenderContext {
  declare readonly _injectibleService: undefined;

  private readonly worker: Worker;

  constructor() {
    this.worker = new RenderWorker();
  }

  public async init() {
    return new Promise<void>((resolve, reject) => {
      resolve();
    });
  }
}

export interface IRenderContext extends IInjectibleService {}

export const IRenderContext = InstantiationService.createDecorator<IRenderContext>('RenderContext');
