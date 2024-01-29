import RAPIER from '@dimforge/rapier3d-compat';
import * as Comlink from 'comlink';
import { CapsuleGeometry } from 'three';

import { type IInjectibleService, IInstantiationService, InstantiationService } from '../../platform/di/common/InstantiationService';
import { type MeshComponent } from '../components/MeshComponent';
import { type SceneComponent } from '../components/SceneComponent';
import { getTargetId } from '../core/class/decorators';
import { type IProxyConstructionData, type IProxyOrigin, type TProxyOriginConstructor } from '../core/class/specifiers/proxy';
import { TripleBuffer } from '../core/memory/TripleBuffer';
import { type IEngineLoopTickContext } from '../EngineLoop';
import { Flags } from '../Flags';
import { type EnqueuedProxy, type RegisteredProxy } from '../ProxyManager';
import { ColliderProxy } from './Collider';
import { type ICreatedProxyData, type IInternalPhysicsWorkerContext } from './Physics.worker';
import PhysicsWorker from './Physics.worker?worker';
import { PhysicsInfo } from './PhysicsInfo';
import { RigidBodyProxy } from './RigidBody';

export class PhysicsWorkerContext implements IPhysicsWorkerContext {
  private static readonly tasks: any[] = [];

  public static addTask(task: any): number {
    return this.tasks.push(task) - 1;
  }

  public static removeTask(idx: number): void {
    return this.tasks.removeAtSwap(idx);
  }

  declare readonly _injectibleService: undefined;

  private readonly worker: Worker;

  private readonly comlink: Comlink.Remote<IInternalPhysicsWorkerContext>;

  private info: PhysicsInfo | null = null;

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

  public async registerCollider(component: MeshComponent): Promise<void> {
    // It's possible to not have a component a rigid body (exclude it from physics).
    if (!component.rigidBody) {
      return;
    }

    const rigidBodyId = component.rigidBody.id;

    if (component.geometry instanceof CapsuleGeometry) {
      const { radius, length } = component.geometry.parameters;

      return this.comlink.registerCollider(RAPIER.ShapeType.Capsule, { rigidBodyId, halfHeight: length * 0.5, radius }).then(({ id, tb }: ICreatedProxyData) => {
        component.collider = this.instantiationService.createInstance(
          ColliderProxy,
          [],
          new TripleBuffer(tb.flags, tb.byteLength, tb.buffers),
          id
        );
      });
    }
  }

  public async registerRigidBody(component: SceneComponent): Promise<void> {
    const bodyType = component.getBodyType();

    if (!bodyType) {
      return;
    }

    // ? Should we throw an error after x amount of time?
    return this.comlink.registerRigidBody(bodyType).then(({ id, tb }: ICreatedProxyData) => {
      component.rigidBody = this.instantiationService.createInstance(
        RigidBodyProxy,
        [],
        new TripleBuffer(tb.flags, tb.byteLength, tb.buffers),
        id
      );
    });
  }

  public async step(tick: IEngineLoopTickContext): Promise<void> {
    return this.comlink.step(tick, []);
  }

  public createProxies(proxies: EnqueuedProxy<IProxyOrigin>[]): Promise<void> {
    const data: IProxyConstructionData[] = [];

    for (let i = 0; i < proxies.length; ++i) {
      const { target, args } = proxies[i];

      data[i] = {
        constructor: (target.constructor as TProxyOriginConstructor).proxyClassName,
        id: getTargetId(target) as number,
        tb: target.tripleBuffer,
        args,
      };
    }

    return this.comlink.createProxies(data);
  }
}

export interface IPhysicsWorkerContext extends IInjectibleService {
  createProxies(proxies: RegisteredProxy<IProxyOrigin>[]): Promise<void>;
  step(tick: IEngineLoopTickContext): Promise<void>;
  registerCollider(component: SceneComponent): Promise<void>;
  /**
   * @returns A snapshot of the physics world as a `Uint8Array`
   */
  registerRigidBody(component: SceneComponent): Promise<void>;
}

export const IPhysicsWorkerContext = InstantiationService.createDecorator<IPhysicsWorkerContext>('PhysicsWorkerContext');
