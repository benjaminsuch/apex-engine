import { Actor, Level } from 'apex-engine/src/engine';
import { ActorComponent, SceneComponent } from 'apex-engine/src/engine/components';
import { Renderer } from 'apex-engine/src/renderer';
import { BoxGeometry, Mesh, MeshBasicMaterial } from 'three';

export class StartLevel extends Level {
  public init() {
    super.init();

    if (IS_CLIENT) {
      Renderer.getInstance().camera.position.y = 50;
      Renderer.getInstance().camera.position.z = 100;
      Renderer.getInstance().camera.rotation.x = -0.25;
    }

    this.getWorld().spawnActor(DemoActor);
  }
}

class DemoActor extends Actor {
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
      new MeshBasicMaterial({ color: 0x00ff00 })
    );
  }

  public tick() {
    this.sceneObject.rotation.x += 0.01;
    this.sceneObject.rotation.y += 0.01;
  }
}
