import * as THREE from 'three';

import { type TripleBuffer } from '../../platform/memory/common';
import { CLASS, PROP } from '../class';
import { proxy } from '../class/specifiers/proxy';
import { boolean, mat4, quat, ref, serialize, vec3 } from '../class/specifiers/serialize';
import { RenderProxy } from '../RenderProxy';
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
    number
  ];

  declare quaternion: [number, number, number, number];

  declare up: [number, number, number];

  declare visible: boolean;

  declare castShadow: boolean;

  declare receiveShadow: boolean;

  declare isRootComponent: boolean;

  declare parent: SceneComponentProxy | null;

  public children: SceneComponentProxy[] = [];

  public sceneObject: THREE.Object3D = new THREE.Object3D();

  public tick(time: number): void {
    this.sceneObject.castShadow = this.castShadow;
    this.sceneObject.receiveShadow = this.receiveShadow;
    this.sceneObject.visible = this.visible;
    this.sceneObject.position.fromArray(this.position);
    this.sceneObject.rotation.fromArray(this.rotation);
    this.sceneObject.scale.fromArray(this.scale);
    this.sceneObject.up.fromArray(this.up);

    if (this.parent) {
      const idx = this.parent.children.indexOf(this);

      if (idx === -1) {
        this.parent.children.push(this);
      }
    }
  }
}

@CLASS(proxy(SceneComponentProxy))
export class SceneComponent extends ActorComponent {
  declare byteView: Uint8Array;

  declare tripleBuffer: TripleBuffer;

  @PROP(serialize(vec3))
  public position: THREE.Vector3 = new THREE.Vector3();

  @PROP(serialize(vec3))
  public rotation: THREE.Euler = new THREE.Euler();

  @PROP(serialize(vec3))
  public scale: THREE.Vector3 = new THREE.Vector3();

  @PROP(serialize(mat4))
  public matrix: THREE.Matrix4 = new THREE.Matrix4();

  @PROP(serialize(quat))
  public quaternion: THREE.Quaternion = new THREE.Quaternion();

  @PROP(serialize(vec3))
  public up: THREE.Vector3 = new THREE.Vector3();

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
