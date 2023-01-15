import { Actor, Level } from 'engine/engine';

export class MenuLevel extends Level {
  public init() {
    super.init();

    this.owningWorld?.spawnActor(DemoActor);
  }
}

class DemoActor extends Actor {}
