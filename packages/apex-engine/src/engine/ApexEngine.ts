import { WebGLRenderer } from 'three';

import { EngineLoop } from './EngineLoop';
import { GameInstance } from './GameInstance';
import { Level } from './Level';

export class ApexEngine {
  private static renderer?: WebGLRenderer;

  public static getRenderer() {
    if (!this.renderer) {
      throw new Error(`No instance of Renderer available.`);
    }
    return this.renderer;
  }

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
    const renderer = new WebGLRenderer({ antialias: true, alpha: true });
    //todo: Both "width" and "height" must be derived from the target platform.
    renderer.setSize(window.innerWidth, window.innerHeight);
    //todo: Appending the `domElement` as a child is also platform specific and needs to be abstracted.
    document.body.appendChild(renderer.domElement);

    ApexEngine.renderer = renderer;

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

      level.postLoad();

      this.getGameInstance().getWorld().setCurrentLevel(level);

      level.init();
    } catch (error) {
      console.log(error);
    }
  }
}
