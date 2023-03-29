import { type Actor } from './Actor';
import { type GameInstance } from './GameInstance';
import { type Level } from './Level';

export class World {
  /**
   * Actors stored here are persistent and won't be destroyed when changing levels.
   */
  private readonly actors: Set<Actor> = new Set();

  public getActors() {
    return Array.from(this.actors);
  }

  private currentLevel?: Level;

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
    }
  }

  public getGameInstance() {
    return this.gameInstance;
  }

  private isInitialized: boolean = false;

  constructor(private readonly gameInstance: GameInstance) {}

  public init() {
    this.isInitialized = true;
  }

  public initActorsForPlay() {
    if (!this.isInitialized) {
      throw new Error(`World has not been initialized.`);
    }

    if (this.currentLevel) {
      this.currentLevel.initActors();
    }
  }

  public tick() {
    for (const actor of this.getActors()) {
      actor.tick();
    }
  }

  public spawnActor(ActorClass: typeof Actor, level?: Level) {
    if (!this.currentLevel) {
      throw new Error(`Cannot spawn actor: Please set a current level before spawning actors.`);
    }

    level = level ?? this.currentLevel;

    const actor = level.addActor(ActorClass);

    this.actors.add(actor);

    return actor;
  }
}
