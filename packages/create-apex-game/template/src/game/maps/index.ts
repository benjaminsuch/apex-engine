import { Level } from 'apex-engine';

import { DemoActor } from '../../game/actors/DemoActor';
import { PlayerCamera } from '../../game/actors/PlayerCameraPawn';
import { PlayerController } from '../../game/actors/PlayerController';

export default class PacificOceanLevel extends Level {
  public override init() {
    super.init();

    const playerController = this.getWorld().spawnActor(PlayerController);
    const playerPawn = this.getWorld().spawnActor(PlayerCamera);

    playerController.setPawn(playerPawn);

    this.getWorld().spawnActor(DemoActor);
  }
}
