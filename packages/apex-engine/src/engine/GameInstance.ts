import { IInstantiationService } from '../platform/di/common/InstantiationService';
import { IConsoleLogger } from '../platform/logging/common/ConsoleLogger';
import { type ApexEngine } from './ApexEngine';
import { GameMode } from './GameMode';
import { GameProxyManager } from './GameProxyManager';
import { HUD } from './HUD';
import { Player } from './Player';
import { IRenderWorkerContext } from './renderer/RenderWorkerContext';
import { World } from './World';

export class GameInstance {
  private world?: World;

  public getWorld(): World {
    if (!this.world) {
      throw new Error(`No world set.`);
    }
    return this.world;
  }

  private proxyManager?: GameProxyManager;

  public getProxyManager(): GameProxyManager {
    if (!this.proxyManager) {
      throw new Error(`No instance of ProxyManager available.`);
    }
    return this.proxyManager;
  }

  private player?: Player;

  public getPlayer(): Player {
    if (!this.player) {
      throw new Error(`No player set.`);
    }
    return this.player;
  }

  public HUD: HUD | null = null;

  public getHUD(): HUD {
    if (!this.HUD) {
      throw new Error(`No HUD set.`);
    }
    return this.HUD;
  }

  constructor(
    private readonly engine: ApexEngine,
    @IInstantiationService protected readonly instantiationService: IInstantiationService,
    @IConsoleLogger protected readonly logger: IConsoleLogger,
    @IRenderWorkerContext protected readonly renderWorker: IRenderWorkerContext
  ) {}

  public init(): void {
    this.logger.debug(this.constructor.name, 'Initialize');

    this.proxyManager = this.instantiationService.createInstance(GameProxyManager);

    this.world = this.instantiationService.createInstance(World);
    this.world.init(this);
  }

  public async start(): Promise<void> {
    this.logger.info(this.constructor.name, `Start`);

    await this.engine.loadMap(DEFAULT_MAP);
    await this.renderWorker.start();
    await this.getWorld().beginPlay();
  }

  public setupHUD(): void {
    if (this.HUD) {
      this.logger.warn(`HUD already set up.`);
      return;
    }

    this.HUD = this.getWorld().spawnActor(HUD);
    this.HUD.init();
  }

  public createPlayer(withPlayerController: boolean = false): void {
    if (this.player) {
      throw new Error(`A player already exists.`);
    }

    this.logger.debug(this.constructor.name, 'Creating player');
    this.player = this.instantiationService.createInstance(Player);

    if (withPlayerController) {
      this.player.spawnPlayActor(this.world!);
    }
  }

  public async createGameModeFromURL(url: URL): Promise<GameMode> {
    return this.getWorld().spawnActor(GameMode.DefaultGameModeClass);
  }
}
