import { IInstatiationService } from '../platform/di/common';
import { IRenderer } from '../platform/renderer/common';
import { type Actor } from './Actor';
import { type World } from './World';

export class Level {
  private readonly actors: Set<Actor> = new Set();

  public addActor(ActorClass: typeof Actor) {
    const actor = this.instantiationService.createInstance(ActorClass);
    actor.registerWithLevel(this);
    this.actors.add(actor);
    return actor;
  }

  public getActors() {
    return Array.from(this.actors);
  }

  public hasActor(actor: Actor) {
    return this.actors.has(actor);
  }

  public world?: World;

  public getWorld() {
    if (!this.world) {
      throw new Error(`This level has not been assigned to a world yet.`);
    }
    return this.world;
  }

  private isInitialized: boolean = false;

  constructor(
    @IInstatiationService protected readonly instantiationService: IInstatiationService,
    @IRenderer protected readonly renderer: IRenderer
  ) {}

  public init() {
    this.isInitialized = true;
  }

  public initActors() {
    if (!this.isInitialized) {
      throw new Error(`Level has not been initialized.`);
    }

    for (const actor of this.getActors()) {
      actor.preInitComponents();
    }

    for (const actor of this.getActors()) {
      actor.initComponents();
      actor.postInitComponents();
    }
  }

  public beginPlay() {}

  public isCurrentLevel() {
    return this.world?.getCurrentLevel() === this;
  }

  public postLoad() {}
}
