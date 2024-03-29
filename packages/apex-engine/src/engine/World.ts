import { IInstantiationService } from '../platform/di/common/InstantiationService';
import { IConsoleLogger } from '../platform/logging/common/ConsoleLogger';
import { type Actor } from './Actor';
import { type IEngineLoopTickContext } from './EngineLoop';
import { type GameInstance } from './GameInstance';
import { type GameMode } from './GameMode';
import { type GLTFParserRegisterActorCallback } from './GLTFLoader';
import { type Level } from './Level';
import { IPhysicsWorkerContext } from './physics/PhysicsWorkerContext';
import { type Player } from './Player';
import { type PlayerController } from './PlayerController';
import { IRenderWorkerContext } from './renderer/RenderWorkerContext';
import { ETickGroup, TickManager } from './TickManager';

export class World {
  private gameMode?: GameMode;

  public async setGameMode(url: string): Promise<void> {
    if (!IS_CLIENT && !this.gameMode) {
      let urlObj: URL;

      try {
        urlObj = new URL(url);
      } catch {
        urlObj = new URL(`file://${url}`);
      }

      try {
        this.gameMode = await this.getGameInstance().createGameModeFromURL(urlObj);
      } catch (error: any) {
        this.logger.error(error);
      }
    }
  }

  public getGameMode(): GameMode {
    if (!this.gameMode) {
      throw new Error(`The game mode has not been set yet.`);
    }
    return this.gameMode;
  }

  private gameInstance?: GameInstance;

  public getGameInstance(): GameInstance {
    if (!this.gameInstance) {
      throw new Error(`No game instance set.`);
    }
    return this.gameInstance;
  }

  public readonly actors: Actor[] = [];

  public currentLevel?: Level;

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

  public tickGroup: ETickGroup | null = null;

  public isInitialized: boolean = false;

  constructor(
    @IInstantiationService protected readonly instantiationService: IInstantiationService,
    @IConsoleLogger protected readonly logger: IConsoleLogger,
    @IRenderWorkerContext protected readonly renderContext: IRenderWorkerContext,
    @IPhysicsWorkerContext protected readonly physicsContext: IPhysicsWorkerContext
  ) {}

  public init(gameInstance: GameInstance): void {
    if (this.isInitialized) {
      this.logger.warn(this.constructor.name, 'Already initialized.');
      return;
    }

    this.logger.debug(this.constructor.name, 'Initialize', this);

    this.gameInstance = gameInstance;
    this.isInitialized = true;
  }

  public async tick(tick: IEngineLoopTickContext): Promise<void> {
    TickManager.getInstance().startTick(tick);

    this.tickGroup = ETickGroup.PrePhysics;

    await this.runTickGroup(ETickGroup.PrePhysics);
    await Promise.all([this.physicsContext.step(tick), this.runTickGroup(ETickGroup.DuringPhysics)]);
    await this.runTickGroup(ETickGroup.PostPhysics);

    TickManager.getInstance().endTick();
  }

  public async registerActors(registerCallbacks: GLTFParserRegisterActorCallback[]): Promise<void> {
    await Promise.all(registerCallbacks.map(async register => register(this.getCurrentLevel())));
  }

  public initActorsForPlay(): void {
    if (!this.isInitialized) {
      throw new Error(`World has not been initialized.`);
    }

    this.logger.debug(this.constructor.name, 'Initialize actors for play', IS_BROWSER ? this.actors : this.actors.length);

    if (this.currentLevel) {
      this.currentLevel.initActors();
    }
  }

  public async beginPlay(): Promise<void> {
    this.logger.debug(this.constructor.name, 'Begin Play');
    await this.getCurrentLevel().beginPlay();

    for (const actor of this.actors) {
      await actor.beginPlay();
    }

    // todo: StartPlay via GameMode
    // todo: Broadcast begin-play event
  }

  public spawnActor<T extends TClass>(ActorClass: T, level: Level | undefined = this.currentLevel): InstanceType<T> {
    this.logger.debug(this.constructor.name, 'Spawn actor:', ActorClass.name);

    if (!level) {
      throw new Error(`Cannot spawn actor: Please set a current level before spawning actors.`);
    }

    const actor = level.addActor(ActorClass);
    this.actors.push(actor);

    return actor;
  }

  public spawnPlayActor(player: Player): PlayerController {
    this.logger.debug(this.constructor.name, 'Spawn play actor:', player.constructor.name);

    const playerController = this.getGameMode().login(player);
    playerController.setPlayer(player);

    this.getGameMode().postLogin(playerController);

    return playerController;
  }

  protected async runTickGroup(group: ETickGroup): Promise<void> {
    await TickManager.getInstance().runTickGroup(group);
    this.tickGroup = ETickGroup[ETickGroup[group + 1] as keyof typeof ETickGroup];
  }
}
