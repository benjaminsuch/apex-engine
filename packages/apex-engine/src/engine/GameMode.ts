import { Actor } from './Actor';
import { ApexEngine } from './ApexEngine';
import { type Pawn } from './Pawn';
import { type Player } from './Player';
import { PlayerController } from './PlayerController';

export class GameMode extends Actor {
  public preLogin(): void {}

  public login(player: Player): PlayerController {
    this.logger.debug(this.constructor.name, `Login`);

    const playerController = this.spawnPlayerController();
    this.initPlayer(playerController);

    return playerController;
  }

  public postLogin(playerController: PlayerController): void {
    this.restartPlayer(playerController);
  }

  public restartPlayer(playerController: PlayerController, playerStart: Actor | undefined = this.findPlayerStart(playerController)): void {
    this.logger.debug(this.constructor.name, `Restart player`);

    if (!playerStart) {
      this.logger.debug(`Player start not found.`);
      return;
    }

    this.initStartSpot(playerStart, playerController);
    playerController.possess(this.spawnDefaultPlayerPawn());
  }

  public findPlayerStart(playerController: PlayerController): Actor | undefined {
    return playerController.startSpot;
  }

  public spawnPlayerController(): PlayerController {
    return this.getWorld().spawnActor(PlayerController);
  }

  public spawnDefaultPlayerPawn(): Pawn {
    return this.getWorld().spawnActor(ApexEngine.DefaultPawnClass);
  }

  protected initStartSpot(playerStart: Actor, playerController: PlayerController): void {}

  protected initPlayer(playerController: PlayerController): void {
    this.logger.debug(this.constructor.name, `Initialize Player`);

    const startSpot = this.findPlayerStart(playerController);

    if (!startSpot) {
      this.logger.error(`Unable to find start spot for player.`);
      return;
    }

    playerController.startSpot = startSpot;
  }
}

// We need a default export for our default-class loading in `EngineLoop.init`.
export default GameMode;
