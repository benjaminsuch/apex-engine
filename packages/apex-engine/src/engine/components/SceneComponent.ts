import { Object3D } from 'three';

import { Renderer } from '../../renderer';
import { ActorComponent } from './ActorComponent';

export class SceneComponent extends ActorComponent {
  public sceneObject: Object3D;

  private readonly children: Set<SceneComponent> = new Set();

  public attachToParent(parent: SceneComponent) {
    parent.children.add(this);
    parent.sceneObject.add(this.sceneObject);
  }

  constructor() {
    super();

    this.sceneObject = new Object3D();
  }

  protected onRegister() {
    Renderer.registerTickFunction(this);
  }
}
