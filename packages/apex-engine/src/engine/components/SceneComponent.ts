import { Euler, Matrix4, Object3D, Quaternion, Vector3 } from 'three';

import { type Actor } from '../Actor';
import { CLASS, PROP } from '../core/class/decorators';
import { proxy } from '../core/class/specifiers/proxy';
import { boolean, mat4, quat, ref, serialize, vec3 } from '../core/class/specifiers/serialize';
import { type TripleBuffer } from '../core/memory/TripleBuffer';
import { type IInternalRenderWorkerContext } from '../renderer/Render.worker';
import { RenderProxy } from '../renderer/RenderProxy';
import { ActorComponent } from './ActorComponent';

export class SceneComponentProxy extends RenderProxy {
  declare position: [number, number, number];

  declare rotation: [number, number, number];

  declare scale: [number, number, number];

  declare matrix: [
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
  ];

  declare quaternion: [number, number, number, number];

  declare up: [number, number, number];

  declare visible: boolean;

  declare castShadow: boolean;

  declare receiveShadow: boolean;

  declare isRootComponent: boolean;

  declare parent: SceneComponentProxy | null;

  public children: SceneComponentProxy[] = [];

  public childIndex: number = -1;

  public sceneObject: Object3D;

  constructor(
    args: unknown[] = [],
    tb: TripleBuffer,
    public override readonly id: number,
    protected override readonly renderer: IInternalRenderWorkerContext
  ) {
    super(args, tb, id, renderer);

    this.sceneObject = new Object3D();
  }
}

@CLASS(proxy(SceneComponentProxy))
export class SceneComponent extends ActorComponent {
  declare byteView: Uint8Array;

  declare tripleBuffer: TripleBuffer;

  @PROP(serialize(vec3))
  public position: Vector3 = new Vector3();

  @PROP(serialize(vec3))
  public rotation: Euler = new Euler();

  @PROP(serialize(vec3))
  public scale: Vector3 = new Vector3(1, 1, 1);

  @PROP(serialize(mat4))
  public matrix: Matrix4 = new Matrix4();

  @PROP(serialize(quat))
  public quaternion: Quaternion = new Quaternion();

  @PROP(serialize(vec3))
  public up: Vector3 = Object3D.DEFAULT_UP;

  @PROP(serialize(boolean))
  public visible: boolean = true;

  @PROP(serialize(boolean))
  public castShadow: boolean = false;

  @PROP(serialize(boolean))
  public receiveShadow: boolean = false;

  @PROP(serialize(boolean))
  public isRootComponent: boolean = false;

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

  public setAsRoot(actor: Actor): boolean {
    if (actor.setRootComponent(this)) {
      this.isRootComponent = true;
      return true;
    }
    return false;
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

    if (owner.getRootComponent() === this) {
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

    // this.componentTick.addDependency(parent.componentTick);

    this.parent = parent;
    this.childIndex = this.parent.children.push(this) - 1;

    // ? Update child transformations, when attached to parent?
    // ? Broadcast an event, something like "onChildAttached"?
    return true;
  }

  public detachFromParent(parent: SceneComponent): boolean {
    if (!this.parent) {
      this.logger.warn(
        `"${this.constructor.name}" is not attached to "${parent.constructor.name}".`
      );
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

    this.children.splice(component.childIndex, 1);

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
}
