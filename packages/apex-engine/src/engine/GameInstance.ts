import { GameEngine } from './GameEngine';
import { World } from './World';

export class GameInstance {
  private world?: World;

  public getWorld() {
    if (!this.world) {
      throw new Error(`No world set.`);
    }
    return this.world;
  }

  public init() {
    this.world = new World(this);
  }

  public start() {
    GameEngine.getInstance().loadLevel(APEX_GAME_DEFAULT_LEVEL);
  }
}
