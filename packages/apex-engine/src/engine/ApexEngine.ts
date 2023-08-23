import { IInstatiationService } from '../platform/di/common';
import { IConsoleLogger } from '../platform/logging/common';
import { type EngineLoop } from './EngineLoop';
import { GameInstance } from './GameInstance';
import { type Level } from './Level';

export abstract class ApexEngine {
  private static instance?: ApexEngine;

  public static getInstance() {
    if (!this.instance) {
      throw new Error(`No instance of GameEngine available.`);
    }
    return this.instance;
  }

  private gameInstance?: GameInstance;

  public getGameInstance() {
    if (!this.isInitialized) {
      throw new Error(`Cannot access GameInstance before the Engine has been initialized.`);
    }
    return this.gameInstance as GameInstance;
  }

  public isRunning: boolean = false;

  public isInitialized: boolean = false;

  constructor(
    private readonly engineLoop: EngineLoop,
    @IInstatiationService private readonly instantiationService: IInstatiationService,
    @IConsoleLogger private readonly logger: IConsoleLogger
  ) {
    if (ApexEngine.instance) {
      throw new Error(`An instance of the GameEngine already exists.`);
    }

    ApexEngine.instance = this;
  }

  public init() {
    this.gameInstance = new GameInstance(this);
    this.gameInstance.init();
    this.gameInstance.createPlayer();

    this.isInitialized = true;
  }

  public tick() {
    this.getGameInstance().getWorld().tick();
  }

  public start() {
    this.isRunning = true;
    this.getGameInstance().start();
  }

  public exit() {}

  public async loadLevel(url: string) {
    //todo: Broadcast pre-load-level event
    this.logger.info(`Attempt to load level: ${url}`);

    try {
      const gameInstance = this.getGameInstance();
      const world = gameInstance.getWorld();

      if (world.currentLevel) {
        this.logger.info(`Disposing current level`);

        // Clean up
        // - Shutdown net driver
        // - Dispose current level
        // - Detach player from its player controller and destroy the player controller actor
        // - Destroy player pawn
        // - Clean up the "World", which includes destroying all actors which are not supposed to be kept between levels.
        //   (We call the clean up function after we clean up the player in case that it might execute code or spawn actors)

        world.currentLevel.dispose();
        //todo: Broadcast level-removed-from-world event
      }

      const { default: LoadedLevel }: { default: typeof Level } = await import(url);

      this.logger.info(`Level loaded: ${url}`);

      const level = this.instantiationService.createInstance(LoadedLevel);
      const player = gameInstance.getPlayer();

      if (!world.isInitialized) {
        throw new Error(`Cannot continue loading level: World is not initialized.`);
      }

      level.postLoad(world);
      world.setCurrentLevel(level);

      await world.setGameMode(url);

      level.init();
      world.initActorsForPlay();
      player.spawnPlayActor(world);

      //todo: Broadcast load-level-completed event
    } catch (error) {
      console.log(error);
    }
  }
}
