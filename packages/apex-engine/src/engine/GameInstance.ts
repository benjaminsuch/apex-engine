import { GameEngine } from './GameEngine';
import { World } from './World';

export class GameInstance {
  private world?: World;

  public getWorld() {
    return this.world;
  }

  public init() {
    this.world = new World(this);
  }

  public start() {
    GameEngine.getInstance().loadLevel(APEX_GAME_DEFAULT_LEVEL);
  }
}
