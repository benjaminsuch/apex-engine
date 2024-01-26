import * as Comlink from 'comlink';

import { type IInjectibleService, InstantiationService } from '../../platform/di/common/InstantiationService';
import PhysicsWorker from './Physics.worker?worker';

export class PhysicsWorkerContext implements IPhysicsWorkerContext {
  declare readonly _injectibleService: undefined;

  private readonly worker: Worker;

  private readonly comlink: Comlink.Remote<IPhysicsWorkerContext>;

  public isInitialized = false;

  constructor() {
    this.worker = new PhysicsWorker();
    this.comlink = Comlink.wrap<IPhysicsWorkerContext>(this.worker);
  }

  public async init(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    this.isInitialized = true;

    return new Promise<void>((resolve, reject) => {
      resolve();
    });
  }

  public async initPhysicsStep(): Promise<void> {
    return this.comlink.initPhysicsStep();
  }

  public async finishPhysicsStep(): Promise<void> {
    return this.comlink.finishPhysicsStep();
  }
}

export interface IPhysicsWorkerContext extends IInjectibleService {
  initPhysicsStep(): Promise<void>;
  finishPhysicsStep(): Promise<void>;
}

export const IPhysicsWorkerContext = InstantiationService.createDecorator<IPhysicsWorkerContext>('PhysicsWorkerContext');
