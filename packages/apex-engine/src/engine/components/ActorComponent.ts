import { IInstantiationService } from '../../platform/di/common/InstantiationService';
import { IConsoleLogger } from '../../platform/logging/common/ConsoleLogger';
import { type Actor } from '../Actor';

export class ActorComponent {
  /**
   * The actor that owns this component.
   */
  private owner?: Actor;

  public getOwner(): Actor {
    if (!this.owner) {
      throw new Error(`No owner assigned.`);
    }
    return this.owner;
  }

  public isInitialized: boolean = false;

  constructor(
    @IInstantiationService protected readonly instantiationService: IInstantiationService,
    @IConsoleLogger protected readonly logger: IConsoleLogger,
  ) {
  }

  public init(): void {
    this.isInitialized = true;
  }

  public registerWithActor(actor: Actor): void {
    if (actor.hasComponent(this)) {
      throw new Error(`This instance is already registered for this actor.`);
    }

    this.owner = actor;
    this.onRegister();
  }

  protected onRegister(): void {}
}
