import { InstantiationService } from '../../di/common';

export interface IWorker extends DedicatedWorkerGlobalScope {
  readonly _injectibleService: undefined;
}

export const IWorker = InstantiationService.createDecorator<IWorker>('worker');
