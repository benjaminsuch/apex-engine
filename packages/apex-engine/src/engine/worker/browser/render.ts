import { WorkerMain } from '../../../launch/browser/WorkerMain';
import { RenderWorker } from '../../renderer/RenderWorker';

const main = new WorkerMain<RenderWorker>(RenderWorker);

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
