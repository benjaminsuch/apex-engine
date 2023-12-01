import * as THREE from 'three';

import { IInstatiationService } from '../../platform/di/common';
import { IConsoleLogger } from '../../platform/logging/common';
import { IRenderer } from '../../platform/renderer/common';
import { CLASS, PROP } from '../class';
import { proxy } from '../class/specifiers/proxy';
import { ref, serialize } from '../class/specifiers/serialize';
import { BoxGeometry } from '../BoxGeometry';
import { SceneComponent, SceneComponentProxy } from './SceneComponent';

export class MeshComponentProxy extends SceneComponentProxy {
  declare geometry: THREE.BufferGeometry;

  declare material: THREE.Material;

  public override sceneObject: THREE.Mesh = new THREE.Mesh();
}

@CLASS(proxy(MeshComponentProxy))
export class MeshComponent extends SceneComponent {
  @PROP(serialize(ref))
  public geometry: BoxGeometry;

  constructor(
    geometry: BoxGeometry,
    @IInstatiationService protected override readonly instantiationService: IInstatiationService,
    @IConsoleLogger protected override readonly logger: IConsoleLogger,
    @IRenderer protected readonly renderer: IRenderer
  ) {
    super(instantiationService, logger);

    this.geometry = geometry;
  }
}
