import * as Comlink from 'comlink';

import { type IInjectibleService, IInstantiationService, InstantiationService } from '../../platform/di/common/InstantiationService';
import { type SceneComponent } from '../components/SceneComponent';
import { TripleBuffer } from '../core/memory/TripleBuffer';
import { Flags } from '../Flags';
import { type IInternalPhysicsWorkerContext, type IRegisterRigidBodyReturn } from './Physics.worker';
import PhysicsWorker from './Physics.worker?worker';
import { PhysicsInfo } from './PhysicsInfo';
import { RigidBodyProxy } from './RigidBody';

export class PhysicsWorkerContext implements IPhysicsWorkerContext {
  declare readonly _injectibleService: undefined;

  private readonly worker: Worker;

  private readonly comlink: Comlink.Remote<IInternalPhysicsWorkerContext>;

  private info: PhysicsInfo | null = null;

  public get simulationState(): PhysicsInfo['simulationState'] {
    if (!this.info) {
      throw new Error(`Cannot read physics info: Physics-Worker hasn't finished initialization.`);
    }
    return this.info.simulationState;
  }

  public isInitialized = false;

  constructor(@IInstantiationService private readonly instantiationService: IInstantiationService) {
    this.worker = new PhysicsWorker();
    this.comlink = Comlink.wrap<IInternalPhysicsWorkerContext>(this.worker);
  }

  public async init(flags: Uint8Array[]): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    this.worker.postMessage({ type: 'init', flags });

    return new Promise<void>((resolve, reject) => {
      let timeoutId = setTimeout(() => {
        reject(`Physics-Worker initialization failed.`);
      }, 30_000);

      this.worker.onmessage = (event): void => {
        if (typeof event.data !== 'object') {
          return;
        }

        if (event.data.type === 'init-response') {
          const { byteLength, buffers } = event.data.tb;

          this.isInitialized = true;
          this.info = this.instantiationService.createInstance(PhysicsInfo, Flags.PHYSICS_FLAGS, new TripleBuffer(Flags.PHYSICS_FLAGS, byteLength, buffers));

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

  public async step(): Promise<void> {
    return this.comlink.step();
  }
}

export interface IPhysicsWorkerContext extends IInjectibleService {
  simulationState: PhysicsInfo['simulationState'];
  step(): Promise<void>;
  /**
   * @returns A snapshot of the physics world as a `Uint8Array`
   */
  registerRigidBody(component: SceneComponent): void;
}

export const IPhysicsWorkerContext = InstantiationService.createDecorator<IPhysicsWorkerContext>('PhysicsWorkerContext');
