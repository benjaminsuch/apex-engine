import type RAPIER from '@dimforge/rapier3d-compat';
import { Matrix4, Object3D, Quaternion, Vector3 } from 'three';

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
import { type ProxyInstance } from '../ProxyInstance';
import { RenderProxy } from './RenderProxy';
import { RenderTaskManager, RenderWorkerTask } from './RenderTaskManager';
import { type RenderWorker } from './RenderWorker';

const _obj = /* @__PURE__ */ new Object3D();

export class SceneComponentProxy extends RenderProxy {
  declare position: [number, number, number];

  declare scale: [number, number, number];

  declare matrixWorld: Matrix4AsArray;

  declare rotation: [number, number, number, number];

  declare up: [number, number, number];

  declare visible: boolean;

  declare castShadow: boolean;

  declare receiveShadow: boolean;

  declare parent: SceneComponentProxy | null;

  public children: SceneComponentProxy[] = [];

  public childIndex: number = -1;

  public sceneObject: Object3D;

  constructor(
    args: unknown[] = [],
    tb: TripleBuffer,
    id: number,
    thread: EProxyThread,
    renderer: RenderWorker
  ) {
    super(args, tb, id, thread, renderer);

    this.sceneObject = new Object3D();
  }

  public setParent(id: ProxyInstance['id']): void {
    const parent = this.renderer.proxyManager.getProxy<SceneComponentProxy>(id, EProxyThread.Game);

    if (parent) {
      parent.target.sceneObject.add(this.sceneObject);
    } else {
      console.warn(`Couldnt find parent ("${id}") for proxy "${this.id}".`);
    }
  }

  public override tick(tick: IEngineLoopTickContext): void {
    super.tick(tick);

    this.sceneObject.castShadow = this.castShadow;
    this.sceneObject.receiveShadow = this.receiveShadow;
    this.sceneObject.visible = this.visible;
    this.sceneObject.position.fromArray(this.position);
    this.sceneObject.quaternion.fromArray(this.rotation);
    this.sceneObject.scale.fromArray(this.scale);
    this.sceneObject.matrixWorld.fromArray(this.matrixWorld);
    this.sceneObject.up.fromArray(this.up);
  }
}

@CLASS(proxy(EProxyThread.Render, SceneComponentProxy))
export class SceneComponent extends ActorComponent implements IProxyOrigin {
  declare readonly byteView: Uint8Array;

  declare readonly tripleBuffer: TripleBuffer;

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

  @PROP(serialize(vec3))
  public position: Vector3 = new Vector3();

  @PROP(serialize(quat))
  public rotation: Quaternion = new Quaternion();

  @PROP(serialize(vec3))
  public scale: Vector3 = new Vector3(1, 1, 1);

  @PROP(serialize(mat4))
  public matrixWorld: Matrix4 = new Matrix4();

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

  constructor(
    @IInstantiationService instantiationService: IInstantiationService,
    @IConsoleLogger logger: IConsoleLogger,
    @IPhysicsWorkerContext protected readonly physicsContext: IPhysicsWorkerContext
  ) {
    super(instantiationService, logger);
  }

  public override async tick(context: IEngineLoopTickContext): Promise<void> {
    await super.tick(context);
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

    // this.componentTick.removeDependency(component.componentTick);

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

  public lookAt(x: number | Vector3, y: number, z: number): void {
    if (x instanceof Vector3) {
      _obj.lookAt(x);
    } else {
      _obj.lookAt(x, y, z);
    }

    this.matrixWorld.copy(_obj.matrixWorld);
  }

  public copyFromObject3D(obj: Object3D): void {
    this.name = obj.name;
    this.uuid = obj.uuid;
    this.position.copy(obj.position);
    this.rotation.copy(obj.quaternion);
    this.scale.copy(obj.scale);
  }
}

class AttachToComponentTask extends RenderWorkerTask<SceneComponent, 'setParent', [number]> {
  constructor(target: SceneComponent, parent: number) {
    super(target, 'setParent', [parent], 0);
  }
}
