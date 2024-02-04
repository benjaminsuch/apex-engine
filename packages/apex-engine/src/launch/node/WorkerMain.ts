import '../bootstrap';
import '../bootstrap-node';

import * as Comlink from 'comlink';
import nodeEndpoint, { type NodeEndpoint } from 'comlink/dist/esm/node-adapter';
import { parentPort } from 'worker_threads';

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

    Comlink.expose(this.worker, nodeEndpoint(parentPort as NodeEndpoint));
  }
}
