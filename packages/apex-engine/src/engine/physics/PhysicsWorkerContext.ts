import * as Comlink from 'comlink';
import { BoxGeometry, BufferGeometry, CapsuleGeometry, PlaneGeometry, type Vector3 } from 'three';

import { type IInjectibleService, IInstantiationService, InstantiationService } from '../../platform/di/common/InstantiationService';
import { IWorkerManager } from '../../platform/worker/common/WorkerManager';
import { EProxyThread, type IProxyConstructionData } from '../core/class/specifiers/proxy';
import { TripleBuffer } from '../core/memory/TripleBuffer';
import { type IEngineLoopTickContext } from '../EngineLoop';
import { Flags } from '../Flags';
import { type MeshComponent } from '../renderer/MeshComponent';
import { type SceneComponent } from '../renderer/SceneComponent';
import { ColliderProxy } from './Collider';
import { KinematicControllerProxy } from './KinematicController';
import { PhysicsInfo } from './PhysicsInfo';
import { PhysicsTaskManager } from './PhysicsTaskManager';
import { type ICreatedProxyData, type PhysicsWorker } from './PhysicsWorker';
import { RigidBodyProxy } from './RigidBody';

export class PhysicsWorkerContext implements IPhysicsWorkerContext {
  declare readonly _injectibleService: undefined;

  private readonly worker: Worker;

  private readonly comlink: Comlink.Remote<PhysicsWorker>;

  private info: PhysicsInfo | null = null;

  public isInitialized = false;

  constructor(
    @IInstantiationService private readonly instantiationService: IInstantiationService,
    @IWorkerManager private readonly workerManager: IWorkerManager
  ) {
    this.worker = this.workerManager.physicsWorker;
    this.comlink = Comlink.wrap<PhysicsWorker>(this.worker);
  }

  public async init(flags: Uint8Array[], renderPort: MessagePort): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    return new Promise<void>((resolve, reject) => {
      let timeoutId = setTimeout(() => {
        this.worker.removeEventListener('message', handleInitResponse);
        reject(`Physics-Worker initialization failed.`);
      }, 5_000);

      this.worker.postMessage({ type: 'init', flags, renderPort }, [renderPort]);

      const handleInitResponse = (event: MessageEvent): void => {
        if (typeof event.data !== 'object') {
          return;
        }

        if (event.data.type === 'init-response') {
          const { byteLength, buffers } = event.data.tb;

          this.isInitialized = true;
          this.info = this.instantiationService.createInstance(PhysicsInfo, Flags.PHYSICS_FLAGS, new TripleBuffer(Flags.PHYSICS_FLAGS, byteLength, buffers));

          clearTimeout(timeoutId);
          this.worker.removeEventListener('message', handleInitResponse);
          resolve();
        }
      };

      this.worker.addEventListener('message', handleInitResponse);
    });
  }

  public async registerCollider(component: MeshComponent): Promise<void> {
    // It's possible to not have a component a rigid body (exclude it from physics).
    if (!component.rigidBody) {
      return;
    }

    const rigidBodyId = component.rigidBody.id;
    let args: any;

    if (component.geometry instanceof CapsuleGeometry) {
      const { radius, length } = component.geometry.parameters;
      // Rapier takes half-length
      args = { radius, length: length * 0.5 };
    }

    if (component.geometry instanceof PlaneGeometry) {
      const { height, width } = component.geometry.parameters;
      args = { height, width };
    }

    if (component.geometry instanceof BoxGeometry) {
      const { height, width, depth } = component.geometry.parameters;
      args = { height, width, depth };
    }

    if (component.geometry instanceof BufferGeometry) {
      const position = component.geometry.getAttribute('position').array;
      const indices = component.geometry.getIndex()!.array;

      args = { position, indices };
    }

    if (!args || !component.colliderShape) {
      return;
    }

    return this.comlink.registerCollider(component.colliderShape, { rigidBodyId, ...args }).then(({ id, tb }: ICreatedProxyData) => {
      component.collider = this.instantiationService.createInstance(
        ColliderProxy,
        [],
        new TripleBuffer(tb.flags, tb.byteLength, tb.buffers),
        id,
        EProxyThread.Game
      );
    });
  }

  public async registerRigidBody(component: SceneComponent, options?: { position?: Vector3 }): Promise<void> {
    const bodyType = component.getBodyType();

    if (bodyType === null) {
      return;
    }

    // ? Should we throw an error after x amount of time?
    return this.comlink.registerRigidBody(bodyType, { position: options?.position?.toArray() }).then(({ id, tb }: ICreatedProxyData) => {
      component.rigidBody = this.instantiationService.createInstance(
        RigidBodyProxy,
        [],
        new TripleBuffer(tb.flags, tb.byteLength, tb.buffers),
        id,
        EProxyThread.Game
      );
    });
  }

  public async registerKinematicController(options: { offset: number }): Promise<KinematicControllerProxy> {
    const { id, tb } = await this.comlink.registerKinematicController(options);

    return this.instantiationService.createInstance(
      KinematicControllerProxy,
      [],
      new TripleBuffer(tb.flags, tb.byteLength, tb.buffers),
      id,
      EProxyThread.Game
    );
  }

  public async step(tick: IEngineLoopTickContext): Promise<void> {
    await this.comlink.step(tick, PhysicsTaskManager.getTasks().map(task => task.toJSON()));
    PhysicsTaskManager.clear();
  }

  public createProxies(stack: IProxyConstructionData[]): Promise<void> {
    return this.comlink.createProxies(stack);
  }
}

export interface IPhysicsWorkerContext extends IInjectibleService {
  createProxies(proxies: IProxyConstructionData[]): Promise<void>;
  step(tick: IEngineLoopTickContext): Promise<void>;
  registerCollider(component: SceneComponent): Promise<void>;
  /**
   * @returns A snapshot of the physics world as a `Uint8Array`
   */
  registerRigidBody(component: SceneComponent, options?: { position?: Vector3 }): Promise<void>;
  registerKinematicController(options: { offset: number }): Promise<KinematicControllerProxy>;
}

export const IPhysicsWorkerContext = InstantiationService.createDecorator<IPhysicsWorkerContext>('PhysicsWorkerContext');
