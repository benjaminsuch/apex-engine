import { Actor } from './Actor';
import { Pawn } from './Pawn';
import { PlayerController } from './PlayerController';

export class GameMode extends Actor {
  public readonly playerPawnClass: typeof Pawn = Pawn;

  public readonly playerControllerClass: typeof PlayerController = PlayerController;

  public login() {
    return this.spawnPlayerController();
  }

  public postLogin() {
    this.initPlayer();
  }

  public restartPlayer() {
    const startSpot = this.findPlayerStart();
  }

  public restartPlayerAtPlayerStart() {}

  public findPlayerStart() {}

  public spawnPlayerController() {
    return this.getWorld().spawnActor(this.playerControllerClass);
  }

  public spawnDefaultPlayerPawn() {}

  private initPlayer() {}
}
