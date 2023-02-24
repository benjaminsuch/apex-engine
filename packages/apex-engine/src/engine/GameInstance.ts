import { type ApexEngine } from './ApexEngine';
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
    // The Apex Build Tool shows a warning `@rollup/plugin-typescript TS2304: Cannot find name 'DEFAULT_LEVEL'`
    // @ts-ignore
    this.engine.loadLevel(DEFAULT_LEVEL);
  }
}
