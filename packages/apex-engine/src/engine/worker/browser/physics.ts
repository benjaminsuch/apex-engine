import { WorkerMain } from '../../../launch/browser/WorkerMain';
import { PhysicsWorker } from '../../physics/PhysicsWorker';

const main = new WorkerMain<PhysicsWorker>(PhysicsWorker);

self.addEventListener('message', onInit);

function onInit(event: MessageEvent): void {
  if (typeof event.data !== 'object') {
    return;
  }

  if (event.data.type === 'init') {
    self.removeEventListener('message', onInit);
    main.worker.init(event.data);
  }
}
