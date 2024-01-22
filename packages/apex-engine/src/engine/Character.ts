import { CapsuleGeometry } from 'three';

import { IInstantiationService } from '../platform/di/common/InstantiationService';
import { IConsoleLogger } from '../platform/logging/common/ConsoleLogger';
import { CameraComponent } from './components/CameraComponent';
import { MeshComponent } from './components/MeshComponent';
import { InputAction } from './InputAction';
import { InputMappingContext } from './InputMappingContext';
import { ETriggerEvent } from './InputTriggers';
import { Pawn } from './Pawn';
import { PlayerController } from './PlayerController';

export class Character extends Pawn {
  private readonly cameraComponent: CameraComponent;

  protected readonly capsuleComponent: MeshComponent;

  protected defaultMappingContext: InputMappingContext | undefined;

  public getDefaultMappingContext(): InputMappingContext {
    if (!this.defaultMappingContext) {
      throw new Error(`No default mapping context assigned.`);
    }
    return this.defaultMappingContext;
  }

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

  public override beginPlay(): void {
    super.beginPlay();

    if (IS_BROWSER) {
      document.body.addEventListener('mousedown', this);
    }

    if (!(this.controller instanceof PlayerController)) {
      this.logger.warn(
        this.constructor.name,
        'Skipping input mapping: PlayerController is not defined'
      );
      return;
    }

    this.defaultMappingContext = this.instantiationService.createInstance(DefaultMappingContext);
    this.controller.playerInput.addMappingContext(this.defaultMappingContext);
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
    if (!this.inputComponent) {
      this.logger.warn(
        this.constructor.name,
        'Skipping input bindings: InputComponent is not defined. Did you forget to call "setupInputComponent"?'
      );
      return;
    }

    this.inputComponent.bindAction(MoveAction, ETriggerEvent.Triggered, this, this.moveForward);

    this.logger.debug(this.constructor.name, `Setup action bindings`);
  }
}

class DefaultMappingContext extends InputMappingContext {
  private readonly lookAction: LookAction;

  private readonly moveAction: MoveAction;

  constructor(@IInstantiationService protected override readonly instantiationService: IInstantiationService) {
    super(instantiationService);

    this.lookAction = this.instantiationService.createInstance(LookAction);
    this.moveAction = this.instantiationService.createInstance(MoveAction);

    this.mapKey(this.lookAction, 'MouseXY');
    const moveMapping = this.mapKey(this.moveAction, 'KeyW');
    // moveMapping.modifiers.push(...)
    // moveMapping.triggers.push(...)
  }
}

class LookAction extends InputAction {}

class MoveAction extends InputAction {}
