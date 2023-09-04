import { EngineLoop } from '../../engine';
import { InstantiationService, ServiceCollection } from '../../platform/di/common';
import { ConsoleLogger, IConsoleLogger } from '../../platform/logging/common';
import { WebSocketNetDriver } from '../../platform/net/browser';
import { INetDriver } from '../../platform/net/common';
import { BrowserRenderer } from '../../platform/renderer/browser';
import { IRenderer } from '../../platform/renderer/common';

export class WindowMain {
  private readonly instantiationService: InstantiationService;

  constructor() {
    const services = new ServiceCollection();
    const consoleLogger = new ConsoleLogger();

    services.set(IConsoleLogger, consoleLogger);
    services.set(IRenderer, new BrowserRenderer());

    this.instantiationService = new InstantiationService(services);
    this.instantiationService.setServiceInstance(
      INetDriver,
      new WebSocketNetDriver(this.instantiationService, consoleLogger)
    );
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
