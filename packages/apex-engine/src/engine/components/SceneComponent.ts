import * as THREE from 'three';

import { CLASS, PROP } from '../core/class/decorators';
import { proxy } from '../core/class/specifiers/proxy';
import { boolean, mat4, quat, ref, serialize, vec3 } from '../core/class/specifiers/serialize';
import { type TripleBuffer } from '../core/memory/TripleBuffer';
import { ActorComponent } from './ActorComponent';

export class SceneComponentProxy {
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

  public sceneObject: THREE.Object3D = new THREE.Object3D();
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
  public scale: THREE.Vector3 = new THREE.Vector3(1, 1, 1);

  @PROP(serialize(mat4))
  public matrix: THREE.Matrix4 = new THREE.Matrix4();

  @PROP(serialize(quat))
  public quaternion: THREE.Quaternion = new THREE.Quaternion();

  @PROP(serialize(vec3))
  public up: THREE.Vector3 = THREE.Object3D.DEFAULT_UP;

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
}
