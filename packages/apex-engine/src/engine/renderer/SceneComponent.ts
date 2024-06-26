import type RAPIER from '@dimforge/rapier3d-compat';
import { type AnimationAction, type AnimationClip, AnimationMixer, Matrix4, Object3D, Quaternion, Vector3 } from 'three';

import { IInstantiationService } from '../../platform/di/common/InstantiationService';
import { IConsoleLogger } from '../../platform/logging/common/ConsoleLogger';
import { type Actor } from '../Actor';
import { ActorComponent } from '../ActorComponent';
import { CLASS, getTargetId, PROP } from '../core/class/decorators';
import { EProxyThread, type IProxyOrigin, proxy } from '../core/class/specifiers/proxy';
import { boolean, mat4, quat, ref, serialize, vec3 } from '../core/class/specifiers/serialize';
import { type TripleBuffer } from '../core/memory/TripleBuffer';
import { type IEngineLoopTickContext } from '../EngineLoop';
import { type ColliderProxy } from '../physics/Collider';
import { IPhysicsWorkerContext } from '../physics/PhysicsWorkerContext';
import { type RigidBodyProxy } from '../physics/RigidBody';
import { RenderProxy } from './RenderProxy';
import { RenderTaskManager, RenderWorkerTask } from './RenderTaskManager';
import { type RenderWorker } from './RenderWorker';
import { IRenderWorkerContext } from './RenderWorkerContext';

const _target = new Vector3();
const _position = new Vector3();
const _m1 = new Matrix4();

export class SceneComponentProxy<T extends Object3D = Object3D> extends RenderProxy<T> {
  declare position: [number, number, number];

  declare scale: [number, number, number];

  declare matrix: Matrix4AsArray;

  declare matrixAutoUpdate: boolean;

  declare matrixWorld: Matrix4AsArray;

  declare matrixWorldNeedsUpdate: boolean;

  declare rotation: [number, number, number, number];

  declare up: [number, number, number];

  declare visible: boolean;

  declare castShadow: boolean;

  declare receiveShadow: boolean;

  declare parent: SceneComponentProxy | null;

  public children: SceneComponentProxy[] = [];

  public childIndex: number = -1;

  protected readonly object: T;

  constructor([params]: any[] = [], tb: TripleBuffer, id: number, thread: EProxyThread, renderer: RenderWorker) {
    super([], tb, id, thread, renderer);

    this.object = new Object3D() as T;

    if (params) {
      this.object.name = params.name;
      this.object.uuid = params.uuid || this.object.uuid;
    }
  }

  public override tick(context: IEngineLoopTickContext): void {
    super.tick(context);

    this.object.castShadow = this.castShadow;
    this.object.matrix.fromArray(this.matrix);
    this.object.matrixAutoUpdate = this.matrixAutoUpdate;
    this.object.matrixWorld.fromArray(this.matrixWorld);
    this.object.matrixWorldNeedsUpdate = this.matrixWorldNeedsUpdate;
    this.object.position.fromArray(this.position);
    this.object.quaternion.fromArray(this.rotation);
    this.object.scale.fromArray(this.scale);
    this.object.receiveShadow = this.receiveShadow;
    this.object.up.fromArray(this.up);
    this.object.visible = this.visible;
  }
}

export interface SceneComponentProxyArgs {
  name: string;
  uuid: string;
}

@CLASS(proxy(EProxyThread.Render, SceneComponentProxy))
export class SceneComponent extends ActorComponent implements IProxyOrigin {
  declare readonly byteView: Uint8Array;

  declare readonly tripleBuffer: TripleBuffer;

  /**
   * Available after `loadAnimations` has been called.
   */
  protected mixer: AnimationMixer | null = null;

  /**
   * This property is used for registering the rigid-body. It supports `null`,
   * in case you don't want this component to have a rigid-body.
   *
   * Important: When the rigid-body has been registered, changing this property
   * directly will have no effect. Instead, use `setBodyType`.
   */
  protected bodyType: RAPIER.RigidBodyType | null = null;

  public getBodyType(): SceneComponent['bodyType'] {
    return this.bodyType;
  }

  public setBodyType(val: SceneComponent['bodyType']): void {
    if (this.rigidBody) {
      if (val === null) {
        this.logger.warn(`You can't set the rigid-body type to "null" after a rigid-body has been created.`);
        return;
      } else {
        this.rigidBody.setBodyType(val);
      }
    } else {
      // @todo: Should we support creation of a rigid-body during play?
    }

    this.bodyType = val;
  }

  public readonly animations: Map<AnimationClip['name'], AnimationAction> = new Map();

  @PROP(serialize(vec3))
  public position: Vector3 = new Vector3();

  @PROP(serialize(quat))
  public rotation: Quaternion = new Quaternion();

  public get quaternion(): Quaternion {
    return this.rotation;
  }

  @PROP(serialize(vec3))
  public scale: Vector3 = new Vector3(1, 1, 1);

  @PROP(serialize(mat4))
  public matrix: Matrix4 = new Matrix4();

  @PROP(serialize(boolean))
  public matrixAutoUpdate: boolean = true;

  @PROP(serialize(mat4))
  public matrixWorld: Matrix4 = new Matrix4();

  @PROP(serialize(boolean))
  public matrixWorldNeedsUpdate: boolean = false;

  @PROP(serialize(vec3))
  public up: Vector3 = Object3D.DEFAULT_UP;

  @PROP(serialize(boolean))
  public visible: boolean = true;

