import { WorkerMain } from '../../../launch/browser/WorkerMain';
import { PhysicsWorker } from '../../physics/PhysicsWorker';

const main = new WorkerMain<PhysicsWorker>(PhysicsWorker);

self.addEventListener('message', onInit);

async function onInit(event: MessageEvent): Promise<void> {
  if (typeof event.data !== 'object') {
    return;
  }

  if (event.data.type === 'init') {
    self.removeEventListener('message', onInit);
    await main.worker.init(event.data);
    self.postMessage({ type: 'init-response', tb: main.worker.info.tripleBuffer });
  }
}
