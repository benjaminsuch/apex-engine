import * as THREE from 'three';

import { IInstatiationService } from '../../platform/di/common';
import { IConsoleLogger } from '../../platform/logging/common';
import { IRenderer } from '../../platform/renderer/common';
import { SceneProxy } from '../SceneProxy';
import { SceneComponent } from './SceneComponent';
import { CLASS } from '../class';
import { proxy } from '../class/specifiers/proxy';

export class MeshComponentProxy extends SceneProxy {
  declare geometry: THREE.BufferGeometry;

  declare material: THREE.Material;

  public mesh: THREE.Mesh = new THREE.Mesh();

  public positions: Float32Array = new Float32Array();

  public normals: Float32Array = new Float32Array();
}

@CLASS(proxy(MeshComponentProxy))
export class MeshComponent extends SceneComponent {
  constructor(
    @IInstatiationService protected override readonly instantiationService: IInstatiationService,
    @IConsoleLogger protected override readonly logger: IConsoleLogger,
    @IRenderer protected readonly renderer: IRenderer
  ) {
    super(instantiationService, logger);
  }
}
