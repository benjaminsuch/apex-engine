import { EngineLoop } from '../../engine';
import { InstantiationService, ServiceCollection } from '../../platform/di/common';
import { ConsoleLogger, IConsoleLogger } from '../../platform/logging/common';
import { IRenderer } from '../../platform/renderer/common';
import { NodeRenderer } from '../../platform/renderer/node';

const port = 8080;

export class CliMain {
  private readonly instantiationService: InstantiationService;

  constructor(args: string[]) {
    const services = new ServiceCollection();

    services.set(IConsoleLogger, new ConsoleLogger());
    // Just a temporary fix to avoid `createInstance` to throw type errors.
    // TODO: Fix "createInstance" type and remove the renderer.
    services.set(IRenderer, new NodeRenderer());

    this.instantiationService = new InstantiationService(services);
  }

  public init() {
    this.instantiationService.createInstance(EngineLoop).init();
  }
}
