import { IInstantiationService } from '../platform/di/common/InstantiationService';
import { IConsoleLogger } from '../platform/logging/common/ConsoleLogger';
import { type ApexEngine } from './ApexEngine';
import { IRenderWorkerContext } from './renderer/RenderWorkerContext';
import { World } from './World';

export class GameInstance {
  private world: World | null = null;

  public getWorld(): World {
    if (!this.world) {
      throw new Error(`No world set.`);
    }
    return this.world;
  }

  constructor(
    private readonly engine: ApexEngine,
    @IInstantiationService protected readonly instantiationService: IInstantiationService,
    @IConsoleLogger protected readonly logger: IConsoleLogger,
    @IRenderWorkerContext protected readonly renderWorker: IRenderWorkerContext
  ) {}

  public init(): void {
    this.logger.debug(this.constructor.name, 'Initialize');

    this.world = this.instantiationService.createInstance(World);
    this.world.init(this);
  }

  public start(): void {
    this.engine.loadMap(DEFAULT_MAP).then(() => {
      this.renderWorker.start();
      this.getWorld().beginPlay();
    });
  }
}
