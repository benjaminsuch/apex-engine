import { Actor } from './Actor';
import { type Controller } from './Controller';
import { InputComponent } from './input/InputComponent';

export class Pawn extends Actor {
  protected controller?: Controller | null = null;

  public getController(): Controller {
    if (!this.controller) {
      throw new Error(`Controller not set.`);
    }
    return this.controller;
  }

  public inputComponent?: InputComponent;

  public possessedBy(controller: Controller): void {
    const oldController = this.controller;

    this.controller = controller;

    if (oldController !== controller) {
      // todo: Broadcast controller changed event
    }
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

  public restart(isClient: boolean = false): void {
    if (isClient) {
      this.clientRestart();
    }
  }

  protected clientRestart(): void {
    if (this.controller) {
      if (!this.inputComponent) {
        this.inputComponent = this.addComponent(InputComponent);
        this.setupInputComponent();
      }
    }
  }

  protected setupInputComponent(): void {}
}
