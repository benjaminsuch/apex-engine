import { IInstatiationService } from '../platform/di/common';
import { INetDriver } from '../platform/net/common';
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

  constructor(
    private readonly engine: ApexEngine,
    @IInstatiationService protected readonly instantiationService: IInstatiationService,
    @INetDriver protected readonly netDriver: INetDriver
  ) {}

  public init() {
    this.world = this.instantiationService.createInstance(World, this);
    this.world.init();

    if (!IS_GAME) {
      this.netDriver.init();
      this.netDriver.listen();
      this.netDriver.connect();
    }
  }

  public start() {
    this.engine.loadLevel(DEFAULT_LEVEL).then(() => {
      this.getWorld().beginPlay();
    });
  }
}
