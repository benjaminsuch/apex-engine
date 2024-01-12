import { Matrix4 } from 'three';

import { Actor } from './Actor';
import { Pawn } from './Pawn';
import { type Player } from './Player';
import { PlayerController } from './PlayerController';

export class GameMode extends Actor {
  public preLogin(): void {}

  public login(player: Player): PlayerController {
    const playerController = this.spawnPlayerController();
    this.initPlayer(playerController);

    return playerController;
  }

  public postLogin(playerController: PlayerController): void {
    this.restartPlayer(playerController);
  }

  public restartPlayer(playerController: PlayerController, transform: Matrix4 = this.findPlayerStartLocation()): void {
    this.logger.debug(this.constructor.name, `Restart player`);
    // InitStartSpot
    // FinishRestartPlayer
    playerController.possess(this.spawnDefaultPlayerPawn());
  }

  public findPlayerStartLocation(): Matrix4 {
    return new Matrix4();
  }

  public spawnPlayerController(): PlayerController {
    return this.getWorld().spawnActor(PlayerController);
  }

  public spawnDefaultPlayerPawn(): Pawn {
    return this.getWorld().spawnActor(Pawn);
  }

  private initPlayer(player: PlayerController): void {}
}
