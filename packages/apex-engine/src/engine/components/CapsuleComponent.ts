import { CapsuleGeometry, type IGeometryJSON } from 'three';

import { IInstantiationService } from '../../platform/di/common/InstantiationService';
import { IConsoleLogger } from '../../platform/logging/common/ConsoleLogger';
import { CLASS } from '../core/class/decorators';
import { proxy } from '../core/class/specifiers/proxy';
import { MeshComponent, MeshComponentProxy } from './MeshComponent';

@CLASS(proxy(MeshComponentProxy))
export class CapsuleComponent extends MeshComponent {
  constructor(
    @IInstantiationService protected override readonly instantiationService: IInstantiationService,
    @IConsoleLogger protected override readonly logger: IConsoleLogger
  ) {
    const geometry = new CapsuleGeometry(1, 3);
    console.log('geometry', geometry);
    super(undefined, undefined, instantiationService, logger);
  }
}
