import { IInstantiationService } from '../platform/di/common/InstantiationService';
import { IConsoleLogger } from '../platform/logging/common/ConsoleLogger';
import { IAssetWorkerContext } from './assets/AssetWorkerContext';
import { TripleBuffer } from './core/memory/TripleBuffer';
import { type IEngineLoopTickContext } from './EngineLoop';
import { Flags } from './Flags';
import { GameInstance } from './GameInstance';
import { Level } from './Level';

export class ApexEngine {
  private static instance?: ApexEngine;

  public static getInstance(): ApexEngine {
    if (!this.instance) {
      throw new Error(`No instance of ApexEngine available.`);
    }
    return this.instance;
  }

  private gameInstance?: GameInstance;

  public getGameInstance(): GameInstance {
    if (!this.gameInstance) {
      throw new Error(`Cannot access GameInstance before the Engine has been initialized.`);
    }
    return this.gameInstance;
  }

  public isInitialized: boolean = false;

  constructor(
    @IConsoleLogger protected readonly logger: IConsoleLogger,
    @IInstantiationService protected readonly instantiationService: IInstantiationService,
    @IAssetWorkerContext protected readonly assetWorker: IAssetWorkerContext
  ) {
    if (ApexEngine.instance) {
      throw new Error(`An instance of the ApexEngine already exists.`);
    }

    ApexEngine.instance = this;
  }

  public init(): void {
    this.gameInstance = this.instantiationService.createInstance(GameInstance, this);
    this.gameInstance.init();

    this.isInitialized = true;
  }

  public tick(tick: IEngineLoopTickContext): void {
    TripleBuffer.swapReadBufferFlags(Flags.RENDER_FLAGS);

    this.getGameInstance().getWorld().tick(tick);

    TripleBuffer.swapWriteBufferFlags(Flags.GAME_FLAGS);
  }

  public async start(): Promise<void> {
    await this.getGameInstance().start();
  }

  public async loadMap(url: string): Promise<void> {
    // todo: Dispose previous level
    try {
      this.logger.info('Attempting to load map:', url);

      const world = this.getGameInstance().getWorld();

      if (!world.isInitialized) {
        throw new Error(`Cannot load map: World is not initialized.`);
      }

      const content = await this.assetWorker.loadGLTF(url);
      const level = this.instantiationService.createInstance(Level);

      world.setCurrentLevel(level);
      level.load(content);

      this.logger.info('Map content loaded');
    } catch (error) {
      console.error(error);
    }
  }
}
