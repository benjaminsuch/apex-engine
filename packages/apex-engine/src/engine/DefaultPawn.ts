import { Pawn } from './Pawn';
import { InputAxisMap } from './PlayerInput';
import { CameraComponent } from './components';
import { Quaternion } from './math';

const quat = new Quaternion();

export class DefaultPawn extends Pawn {
  private inputBindingsInitialized: boolean = false;

  private cameraComponent: CameraComponent | null = null;

  public moveForward() {}

  public moveRight() {}

  public moveUp() {}

  public turn(delta: number) {
    if (typeof window === 'undefined') {
      return;
    }

    if (this.cameraComponent && this.controller) {
      const halfWidth = window.innerWidth / 2;
      const mouseX = this.controller.playerInput.getKeyValue('MouseX');
      const yawLeft = (mouseX.x - halfWidth) / halfWidth;

      quat.set(quat.x, yawLeft * delta, -0, 1).normalize();

      this.cameraComponent.quaternion.set(quat.x, quat.y, quat.z, 1);
    }
  }

  public lookUp(delta: number) {
    if (typeof window === 'undefined') {
      return;
    }

    if (this.cameraComponent && this.controller) {
      const halfHeight = window.innerHeight / 2;
      const mouseY = this.controller.playerInput.getKeyValue('MouseY');
      const pitchDown = (mouseY.x - halfHeight) / halfHeight;

      quat.set(pitchDown * delta, quat.y, -0, 1).normalize();

      this.cameraComponent.quaternion.set(quat.x, quat.y, quat.z, 1);
    }
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

    playerInput.addAxisMap(new InputAxisMap('DefaultPawn_MoveForward', 'KeyW', 1));
    playerInput.addAxisMap(new InputAxisMap('DefaultPawn_MoveForward', 'ArrowUp', 1));
    playerInput.addAxisMap(new InputAxisMap('DefaultPawn_MoveForward', 'KeyS', -1));
    playerInput.addAxisMap(new InputAxisMap('DefaultPawn_MoveForward', 'ArrowDown', -1));

    playerInput.addAxisMap(new InputAxisMap('DefaultPawn_MoveRight', 'KeyA', -1));
    playerInput.addAxisMap(new InputAxisMap('DefaultPawn_MoveRight', 'ArrowLeft', -1));
    playerInput.addAxisMap(new InputAxisMap('DefaultPawn_MoveRight', 'KeyD', 1));
    playerInput.addAxisMap(new InputAxisMap('DefaultPawn_MoveRight', 'ArrowRight', 1));

    playerInput.addAxisMap(new InputAxisMap('DefaultPawn_MoveUp', 'Space', 1));

    playerInput.addAxisMap(new InputAxisMap('DefaultPawn_Turn', 'MouseX', 1));
    playerInput.addAxisMap(new InputAxisMap('DefaultPawn_LookUp', 'MouseY', 1));

    this.inputBindingsInitialized = true;

    this.logger.debug(this.constructor.name, `Initialized input maps`);
  }

  protected override onRegister(): void {
    this.cameraComponent = this.addComponent(CameraComponent);
  }
}
