import { IInstatiationService } from '../platform/di/common';
import { IConsoleLogger } from '../platform/logging/common';
import { IRenderingPlatform } from '../platform/rendering/common';
import { Actor } from './Actor';
import { InputComponent } from './components';
import { type IEngineLoopTickContext } from './EngineLoop';
import { type Pawn } from './Pawn';
import { PlayerInput } from './PlayerInput';

export class PlayerController extends Actor {
  protected pawn: Pawn | null = null;

  public getPawn() {
    if (!this.pawn) {
      throw new Error(`Pawn not set.`);
    }
    return this.pawn;
  }

  public setPawn(pawn: PlayerController['pawn']) {
    this.pawn = pawn;

    if (pawn) {
      // const cameraComponent = pawn.getComponent(CameraComponent);
      // if (cameraComponent) {
      // this.camera = cameraComponent;
      // }
    }
  }

  protected camera?: any;

  public readonly playerInput = new PlayerInput();

  constructor(
    @IInstatiationService protected override readonly instantiationService: IInstatiationService,
    @IConsoleLogger protected override readonly logger: IConsoleLogger,
    @IRenderingPlatform public override readonly renderer: IRenderingPlatform
  ) {
    super(instantiationService, logger, renderer);

    this.addComponent(InputComponent);
  }

  public override tick(tick: IEngineLoopTickContext): void {
    this.playerInput.processInputStack(this.buildInputStack(), tick.delta);
    super.tick(tick);
  }

  public override beginPlay(): void {
    if (this.camera) {
      /* this.renderer.send<TRenderSetCameraMessage>({
        type: 'set-camera',
        camera: this.camera.toJSON()
      }); */
    }

    super.beginPlay();
  }

  public possess(pawn: Pawn) {
    this.pawn?.controller?.unpossess();

    this.logger.debug(this.constructor.name, 'Possess new pawn:', pawn.constructor.name);
    this.setPawn(pawn);

    pawn.possessBy(this);
    pawn.restart();
  }

  public unpossess() {
    this.logger.debug(this.constructor.name, 'Unpossess old pawn:', this.pawn?.constructor.name);
    this.pawn?.unpossessed();
    this.setPawn(null);
  }

  private buildInputStack() {
    const stack: InputComponent[] = [];

    for (const actor of this.getWorld().actors) {
      const component = actor.getComponent(InputComponent);

      if (component) {
        stack.push(component);
      }
    }

    return stack;
  }
}
