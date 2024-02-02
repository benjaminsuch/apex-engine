import { EngineLoop } from '../../engine/EngineLoop';
import { InstantiationService } from '../../platform/di/common/InstantiationService';
import { ServiceCollection } from '../../platform/di/common/ServiceCollection';
import { ConsoleLogger, IConsoleLogger } from '../../platform/logging/common/ConsoleLogger';

export class WindowMain {
  private readonly instantiationService: InstantiationService;

  constructor() {
    const services = new ServiceCollection();

    services.set(IConsoleLogger, new ConsoleLogger());

    this.instantiationService = new InstantiationService(services);
  }

  public init(): void {
    const engineLoop = this.instantiationService.createInstance(EngineLoop);

    engineLoop.init().then(() => engineLoop.tick());
  }
}
