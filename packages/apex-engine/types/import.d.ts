declare module '*?worker' {
  import { type WorkerOptions } from 'node:worker_threads';

  const workerConstructor: {
    new (options?: WorkerOptions): Worker;
  };

  export default workerConstructor;
}

declare module 'build:info' {
  export const plugins: Map<string, { startup?: Function, shutdown?: Function }>;
  export const levels: Record<string, () => Promise<{ default: TClass }>>;
  export function loadLevel(url: string): Promise<{ default: TClass }>;
}
