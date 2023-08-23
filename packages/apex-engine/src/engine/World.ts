import { type Actor } from './Actor';
import { type GameInstance } from './GameInstance';
import { type GameMode } from './GameMode';
import { type Level } from './Level';
import { type PlayerController } from './PlayerController';

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
      //todo: Broadcast level-changed event
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

  constructor() {}

  public init(gameInstance: GameInstance): void {
    this.gameInstance = gameInstance;
    this.isInitialized = true;
  }

  public initActorsForPlay(): void {
    if (!this.isInitialized) {
      throw new Error(`World has not been initialized.`);
    }

    if (this.currentLevel) {
      this.currentLevel.initActors();
    }

    console.log('Init actors for play', this.actors);
  }

  public beginPlay(): void {
    for (const actor of this.actors) {
      actor.beginPlay();
    }
    //todo: StartPlay via GameMode
    //todo: Broadcast begin-play event
  }

  public cleanUp() {
    this.currentLevel = null;
    this.isInitialized = false;
  }

  public tick(): void {
    for (const actor of this.actors) {
      actor.tick();
    }
  }

  public spawnActor<T extends typeof Actor>(
    ActorClass: T,
    level: Level | null = this.currentLevel
  ): InstanceType<T> {
    if (!level) {
      throw new Error(`Cannot spawn actor: Please set a current level before spawning actors.`);
    }

    const actor = level.addActor(ActorClass);

    this.actors.add(actor);

    return actor;
  }

  public destroyActor(actor: Actor) {
    actor.dispose();
    this.getCurrentLevel().removeActor(actor);
    this.actors.delete(actor);
  }

  public spawnPlayActor() {
    const playerController = this.getGameMode().login();
    this.getGameMode().postLogin(playerController);
    return playerController;
  }
}
