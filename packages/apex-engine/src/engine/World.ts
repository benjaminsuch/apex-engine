import { IInstantiationService } from '../platform/di/common/InstantiationService';
import { IConsoleLogger } from '../platform/logging/common/ConsoleLogger';
import { type Actor } from './Actor';
import { type IEngineLoopTickContext } from './EngineLoop';
import { type GameInstance } from './GameInstance';
import { type GameMode } from './GameMode';
import { type Level } from './Level';
import { IPhysicsWorkerContext } from './physics/PhysicsWorkerContext';
import { type Player } from './Player';
import { type PlayerController } from './PlayerController';
import { IRenderWorkerContext } from './renderer/RenderWorkerContext';
import { ETickGroup, TickFunction, TickManager } from './TickManager';

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

  public tickGroup: ETickGroup = ETickGroup.PrePhysics;

  public startPhysicsTickFunction: StartPhysicsTickFunction;

  public endPhysicsTickFunction: EndPhysicsTickFunction;

  public isInitialized: boolean = false;

  constructor(
    @IInstantiationService protected readonly instantiationService: IInstantiationService,
    @IConsoleLogger protected readonly logger: IConsoleLogger,
    @IRenderWorkerContext protected readonly renderWorker: IRenderWorkerContext,
    @IPhysicsWorkerContext protected readonly physicsWorker: IPhysicsWorkerContext
  ) {
    this.startPhysicsTickFunction = this.instantiationService.createInstance(StartPhysicsTickFunction, this);
    this.startPhysicsTickFunction.canTick = true;
    this.startPhysicsTickFunction.tickGroup = ETickGroup.StartPhysics_Internal;

    this.endPhysicsTickFunction = this.instantiationService.createInstance(EndPhysicsTickFunction, this);
    this.endPhysicsTickFunction.canTick = true;
    this.endPhysicsTickFunction.tickGroup = ETickGroup.EndPhysics_Internal;
  }

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
    this.runTickGroup(ETickGroup.StartPhysics_Internal);
    this.runTickGroup(ETickGroup.DuringPhysics);
    this.runTickGroup(ETickGroup.EndPhysics_Internal);
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

    this.registerPhysicsTickFunctions();
    // todo: StartPlay via GameMode
    // todo: Broadcast begin-play event
  }

  public spawnActor<T extends typeof Actor>(ActorClass: T, level: Level | undefined = this.currentLevel): InstanceType<T> {
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

  public async initPhysicsStep(): Promise<void> {
    return this.physicsWorker.initPhysicsStep();
  }

  public async finishPhysicsStep(): Promise<void> {
    return this.physicsWorker.finishPhysicsStep();
  }

  protected registerPhysicsTickFunctions(): void {
    if (this.startPhysicsTickFunction.canTick) {
      this.startPhysicsTickFunction.register();
    }
    if (this.endPhysicsTickFunction.canTick) {
      this.endPhysicsTickFunction.addDependency(this.startPhysicsTickFunction);
      this.endPhysicsTickFunction.register();
    }
  }

  protected runTickGroup(group: ETickGroup): void {
    this.tickGroup = group;
    TickManager.getInstance().runTickGroup(group);
  }
}

class StartPhysicsTickFunction extends TickFunction<World> {
  public override run(context: IEngineLoopTickContext): void {
    this.target.initPhysicsStep();
  }
}

class EndPhysicsTickFunction extends TickFunction<World> {
  public override run(context: IEngineLoopTickContext): void {
    this.target.finishPhysicsStep();
  }
}
