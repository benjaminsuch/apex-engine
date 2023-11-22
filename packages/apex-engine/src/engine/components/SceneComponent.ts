import { Euler, Matrix4, Quaternion, Vector3 } from 'three';

import { PROP } from '../class';
import { mat4, quat, serialize, vec3 } from '../class/specifiers/serialize';
import { ActorComponent } from './ActorComponent';

export type SceneObjectType = 'Box' | 'Object3D' | 'PerspectiveCamera';

export abstract class SceneComponent extends ActorComponent {
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
}
