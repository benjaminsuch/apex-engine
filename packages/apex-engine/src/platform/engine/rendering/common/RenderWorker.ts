import { IWorker } from '../../../core/worker/common';
import { InstantiationService } from '../../../di/common';

export interface IRenderWorker extends IWorker {}

export const IRenderWorker = InstantiationService.createDecorator<IRenderWorker>('renderWorker');
