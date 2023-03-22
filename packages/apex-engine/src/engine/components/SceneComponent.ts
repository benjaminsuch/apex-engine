import { Euler, Matrix4, Quaternion } from 'three';

import { Vector3 } from '../math';
import { ActorComponent } from './ActorComponent';

export class SceneComponent extends ActorComponent {
  private readonly position: Vector3 = new Vector3();

  private readonly scale: Vector3 = new Vector3();

  private readonly rotation: Euler = new Euler();

  private readonly quaternion: Quaternion = new Quaternion();

  private readonly matrix: Matrix4 = new Matrix4();

  private readonly matrixWorld: Matrix4 = new Matrix4();

  private visible: boolean = true;

  private readonly children: Set<SceneComponent> = new Set();

  public attachToParent(parent: SceneComponent) {
    parent.children.add(this);
  }

  public toJSON(): any {
    return {
      position: this.position,
      scale: this.scale,
      rotation: this.rotation,
      quaternion: this.quaternion,
      matrix: this.matrix,
      matrixWorld: this.matrixWorld,
      visible: this.visible,
      children: [...this.children].map(child => child.toJSON())
    };
  }
}
