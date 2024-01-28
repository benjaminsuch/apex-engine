import { loadLevel } from 'build:info';

import { IInstantiationService } from '../platform/di/common/InstantiationService';
import { IConsoleLogger } from '../platform/logging/common/ConsoleLogger';
import { TripleBuffer } from './core/memory/TripleBuffer';
import { type IEngineLoopTickContext } from './EngineLoop';
import { Flags } from './Flags';
import { GameInstance } from './GameInstance';
import { type Level } from './Level';
import { GLTFLoader } from './three/GLTFLoader';

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
  ) {
    if (ApexEngine.instance) {
      throw new Error(`An instance of the ApexEngine already exists1.`);
    }

    ApexEngine.instance = this;
  }

  public init(): void {
    this.gameInstance = this.instantiationService.createInstance(GameInstance, this);
    this.gameInstance.init();

    if (IS_BROWSER) {
      this.gameInstance.createPlayer();
    }

    this.isInitialized = true;
  }

  public async tick(tick: IEngineLoopTickContext): Promise<void> {
    TripleBuffer.swapReadBufferFlags(Flags.RENDER_FLAGS);
    TripleBuffer.swapReadBufferFlags(Flags.PHYSICS_FLAGS);

    await this.getGameInstance().getWorld().tick(tick);

    TripleBuffer.swapWriteBufferFlags(Flags.PHYSICS_FLAGS);
    TripleBuffer.swapWriteBufferFlags(Flags.GAME_FLAGS);
  }

  public async start(): Promise<void> {
    await this.getGameInstance().start();
  }

  /**
   * Loads the level and creates the game mode from the given `url`. When successful
   * the level and all actors will be initialized for play and a play actor will be
   * spawned.
   *
   * @param url
   */
  public async loadMap(url: string): Promise<void> {
    // todo: Dispose previous level
    try {
      this.logger.info('Attempting to load map:', url);

      const gameInstance = this.getGameInstance();
      const world = gameInstance.getWorld();

      if (!world.isInitialized) {
        throw new Error(`Cannot load map: World is not initialized.`);
      }

      const loader = this.instantiationService.createInstance(GLTFLoader);
      const content = await loader.load(`game/maps/${url}`);
      const { default: LoadedLevel }: { default: typeof Level } = await loadLevel(url);
      const level = this.instantiationService.createInstance(LoadedLevel);

      world.setCurrentLevel(level);
      level.load(content);

      await world.setGameMode(url);

      level.init();
      world.initActorsForPlay();

      if (IS_BROWSER) {
        gameInstance.getPlayer().spawnPlayActor(world);
      }

      this.logger.info('Map content loaded');
    } catch (error) {
      console.error(error);
    }
  }
}
