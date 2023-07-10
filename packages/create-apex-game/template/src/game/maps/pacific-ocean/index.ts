import { Level } from 'apex-engine/src/engine';

import { PlayerController } from 'engine/PlayerController';
import { DemoActor } from 'game/actors/DemoActor';
import { PlayerCamera } from 'game/actors/PlayerCameraPawn';

export default class PacificOceanLevel extends Level {
  public override init() {
    super.init();

    const playerController = this.getWorld().spawnActor(PlayerController);
    const playerPawn = this.getWorld().spawnActor(PlayerCamera);

    playerController.setPawn(playerPawn);

    this.getWorld().spawnActor(DemoActor);
  }
}
