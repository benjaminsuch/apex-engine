import { Pawn } from './Pawn';
import { EKeyEvent, InputActionMap, InputAxisMap } from './PlayerInput';
import { CameraComponent } from './components';

export class DefaultPawn extends Pawn {
  private inputBindingsInitialized: boolean = false;

  private cameraComponent: CameraComponent | null = null;

  public openSomething() {
    console.log('openSomething');
  }

  public moveForward(value: number) {
    //console.log('moveForward');
  }

  public moveRight(value: number) {}

  public moveUp(value: number) {}

  public turn(value: number) {
    //console.log('turn', value);
  }

  public lookUp(value: number) {
    //console.log('lookUp', value);
  }

  protected override setupInputComponent() {
    this.initInputBindings();

    if (!this.inputComponent) {
      this.logger.warn(
        this.constructor.name,
        'Skipping input bindings: InputComponent is not defined. Did you forget to call "setupInputComponent"?'
      );
      return;
    }

    this.inputComponent.bindAxis('DefaultPawn_MoveForward', this, this.moveForward);
    this.inputComponent.bindAxis('DefaultPawn_MoveRight', this, this.moveRight);
    this.inputComponent.bindAxis('DefaultPawn_MoveUp', this, this.moveUp);
    this.inputComponent.bindAxis('DefaultPawn_Turn', this, this.turn);
    this.inputComponent.bindAxis('DefaultPawn_LookUp', this, this.lookUp);
    this.inputComponent.bindAction('OpenSomething', this, this.openSomething, EKeyEvent.Pressed);

    this.logger.debug(this.constructor.name, `Setup action bindings`);
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

    playerInput.addMapping(new InputActionMap('OpenSomething', 'KeyW'));

    playerInput.addMapping(new InputAxisMap('DefaultPawn_MoveForward', 'KeyW', 1));
    playerInput.addMapping(new InputAxisMap('DefaultPawn_MoveForward', 'ArrowUp', 1));
    playerInput.addMapping(new InputAxisMap('DefaultPawn_MoveForward', 'KeyS', -1));
    playerInput.addMapping(new InputAxisMap('DefaultPawn_MoveForward', 'ArrowDown', -1));

    playerInput.addMapping(new InputAxisMap('DefaultPawn_MoveRight', 'KeyA', -1));
    playerInput.addMapping(new InputAxisMap('DefaultPawn_MoveRight', 'ArrowLeft', -1));
    playerInput.addMapping(new InputAxisMap('DefaultPawn_MoveRight', 'KeyD', 1));
    playerInput.addMapping(new InputAxisMap('DefaultPawn_MoveRight', 'ArrowRight', 1));

    playerInput.addMapping(new InputAxisMap('DefaultPawn_MoveUp', 'Space', 1));

    playerInput.addMapping(new InputAxisMap('DefaultPawn_Turn', 'MouseX', 1));
    playerInput.addMapping(new InputAxisMap('DefaultPawn_LookUp', 'MouseY', 1));

    this.inputBindingsInitialized = true;

    this.logger.debug(this.constructor.name, `Initialized input maps`);
  }

  protected override onRegister(): void {
    this.cameraComponent = this.addComponent(CameraComponent);
  }
}
