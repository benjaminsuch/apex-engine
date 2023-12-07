import { EngineLoop } from '../../engine';
import RenderMainThread from '../../engine/renderer/render.main';
import RenderWorker from '../../engine/renderer/render.worker?worker';
import { InstantiationService, ServiceCollection } from '../../platform/di/common';
import { ConsoleLogger, IConsoleLogger } from '../../platform/logging/common';
import { WebSocketNetDriver } from '../../platform/net/browser';
import { INetDriver } from '../../platform/net/common';
import { BrowserRenderingPlatform } from '../../platform/rendering/browser';
import { IRenderPlatform } from '../../platform/rendering/common';

export class BrowserMain {
  private readonly instantiationService: InstantiationService;

  constructor() {
    const services = new ServiceCollection();
    const consoleLogger = new ConsoleLogger();
    const renderer = RENDER_ON_MAIN_THREAD ? new RenderMainThread() : new RenderWorker();

    services.set(IConsoleLogger, consoleLogger);

    this.instantiationService = new InstantiationService(services);
    this.instantiationService.setServiceInstance(
      INetDriver,
      new WebSocketNetDriver(this.instantiationService, consoleLogger)
    );
    this.instantiationService.setServiceInstance(
      IRenderPlatform,
      new BrowserRenderingPlatform(renderer, this.instantiationService, consoleLogger)
    );
  }

  public init() {
    //! This will be removed later, as it is just a hotfix.
    //
    //  Web workers can be loaded via file or inline. Loading a file will take roughly
    //  500ms and will result in our web workers not being ready, when the engine loop
    //  is started.
    //
    //  At some point we will load the web workers inline and remove the timeout.
    setTimeout(async () => {
      const engineLoop = this.instantiationService.createInstance(EngineLoop);

      await engineLoop.init();

      if (!engineLoop.isEngineExitRequested()) {
        engineLoop.tick();
      }
    }, 750);
  }
}
