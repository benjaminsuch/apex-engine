import { Level } from 'apex-engine/src/engine/Level';
import { IInstantiationService } from 'apex-engine/src/platform/di/common/InstantiationService';
import { IConsoleLogger } from 'apex-engine/src/platform/logging/common/ConsoleLogger';

export default class Level_1 extends Level {
  constructor(
    @IInstantiationService protected override readonly instantiationService: IInstantiationService,
    @IConsoleLogger protected override readonly logger: IConsoleLogger
  ) {
    super(instantiationService, logger);
  }
}
