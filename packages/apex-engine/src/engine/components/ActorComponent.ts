import { MathUtils } from 'three';

import { IInstatiationService } from '../../platform/di/common';
import { IConsoleLogger } from '../../platform/logging/common';
import { Actor } from '../Actor';
import { type Tick } from '../EngineLoop';
import { World } from '../World';

export class ActorComponent {
  public readonly uuid: string = MathUtils.generateUUID();

  private owner?: Actor;

  public getOwner() {
    if (!this.owner) {
      throw new Error(`No owner found.`);
    }
    return this.owner;
  }

  public world?: World;

  public getWorld() {
    if (!this.world) {
      throw new Error(`This component is not part of a world.`);
    }
    return this.world;
  }

  public isInitialized: boolean = false;

  constructor(
    @IInstatiationService protected readonly instantiationService: IInstatiationService,
    @IConsoleLogger protected readonly logger: IConsoleLogger
  ) {}

  public init() {
    this.isInitialized = true;
  }

  public beginPlay() {}

  public tick(tick: Tick) {}

  public registerWithActor(actor: Actor) {
    if (actor.hasComponent(this)) {
      throw new Error(`This instance is already registered for this actor.`);
    }

    this.owner = actor;
    this.onRegister();
  }

  public dispose() {
    this.logger.debug(this.constructor.name, 'Dispose');
  }

  protected onRegister() {}
}
