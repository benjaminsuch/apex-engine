import { Actor, ActorComponent, SceneComponent } from 'apex-engine';

export class DemoActor extends Actor {
  protected override onRegister(): void {
    this.addComponent(ActorComponent);
    this.addComponent(SceneComponent, true);
  }

  public override tick(): void {
    this.getRootComponent().rotation.x += 0.01;
    this.getRootComponent().rotation.y += 0.01;
    this.getRootComponent().rotation.z += 0.01;
  }
}
