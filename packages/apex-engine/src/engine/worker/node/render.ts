import { parentPort } from 'worker_threads';

import { WorkerMain } from '../../../launch/node/WorkerMain';
import { TripleBuffer } from '../../core/memory/TripleBuffer';

new WorkerMain<TClass>(class {});

if (parentPort) {
  parentPort.addListener('message', onInit);

  function onInit(event: MessageEvent): void {
    if (typeof event.data !== 'object') {
      return;
    }

    if (event.data.type === 'init') {
      parentPort?.removeListener('message', onInit);
      parentPort?.postMessage({ type: 'init-response', data: new TripleBuffer() });
    }
  }
}
