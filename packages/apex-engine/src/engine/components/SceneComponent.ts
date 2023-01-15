import { Object3D } from 'three';
import { ActorComponent } from './ActorComponent';

export class SceneComponent extends ActorComponent {
  public readonly object3D: Object3D;

  constructor() {
    super();

    this.object3D = new Object3D();
  }
}
