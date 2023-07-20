import { EngineLoop } from '../../engine';
import { InstantiationService, ServiceCollection } from '../../platform/di/common';
import { ConsoleLogger, IConsoleLogger } from '../../platform/logging/common';
import { BrowserRenderer } from '../../platform/renderer/browser';
import { IRenderer } from '../../platform/renderer/common';

export class BrowserMain {
  private readonly instantiationService: InstantiationService;

  constructor() {
    const services = new ServiceCollection();

    services.set(IConsoleLogger, new ConsoleLogger());
    services.set(IRenderer, new BrowserRenderer({ runOnMainThread: !!RENDER_ON_MAIN_THREAD }));

    this.instantiationService = new InstantiationService(services);
  }

  public init() {
    //! This will be removed later, as it is just a hotfix.
    //
    //  Web workers can be loaded via file or inline. Loading a file will take roughly
    //  500ms and will result in our web workers not being ready, when the engine loop
    //  is started.
    //
    //  At some point we will load the web workers inline and remove the timeout.
    setTimeout(() => {
      const engineLoop = this.instantiationService.createInstance(EngineLoop);

      engineLoop.init();

      if (!engineLoop.isEngineExitRequested()) {
        engineLoop.tick();
      }
    }, 750);
  }
}
