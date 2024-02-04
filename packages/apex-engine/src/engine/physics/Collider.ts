import RAPIER from '@dimforge/rapier3d-compat';
import { type Quaternion, type Vector3 } from 'three';

import { IInstantiationService } from '../../platform/di/common/InstantiationService';
import { CLASS, PROP } from '../core/class/decorators';
import { EProxyThread, type IProxyOrigin, proxy } from '../core/class/specifiers/proxy';
import { float64, serialize } from '../core/class/specifiers/serialize';
import { type TripleBuffer } from '../core/memory/TripleBuffer';
import { type IEngineLoopTickContext } from '../EngineLoop';
import { ProxyInstance } from '../ProxyInstance';
import { TickFunction } from '../TickManager';
import { PhysicsTaskManager, PhysicsWorkerTask } from './PhysicsTaskManager';
import { type PhysicsWorker } from './PhysicsWorker';
import { type RigidBody } from './RigidBody';

export interface IColliderBallConstructorArgs {
  radius: number;
}

export interface IColliderHalfSpaceConstructorArgs {
  normal: RAPIER.Vector;
}

export interface IColliderCuboidConstructorArgs {
  hx: number;
  hy: number;
  hz: number;
}

export interface IColliderRoundCuboidConstructorArgs {
  hx: number;
  hy: number;
  hz: number;
  borderRadius: number;
}

export interface IColliderCapsuleConstructorArgs {
  halfHeight: number;
  radius: number;
}

export interface IColliderSegmentConstructorArgs {
  a: RAPIER.Vector;
  b: RAPIER.Vector;
}

export interface IColliderTriangleConstructorArgs {
  a: RAPIER.Vector;
  b: RAPIER.Vector;
  c: RAPIER.Vector;
}

export interface IColliderRoundTriangleConstructorArgs {
  a: RAPIER.Vector;
  b: RAPIER.Vector;
  c: RAPIER.Vector;
  borderRadius: number;
}

export interface IColliderPolylineConstructorArgs {
  vertices: Float32Array;
  indices?: Uint32Array;
}

export interface IColliderTriMeshConstructorArgs {
  vertices: Float32Array;
  indices: Uint32Array;
}

export interface IColliderConvexPolyhedronConstructorArgs {
  vertices: Float32Array;
  indices?: Uint32Array;
}

export interface IColliderRoundConvexPolyhedronConstructorArgs {
  vertices: Float32Array;
  indices?: Uint32Array;
  borderRadius: number;
}

export interface IColliderHeightFieldConstructorArgs {
  nrows: number;
  ncols: number;
  heights: Float32Array;
  scale: RAPIER.Vector;
}

export interface IColliderCylinderConstructorArgs {
  halfHeight: number;
  radius: number;
}

export interface IColliderRoundCylinderConstructorArgs {
  halfHeight: number;
  radius: number;
  borderRadius: number;
}

export interface IColliderConeConstructorArgs {
  halfHeight: number;
  radius: number;
}

export interface IColliderRoundConeConstructorArgs {
  halfHeight: number;
  radius: number;
  borderRadius: number;
}

export type ColliderDescConstructor = typeof RAPIER.ColliderDesc.ball
  | typeof RAPIER.ColliderDesc.capsule
  | typeof RAPIER.ColliderDesc.cone
  | typeof RAPIER.ColliderDesc.convexHull
  | typeof RAPIER.ColliderDesc.cuboid
  | typeof RAPIER.ColliderDesc.cylinder
  | typeof RAPIER.ColliderDesc.heightfield
  | typeof RAPIER.ColliderDesc.polyline
  | typeof RAPIER.ColliderDesc.roundCone
  | typeof RAPIER.ColliderDesc.roundConvexHull
  | typeof RAPIER.ColliderDesc.roundCuboid
  | typeof RAPIER.ColliderDesc.roundCylinder
  | typeof RAPIER.ColliderDesc.roundTriangle
  | typeof RAPIER.ColliderDesc.segment
  | typeof RAPIER.ColliderDesc.trimesh
  | typeof RAPIER.ColliderDesc.triangle;

export type AnyColliderDescConstructor = (...args: [ProxyInstance['id'], ...unknown[]]) => RAPIER.ColliderDesc;

