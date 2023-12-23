declare module '*?worker' {
  import { type WorkerOptions } from 'node:worker_threads';

  const workerConstructor: {
    new (options?: WorkerOptions): Worker;
  };

  export default workerConstructor;
}
