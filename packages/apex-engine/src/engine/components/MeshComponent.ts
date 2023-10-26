import * as THREE from 'three';

import { IInstatiationService } from '../../platform/di/common';
import { IConsoleLogger } from '../../platform/logging/common';
import { IRenderer } from '../../platform/renderer/common';
import { PROP } from '../class';
import { ref, serialize } from '../class/specifiers/serialize';
import { SceneProxy } from '../SceneProxy';
import { SceneComponent } from './SceneComponent';
import { BufferGeometry } from '../BufferGeometry';

export class MeshProxy extends SceneProxy {}

const m1 = new THREE.Mesh();

export class MeshComponent extends SceneComponent {
  @PROP(serialize(ref))
  public geometry: BufferGeometry = new BufferGeometry();

  constructor(
    @IInstatiationService protected override readonly instantiationService: IInstatiationService,
    @IConsoleLogger protected override readonly logger: IConsoleLogger,
    @IRenderer protected readonly renderer: IRenderer
  ) {
    super(instantiationService, logger);
  }
}
