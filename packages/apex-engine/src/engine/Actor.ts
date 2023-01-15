import { Level } from './Level';
import { World } from './World';

export class Actor {
  private level?: Level;

  public getLevel() {
    return this.level;
  }

  private world?: World;

  public getWorld() {
    return this.world;
  }

  private isInitialized: boolean = false;

  public preInitComponents() {}

  public initComponents() {}

  public postInitComponents() {
    this.isInitialized = true;
  }

  public registerWithLevel(level: Level) {
    if (level.hasActor(this)) {
      throw new Error(`This instance is already registered in this level.`);
    }

    this.level = level;
    this.world = level.owningWorld;

    this.onRegister();
  }

  protected onRegister() {}
}
