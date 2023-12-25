import { EngineLoop } from '../../engine/EngineLoop';
import { InstantiationService, ServiceCollection } from '../../platform/di/common';

export class BrowserMain {
  private readonly instantiationService: InstantiationService;

  constructor() {
    const services = new ServiceCollection();

    this.instantiationService = new InstantiationService(services);
  }

  public init() {
    const engineLoop = this.instantiationService.createInstance(EngineLoop);
    engineLoop.init();
  }
}
