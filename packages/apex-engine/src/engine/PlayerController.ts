import { IInstatiationService } from '../platform/di/common';
import { IConsoleLogger } from '../platform/logging/common';
import { IRenderer, type TRenderSetCameraMessage } from '../platform/renderer/common';
import { Actor } from './Actor';
import { Pawn } from './Pawn';
import { PlayerInput } from './PlayerInput';
import { CameraComponent, InputComponent } from './components';

export class PlayerController extends Actor {
  protected pawn: Pawn | null = null;

  public getPawn() {
    return this.pawn;
  }

  public setPawn(pawn: PlayerController['pawn']) {
    this.pawn = pawn;

    if (pawn instanceof Pawn) {
      for (const component of pawn.getComponents()) {
        if (component instanceof CameraComponent) {
          this.camera = component;
        }
      }
    }
  }

  protected camera?: CameraComponent;

  public readonly playerInput = new PlayerInput();

  constructor(
    @IInstatiationService protected override readonly instantiationService: IInstatiationService,
    @IConsoleLogger protected override readonly logger: IConsoleLogger,
    @IRenderer public override readonly renderer: IRenderer
  ) {
    super(instantiationService, logger, renderer);

    this.addComponent(InputComponent);
  }

  public override tick(): void {
    //
  }

  public override beginPlay(): void {
    if (this.camera) {
      this.renderer.send<TRenderSetCameraMessage>({
        type: 'set-camera',
        camera: this.camera.toJSON()
      });
    }

    super.beginPlay();
  }

  public possess(pawn: Pawn) {
    if (pawn.controller) {
      pawn.controller.unpossess();
    }

    this.setPawn(pawn);

    pawn.possessBy(this);
    pawn.restart();
  }

  public unpossess() {
    this.pawn?.unpossessed();
    this.setPawn(null);
  }
}
