import { type IGeometryJSON, type IMaterialJSON } from 'three';

import { IInstantiationService } from '../../platform/di/common/InstantiationService';
import { IConsoleLogger } from '../../platform/logging/common/ConsoleLogger';
import { CLASS } from '../core/class/decorators';
import { proxy } from '../core/class/specifiers/proxy';
import { SceneComponent, SceneComponentProxy } from './SceneComponent';

export class MeshComponentProxy extends SceneComponentProxy {}

@CLASS(proxy(MeshComponentProxy))
export class MeshComponent extends SceneComponent {
  constructor(
    public geometry: IGeometryJSON | undefined = undefined,
    public material: IMaterialJSON | undefined = undefined,
    @IInstantiationService protected override readonly instantiationService: IInstantiationService,
    @IConsoleLogger protected override readonly logger: IConsoleLogger
  ) {
    super(instantiationService, logger);
  }
}
