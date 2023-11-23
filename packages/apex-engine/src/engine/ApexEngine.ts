import { IInstatiationService } from '../platform/di/common';
import { IConsoleLogger } from '../platform/logging/common';
import { TripleBuffer } from '../platform/memory/common';
import { IRenderer } from '../platform/renderer/common';
import { type EngineLoop, type Tick } from './EngineLoop';
import { GameInstance } from './GameInstance';
import { type Level } from './Level';
import { messageQueue } from './class/specifiers/proxy';

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

  public static GAME_FLAGS: Uint8Array = new Uint8Array(
    new SharedArrayBuffer(Uint8Array.BYTES_PER_ELEMENT)
  ).fill(0x6);

  public isRunning: boolean = false;

  public isInitialized: boolean = false;

  constructor(
    protected readonly engineLoop: EngineLoop,
    @IInstatiationService protected readonly instantiationService: IInstatiationService,
    @IConsoleLogger protected readonly logger: IConsoleLogger,
    @IRenderer protected readonly renderer: IRenderer
  ) {
    if (ApexEngine.instance) {
      throw new Error(`An instance of the GameEngine already exists.`);
    }

    ApexEngine.instance = this;
  }

  public init() {
    this.gameInstance = this.instantiationService.createInstance(GameInstance, this);
    this.gameInstance.init();

    if (IS_BROWSER) {
      this.gameInstance.createPlayer();
    }

    this.isInitialized = true;
  }

  public tick(tick: Tick) {
    TripleBuffer.swapWriteBufferFlags(ApexEngine.GAME_FLAGS);

    while (messageQueue.length) {
      const message = messageQueue.shift();
      this.renderer.send(message);
    }

    this.getGameInstance().getWorld().tick(tick);
  }

  public start() {
    this.isRunning = true;
    this.getGameInstance().start();
  }

  public exit() {}

  /**
   * Client <-> Server:
   * 1. Client calls `loadLevel(<url>)`
   * 2. Client must be already authenticated? Otherwise try to authenticate
   * 3. Load level, call `postLoad`, `setCurrentLevel`, `init` and `initActorsForPlay`
   * 4. Client replicates additional actors sent from the server
   * @param url
   */
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

      if (!world.isInitialized) {
        throw new Error(`Cannot continue loading level: World is not initialized.`);
      }

      level.postLoad(world);
      world.setCurrentLevel(level);

      await world.setGameMode(url);

      level.init();
      world.initActorsForPlay();

      if (IS_BROWSER) {
        gameInstance.getPlayer().spawnPlayActor(world);
      }

      //todo: Broadcast load-level-completed event
    } catch (error) {
      console.log(error);
    }
  }
}
