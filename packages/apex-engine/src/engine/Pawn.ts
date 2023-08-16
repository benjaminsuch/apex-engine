import { Actor } from './Actor';
import { type PlayerController } from './PlayerController';
import { InputComponent } from './components';

export class Pawn extends Actor {
  public controller: PlayerController | null = null;

  public inputComponent: InputComponent | null = null;

  public possessBy(player: PlayerController) {
    this.controller = player;
  }

  public unpossessed() {
    this.controller = null;
  }

  public restart() {
    if (this.controller) {
      if (!this.inputComponent) {
        this.inputComponent = this.addComponent(InputComponent);
        this.setupInputComponent();
      }
    }
  }

  protected setupInputComponent() {}
}
