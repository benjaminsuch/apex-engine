import { ApexEngine } from './ApexEngine';
import { World } from './World';

export class GameInstance {
  private world?: World;

  public getWorld() {
    if (!this.world) {
      throw new Error(`No world set.`);
    }
    return this.world;
  }

  constructor(private readonly engine: ApexEngine) {}

  public init() {
    this.world = new World(this);
    this.world.init();
  }

  public start() {
    this.engine.loadLevel(APEX_GAME_DEFAULT_LEVEL);
    //this.engine.loadLevel('/src/game/levels/start');
  }
}
