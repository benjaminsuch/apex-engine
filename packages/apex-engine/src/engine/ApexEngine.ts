import { IInstatiationService } from '../platform/di/common';
import { IConsoleLogger } from '../platform/logging/common';
import { TripleBuffer } from '../platform/memory/common/TripleBuffer';
import { IRenderer } from '../platform/renderer/common';
import { proxies, proxiesToSend } from './Class';
import { type EngineLoop, type Tick } from './EngineLoop';
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

  private flags: Uint8Array = new Uint8Array(
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
    TripleBuffer.swapWriteBufferFlags(this.flags);

    for (const proxy of proxiesToSend) {
      const tripleBuffer: TripleBuffer = Reflect.getMetadata('instance:buffer', proxy);

      if (!tripleBuffer) {
        console.log(`No triple buffer found for ${proxy.name}`);
        continue;
      }

      this.renderer.send<any>({
        type: 'instance',
        byteLength: tripleBuffer.byteLength,
        buffers: tripleBuffer.buffers
      });
    }

    this.getGameInstance().getWorld().tick(tick);
  }

  public start() {
    for (const proxy of proxies) {
      const specifiers = Reflect.getMetadata('class:specifiers', proxy.constructor);

      for (const [, specifier] of specifiers) {
        specifier(proxy);
      }
    }

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
