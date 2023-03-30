import { EngineLoop } from '../../engine';
import { InstantiationService, ServiceCollection } from '../../platform/di/common';
import { ConsoleLogger, IConsoleLogger } from '../../platform/logging/common';
import { Renderer } from '../../platform/renderer/browser';
import { IRenderer } from '../../platform/renderer/common';

export class WindowMain {
  private readonly instantiationService: InstantiationService;

  constructor() {
    const services = new ServiceCollection();

    services.set(IConsoleLogger, new ConsoleLogger());
    services.set(IRenderer, new Renderer());

    this.instantiationService = new InstantiationService(services);
  }

  public init() {
    setTimeout(() => {
      const engineLoop = this.instantiationService.createInstance(EngineLoop);

      engineLoop.init();

      if (!engineLoop.isEngineExitRequested()) {
        engineLoop.tick();
      }
    }, 750);
  }
}
