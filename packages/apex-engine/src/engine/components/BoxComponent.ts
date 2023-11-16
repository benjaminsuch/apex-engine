import { SceneProxy } from '../SceneProxy';
import { CLASS, getTargetId } from '../class';
import { proxy } from '../class/specifiers/proxy';
import { MeshComponent } from './MeshComponent';

export class BoxComponentProxy extends SceneProxy {}

@CLASS(proxy(BoxComponentProxy))
export class BoxComponent extends MeshComponent {
  public makeSpherePositions(segmentsAround: number, segmentsDown: number) {
    this.renderer.send({
      type: 'rpc',
      id: getTargetId(this),
      action: 'makeSpherePositions',
      params: [segmentsAround, segmentsDown]
    });
  }
}
