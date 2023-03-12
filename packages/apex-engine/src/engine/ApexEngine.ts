import { IConsoleLogger } from '../platform/logging/common';
import { type EngineLoop } from './EngineLoop';
import { GameInstance } from './GameInstance';
import { type Level } from './Level';

export enum EngineTarget {
  /**
   * A client that runs the game with a renderer and listens to a dedicated server.
   */
  Client = 'client',
  /**
   * Runs both, the client and a listen server on the local machine.
   */
  Game = 'game',
  /**
   * A dedicated server that allows clients to connect.
   */
  Server = 'server'
}

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

  private isInitialized: boolean = false;

  constructor(
    private readonly engineLoop: EngineLoop,
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

    this.isInitialized = true;
  }

  public tick() {}

  public start() {
    this.isRunning = true;
    this.getGameInstance().start();
  }

  public exit() {}

  public async loadLevel(url: string) {
    this.logger.info(`Attempt to load level: ${url}`);

    try {
      const { default: LoadedLevel }: { default: typeof Level } = await import(`../${url}`);

      this.logger.info(`Level loaded: ${url}`);

      const level = new LoadedLevel();
      const world = this.getGameInstance().getWorld();

      level.postLoad();
      world.setCurrentLevel(level);
      level.init();
      world.initActorsForPlay();
    } catch (error) {
      console.log(error);
    }
  }
}
