import { MathUtils } from 'three';

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

  private isInitialized: boolean = false;

  constructor(...args: any[]) {}

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

  public dispose() {}

  protected onRegister() {}
}
