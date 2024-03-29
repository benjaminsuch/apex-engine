import { parentPort } from 'worker_threads';

import { WorkerMain } from '../../../launch/node/WorkerMain';
import { RenderWorker } from '../../renderer/RenderWorker';

const main = new WorkerMain<RenderWorker>(RenderWorker);

if (parentPort) {
  parentPort.addListener('message', onInit);

  function onInit(data: Record<string, any>): void {
    if (typeof data !== 'object') {
      return;
    }

    if (data.type === 'init') {
      parentPort?.removeListener('message', onInit);
      main.worker.init(data as any);
      parentPort?.postMessage({ type: 'init-response' });
    }
  }
}