export type GetColliderArgsByShape<T> = T extends RAPIER.ShapeType.Ball
  ? IColliderBallConstructorArgs
  : T extends RAPIER.ShapeType.Capsule
    ? IColliderCapsuleConstructorArgs
    : T extends RAPIER.ShapeType.Cone
      ? IColliderConeConstructorArgs
      : T extends RAPIER.ShapeType.ConvexPolyhedron
        ? IColliderConvexPolyhedronConstructorArgs
        : T extends RAPIER.ShapeType.Cuboid
          ? IColliderCuboidConstructorArgs
          : T extends RAPIER.ShapeType.Cylinder
            ? IColliderCylinderConstructorArgs
            : T extends RAPIER.ShapeType.HeightField
              ? IColliderHeightFieldConstructorArgs
              : T extends RAPIER.ShapeType.Polyline
                ? IColliderPolylineConstructorArgs
                : T extends RAPIER.ShapeType.RoundCone
                  ? IColliderRoundConeConstructorArgs
                  : T extends RAPIER.ShapeType.RoundConvexPolyhedron
                    ? IColliderRoundConvexPolyhedronConstructorArgs
                    : T extends RAPIER.ShapeType.RoundCuboid
                      ? IColliderRoundCuboidConstructorArgs
                      : T extends RAPIER.ShapeType.RoundCylinder
                        ? IColliderRoundCylinderConstructorArgs
                        : T extends RAPIER.ShapeType.RoundTriangle
                          ? IColliderRoundTriangleConstructorArgs
                          : T extends RAPIER.ShapeType.Segment
                            ? IColliderSegmentConstructorArgs
                            : T extends RAPIER.ShapeType.TriMesh
                              ? IColliderTriMeshConstructorArgs
                              : T extends RAPIER.ShapeType.Triangle
                                ? IColliderTriangleConstructorArgs
                                : never;

export type ColliderRegisterArgs<T> = { rigidBodyId: ProxyInstance['id'] } & GetColliderArgsByShape<T>;

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
    protected readonly physicsContext: PhysicsWorker,
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

function getColliderDescConstructor<T extends RAPIER.ShapeType>(type: T): AnyColliderDescConstructor {
  const constructors: Record<RAPIER.ShapeType, ColliderDescConstructor> = {
    [RAPIER.ShapeType.Ball]: RAPIER.ColliderDesc.ball,
    [RAPIER.ShapeType.Capsule]: RAPIER.ColliderDesc.capsule,
    [RAPIER.ShapeType.Cone]: RAPIER.ColliderDesc.cone,
    [RAPIER.ShapeType.ConvexPolyhedron]: RAPIER.ColliderDesc.convexHull,
    [RAPIER.ShapeType.Cuboid]: RAPIER.ColliderDesc.cuboid,
    [RAPIER.ShapeType.Cylinder]: RAPIER.ColliderDesc.cylinder,
    [RAPIER.ShapeType.HalfSpace]: RAPIER.ColliderDesc.heightfield,
    [RAPIER.ShapeType.HeightField]: RAPIER.ColliderDesc.heightfield,
    [RAPIER.ShapeType.Polyline]: RAPIER.ColliderDesc.polyline,
    [RAPIER.ShapeType.RoundCone]: RAPIER.ColliderDesc.roundCone,
    [RAPIER.ShapeType.RoundConvexPolyhedron]: RAPIER.ColliderDesc.roundConvexHull,
    [RAPIER.ShapeType.RoundCuboid]: RAPIER.ColliderDesc.roundCuboid,
    [RAPIER.ShapeType.RoundCylinder]: RAPIER.ColliderDesc.roundCylinder,
    [RAPIER.ShapeType.RoundTriangle]: RAPIER.ColliderDesc.roundTriangle,
    [RAPIER.ShapeType.Segment]: RAPIER.ColliderDesc.segment,
    [RAPIER.ShapeType.TriMesh]: RAPIER.ColliderDesc.trimesh,
    [RAPIER.ShapeType.Triangle]: RAPIER.ColliderDesc.triangle,
  };

  return constructors[type] as AnyColliderDescConstructor;
}
