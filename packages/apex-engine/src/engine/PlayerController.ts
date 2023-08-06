import { type TRenderSetCameraMessage } from '../platform/renderer/common';
import { CameraComponent } from './components';
import { Actor } from './Actor';
import { Pawn } from './Pawn';

export class PlayerController extends Actor {
  protected pawn?: Pawn;

  public getPawn() {
    return this.pawn;
  }

  public setPawn(pawn: Pawn) {
    this.pawn = pawn;

    for (const component of pawn.getComponents()) {
      if (component instanceof CameraComponent) {
        this.camera = component;
      }
    }
  }

  protected camera?: CameraComponent;

  public override beginPlay(): void {
    if (this.camera) {
      this.renderer.send<TRenderSetCameraMessage>({
        type: 'set-camera',
        camera: this.camera.toJSON()
      });
    }

    super.beginPlay();
  }
}
