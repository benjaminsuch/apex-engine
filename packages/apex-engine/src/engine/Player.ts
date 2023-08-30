import { IInstatiationService } from '../platform/di/common';
import { IConsoleLogger } from '../platform/logging/common';
import { PlayerController } from './PlayerController';
import { type World } from './World';

export class Player {
  private playerController: PlayerController | null = null;

  public getPlayerController() {
    if (!this.playerController) {
      throw new Error(`No player controller set.`);
    }
    return this.playerController;
  }

  constructor(
    @IInstatiationService protected readonly instantiationService: IInstatiationService,
    @IConsoleLogger protected readonly logger: IConsoleLogger
  ) {}

  public spawnPlayActor(world: World) {
    this.logger.debug(this.constructor.name, 'Spawn player actor');

    if (IS_CLIENT) {
      this.playerController = world.spawnActor(PlayerController);
    } else {
      this.playerController = world.spawnPlayActor(this);
    }
  }
}
