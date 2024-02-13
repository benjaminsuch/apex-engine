import RAPIER from '@dimforge/rapier3d-compat';
import { type Quaternion, type Vector3 } from 'three';

import { IInstantiationService } from '../../platform/di/common/InstantiationService';
import { CLASS, PROP } from '../core/class/decorators';
import { EProxyThread, type IProxyOrigin, proxy } from '../core/class/specifiers/proxy';
import { float32, float64, int8, serialize, uint8, uint16 } from '../core/class/specifiers/serialize';
import { type TripleBuffer } from '../core/memory/TripleBuffer';
import { type IEngineLoopTickContext } from '../EngineLoop';
import { ProxyInstance } from '../ProxyInstance';
import { TickFunction } from '../TickManager';
import { type Collider, type ColliderProxy } from './Collider';
import { type KinematicController, type KinematicControllerProxy } from './KinematicController';
import { PhysicsTaskManager, PhysicsWorkerTask, type PhysicsWorkerTaskJSON } from './PhysicsTaskManager';
import { type PhysicsWorker } from './PhysicsWorker';

export class RigidBodyProxy extends ProxyInstance {
  declare readonly handle: number;

  declare readonly bodyType: number;

  declare readonly angularDamping: number;

  declare readonly dominanceGroup: number;

  declare readonly angvel: [number, number, number];

  declare readonly position: [number, number, number];

  declare readonly rotation: [number, number, number, number];

  /**
   * Computes the movement based on the given parameters and will set the next
   * kinematic translation on this rigid-body.
   *
   * @param controller A `KinematicController` that will compute the movement.
   * @param collider The collider that is affected by the movement.
   * @param movement A `Vector3` where the values will determine by how much the rigid-body will move.
   */
  public kinematicTranslate(controller: KinematicControllerProxy, collider: ColliderProxy, movement: Vector3): void {
    PhysicsTaskManager.addTask(new KinematicTranslateTask(this, [controller.id, collider.id, movement]));
  }

  /**
   * Sets the rigid-body's additional mass.
   *
   * The total angular inertia of the rigid-body will be scaled automatically based on this additional mass. If this
   * scaling effect isn’t desired, use Self::additional_mass_properties instead of this method.
   *
   * This is only the "additional" mass because the total mass of the rigid-body is equal to the sum of this
   * additional mass and the mass computed from the colliders (with non-zero densities) attached to this rigid-body.
   *
   * That total mass (which includes the attached colliders’ contributions) will be updated at the name physics step,
   * or can be updated manually with `this.recomputeMassPropertiesFromColliders`.
   *
   * This will override any previous additional mass-properties set by `this.setAdditionalMass`,
   * `this.setAdditionalMassProperties`, `RigidBodyDesc::setAdditionalMass`, or
   * `RigidBodyDesc.setAdditionalMassfProperties` for this rigid-body.
   *
   * @param mass    The additional mass to set.
   * @param wakeUp  If `true` then the rigid-body will be woken up if it was put to sleep because it did not move for a while.
   */
  public setAdditionalMass(mass: number, wakeUp: boolean = false): void {
    PhysicsTaskManager.addTask(new SetAdditionalMassTask(this, [mass, wakeUp]));
  }

  /**
   * Sets the linear damping factor applied to this rigid-body.
   *
   * @param factor The damping factor to set.
   */
  public setLinearDamping(factor: number): void {
    PhysicsTaskManager.addTask(new SetLinearDampingTask(this, factor));
  }

  /**
   * Sets the position of this rigid-body.
   *
   * Note: This method does the same as `setTranslation` of `Rapier.RigidBody`. We just renamed it
   * for consistency reasons.
   *
   * @param vec     The world-space position.
   * @param wakeUp  Forces the rigid-body to wake-up so it is properly affected by forces if
   *                it wasn't moving before modifying its position.
   */
  public setPosition(vec: Vector3, wakeUp: boolean = false): void {
    PhysicsTaskManager.addTask(new SetTranslationTask(this, [vec.x, vec.y, vec.z, wakeUp]));
  }

  /**
   * Sets the rotation quaternion of this rigid-body.
   *
   * This does nothing if a zero quaternion is provided.
   *
   * @param rotation  The rotation to set.
   * @param wakeUp    Forces the rigid-body to wake-up so it is properly affected by forces if
   *                  it wasn't moving before modifying its position.
   */
  public setRotation(quat: Quaternion, wakeUp: boolean = false): void {
    PhysicsTaskManager.addTask(new SetRotationTask(this, [quat.x, quat.y, quat.z, quat.w, wakeUp]));
  }

  /**
   * Set a new status for this rigid-body: static, dynamic, or kinematic.
   *
   * @param bodyType The new body type.
   */
  public setBodyType(bodyType: RAPIER.RigidBodyType): void {
    PhysicsTaskManager.addTask(new SetBodyTypeTask(this, bodyType));
  }
}

/**
 * This class is instantiated on the physics thread and creates a proxy on the
 * game thread.
 */
@CLASS(proxy(EProxyThread.Game, RigidBodyProxy))
export class RigidBody implements IProxyOrigin {
  declare readonly tripleBuffer: TripleBuffer;

  declare readonly byteView: Uint8Array;

  @PROP(serialize(float64))
  public readonly handle: number;

  @PROP(serialize(uint8))
  public bodyType: RAPIER.RigidBodyType;

  @PROP(serialize(uint16))
  public angularDamping!: number;

  @PROP(serialize(int8))
  public dominanceGroup!: number;

  @PROP(serialize(float32, [3]))
  public readonly angvel: [number, number, number] = [0, 0, 0];

