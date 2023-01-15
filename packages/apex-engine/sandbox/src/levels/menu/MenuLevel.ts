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

    const sceneComponent = this.addComponent(SceneComponent, true) as SceneComponent;
    const cube = new Mesh(new BoxGeometry(1, 1, 1), new MeshBasicMaterial({ color: 0x00ff00 }));

    sceneComponent.object3D.add(cube);

    const scene = this.getLevel().scene;
    scene.add(sceneComponent.object3D);

    const camera = new PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 5;

    function animate() {
      requestAnimationFrame(animate);

      cube.rotation.x += 0.01;
      cube.rotation.y += 0.01;

      //ApexEngine.getRenderer().render(scene, camera);
    }

    animate();
  }
}
