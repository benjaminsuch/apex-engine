import { CameraComponent } from 'apex-engine/src/engine/components';

import { Pawn } from 'engine/Pawn';

export class PlayerCamera extends Pawn {
  protected override onRegister(): void {
    this.addComponent(CameraComponent, true);
  }
}
