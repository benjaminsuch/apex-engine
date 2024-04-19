import { Character } from 'apex-engine/src/engine/Character';
import { type IEngineLoopTickContext } from 'apex-engine/src/engine/EngineLoop';
import { type DebugMessage, HUD } from 'apex-engine/src/engine/HUD';
import { InputAction } from 'apex-engine/src/engine/input/InputAction';
import { InputMappingContext } from 'apex-engine/src/engine/input/InputMappingContext';
import { EInputAxisSwizzleOrder, InputModifierNegate, InputModifierScalar, InputModifierScalarByDelta, InputModifierSwizzleAxis } from 'apex-engine/src/engine/input/InputModifiers';
import { ETriggerEvent } from 'apex-engine/src/engine/input/InputTriggers';
import { PlayerController } from 'apex-engine/src/engine/PlayerController';
import { CameraComponent } from 'apex-engine/src/engine/renderer/CameraComponent';
import { Vector3 } from 'apex-engine/src/engine/three';
import { IInstantiationService } from 'apex-engine/src/platform/di/common/InstantiationService';
import { IConsoleLogger } from 'apex-engine/src/platform/logging/common/ConsoleLogger';

const CAMERA_POS_X = 0;
const CAMERA_POS_Y = 35;
const CAMERA_POS_Z = 25;

export default class TopDownCharacter extends Character {
  private readonly camera: CameraComponent;

  private readonly moveAction: MoveAction;

  private readonly inputDebugMessage?: DebugMessage;

  public readonly movement: Vector3 = new Vector3(0, -0.2, 0);

  public defaultMappingContext: InputMappingContext;

  constructor(@IInstantiationService instantiationService: IInstantiationService, @IConsoleLogger logger: IConsoleLogger) {
    super(instantiationService, logger);

    this.camera = this.addComponent(CameraComponent, 50, window.innerWidth / window.innerHeight, 0.1, 2000);

    const rootComponent = this.rootComponent;

    if (rootComponent) {
      rootComponent.position.z = 5;

      this.camera.attachToComponent(rootComponent);
      this.camera.position.set(CAMERA_POS_X, CAMERA_POS_Y, CAMERA_POS_Z);
      this.camera.matrixWorld.lookAt(this.camera.position, rootComponent.position, this.camera.up);
      this.camera.rotation.setFromRotationMatrix(this.camera.matrixWorld);
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

    try {
      this.inputDebugMessage = HUD.getInstance().createDebugMessage();
      this.inputDebugMessage.value = 'my input debug message';
    } catch {}
  }

  public override async beginPlay(): Promise<void> {
    await super.beginPlay();

    if (!(this.controller instanceof PlayerController)) {
      this.logger.warn(this.constructor.name, 'Skipping input mapping: PlayerController is not defined');
      return;
    }

    this.controller.playerInput.addMappingContext(this.defaultMappingContext);
  }

  public override tick(context: IEngineLoopTickContext): void {
    const collider = this.capsuleComponent.collider;
    const kinematicController = this.controller?.kinematicController;

    if (kinematicController && collider) {
      this.capsuleComponent.rigidBody?.kinematicTranslate(kinematicController, collider, this.movement);
    }
  }

  public move(value: Vector3): void {
    this.movement.add(value.setY(-0.2));
    if (this.inputDebugMessage) {
      this.inputDebugMessage.value = `Move (value=${value.toArray().join(',')}, moveAction=${this.moveAction.value.toArray().join(',')})`;
    }
  }

  public override updateComponentBody(): void {
    super.updateComponentBody();

    this.movement.set(0, -0.2, 0);
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
