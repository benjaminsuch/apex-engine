import * as THREE from 'three';

import { IInstatiationService } from '../../platform/di/common';
import { IConsoleLogger } from '../../platform/logging/common';
import { IRenderingPlatform } from '../../platform/rendering/common';
import { CLASS } from '../class';
import { proxy } from '../class/specifiers/proxy';
import { SceneComponent, SceneComponentProxy } from './SceneComponent';

export class SkinnedMeshComponentProxy extends SceneComponentProxy {
  public override sceneObject: THREE.SkinnedMesh = new THREE.SkinnedMesh();
}

@CLASS(proxy(SkinnedMeshComponentProxy))
export class SkinnedMeshComponent extends SceneComponent {
  constructor(
    @IInstatiationService protected override readonly instantiationService: IInstatiationService,
    @IConsoleLogger protected override readonly logger: IConsoleLogger,
    @IRenderingPlatform protected readonly renderer: IRenderingPlatform

  ) {
    super(instantiationService, logger);
  }
}
