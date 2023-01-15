import { EngineLoop } from './EngineLoop';
import { GameInstance } from './GameInstance';
import { Level } from './Level';

export class ApexEngine {
  private static instance?: ApexEngine;

  public static getInstance() {
    if (!this.instance) {
      throw new Error(`Please create an instance before you call getInstance().`);
    }
    return this.instance;
  }

  private gameInstance?: GameInstance;

  public getGameInstance() {
    return this.gameInstance;
  }

  constructor(private readonly engineLoop: EngineLoop) {
    if (ApexEngine.instance) {
      throw new Error(`An instance of the engine already exists.`);
    }

    ApexEngine.instance = this;
  }

  public init() {
    this.gameInstance = new GameInstance();
    this.gameInstance.init();
  }

  public start() {
    this.gameInstance?.start();
  }

  public async loadLevel(url: string) {
    try {
      const { default: LoadedLevel }: { default: typeof Level } = await import(
        /* @vite-ignore */ url
      );
      const level = new LoadedLevel();

      level.postLoad();

      this.gameInstance?.getWorld()?.setCurrentLevel(level);

      level.init();
    } catch (error) {
      console.log(error);
    }
  }
}
