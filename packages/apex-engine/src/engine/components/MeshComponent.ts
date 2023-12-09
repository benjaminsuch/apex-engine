import * as THREE from 'three';

import { IInstatiationService } from '../../platform/di/common';
import { IConsoleLogger } from '../../platform/logging/common';
import { type TripleBuffer } from '../../platform/memory/common';
import { IRenderingPlatform } from '../../platform/rendering/common';
import { CLASS, PROP } from '../class';
import { proxy } from '../class/specifiers/proxy';
import { ref, serialize } from '../class/specifiers/serialize';
import { type Renderer } from '../renderer';
import { type BoxGeometry, type BoxGeometryProxy } from '../BoxGeometry';
import { SceneComponent, SceneComponentProxy } from './SceneComponent';

export class MeshComponentProxy extends SceneComponentProxy {
  declare geometry: BoxGeometryProxy;

  declare material: THREE.Material;

  public override sceneObject: THREE.Mesh = new THREE.Mesh();

  constructor(
    args: number[],
    tb: TripleBuffer,
    public override readonly id: number,
    protected override readonly messagePort: MessagePort | null = null,
    protected override readonly renderer: Renderer
  ) {
    super(args, tb, id, messagePort, renderer);

    //todo: BoxGeometry -> BufferGeometry
    //this.sceneObject = new THREE.Mesh(new THREE.BoxGeometry(args[0], args[1], args[2]));
  }
}

@CLASS(proxy(MeshComponentProxy))
export class MeshComponent extends SceneComponent {
  @PROP(serialize(ref))
  public geometry: BoxGeometry;

  constructor(
    geometry: BoxGeometry,
    @IInstatiationService protected override readonly instantiationService: IInstatiationService,
    @IConsoleLogger protected override readonly logger: IConsoleLogger,
    @IRenderingPlatform protected readonly renderer: IRenderingPlatform
  ) {
    super(instantiationService, logger);

    this.geometry = geometry;
  }
}
