import { IConsoleLogger } from '../platform/logging/common/ConsoleLogger';
import { type Actor } from './Actor';
import { type IEngineLoopTickContext } from './EngineLoop';
import { type GameInstance } from './GameInstance';
import { type GameMode } from './GameMode';
import { type Level } from './Level';
import { IRenderWorkerContext } from './renderer/RenderWorkerContext';
import { ETickGroup, TickManager } from './TickManager';

export class World {
  private gameMode: GameMode | null = null;

  public async setGameMode(url: string): Promise<void> {
    if (!IS_CLIENT && !this.gameMode) {
      let urlObj: URL;

      try {
        urlObj = new URL(url);
      } catch {
        urlObj = new URL(`file://${url}`);
      }

      this.gameMode = await this.getGameInstance().createGameModeFromURL(urlObj);
    }
  }

  public getGameMode(): GameMode {
    if (!this.gameMode) {
      throw new Error(`The game mode has not been set yet.`);
    }
    return this.gameMode;
  }

  private gameInstance: GameInstance | null = null;

  public getGameInstance(): GameInstance {
    if (!this.gameInstance) {
      throw new Error(`No game instance set.`);
    }
    return this.gameInstance;
  }

  public readonly actors: Actor[] = [];

  public currentLevel: Level | null = null;

  public getCurrentLevel(): Level {
    if (!this.currentLevel) {
      throw new Error(`A current level has not been set.`);
    }
    return this.currentLevel;
  }

  public setCurrentLevel(level: Level): void {
    if (this.currentLevel !== level) {
      this.currentLevel = level;
      this.currentLevel.world = this;
      // todo: Broadcast level-changed event
    }
  }

  public tickGroup: ETickGroup = ETickGroup.PrePhysics;

  public isInitialized: boolean = false;

  constructor(@IConsoleLogger protected readonly logger: IConsoleLogger, @IRenderWorkerContext protected readonly renderWorker: IRenderWorkerContext) {}

  public init(gameInstance: GameInstance): void {
    if (this.isInitialized) {
      this.logger.warn(this.constructor.name, 'Already initialized.');
      return;
    }

    this.logger.debug(this.constructor.name, 'Initialize');

    this.gameInstance = gameInstance;
    this.isInitialized = true;
  }

  public tick(tick: IEngineLoopTickContext): void {
    TickManager.getInstance().startTick(tick, this);

    this.runTickGroup(ETickGroup.PrePhysics);
    this.runTickGroup(ETickGroup.DuringPhysics);
    this.runTickGroup(ETickGroup.PostPhysics);

    TickManager.getInstance().endTick();
  }

  public initActorsForPlay(): void {
    if (!this.isInitialized) {
      throw new Error(`World has not been initialized.`);
    }

    this.logger.debug(
      this.constructor.name,
      'Initialize actors for play',
      IS_BROWSER ? this.actors : this.actors.length
    );

    if (this.currentLevel) {
      this.currentLevel.initActors();
    }
  }

  public beginPlay(): void {
    this.logger.debug(this.constructor.name, 'Begin Play');
    this.getCurrentLevel().beginPlay();

    for (const actor of this.actors) {
      actor.beginPlay();
    }
    // todo: StartPlay via GameMode
    // todo: Broadcast begin-play event
  }

  public spawnActor<T extends typeof Actor>(
    ActorClass: T,
    level: Level | null = this.currentLevel
  ): InstanceType<T> {
    this.logger.debug(this.constructor.name, 'Spawn actor:', ActorClass.name);

    if (!level) {
      throw new Error(`Cannot spawn actor: Please set a current level before spawning actors.`);
    }

    const actor = level.addActor(ActorClass);
    this.actors.push(actor);

    return actor;
  }

  protected runTickGroup(group: ETickGroup): void {
    this.tickGroup = group;
    TickManager.getInstance().runTickGroup(group);
  }
}
