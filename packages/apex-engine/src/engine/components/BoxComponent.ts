import * as THREE from 'three';

import { IInstatiationService } from '../../platform/di/common';
import { IConsoleLogger } from '../../platform/logging/common';
import { type TripleBuffer } from '../../platform/memory/common';
import { IRenderingPlatform } from '../../platform/rendering/common';
import { BoxGeometry } from '../BoxGeometry';
import { CLASS } from '../class';
import { proxy } from '../class/specifiers/proxy';
import { type Renderer } from '../renderer';
import { MeshComponent, MeshComponentProxy } from './MeshComponent';

export class BoxComponentProxy extends MeshComponentProxy {
  constructor(
    args: [number, number, number, number, number, number],
    tb: TripleBuffer,
    public override readonly id: number,
    protected override readonly messagePort: MessagePort | null = null,
    protected override readonly renderer: Renderer
  ) {
    super(args, tb, id, messagePort, renderer);

    this.sceneObject = new THREE.Mesh(
      // new THREE.BoxGeometry(args[0], args[1], args[2], args[3], args[4], args[5])
    );
  }
}

@CLASS(proxy(BoxComponentProxy))
export class BoxComponent extends MeshComponent {
  // constructor(
  //   width: number = 1,
  //   height: number = 1,
  //   depth: number = 1,
  //   @IInstatiationService protected override readonly instantiationService: IInstatiationService,
  //   @IConsoleLogger protected override readonly logger: IConsoleLogger,
  //   @IRenderingPlatform protected override readonly renderer: IRenderingPlatform
  // ) {
  //   super(
  //     instantiationService.createInstance(BoxGeometry, width, height, depth),
  //     instantiationService,
  //     logger,
  //     renderer
  //   );
  // }
}
