import { EngineLoop } from '../../engine';
import { InstantiationService, ServiceCollection } from '../../platform/di/common';
import { ConsoleLogger, IConsoleLogger } from '../../platform/logging/common';

const port = 8080;

export class CliMain {
  private readonly instantiationService: InstantiationService;

  constructor(args: string[]) {
    const services = new ServiceCollection();

    services.set(IConsoleLogger, new ConsoleLogger());

    this.instantiationService = new InstantiationService(services);
  }

  public init() {
    this.instantiationService.createInstance(EngineLoop).init();
  }
}
