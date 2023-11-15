import * as THREE from 'three';

import { IInstatiationService } from '../../platform/di/common';
import { IConsoleLogger } from '../../platform/logging/common';
import { IRenderer } from '../../platform/renderer/common';
import { SceneComponent } from './SceneComponent';

const m1 = new THREE.Mesh();

export class MeshComponent extends SceneComponent {
  constructor(
    @IInstatiationService protected override readonly instantiationService: IInstatiationService,
    @IConsoleLogger protected override readonly logger: IConsoleLogger,
    @IRenderer protected readonly renderer: IRenderer
  ) {
    super(instantiationService, logger);
  }
}
