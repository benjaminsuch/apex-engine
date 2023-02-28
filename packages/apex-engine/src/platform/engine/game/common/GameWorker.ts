import { IWorker } from '../../../core/worker/common';
import { InstantiationService } from '../../../di/common';

export interface IGameWorker extends IWorker {}

export const IGameWorker = InstantiationService.createDecorator<IGameWorker>('gameWorker');
