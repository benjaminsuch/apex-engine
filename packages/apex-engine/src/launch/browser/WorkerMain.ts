import '../bootstrap';
import '../bootstrap-browser';

import { IInjectibleService } from '../../platform/di/common/InstantiationService';
import { ServiceCollection } from '../../platform/di/common/ServiceCollection';

export class WorkerMain {
  constructor() {
    const services = new ServiceCollection();
  }
}
