import { CameraComponent, Pawn } from 'apex-engine/src/engine';

export class PlayerCamera extends Pawn {
  protected override onRegister(): void {
    this.addComponent(CameraComponent, true);
  }
}
