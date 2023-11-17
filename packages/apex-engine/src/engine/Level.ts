import { IInstatiationService } from '../platform/di/common';
import { IConsoleLogger } from '../platform/logging/common';
import { IRenderer } from '../platform/renderer/common';
import { type Actor } from './Actor';
import { type World } from './World';

export class Level {
  public readonly actors: Set<Actor> = new Set();

  public addActor<T extends typeof Actor>(ActorClass: T): InstanceType<T> {
    const actor = this.instantiationService.createInstance(ActorClass as typeof Actor);
    actor.registerWithLevel(this);
    this.actors.add(actor);
    return actor as InstanceType<T>;
  }

  public removeActor(actor: Actor) {
    this.actors.delete(actor);
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

  public isInitialized: boolean = false;

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
    if (!IS_SERVER) {
      this.logger.debug(this.constructor.name, 'Initialize actors', this.actors);
    } else {
      this.logger.debug(this.constructor.name, 'Initialize actors', this.actors.size);
    }

    if (!this.isInitialized) {
      throw new Error(`Level has not been initialized.`);
    }

    for (const actor of this.actors) {
      actor.preInitComponents();
    }

    for (const actor of this.actors) {
      actor.initComponents();
      actor.postInitComponents();
    }
  }

  public beginPlay() {
    this.logger.debug(this.constructor.name, 'Begin play');
  }

  public isCurrentLevel() {
    return this.world?.getCurrentLevel() === this;
  }

  /**
   * At this stage, the world has been initiated and the game mode created. Any code that should be
   * exectuted before the level and it's actor have been initiated.
   *
   * @param world The world must be set here, since we broadcast the post-load event before we call `init`.
   */
  public postLoad(world: World) {
    if (!this.world) {
      this.world = world;
    }
  }

  public dispose() {
    //todo: Make sure all event listeners are removed
    //todo: Make sure injected services don't store any data from this level
  }
}
