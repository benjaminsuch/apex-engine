import { CameraComponent } from './components';
import { Actor } from './Actor';
import { Pawn } from './Pawn';

export class PlayerController extends Actor {
  protected pawn?: Pawn;

  protected camera?: CameraComponent;

  public getPawn() {
    return this.pawn;
  }

  public setPawn(pawn: Pawn) {
    this.pawn = pawn;

    for (const component of pawn.getComponents()) {
      if (component instanceof CameraComponent) {
        this.camera = component;
      }
    }
  }
}
