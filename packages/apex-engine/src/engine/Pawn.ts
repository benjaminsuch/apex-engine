import { Actor } from './Actor';
import { type PlayerController } from './PlayerController';
import { InputComponent } from './components';

export class Pawn extends Actor {
  public controller: PlayerController | null = null;

  public inputComponent: InputComponent | null = null;

  public possessBy(player: PlayerController): void {
    this.controller = player;
  }

  /**
   * Detaches the pawn from it's controller and resets necessary props for potential
   * repossession.
   *
   * A `dispose` is not called here, since the Pawn could be repossessed. Only
   * the player controller or another instance with authority (such as Level or World)
   * should dispose actors.
   */
  public unpossessed(): void {
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
