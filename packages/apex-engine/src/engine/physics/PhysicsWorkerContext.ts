import { type IInjectibleService, InstantiationService } from '../../platform/di/common/InstantiationService';
import PhysicsWorker from './Physics.worker?worker';

export class PhysicsWorkerContext implements IPhysicsWorkerContext {
  declare readonly _injectibleService: undefined;

  private readonly worker: Worker;

  constructor() {
    this.worker = new PhysicsWorker();
  }

  public async init(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      resolve();
    });
  }
}

export interface IPhysicsWorkerContext extends IInjectibleService {}

export const IPhysicsWorkerContext = InstantiationService.createDecorator<IPhysicsWorkerContext>('PhysicsWorkerContext');
