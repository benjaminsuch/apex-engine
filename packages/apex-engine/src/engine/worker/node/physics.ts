import { parentPort } from 'worker_threads';

import { WorkerMain } from '../../../launch/node/WorkerMain';
import { PhysicsWorker } from '../../physics/PhysicsWorker';

const main = new WorkerMain<PhysicsWorker>(PhysicsWorker);

if (parentPort) {
  parentPort.addListener('message', onInit);

  async function onInit(data: any): Promise<void> {
    if (typeof data !== 'object') {
      return;
    }

    if (data.type === 'init') {
      parentPort?.removeListener('message', onInit);
      await main.worker.init(data);
      parentPort?.postMessage({ type: 'init-response', tb: main.worker.info.tripleBuffer });
    }
  }
}
