import { EngineLoop } from '../../engine/EngineLoop';
import PhysicsWorker from '../../engine/worker/browser/physics?worker';
import RenderWorker from '../../engine/worker/browser/render?worker';
import { InstantiationService } from '../../platform/di/common/InstantiationService';
import { ServiceCollection } from '../../platform/di/common/ServiceCollection';
import { BrowserHttpService } from '../../platform/http/browser/HttpService';
import { IHttpService } from '../../platform/http/common/Http';
import { ConsoleLogger, IConsoleLogger } from '../../platform/logging/common/ConsoleLogger';
import { BrowserWorkerManager } from '../../platform/worker/browser/BrowserWorkerManager';
import { IWorkerManager } from '../../platform/worker/common/WorkerManager';

export class BrowserMain {
  private readonly instantiationService: InstantiationService;

  constructor() {
    const services = new ServiceCollection();
    const logger = new ConsoleLogger();

    services.set(IConsoleLogger, logger);
    services.set(IHttpService, new BrowserHttpService(logger));

    this.instantiationService = new InstantiationService(services);

    const workerManager = this.instantiationService.createInstance(BrowserWorkerManager, new PhysicsWorker(), new RenderWorker());
    this.instantiationService.setServiceInstance(IWorkerManager, workerManager);
  }

  public init(): void {
    const engineLoop = this.instantiationService.createInstance(EngineLoop);

    engineLoop.init().then(() => engineLoop.tick());
  }
}
