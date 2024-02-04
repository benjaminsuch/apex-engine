import '../bootstrap';
import '../bootstrap-browser';

import * as Comlink from 'comlink';

import { InstantiationService } from '../../platform/di/common/InstantiationService';
import { ServiceCollection } from '../../platform/di/common/ServiceCollection';
import { ConsoleLogger, IConsoleLogger } from '../../platform/logging/common/ConsoleLogger';

export class WorkerMain<T> {
  public readonly worker: T;

  constructor(WorkerConstructor: TClass) {
    const services = new ServiceCollection();
    services.set(IConsoleLogger, new ConsoleLogger());

    const instantiationService = new InstantiationService(services);
    this.worker = instantiationService.createInstance(WorkerConstructor);

    Comlink.expose(this.worker);
  }
}
