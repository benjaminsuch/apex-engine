import { Actor } from './Actor';
import { Pawn } from './Pawn';
import { PlayerController } from './PlayerController';
import { InputComponent } from './components';

export class GameMode extends Actor {
  public readonly playerPawnClass: typeof Pawn = Pawn;

  public readonly playerControllerClass: typeof PlayerController = PlayerController;

  public login() {
    this.spawnPlayerController();
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
    const playerController = this.getWorld().spawnActor(this.playerControllerClass);
    playerController.addComponent(InputComponent);

    return playerController;
  }

  public spawnDefaultPlayerPawn() {}

  private initPlayer() {}
}
