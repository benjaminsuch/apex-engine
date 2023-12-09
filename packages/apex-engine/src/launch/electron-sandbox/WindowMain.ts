import { EngineLoop } from '../../engine';
import RenderMainThread from '../../engine/renderer/render.main';
import RenderWorker from '../../engine/renderer/render.worker?worker';
import { InstantiationService, ServiceCollection } from '../../platform/di/common';
import { ConsoleLogger, IConsoleLogger } from '../../platform/logging/common';
import { WebSocketNetDriver } from '../../platform/net/browser';
import { INetDriver } from '../../platform/net/common';
import { BrowserRenderingPlatform } from '../../platform/rendering/browser';
import { IRenderingPlatform } from '../../platform/rendering/common';

export class WindowMain {
  private readonly instantiationService: InstantiationService;

  constructor() {
    const services = new ServiceCollection();
    const consoleLogger = new ConsoleLogger();
    const renderer = RENDER_ON_MAIN_THREAD ? new RenderMainThread() : new RenderWorker();

    services.set(IConsoleLogger, consoleLogger);
    services.set(IRenderingPlatform, new BrowserRenderingPlatform(renderer));

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
