import {
  PlayerController as BasePlayerController,
  type TRenderSetCameraMessage
} from 'apex-engine';

export class PlayerController extends BasePlayerController {
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
