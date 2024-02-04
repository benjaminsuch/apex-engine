import { type IInjectibleService, InstantiationService } from '../../di/common/InstantiationService';
import { IConsoleLogger } from '../../logging/common/ConsoleLogger';

export interface IWorkerManager extends IInjectibleService {
  readonly physicsWorker: Worker;
  readonly renderWorker: Worker;
  register(id: string, worker: Worker): void;
}

export const IWorkerManager = InstantiationService.createDecorator<IWorkerManager>('WorkerManager');

export abstract class WorkerManager implements IWorkerManager {
  declare readonly _injectibleService: undefined;

  private readonly registeredWorkers: Map<string, Worker> = new Map();

  private readonly protectedIds: Set<string> = new Set();

  constructor(
    public readonly physicsWorker: Worker,
    public readonly renderWorker: Worker,
    @IConsoleLogger protected readonly logger: IConsoleLogger
  ) {
    this.register('PhysicsWorker', physicsWorker, true);
    this.register('RenderWorker', renderWorker, true);
  }

  public register(id: string, worker: Worker, isProtected: boolean = false): void {
    if (this.protectedIds.has(id)) {
      this.logger.warn(this.constructor.name, `Unable to register worker: "${id}" is a protected id.`);
      return;
    }

    if (isProtected) {
      this.protectedIds.add(id);
    }

    this.registeredWorkers.set(id, worker);
  }

  public getWorker(id: string): Worker | undefined {
    return this.registeredWorkers.get(id);
  }
}
