import { IWorker } from '../../../worker/common';
import { InstantiationService } from '../../../di/common';

export interface IRenderWorker extends IWorker {
  readonly _injectibleService: undefined;
}

export const IRenderWorker = InstantiationService.createDecorator<IRenderWorker>('renderWorker');
