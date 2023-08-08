import { Actor } from './Actor';
import { DefaultPawn } from './DefaultPawn';
import { PlayerController } from './PlayerController';

export class GameMode extends Actor {
  public readonly playerPawnClass: typeof Actor = DefaultPawn;

  public readonly playerControllerClass: typeof PlayerController = PlayerController;

  public login() {
    const playerController = this.spawnPlayerController();
    this.initPlayer(playerController);

    return playerController;
  }

  public postLogin(player: PlayerController) {
    //HandleStartingNewPlayer
    this.restartPlayer(player);
  }

  public restartPlayer(player: PlayerController) {
    const startSpot = this.findPlayerStart();
    this.restartPlayerAtPlayerStart(player);
  }

  public restartPlayerAtPlayerStart(player: PlayerController) {
    player.setPawn(this.spawnDefaultPlayerPawn());
  }

  public findPlayerStart() {}

  public spawnPlayerController() {
    return this.getWorld().spawnActor(this.playerControllerClass);
  }

  public spawnDefaultPlayerPawn() {
    return this.getWorld().spawnActor(this.playerPawnClass);
  }

  private initPlayer(player: PlayerController) {}
}
