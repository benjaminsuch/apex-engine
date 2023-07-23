import { IInstatiationService } from '../platform/di/common';
import { IConsoleLogger } from '../platform/logging/common';
import { IRenderer } from '../platform/renderer/common';
import { type Actor } from './Actor';
import { GameMode } from './GameMode';
import { type World } from './World';

export class Level {
  private readonly actors: Set<Actor> = new Set();

  public addActor<T extends typeof Actor>(ActorClass: T): InstanceType<T> {
    const actor = this.instantiationService.createInstance(ActorClass as typeof Actor);
    actor.registerWithLevel(this);
    this.actors.add(actor);
    return actor as InstanceType<T>;
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

  public readonly gameModeClass: typeof GameMode = GameMode;

  constructor(
    @IInstatiationService protected readonly instantiationService: IInstatiationService,
    @IConsoleLogger protected readonly logger: IConsoleLogger,
    @IRenderer protected readonly renderer: IRenderer
  ) {}

  public init() {
    if (this.isInitialized) {
      this.logger.warn(this.constructor.name, 'Already initialized.');
      return;
    }

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
