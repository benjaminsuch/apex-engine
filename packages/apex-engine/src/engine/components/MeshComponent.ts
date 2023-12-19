import * as THREE from 'three';

import { IInstatiationService } from '../../platform/di/common';
import { IConsoleLogger } from '../../platform/logging/common';
import { IRenderingPlatform } from '../../platform/rendering/common';
import { type BufferGeometry, type BufferGeometryProxy } from '../BufferGeometry';
import { CLASS, PROP } from '../class';
import { proxy } from '../class/specifiers/proxy';
import { ref, serialize } from '../class/specifiers/serialize';
import { SceneComponent, SceneComponentProxy } from './SceneComponent';

export class MeshComponentProxy extends SceneComponentProxy {
  declare geometry: BufferGeometryProxy;

  declare material: THREE.Material;

  public override sceneObject: THREE.Mesh = new THREE.Mesh();
}

@CLASS(proxy(MeshComponentProxy))
export class MeshComponent extends SceneComponent {
  constructor(
    defaults: any,
    geometry: any,
    material: any,
    @IInstatiationService protected override readonly instantiationService: IInstatiationService,
    @IConsoleLogger protected override readonly logger: IConsoleLogger,
    @IRenderingPlatform protected readonly renderer: IRenderingPlatform
  ) {
    super(instantiationService, logger);
  }
}
