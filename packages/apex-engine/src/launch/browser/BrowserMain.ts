import { EngineLoop } from '../../engine';
import { WorkerThread } from '../../platform/core/worker/browser';
import { InstantiationService, ServiceCollection } from '../../platform/di/common';
import { ConsoleLogger, IConsoleLogger } from '../../platform/logging/common';
import { Renderer } from '../../platform/renderer/browser';

export class BrowserMain {
  private readonly instantiationService: InstantiationService;

  constructor() {
    const services = new ServiceCollection();

    services.set(IConsoleLogger, new ConsoleLogger());

    this.instantiationService = new InstantiationService(services);
  }

  public init() {
    const engineLoop = this.instantiationService.createInstance(
      EngineLoop,
      this.instantiationService,
      this.instantiationService.createInstance(WorkerThread, '../../platform/engine/game/browser'),
      this.instantiationService.createInstance(
        WorkerThread,
        '../../platform/engine/rendering/browser'
      ),
      this.instantiationService.createInstance(Renderer)
    );

    engineLoop.init();

    if (!engineLoop.isEngineExitRequested()) {
      engineLoop.tick();
    }
  }
}
