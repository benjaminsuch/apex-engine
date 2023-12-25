import { type IInjectibleService, InstantiationService } from '../platform/di/common/InstantiationService';
import { AbstractWorkerInitiator } from './AbstractWorkerInitiator';
import PhysicsWorker from './PhysicsWorker?worker';

export class PhysicsContext extends AbstractWorkerInitiator implements IPhysicsContext {
  declare readonly _injectibleService: undefined;

  constructor() {
    super(new PhysicsWorker());
  }

  public async init() {
    return Promise.all([this.workerReady(), new Promise<void>((resolve, reject) => {
      resolve();
    })]);
  }
}

export interface IPhysicsContext extends IInjectibleService {}

export const IPhysicsContext = InstantiationService.createDecorator<IPhysicsContext>('PhysicsContext');
