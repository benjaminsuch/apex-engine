import * as Comlink from 'comlink';

import { type IInjectibleService, IInstantiationService, InstantiationService } from '../../platform/di/common/InstantiationService';
import { type SceneComponent } from '../components/SceneComponent';
import { TripleBuffer } from '../core/memory/TripleBuffer';
import { type IInternalPhysicsWorkerContext, type IRegisterRigidBodyReturn } from './Physics.worker';
import PhysicsWorker from './Physics.worker?worker';
import { RigidBodyProxy } from './RigidBody';

export class PhysicsWorkerContext implements IPhysicsWorkerContext {
  declare readonly _injectibleService: undefined;

  private readonly worker: Worker;

  private readonly comlink: Comlink.Remote<IInternalPhysicsWorkerContext>;

  public isInitialized = false;

  constructor(@IInstantiationService private readonly instantiationService: IInstantiationService) {
    this.worker = new PhysicsWorker();
    this.comlink = Comlink.wrap<IInternalPhysicsWorkerContext>(this.worker);
  }

  public async init(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    this.isInitialized = true;

    return new Promise<void>((resolve, reject) => {
      let timeoutId = setTimeout(() => {
        reject(`Physics-Worker initialization failed.1`);
      }, 30_000);

      this.worker.onmessage = (event): void => {
        if (typeof event.data !== 'object') {
          return;
        }

        const { type, data } = event.data;

        if (type === 'init-response') {
          clearTimeout(timeoutId);
          resolve();
        }
      };
    });
  }

  public registerRigidBody(component: SceneComponent): void {
    const bodyType = component.getBodyType();

    if (!bodyType) {
      return;
    }

    // ? Should we throw an error after x amount of time?
    this.comlink.registerRigidBody(bodyType).then(({ id, tb }: IRegisterRigidBodyReturn) => {
      component.rigidBody = this.instantiationService.createInstance(
        RigidBodyProxy,
        [],
        new TripleBuffer(tb.flags, tb.byteLength, tb.buffers),
        id
      );
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
  /**
   * @returns A snapshot of the physics world as a `Uint8Array`
   */
  finishPhysicsStep(): Promise<void>;
  registerRigidBody(component: SceneComponent): void;
}

export const IPhysicsWorkerContext = InstantiationService.createDecorator<IPhysicsWorkerContext>('PhysicsWorkerContext');
