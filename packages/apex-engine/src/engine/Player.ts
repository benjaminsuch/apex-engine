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

  constructor() {}

  public spawnPlayActor(world: World) {
    this.playerController = world.spawnPlayActor();
  }
}
