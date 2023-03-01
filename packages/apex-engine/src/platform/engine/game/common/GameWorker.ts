import { IWorker } from '../../../worker/common';
import { InstantiationService } from '../../../di/common';

export interface IGameWorker extends IWorker {
  readonly _injectibleService: undefined;
}

export const IGameWorker = InstantiationService.createDecorator<IGameWorker>('gameWorker');
