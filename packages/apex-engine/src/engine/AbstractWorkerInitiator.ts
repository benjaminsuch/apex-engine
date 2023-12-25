export abstract class AbstractWorkerInitiator {
  private readonly isReady: Promise<void>;

  constructor(protected readonly worker: Worker) {
    this.isReady = new Promise<void>((resolve, reject) => {
      this.worker.addEventListener('message', () => resolve(), { once: true });
    });
  }

  protected async workerReady() {
    return this.isReady;
  }
}
