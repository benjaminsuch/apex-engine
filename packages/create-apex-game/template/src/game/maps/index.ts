import { Level } from 'apex-engine';

import { DemoActor } from '../actors/DemoActor';
import { PlayerCamera } from '../actors/PlayerCameraPawn';
import { PlayerController } from '../actors/PlayerController';

export default class PacificOceanLevel extends Level {
  public override init() {
    super.init();

    const playerController = this.getWorld().spawnActor(PlayerController);
    const playerPawn = this.getWorld().spawnActor(PlayerCamera);

    playerController.setPawn(playerPawn);

    this.getWorld().spawnActor(DemoActor);
  }
}
