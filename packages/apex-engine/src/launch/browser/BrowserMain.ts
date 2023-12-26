import { EngineLoop } from '../../engine/EngineLoop';
import { InstantiationService } from '../../platform/di/common/InstantiationService';
import { ServiceCollection } from '../../platform/di/common/ServiceCollection';

export class BrowserMain {
  private readonly instantiationService: InstantiationService;

  constructor() {
    const services = new ServiceCollection();

    this.instantiationService = new InstantiationService(services);
  }

  public init(): void {
    const engineLoop = this.instantiationService.createInstance(EngineLoop);

    engineLoop.init().then(() => {
      engineLoop.tick();
    });
  }
}
