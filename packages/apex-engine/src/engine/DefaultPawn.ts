import { Pawn } from './Pawn';
import { InputKeyMap } from './PlayerInput';

export class DefaultPawn extends Pawn {
  private inputBindingsInitialized: boolean = false;

  public moveForward() {}

  public moveRight() {}

  public moveUp() {}

  public turn() {}

  public lookUp() {}

  protected override setupInputComponent() {
    this.initInputBindings();

    if (!this.inputComponent) {
      this.logger.warn(
        this.constructor.name,
        'Skipping input bindings: InputComponent is not defined. Did you forget to call "setupInputComponent"?'
      );
      return;
    }

    this.inputComponent.bindAction('DefaultPawn_MoveForward', this, this.moveForward);
    this.inputComponent.bindAction('DefaultPawn_MoveRight', this, this.moveRight);
    this.inputComponent.bindAction('DefaultPawn_MoveUp', this, this.moveUp);
    this.inputComponent.bindAction('DefaultPawn_Turn', this, this.turn);
    this.inputComponent.bindAction('DefaultPawn_LookUp', this, this.lookUp);
  }

  private initInputBindings() {
    if (this.inputBindingsInitialized) {
      return;
    }

    if (!this.controller) {
      this.logger.warn(
        this.constructor.name,
        'Skipping input maps: PlayerController is not defined'
      );
      return;
    }

    const playerInput = this.controller.playerInput;

    playerInput.addInputMap(new InputKeyMap('DefaultPawn_MoveForward', 'KeyW', 1));
    playerInput.addInputMap(new InputKeyMap('DefaultPawn_MoveForward', 'ArrowUp', 1));
    playerInput.addInputMap(new InputKeyMap('DefaultPawn_MoveForward', 'KeyS', -1));
    playerInput.addInputMap(new InputKeyMap('DefaultPawn_MoveForward', 'ArrowDown', -1));

    playerInput.addInputMap(new InputKeyMap('DefaultPawn_MoveRight', 'KeyA', -1));
    playerInput.addInputMap(new InputKeyMap('DefaultPawn_MoveRight', 'ArrowLeft', -1));
    playerInput.addInputMap(new InputKeyMap('DefaultPawn_MoveRight', 'KeyD', 1));
    playerInput.addInputMap(new InputKeyMap('DefaultPawn_MoveRight', 'ArrowRight', 1));

    playerInput.addInputMap(new InputKeyMap('DefaultPawn_MoveUp', 'Space', 1));

    playerInput.addInputMap(new InputKeyMap('DefaultPawn_Turn', 'MouseX', 1));
    playerInput.addInputMap(new InputKeyMap('DefaultPawn_LookUp', 'MouseY', -1));

    this.inputBindingsInitialized = true;
  }
}
