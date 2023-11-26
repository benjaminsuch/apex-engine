import { Euler, Matrix4, Quaternion, Vector3 } from 'three';

import { SceneProxy } from '../SceneProxy';
import { CLASS, PROP, Schema } from '../class';
import { proxy } from '../class/specifiers/proxy';
import { boolean, mat4, quat, serialize, vec3 } from '../class/specifiers/serialize';
import { ActorComponent } from './ActorComponent';

export type SceneObjectType = 'Box' | 'Object3D' | 'PerspectiveCamera';

export class SceneComponentProxy extends SceneProxy {}

@CLASS(proxy(SceneComponentProxy))
export class SceneComponent extends ActorComponent {
  @PROP(serialize(vec3))
  public position: Vector3 = new Vector3();

  @PROP(serialize(vec3))
  public rotation: Euler = new Euler();

  @PROP(serialize(vec3))
  public scale: Vector3 = new Vector3();

  @PROP(serialize(mat4))
  public matrix: Matrix4 = new Matrix4();

  @PROP(serialize(quat))
  public quaternion: Quaternion = new Quaternion();

  @PROP(serialize(vec3))
  public up: Vector3 = new Vector3();

  @PROP(serialize(boolean))
  public visible: boolean = true;

  @PROP(serialize(boolean))
  public castShadow: boolean = false;

  @PROP(serialize(boolean))
  public receiveShadow: boolean = false;

  /**
   * The component it is attached to.
   */
  public parent: SceneComponent | null = null;

  public childIndex: number = -1;

  /**
   * A list of components that are attached to this component. Don't push components
   * directly into this array and instead use `attachToComponent`.
   */
  public children: SceneComponent[] = [];

  public attachToComponent(parent: SceneComponent) {
    if (this.parent === parent) {
      return;
    }

    if (parent === this) {
      this.logger.warn(`Cannot attach component to itself.`);
      return;
    }

    const owner = this.getOwner();

    if (owner.getRootComponent() === this) {
      this.logger.warn(
        `This component is the root component and cannot be attached to other components.`
      );
      return;
    }

    if (parent.isAttachedTo(this)) {
      this.logger.warn(
        `"${parent.constructor.name}" is already attached to "${this.constructor.name}" and would form a cycle.`
      );
      return;
    }

    this.parent = parent;
    this.childIndex = this.parent.children.push(this) - 1;

    //? Update child transformations, when attached to parent?
    //? Broadcast an event, something like "onChildAttached"?
    return true;
  }

  public detachFromParent(parent: SceneComponent) {
    if (!this.parent) {
      this.logger.warn(
        `"${this.constructor.name}" is not attached to "${parent.constructor.name}".`
      );
      return;
    }

    return this.parent.detachFromComponent(this);
  }

  public detachFromComponent(component: SceneComponent) {
    if (component.parent !== this) {
      this.logger.warn(
        `"${component.constructor.name}" is not attached to "${this.constructor.name}".`
      );
      return;
    }

    this.children.splice(component.childIndex, 1);

    for (const child of this.children) {
      child.childIndex = this.children.indexOf(child);
    }

    //? Broadcast an event, something like "onChildDetached"?
    //todo: Update world transformations for the detached component
    return true;
  }

  public isAttachedTo(component: SceneComponent) {
    for (let parent = this.parent; parent !== null; parent = parent.parent) {
      if (parent === component) {
        return true;
      }
    }
    return false;
  }
}
