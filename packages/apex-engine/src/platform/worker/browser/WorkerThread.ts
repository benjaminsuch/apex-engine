import { IWorker } from '../common';

export class WorkerThread implements IWorker {
  declare readonly _injectibleService: undefined;

  private readonly internalWorker: Worker;

  constructor(file: string) {
    this.internalWorker = new Worker(file, { type: 'module' });
    console.log('thread worker:', this.internalWorker);
  }
}
