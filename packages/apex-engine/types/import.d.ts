declare module '*?worker' {
  import { WorkerOptions } from 'node:worker_threads';

  const workerConstructor: {
    new (options?: WorkerOptions): Worker;
  };

  export default workerConstructor;
}
