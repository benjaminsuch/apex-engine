import { type Actor } from './Actor';
import { type GameInstance } from './GameInstance';
import { type GameMode } from './GameMode';
import { type Level } from './Level';
import { PlayerController } from './PlayerController';

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

  private currentLevel: Level | null = null;

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

  public getGameInstance() {
    return this.gameInstance;
  }

  public isInitialized: boolean = false;

  constructor(private readonly gameInstance: GameInstance) {}

  public init(): void {
    this.isInitialized = true;
  }

  public initActorsForPlay(): void {
    if (!this.isInitialized) {
      throw new Error(`World has not been initialized.`);
    }

    if (this.currentLevel) {
      this.currentLevel.initActors();
    }

    console.log('Init actors for play');
  }

  public beginPlay(): void {
    for (const actor of this.actors) {
      actor.beginPlay();
    }
    //todo: StartPlay via GameMode
    //todo: Broadcast begin-play event
  }

  public tick(): void {
    for (const actor of this.actors) {
      actor.tick();
    }
  }

  public spawnActor<T extends typeof Actor>(ActorClass: T, level?: Level): InstanceType<T> {
    if (!this.currentLevel) {
      throw new Error(`Cannot spawn actor: Please set a current level before spawning actors.`);
    }

    level = level ?? this.currentLevel;

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
