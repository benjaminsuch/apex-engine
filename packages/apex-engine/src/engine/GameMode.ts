import { Matrix4 } from './math';
import { Actor } from './Actor';
import { Pawn } from './Pawn';
import { PlayerController } from './PlayerController';

export class GameMode extends Actor {
  public readonly playerPawnClass: typeof Pawn = Pawn;

  public readonly playerControllerClass: typeof PlayerController = PlayerController;

  public login() {
    const playerController = this.spawnPlayerController();
    this.initPlayer(playerController);

    return playerController;
  }

  public postLogin(player: PlayerController) {
    this.restartPlayer(player);
  }

  public restartPlayer(
    player: PlayerController,
    transform: Matrix4 = this.findPlayerStartLocation()
  ) {
    player.setPawn(this.spawnDefaultPlayerPawn());
  }

  public findPlayerStartLocation() {
    return new Matrix4();
  }

  public spawnPlayerController() {
    return this.getWorld().spawnActor(this.playerControllerClass);
  }

  public spawnDefaultPlayerPawn() {
    return this.getWorld().spawnActor(this.playerPawnClass);
  }

  private initPlayer(player: PlayerController) {}
}
