import { IConsoleLogger } from '../platform/logging/common';
import { INetDriver } from '../platform/net/common';
import { type Actor } from './Actor';
import { type IEngineLoopTickContext } from './EngineLoop';
import { type GameInstance } from './GameInstance';
import { type GameMode } from './GameMode';
import { type Level } from './Level';
import { type NetConnection } from './net';
import { type Player } from './Player';
import { type PlayerController } from './PlayerController';
import { ETickGroup, TickFunctionManager } from './TickFunctionManager';

export class World {
  private readonly playerControllers: Set<PlayerController> = new Set();

  public addPlayerController(controller: PlayerController) {
    // This might be a relevant to know, so we log a warning.
    if (this.playerControllers.has(controller)) {
      console.warn(`An instance of this player controller is already in the list.`);
    }
    this.playerControllers.add(controller);
  }

  public removePlayerController(controller: PlayerController) {
    this.playerControllers.delete(controller);
  }

  /**
   * Actors stored here are persistent and won't be destroyed when changing levels.
   */
  public readonly actors: Set<Actor> = new Set();

  public currentLevel: Level | null = null;

  public getCurrentLevel() {
    if (!this.currentLevel) {
      throw new Error(`A current level has not been set.`);
    }
    return this.currentLevel;
  }

  public setCurrentLevel(level: Level) {
    if (this.currentLevel !== level) {
      this.currentLevel = level;
      this.currentLevel.world = this;
      // todo: Broadcast level-changed event
    }
  }

  private gameMode: GameMode | null = null;

  public async setGameMode(url: string) {
    if (!IS_CLIENT && !this.gameMode) {
      this.gameMode = await this.getGameInstance().createGameModeFromURL(url);
    }
  }

  public getGameMode() {
    if (!this.gameMode) {
      throw new Error(`The game mode has not been set yet.`);
    }
    return this.gameMode;
  }

  private gameInstance: GameInstance | null = null;

  public getGameInstance() {
    if (!this.gameInstance) {
      throw new Error(`No game instance set.`);
    }
    return this.gameInstance;
  }

  public isInitialized: boolean = false;

  public tickGroup: ETickGroup = ETickGroup.PrePhysics;

  constructor(
    @IConsoleLogger protected readonly logger: IConsoleLogger,
    @INetDriver protected readonly netDriver: INetDriver
  ) {}

  public init(gameInstance: GameInstance): void {
    this.logger.debug(this.constructor.name, 'Initialize');

    this.netDriver.world = this;
    this.gameInstance = gameInstance;
    this.isInitialized = true;
  }

  public initActorsForPlay(): void {
    if (!this.isInitialized) {
      throw new Error(`World has not been initialized.`);
    }

    this.logger.debug(
      this.constructor.name,
      'Initialize actors for play',
      IS_BROWSER ? this.actors : this.actors.size
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

  public cleanUp() {
    this.logger.debug(this.constructor.name, 'Clean up');
    this.currentLevel = null;
    this.isInitialized = false;
  }

  public tick(tick: IEngineLoopTickContext): void {
    TickFunctionManager.getInstance().startTick(tick, this);

    this.runTickGroup(ETickGroup.PrePhysics);
    this.runTickGroup(ETickGroup.DuringPhysics);
    this.runTickGroup(ETickGroup.PostPhysics);

    TickFunctionManager.getInstance().endTick();
  }

  public runTickGroup(group: ETickGroup) {
    this.tickGroup = group;
    TickFunctionManager.getInstance().runTickGroup(group);
  }

  public spawnActor<T extends typeof Actor>(
    ActorClass: T,
    level: Level | null = this.currentLevel
  ): InstanceType<T> {
    this.logger.debug(this.constructor.name, 'Spawning actor', ActorClass.name);

    if (!level) {
      throw new Error(`Cannot spawn actor: Please set a current level before spawning actors.`);
    }

    const actor = level.addActor(ActorClass);
    this.actors.add(actor);

    return actor;
  }

  public destroyActor(actor: Actor) {
    this.logger.debug(
      this.constructor.name,
      'Destroying actor',
      IS_BROWSER ? actor : actor.constructor.name
    );

    actor.dispose();
    this.getCurrentLevel().removeActor(actor);
    this.actors.delete(actor);
  }

  public spawnPlayActor(player: Player) {
    this.logger.debug(this.constructor.name, 'Spawning player actor');
    const playerController = this.getGameMode().login();
    this.getGameMode().postLogin(playerController);
    return playerController;
  }

  public welcomePlayer(connection: NetConnection) {
    this.getGameMode().welcomePlayer(connection);
    // connection.controlChannel.send(welcomeData)
    // connection.flush()
  }
}
