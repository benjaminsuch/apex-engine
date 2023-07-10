import { Actor } from 'apex-engine/src/engine';
import { CameraComponent } from 'apex-engine/src/engine';
import { type TRenderSetCameraMessage } from 'apex-engine/src/platform/renderer/common';

import { Pawn } from './Pawn.js';

export class PlayerController extends Actor {
  private pawn?: Pawn;

  private camera?: CameraComponent;

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

  public override beginPlay(): void {
    if (this.camera) {
      this.camera.position.z = 5;
      this.renderer.send<TRenderSetCameraMessage>({
        type: 'set-camera',
        camera: this.camera.toJSON()
      });
    }

    super.beginPlay();
  }
}