  @PROP(serialize(float32, [3]))
  public readonly position: [number, number, number] = [0, 0, 0];

  @PROP(serialize(float32, [4]))
  public readonly rotation: [number, number, number, number] = [0, 0, 0, 0];

  public readonly bodyTick: RigidBodyTickFunction;

  constructor(
    public readonly worldBody: RAPIER.RigidBody,
    protected readonly physicsContext: PhysicsWorker,
    @IInstantiationService protected readonly instantiationService: IInstantiationService
  ) {
    this.handle = this.worldBody.handle;
    this.bodyType = this.worldBody.bodyType();

    this.bodyTick = this.instantiationService.createInstance(RigidBodyTickFunction, this);
    this.bodyTick.canTick = true;
    this.bodyTick.register();

    this.applyWorldBodyTransformations();
  }

  public tick(context: IEngineLoopTickContext): void {
    this.applyWorldBodyTransformations();
  }

  public kinematicTranslate(controllerId: number, colliderId: number, movement: RAPIER.Vector): void {
    const controller = this.physicsContext.proxyManager.getOrigin<KinematicController>(controllerId);
    const collider = this.physicsContext.proxyManager.getOrigin<Collider>(colliderId);

    if (!controller || !collider) {
      return;
    }

    controller.worldController.computeColliderMovement(collider.worldCollider, movement);

    const { x, y, z } = controller.worldController.computedMovement();
    const bodyPos = this.worldBody.translation();

    bodyPos.x += x;
    bodyPos.y += y;
    bodyPos.z += z;

    this.worldBody.setNextKinematicTranslation(bodyPos);
    this.applyWorldBodyTransformations();
  }

  protected applyWorldBodyTransformations(): void {
    this.angularDamping = this.worldBody.angularDamping();
    this.dominanceGroup = this.worldBody.dominanceGroup();

    {
      const { x, y, z } = this.worldBody.translation();

      this.position[0] = x;
      this.position[1] = y;
      this.position[2] = z;
    }

    {
      const { x, y, z, w } = this.worldBody.rotation();

      this.rotation[0] = x;
      this.rotation[1] = y;
      this.rotation[2] = z;
      this.rotation[3] = w;
    }

    {
      const { x, y, z } = this.worldBody.angvel();

      this.angvel[0] = x;
      this.angvel[1] = y;
      this.angvel[2] = z;
    }
  }
}

class RigidBodyTickFunction extends TickFunction<RigidBody> {
  public override run(context: IEngineLoopTickContext): void {
    this.target.tick(context);
  }
}

type KinematicTranslateTaskParams = [KinematicControllerProxy['id'], ColliderProxy['id'], Vector3];

class KinematicTranslateTask extends PhysicsWorkerTask<RigidBodyProxy, 'kinematicTranslate', KinematicTranslateTaskParams> {
  constructor(target: RigidBodyProxy, params: KinematicTranslateTaskParams) {
    super(target, 'kinematicTranslate', params);
  }

  public override toJSON(): PhysicsWorkerTaskJSON {
    const [controllerId, colliderId, { x, y, z }] = this.params;

    return {
      proxy: this.target.id,
      name: this.name,
      params: [controllerId, colliderId, { x, y, z }],
    };
  }
}

type SetAdditionalMassTaskParams = [number, boolean];

class SetAdditionalMassTask extends PhysicsWorkerTask<RigidBodyProxy, 'setAdditionalMass', SetAdditionalMassTaskParams> {
  constructor(target: RigidBodyProxy, params: SetAdditionalMassTaskParams) {
    super(target, 'setAdditionalMass', params);
  }
}

class SetLinearDampingTask extends PhysicsWorkerTask<RigidBodyProxy, 'setLinearDamping', [number]> {
  constructor(target: RigidBodyProxy, mass: number) {
    super(target, 'setLinearDamping', [mass]);
  }
}

type SetTranslationTaskParams = [Vector3['x'], Vector3['y'], Vector3['z'], boolean];

class SetTranslationTask extends PhysicsWorkerTask<RigidBodyProxy, 'setTranslation', SetTranslationTaskParams> {
  constructor(target: RigidBodyProxy, params: SetTranslationTaskParams) {
    super(target, 'setTranslation', params);
  }
}

type SetRotationTaskParams = [Quaternion['x'], Quaternion['y'], Quaternion['z'], Quaternion['w'], boolean];

class SetRotationTask extends PhysicsWorkerTask<RigidBodyProxy, 'setRotation', SetRotationTaskParams> {
  constructor(target: RigidBodyProxy, params: SetRotationTaskParams) {
    super(target, 'setRotation', params);
  }
}

class SetBodyTypeTask extends PhysicsWorkerTask<RigidBodyProxy, 'setBodyType', [RAPIER.RigidBodyType]> {
  constructor(target: RigidBodyProxy, bodyType: number) {
    super(target, 'setBodyType', [bodyType]);
  }
}

export function createRigidBodyDesc(type: RAPIER.RigidBodyType): RAPIER.RigidBodyDesc {
  if (type === RAPIER.RigidBodyType.Dynamic) {
    return RAPIER.RigidBodyDesc.dynamic();
  }
  if (type === RAPIER.RigidBodyType.Fixed) {
    return RAPIER.RigidBodyDesc.fixed();
  }
  if (type === RAPIER.RigidBodyType.KinematicPositionBased) {
    return RAPIER.RigidBodyDesc.kinematicPositionBased();
  }
  if (type === RAPIER.RigidBodyType.KinematicVelocityBased) {
    return RAPIER.RigidBodyDesc.kinematicVelocityBased();
  }

  throw new Error(`Unknown rigid body type.`);
}
