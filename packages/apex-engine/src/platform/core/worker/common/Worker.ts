import { InstantiationService } from '../../../di/common';

export interface IWorker {
  readonly _injectibleService: undefined;
}

export const IWorker = InstantiationService.createDecorator<IWorker>('worker');
