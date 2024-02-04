import { type Worker as NodeWorker } from 'node:worker_threads';

import nodeEndpoint from 'comlink/dist/esm/node-adapter';

import { IConsoleLogger } from '../../logging/common/ConsoleLogger';
import { WorkerManager } from '../common/WorkerManager';

export class NodeWorkerManager extends WorkerManager {
  constructor(
    public override readonly physicsWorker: Worker,
    public override readonly renderWorker: Worker,
    @IConsoleLogger protected override readonly logger: IConsoleLogger
  ) {
    super(physicsWorker, renderWorker, logger);

    // @todo: Fix types
    this.physicsWorker = nodeEndpoint(physicsWorker as unknown as NodeWorker) as Worker;
    this.renderWorker = nodeEndpoint(renderWorker as unknown as NodeWorker) as Worker;
  }
}
