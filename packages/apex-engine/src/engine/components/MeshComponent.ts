import * as THREE from 'three';
import { IInstatiationService } from '../../platform/di/common';
import { IConsoleLogger } from '../../platform/logging/common';
import { IRenderer } from '../../platform/renderer/common';
import { CLASS } from '../class';
import { proxy } from '../class/specifiers/proxy';
import { SceneProxy } from '../SceneProxy';
import { SceneComponent } from './SceneComponent';

class MeshProxy extends SceneProxy {}

const m1 = new THREE.Mesh();

@CLASS(proxy(MeshProxy))
export class MeshComponent extends SceneComponent {
  constructor(
    @IInstatiationService protected override readonly instantiationService: IInstatiationService,
    @IConsoleLogger protected override readonly logger: IConsoleLogger,
    @IRenderer protected readonly renderer: IRenderer
  ) {
    super(instantiationService, logger);
  }
}
