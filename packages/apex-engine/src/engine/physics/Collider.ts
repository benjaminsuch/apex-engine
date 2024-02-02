import type RAPIER from '@dimforge/rapier3d-compat';
import { type Quaternion, type Vector3 } from 'three';

import { IInstantiationService } from '../../platform/di/common/InstantiationService';
import { CLASS, PROP } from '../core/class/decorators';
import { EProxyThread, type IProxyOrigin, proxy } from '../core/class/specifiers/proxy';
import { float64, serialize } from '../core/class/specifiers/serialize';
import { type TripleBuffer } from '../core/memory/TripleBuffer';
import { type IEngineLoopTickContext } from '../EngineLoop';
import { ProxyInstance } from '../ProxyInstance';
import { TickFunction } from '../TickManager';
import { type IInternalPhysicsWorkerContext } from './Physics.worker';
import { PhysicsTaskManager, PhysicsWorkerTask } from './PhysicsTaskManager';
import { type RigidBody } from './RigidBody';

export class ColliderProxy extends ProxyInstance {
  declare readonly handle: number;

  /**
   * Sets the position of this collider.
   *
   * Note: This method does the same as `setTranslation` of `Rapier.Collider`. We just renamed it
   * for consistency reasons.
   *
   * @param vec The world-space position.
   */
  public setPosition(vec: Vector3): void {
    PhysicsTaskManager.addTask(new SetTranslationTask(this, [vec.x, vec.y, vec.z]));
  }

  /**
   * Sets the rotation quaternion of this collider.
   *
   * This does nothing if a zero quaternion is provided.
   *
   * @param rotation The rotation to set.
   */
  public setRotation(quat: Quaternion): void {
    PhysicsTaskManager.addTask(new SetRotationTask(this, [quat.x, quat.y, quat.z, quat.w]));
  }

  /**
   * Sets the density of the collider being built.
   *
   * The mass and angular inertia tensor will be computed automatically based on this density and the collider’s shape.
   *
   * @param density The density to set, must be greater or equal to 0. A density of 0 means that this collider
   *                will not affect the mass or angular inertia of the rigid-body it is attached to.
   */
  public setDensity(density: number): void {
    PhysicsTaskManager.addTask(new SetDensityTask(this, density));
  }

  /**
   * Sets the mass of the collider being built.
   *
   * The angular inertia tensor will be computed automatically based on this mass and the collider’s shape.
   *
   * @param mass The mass to set, must be greater or equal to 0.
   */
  public setMass(mass: number): void {
    PhysicsTaskManager.addTask(new SetMassTask(this, mass));
  }
}

@CLASS(proxy(EProxyThread.Game, ColliderProxy))
export class Collider implements IProxyOrigin {
  declare readonly tripleBuffer: TripleBuffer;

  declare readonly byteView: Uint8Array;

  @PROP(serialize(float64))
  public readonly handle: number;

  public readonly colliderTick: ColliderTickFunction;

  public readonly worldCollider: RAPIER.Collider;

  public readonly rigidBody: RigidBody;

  constructor(
    colliderDesc: RAPIER.ColliderDesc,
    rigidBodyId: number,
    protected readonly physicsContext: IInternalPhysicsWorkerContext,
    @IInstantiationService protected readonly instantiationService: IInstantiationService
  ) {
    this.rigidBody = this.physicsContext.proxyManager.getProxy(rigidBodyId, EProxyThread.Game) as RigidBody;
    this.worldCollider = this.physicsContext.world.createCollider(colliderDesc, this.rigidBody.worldBody);

    this.handle = this.worldCollider.handle;

    this.colliderTick = this.instantiationService.createInstance(ColliderTickFunction, this);
    this.colliderTick.canTick = true;
    this.colliderTick.register();
  }

  public tick(context: IEngineLoopTickContext): void {}
}

class ColliderTickFunction extends TickFunction<Collider> {
  public override run(context: IEngineLoopTickContext): void {
    this.target.tick(context);
  }
}

type SetTranslationTaskParams = [Vector3['x'], Vector3['y'], Vector3['z']];

class SetTranslationTask extends PhysicsWorkerTask<ColliderProxy, 'setTranslation', SetTranslationTaskParams> {
  constructor(target: ColliderProxy, params: SetTranslationTaskParams) {
    super(target, 'setTranslation', params);
  }
}

type SetRotationTaskParams = [Quaternion['x'], Quaternion['y'], Quaternion['z'], Quaternion['w']];

class SetRotationTask extends PhysicsWorkerTask<ColliderProxy, 'setRotation', SetRotationTaskParams> {
  constructor(target: ColliderProxy, params: SetRotationTaskParams) {
    super(target, 'setRotation', params);
  }
}

class SetDensityTask extends PhysicsWorkerTask<ColliderProxy, 'setDensity', [number]> {
  constructor(target: ColliderProxy, density: number) {
    super(target, 'setDensity', [density]);
  }
}

class SetMassTask extends PhysicsWorkerTask<ColliderProxy, 'setMass', [number]> {
  constructor(target: ColliderProxy, mass: number) {
    super(target, 'setMass', [mass]);
  }
}
