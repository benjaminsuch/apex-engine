import * as THREE from 'three';

import { type TripleBuffer } from '../../platform/memory/common';
import { CLASS, FUNC, PROP } from '../class';
import { proxy } from '../class/specifiers/proxy';
import { rpc } from '../class/specifiers/rpc';
import { boolean, mat4, quat, ref, serialize, vec3 } from '../class/specifiers/serialize';
import { type IRenderTickContext, RenderProxy, Renderer } from '../renderer';
import { type Actor } from '../Actor';
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

  public childIndex: number = -1;

  public sceneObject: THREE.Object3D = new THREE.Object3D();

  constructor(
    tb: TripleBuffer,
    public override readonly id: number,
    protected override readonly messagePort: MessagePort | null = null,
    protected override readonly renderer: Renderer
  ) {
    super(tb, id, messagePort, renderer);
  }

  public setAsRoot() {
    // We do not set `isRootComponent` here (this information is automatically set from the triple buffer).
    this.renderer.scene.add(this.sceneObject);
  }

  public override tick(tick: IRenderTickContext): void {
    super.tick(tick);

    this.sceneObject.castShadow = this.castShadow;
    this.sceneObject.receiveShadow = this.receiveShadow;
    this.sceneObject.visible = this.visible;
    this.sceneObject.position.fromArray(this.position);
    // this.sceneObject.rotation.fromArray(this.rotation);
    this.sceneObject.scale.fromArray(this.scale);
    this.sceneObject.up.fromArray(this.up);
  }

  public attachToComponent() {
    // We use setInterval as a ugly fix. The problem is, that once the rpc call comes in,
    // the data from the write-buffer may not been copied to the read-buffer yet.
    //
    // This issue should be resolved, once we include the tick information in our execution.
    // todo: Remove setInterval
    const interval = setInterval(() => {
      // if (!this.parent) {
      //   console.warn(`Cannot attach component to parent: Parent is ${typeof this.parent}.`);
      //   return false;
      // }

      if (!this.parent) {
        return;
      }

      const idx = this.parent.children.indexOf(this);

      if (idx === -1) {
        this.childIndex = this.parent.children.push(this) - 1;
        this.parent.sceneObject.add(this.sceneObject);
        clearInterval(interval);
      }
    });
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

  @FUNC(rpc())
  public setAsRoot(actor: Actor): boolean {
    if (actor.setRootComponent(this)) {
      this.isRootComponent = true;
      return true;
    }
    return false;
  }

  @FUNC(rpc())
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

    this.parent = parent;
    this.childIndex = this.parent.children.push(this) - 1;

    //? Update child transformations, when attached to parent?
    //? Broadcast an event, something like "onChildAttached"?
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
