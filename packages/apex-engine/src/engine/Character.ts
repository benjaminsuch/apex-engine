import { CapsuleGeometry, Euler, MathUtils, Vector3 } from 'three';

import { IInstantiationService } from '../platform/di/common/InstantiationService';
import { IConsoleLogger } from '../platform/logging/common/ConsoleLogger';
import { CameraComponent } from './components/CameraComponent';
import { MeshComponent } from './components/MeshComponent';
import { InputAction } from './InputAction';
import { InputMappingContext } from './InputMappingContext';
import { ETriggerEvent } from './InputTriggers';
import { Pawn } from './Pawn';
import { PlayerController } from './PlayerController';
import { PlayerInput } from './PlayerInput';

export class Character extends Pawn {
  private inputBindingsInitialized: boolean = false;

  private readonly cameraComponent: CameraComponent;

  protected readonly capsuleComponent: MeshComponent;

  constructor(
    @IInstantiationService protected override readonly instantiationService: IInstantiationService,
    @IConsoleLogger protected override readonly logger: IConsoleLogger
  ) {
    super(instantiationService, logger);

    this.capsuleComponent = this.addComponent(MeshComponent, new CapsuleGeometry(1, 3), undefined);
    this.capsuleComponent.setAsRoot(this);

    this.cameraComponent = this.addComponent(CameraComponent, 50, 1, 0.1, 2000);
    this.cameraComponent.position.set(0, 15, -25);
    // this.cameraComponent.lookAt(0, 0, 0);
    this.cameraComponent.attachToComponent(this.getRootComponent());
  }

  public moveForward(value: number): void {
    if (IS_BROWSER) {
      if (this.cameraComponent) {

      }
    }
  }

  public moveRight(value: number): void {
    if (IS_BROWSER) {
      if (this.cameraComponent) {

      }
    }
  }

  public moveUp(value: number): void {}

  public turn(value: number): void {
    if (IS_BROWSER) {
      if (this.cameraComponent) {
      }
    }
  }

  public lookUp(value: number): void {
    if (IS_BROWSER) {
      if (this.cameraComponent) {
        // console.log('lookUp value', value);
      }
    }
  }

  public handleEvent(event: Event): void {
    if (IS_BROWSER) {
      if (event.type === 'mousedown') {
        document.body.requestPointerLock();
      }
    }
  }

  protected override setupInputComponent(): void {
    this.initInputBindings();

    if (!this.inputComponent) {
      this.logger.warn(
        this.constructor.name,
        'Skipping input bindings: InputComponent is not defined. Did you forget to call "setupInputComponent"?'
      );
      return;
    }

    this.inputComponent.bindAction(MoveAction, ETriggerEvent.Triggered, this, this.moveForward);
    // this.inputComponent.bindAxis('DefaultPawn_MoveForward', this, this.moveForward);
    // this.inputComponent.bindAxis('DefaultPawn_MoveRight', this, this.moveRight);
    // this.inputComponent.bindAxis('DefaultPawn_MoveUp', this, this.moveUp);
    // this.inputComponent.bindAxis('DefaultPawn_Turn', this, this.turn);
    // this.inputComponent.bindAxis('DefaultPawn_LookUp', this, this.lookUp);

    this.logger.debug(this.constructor.name, `Setup action bindings`);
  }

  protected override onRegister(): void {
    if (IS_BROWSER) {
      document.body.addEventListener('mousedown', this);
    }
  }

  private initInputBindings(): void {
    if (this.inputBindingsInitialized) {
      return;
    }

    if (!(this.controller instanceof PlayerController)) {
      this.logger.warn(
        this.constructor.name,
        'Skipping input maps: PlayerController is not defined'
      );
      return;
    }

    const moveAction = this.instantiationService.createInstance(MoveAction);

    const defaultMappingContext = this.instantiationService.createInstance(InputMappingContext);
    defaultMappingContext.mapKey(moveAction, 'KeyW');

    const playerInput = this.controller.playerInput;
    playerInput.addMappingContext(defaultMappingContext);

    this.inputBindingsInitialized = true;

    this.logger.debug(this.constructor.name, `Initialized input maps`);
  }
}

class MoveAction extends InputAction {}
