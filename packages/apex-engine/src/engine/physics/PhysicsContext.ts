import { type IInjectibleService, InstantiationService } from '../../platform/di/common/InstantiationService';
import PhysicsWorker from './PhysicsWorker?worker';

export class PhysicsContext implements IPhysicsContext {
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

export interface IPhysicsContext extends IInjectibleService {}

export const IPhysicsContext = InstantiationService.createDecorator<IPhysicsContext>('PhysicsContext');
