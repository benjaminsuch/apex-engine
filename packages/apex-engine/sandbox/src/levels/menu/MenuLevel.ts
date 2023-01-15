import { Actor, Level } from 'engine/engine';
import { ActorComponent, SceneComponent } from 'engine/engine/components';
import { Renderer } from 'engine/renderer';
import { BoxGeometry, Mesh, MeshBasicMaterial, PerspectiveCamera } from 'three';

export class MenuLevel extends Level {
  public init() {
    super.init();

    const camera = new PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 5;

    Renderer.getInstance().camera = camera;

    if (this.owningWorld) {
      this.owningWorld.spawnActor(DemoActor);
    }
  }
}

class DemoActor extends Actor {
  protected onRegister() {
    super.onRegister();

    this.addComponent(ActorComponent);

    const rootComponent = this.addComponent(SceneComponent, true) as SceneComponent;
    const boxComponent = this.addComponent(BoxComponent) as BoxComponent;

    boxComponent.attachToParent(rootComponent);
  }
}

class BoxComponent extends SceneComponent {
  constructor() {
    super();

    this.object3D = new Mesh(new BoxGeometry(1, 1, 1), new MeshBasicMaterial({ color: 0x00ff00 }));
  }

  public tick() {
    this.object3D.rotation.x += 0.01;
    this.object3D.rotation.y += 0.01;
  }
}
