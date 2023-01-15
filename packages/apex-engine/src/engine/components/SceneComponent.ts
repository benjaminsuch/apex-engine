import { Object3D } from 'three';

import { Renderer } from 'src/renderer';
import { ActorComponent } from './ActorComponent';

export class SceneComponent extends ActorComponent {
  public object3D: Object3D;

  private readonly children: Set<SceneComponent> = new Set();

  public attachToParent(parent: SceneComponent) {
    parent.children.add(this);
    parent.object3D.add(this.object3D);
  }

  constructor() {
    super();

    this.object3D = new Object3D();
  }

  protected onRegister() {
    Renderer.registerTickFunction(this);
  }
}
