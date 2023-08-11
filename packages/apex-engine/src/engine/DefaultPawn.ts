import { Pawn } from './Pawn';
import { InputKeyMap } from './PlayerInput';
import { CameraComponent } from './components';
import { Quaternion } from './math';

const quat = new Quaternion();

export class DefaultPawn extends Pawn {
  private inputBindingsInitialized: boolean = false;

  private cameraComponent: CameraComponent | null = null;

  public override tick() {
    const speed = 1.5;
    const delta = 0.01 * speed;

    if (typeof window === 'undefined') {
      return;
    }

    if (this.cameraComponent && this.controller) {
      const { innerHeight, innerWidth } = window;
      const halfHeight = innerHeight / 2;
      const halfWidth = innerWidth / 2;
      const mouseX = this.controller.playerInput.getKeyValue('MouseX');
      const mouseY = this.controller.playerInput.getKeyValue('MouseY');
      const yawLeft = -(mouseX - halfWidth) / halfWidth;
      const pitchDown = (mouseY - halfHeight) / halfHeight;
      quat.set(pitchDown * delta, yawLeft * delta, -0, 1).normalize();
      this.cameraComponent.quaternion.set(quat.x, quat.y, quat.z, 1);
    }

    super.tick();
  }

  public moveForward() {
    this.logger.debug('moveForward');
  }

  public moveRight() {
    this.logger.debug('moveRight');
  }

  public moveUp() {
    this.logger.debug('moveUp');
  }

  public turn() {
    this.logger.debug('turn');
  }

  public lookUp() {
    this.logger.debug('lookUp');
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

    this.inputComponent.bindAction('DefaultPawn_MoveForward', this, this.moveForward);
    this.inputComponent.bindAction('DefaultPawn_MoveRight', this, this.moveRight);
    this.inputComponent.bindAction('DefaultPawn_MoveUp', this, this.moveUp);
    this.inputComponent.bindAction('DefaultPawn_Turn', this, this.turn);
    this.inputComponent.bindAction('DefaultPawn_LookUp', this, this.lookUp);

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

    this.logger.debug(this.constructor.name, `Initialized input maps`);
  }

  protected override onRegister(): void {
    this.cameraComponent = this.addComponent(CameraComponent);
  }
}
