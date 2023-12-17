import { Matrix4 } from 'three';

import { Actor } from './Actor';
import { DefaultPawn } from './DefaultPawn';
import { type NetConnection } from './net';
import { type Pawn } from './Pawn';
import { PlayerController } from './PlayerController';

export class GameMode extends Actor {
  public readonly playerPawnClass: typeof Pawn = DefaultPawn;

  public readonly playerControllerClass: typeof PlayerController = PlayerController;

  public preLogin() {}

  public login() {
    const playerController = this.spawnPlayerController();
    this.initPlayer(playerController);

    return playerController;
  }

  public postLogin(player: PlayerController) {
    this.restartPlayer(player);
  }

  public restartPlayer(
    playerController: PlayerController,
    transform: Matrix4 = this.findPlayerStartLocation()
  ) {
    this.logger.debug(this.constructor.name, `Restart player`);
    // InitStartSpot
    // FinishRestartPlayer
    playerController.possess(this.spawnDefaultPlayerPawn());
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

  public welcomePlayer(connection: NetConnection) {}

  private initPlayer(player: PlayerController) {}
}
