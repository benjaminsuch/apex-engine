import { Actor } from './Actor';
import { InputComponent } from './components/InputComponent';
import { type PlayerController } from './PlayerController';

export class Pawn extends Actor {
  protected controller?: PlayerController | null = null;

  public getController(): PlayerController {
    if (!this.controller) {
      throw new Error(`Controller not set.`);
    }
    return this.controller;
  }

  protected inputComponent?: InputComponent;

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

  public restart(): void {
    if (this.controller) {
      if (!this.inputComponent) {
        this.inputComponent = this.addComponent(InputComponent);
        this.setupInputComponent();
      }
    }
  }

  protected setupInputComponent(): void {}
}
