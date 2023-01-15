import { Actor } from '../Actor';
import { World } from '../World';

export class ActorComponent {
  private owner?: Actor;

  public getOwner() {
    return this.owner;
  }

  private world?: World;

  private isInitialized: boolean = false;

  public init() {
    this.isInitialized = true;
  }

  public registerWithActor(actor: Actor) {
    if (actor.hasComponent(this)) {
      throw new Error(`This instance is already registered for this actor.`);
    }

    this.owner = actor;
    this.world = actor.getWorld();

    this.onRegister();
  }

  protected onRegister() {}
}
