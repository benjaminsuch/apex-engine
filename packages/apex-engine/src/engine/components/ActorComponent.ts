import { Actor } from '../Actor';
import { World } from '../World';

export class ActorComponent {
  private owner?: Actor;

  public getOwner() {
    return this.owner;
  }

  public world?: World;

  public getWorld() {
    if (!this.world) {
      throw new Error(`This actor is not part of a world.`);
    }
    return this.world;
  }

  private isInitialized: boolean = false;

  public init() {
    this.isInitialized = true;
  }

  public beginPlay() {}

  public tick() {}

  public registerWithActor(actor: Actor) {
    if (actor.hasComponent(this)) {
      throw new Error(`This instance is already registered for this actor.`);
    }

    this.owner = actor;
    this.onRegister();
  }

  protected onRegister() {}
}
