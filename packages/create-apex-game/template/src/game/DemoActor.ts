import { Actor } from 'apex-engine/src/engine';
import { ActorComponent, SceneComponent } from 'apex-engine/src/engine/components';
import { BoxGeometry, Mesh, MeshStandardMaterial } from 'three';

export class DemoActor extends Actor {
  constructor() {
    super();

    this.addComponent(ActorComponent);

    const rootComponent = this.addComponent(SceneComponent, true) as SceneComponent;
    const boxComponent = this.addComponent(BoxComponent) as BoxComponent;

    boxComponent.attachToParent(rootComponent);
  }
}

class BoxComponent extends SceneComponent {
  constructor() {
    super();

    this.sceneObject = new Mesh(
      new BoxGeometry(10, 10, 10),
      new MeshStandardMaterial({ color: 0x00ff00 })
    );
  }

  public tick() {
    //this.sceneObject.rotation.x += 0.01;
    //this.sceneObject.rotation.y += 0.01;
  }
}
