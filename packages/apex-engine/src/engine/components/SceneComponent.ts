import { Euler, Matrix4, Quaternion, Vector3 } from 'three';

import { ActorComponent } from './ActorComponent';

export type SceneObjectType = 'Box' | 'Object3D' | 'PerspectiveCamera';

export abstract class SceneComponent extends ActorComponent {
  public position: Vector3 = new Vector3();

  public rotation: Euler = new Euler();

  public scale: Vector3 = new Vector3();

  public matrix: Matrix4 = new Matrix4();

  public quaternion: Quaternion = new Quaternion();

  public up: Vector3 = new Vector3();
}
