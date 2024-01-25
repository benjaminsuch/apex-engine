import { Character } from 'apex-engine/src/engine/Character';
import { CameraComponent } from 'apex-engine/src/engine/components/CameraComponent';
import { type IEngineLoopTickContext } from 'apex-engine/src/engine/EngineLoop';
import { InputAction } from 'apex-engine/src/engine/input/InputAction';
import { InputMappingContext } from 'apex-engine/src/engine/input/InputMappingContext';
import { EInputAxisSwizzleOrder, InputModifierNegate, InputModifierScalar, InputModifierScalarByDelta, InputModifierSwizzleAxis } from 'apex-engine/src/engine/input/InputModifiers';
import { ETriggerEvent } from 'apex-engine/src/engine/input/InputTriggers';
import { PlayerController } from 'apex-engine/src/engine/PlayerController';
import { Vector3 } from 'apex-engine/src/engine/three';
import { IInstantiationService } from 'apex-engine/src/platform/di/common/InstantiationService';
import { IConsoleLogger } from 'apex-engine/src/platform/logging/common/ConsoleLogger';

const CAMERA_POS_X = 0;
const CAMERA_POS_Y = 15;
const CAMERA_POS_Z = 25;
const pos = new Vector3();

export default class ThirdPersonCharacter extends Character {
  private readonly camera: CameraComponent;

  private readonly moveAction: MoveAction;

  public defaultMappingContext: InputMappingContext;

  constructor(
    @IInstantiationService protected override readonly instantiationService: IInstantiationService,
    @IConsoleLogger protected override readonly logger: IConsoleLogger
  ) {
    super(instantiationService, logger);

    this.camera = this.addComponent(CameraComponent, 50, 1, 0.1, 2000);

    const rootComponent = this.rootComponent;

    if (rootComponent) {
      this.camera.attachToComponent(rootComponent);

      this.camera.position.set(CAMERA_POS_X, CAMERA_POS_Y, CAMERA_POS_Z);
      this.camera.matrix.lookAt(this.camera.position, rootComponent.position, this.camera.up);
      this.camera.rotation.setFromRotationMatrix(this.camera.matrix);
    }

    this.moveAction = this.instantiationService.createInstance(MoveAction);
    this.defaultMappingContext = this.instantiationService.createInstance(InputMappingContext);

    const scalarModifier = this.instantiationService.createInstance(InputModifierScalar, 12);
    const deltaModifier = this.instantiationService.createInstance(InputModifierScalarByDelta);
    const negateModifier = this.instantiationService.createInstance(InputModifierNegate);
    const swapAxisModifier = this.instantiationService.createInstance(InputModifierSwizzleAxis, EInputAxisSwizzleOrder.ZYX);

    const moveMappingKeyW = this.defaultMappingContext.mapKey(this.moveAction, 'KeyW');
    const moveMappingKeyS = this.defaultMappingContext.mapKey(this.moveAction, 'KeyS');
    const moveMappingKeyA = this.defaultMappingContext.mapKey(this.moveAction, 'KeyA');
    const moveMappingKeyD = this.defaultMappingContext.mapKey(this.moveAction, 'KeyD');

    moveMappingKeyW.modifiers.push(scalarModifier, deltaModifier, swapAxisModifier, negateModifier);
    moveMappingKeyS.modifiers.push(scalarModifier, deltaModifier, swapAxisModifier);
    moveMappingKeyA.modifiers.push(scalarModifier, deltaModifier, negateModifier);
    moveMappingKeyD.modifiers.push(scalarModifier, deltaModifier);

    this.actorTick.canTick = true;
  }

  public override beginPlay(): void {
    super.beginPlay();

    if (!(this.controller instanceof PlayerController)) {
      this.logger.warn(
        this.constructor.name,
        'Skipping input mapping: PlayerController is not defined'
      );
      return;
    }

    this.controller.playerInput.addMappingContext(this.defaultMappingContext);
  }

  public override tick(context: IEngineLoopTickContext): void {
    super.tick(context);

    const rootComponent = this.rootComponent;

    if (rootComponent) {
      this.camera.position.lerp(pos.set(CAMERA_POS_X + rootComponent.position.x, CAMERA_POS_Y, CAMERA_POS_Z + rootComponent.position.z), 1);
    }
  }

  public move(value: Vector3): void {
    this.rootComponent?.position.addScaledVector(value, 1);
  }

  protected override setupInputComponent(): void {
    if (!this.inputComponent) {
      this.logger.warn(
        this.constructor.name,
        'Skipping input bindings: InputComponent is not defined. Did you forget to call "setupInputComponent"?'
      );
      return;
    }

    this.inputComponent.bindAction(this.moveAction, ETriggerEvent.Triggered, this, this.move);

    this.logger.debug(this.constructor.name, `Setup action bindings`);
  }
}

class MoveAction extends InputAction {}