  @PROP(serialize(boolean))
  public castShadow: boolean = true;

  @PROP(serialize(boolean))
  public receiveShadow: boolean = true;

  /**
   * The component it is attached to.
   */
  @PROP(serialize(ref))
  public parent: SceneComponent | null = null;

  public childIndex: number = -1;

  /**
   * A list of components that are attached to this component. Don't push components
   * directly into this array and instead use `attachToComponent`.
   */
  public children: SceneComponent[] = [];

  /**
   * When not `null`, will be registered in the `MeshComponent.beginPlay` call.
   */
  public rigidBody: RigidBodyProxy | null = null;

  public colliderShape: RAPIER.ShapeType | null = null;

  /**
   * Will be registered when `MeshComponent.beginPlay` is called.
   */
  public collider: ColliderProxy | null = null;

  public userData: Record<string, any> = {};

  constructor(
    @IInstantiationService instantiationService: IInstantiationService,
    @IConsoleLogger logger: IConsoleLogger,
    @IPhysicsWorkerContext protected readonly physicsContext: IPhysicsWorkerContext,
    @IRenderWorkerContext protected readonly renderContext: IRenderWorkerContext
  ) {
    super(instantiationService, logger);
  }

  public override async tick(context: IEngineLoopTickContext): Promise<void> {
    await super.tick(context);

    if (this.mixer) {
      this.mixer.update(context.delta);
    }
  }

  public setAsRoot(actor: Actor): void {
    actor.rootComponent = this;
  }

  public attachToComponent(parent: SceneComponent): boolean {
    if (this.parent === parent) {
      return false;
    }

    if (parent === this) {
      this.logger.warn(`Cannot attach component to itself.`);
      return false;
    }

    const owner = this.getOwner();

    if (owner.rootComponent === this) {
      this.logger.warn(
        `This component is the root component and cannot be attached to other components.`
      );
      return false;
    }

    if (parent.isAttachedTo(this)) {
      this.logger.warn(
        `"${parent.constructor.name}" is already attached to "${this.constructor.name}" and would form a cycle.`
      );
      return false;
    }

    this.componentTick.addDependency(parent.componentTick);

    this.parent = parent;
    this.childIndex = this.parent.children.push(this) - 1;

    RenderTaskManager.addTask(new AttachToComponentTask(this, getTargetId(parent) as number));

    // ? Update child transformations, when attached to parent?
    // ? Broadcast an event, something like "onChildAttached"?
    return true;
  }

  public detachFromParent(): boolean {
    if (!this.parent) {
      this.logger.warn(`"${this.constructor.name}" has no parent.`);
      return false;
    }

    return this.parent.detachFromComponent(this);
  }

  public detachFromComponent(component: SceneComponent): boolean {
    if (component.parent !== this) {
      this.logger.warn(
        `"${component.constructor.name}" is not attached to "${this.constructor.name}".`
      );
      return false;
    }

    this.children.removeAtSwap(component.childIndex);

    for (const child of this.children) {
      child.childIndex = this.children.indexOf(child);
    }

    this.componentTick.removeDependency(component.componentTick);

    // ? Broadcast an event, something like "onChildDetached"?
    // todo: Update world transformations for the detached component
    return true;
  }

  public isAttachedTo(component: SceneComponent): boolean {
    for (let parent = this.parent; parent !== null; parent = parent.parent) {
      if (parent === component) {
        return true;
      }
    }
    return false;
  }

  public applyMatrix4(matrix: Matrix4): void {
    if (this.matrixAutoUpdate) this.updateMatrix();

    this.matrix.premultiply(matrix);
    this.matrix.decompose(this.position, this.rotation, this.scale);
  }

  public updateMatrix(): void {
    this.matrix.compose(this.position, this.rotation, this.scale);
    this.matrixWorldNeedsUpdate = true;
  }

  public lookAt(x: number, y: number, z: number): void {
    _target.set(x, y, z);
    _position.setFromMatrixPosition(this.matrixWorld);
    this.rotation.setFromRotationMatrix(this.onLookAt(_target, _position, this.up));
  }

  public copyFromObject3D(obj: Object3D): void {
    this.name = obj.name;
    this.uuid = obj.uuid;
    this.position.copy(obj.position);
    this.rotation.copy(obj.quaternion);
    this.scale.copy(obj.scale);
  }

  /**
   * Creates an animation mixer and creates an action for each clip.
   *
   * Note: Every action calls `play` after creation, but has it's effective weight set to `0`.
   *
   * @param clips - An array of animation clips.
   */
  public loadAnimations(clips: AnimationClip[]): void {
    this.mixer = new AnimationMixer(this as any);

    for (const clip of clips) {
      const action = this.mixer.clipAction(clip);

      action.enabled = true;
      action.setEffectiveTimeScale(1);
      action.setEffectiveWeight(0);
      action.play();

      this.animations.set(clip.name, action);
    }
  }

  public getProxyArgs(): [SceneComponentProxyArgs, ...unknown[]] {
    return [
      {
        name: this.name,
        uuid: this.uuid,
      },
    ];
  }

  protected onLookAt(target: Vector3, position: Vector3, up: Vector3): Matrix4 {
    return _m1.lookAt(target, position, up);
  }
}

class AttachToComponentTask extends RenderWorkerTask<SceneComponent, 'setParent', [number]> {
  constructor(target: SceneComponent, parent: number) {
    super(target, 'setParent', [parent], 0);
  }
}
