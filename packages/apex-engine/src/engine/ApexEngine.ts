import { Renderer } from 'src/renderer';
import { EngineLoop } from './EngineLoop';
import { GameInstance } from './GameInstance';
import { Level } from './Level';

export abstract class ApexEngine {
  private static instance?: ApexEngine;

  public static getInstance() {
    if (!this.instance) {
      throw new Error(`Please create an instance before you call getInstance().`);
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

  constructor(private readonly engineLoop: EngineLoop) {
    if (ApexEngine.instance) {
      throw new Error(`An instance of the engine already exists.`);
    }

    ApexEngine.instance = this;
  }

  public init() {
    this.gameInstance = new GameInstance();
    this.gameInstance.init();

    this.isInitialized = true;
  }

  public start() {
    this.isRunning = true;
    this.getGameInstance().start();
  }

  public tick() {}

  public async loadLevel(url: string) {
    try {
      const { default: LoadedLevel }: { default: typeof Level } = await import(
        /* @vite-ignore */ url
      );
      const level = new LoadedLevel();
      const world = this.getGameInstance().getWorld();

      level.postLoad();
      world.setCurrentLevel(level);
      level.init();
      world.initActorsForPlay();

      Renderer.getInstance().scene = level.scene;
    } catch (error) {
      console.log(error);
    }
  }
}
