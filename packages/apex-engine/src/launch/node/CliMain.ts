import { EngineLoop } from '../../engine';
import { InstantiationService, ServiceCollection } from '../../platform/di/common';
import { ConsoleLogger, IConsoleLogger } from '../../platform/logging/common';
import { INetDriver } from '../../platform/net/common';
import { WebSocketNetDriver } from '../../platform/net/node';
import { IRenderer } from '../../platform/renderer/common';
import { NodeRenderer } from '../../platform/renderer/node';

export class CliMain {
  private readonly instantiationService: InstantiationService;

  constructor(args: string[]) {
    const services = new ServiceCollection();
    const consoleLogger = new ConsoleLogger();

    services.set(IConsoleLogger, consoleLogger);
    // Just a temporary fix to avoid `createInstance` to throw type errors.
    // TODO: Fix "createInstance" type and remove the renderer.
    services.set(IRenderer, new NodeRenderer());
    services.set(INetDriver, new WebSocketNetDriver(consoleLogger));

    this.instantiationService = new InstantiationService(services);
  }

  public init() {
    this.instantiationService.createInstance(EngineLoop).init();
  }
}
