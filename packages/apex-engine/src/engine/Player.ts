import { IInstantiationService } from '../platform/di/common/InstantiationService';
import { IConsoleLogger } from '../platform/logging/common/ConsoleLogger';
import { PlayerController } from './PlayerController';
import { type World } from './World';

export class Player {
  protected playerController?: PlayerController;

  public getPlayerController(): PlayerController {
    if (!this.playerController) {
      throw new Error(`Player controller not set.`);
    }
    return this.playerController;
  }

  constructor(
    @IInstantiationService protected readonly instantiationService: IInstantiationService,
    @IConsoleLogger protected readonly logger: IConsoleLogger
  ) {}

  public spawnPlayActor(world: World): void {
    if (this.playerController) {
      throw new Error(`A play actor has already been spawned.`);
    }

    if (IS_CLIENT) {
      // The client has no authority and thus will create a regular actor
      this.playerController = world.spawnActor(PlayerController);
    } else {
      this.playerController = world.spawnPlayActor(this);
    }
  }
}
