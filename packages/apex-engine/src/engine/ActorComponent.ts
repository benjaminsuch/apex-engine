import { IInstantiationService } from '../platform/di/common/InstantiationService';
import { IConsoleLogger } from '../platform/logging/common/ConsoleLogger';
import { type Actor } from './Actor';
import { type IEngineLoopTickContext } from './EngineLoop';
import { ETickGroup, TickFunction } from './TickManager';

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

  public readonly componentTick: ComponentTickFunction;

  public isInitialized: boolean = false;

  constructor(
    @IInstantiationService protected readonly instantiationService: IInstantiationService,
    @IConsoleLogger protected readonly logger: IConsoleLogger,
  ) {
    this.componentTick = this.instantiationService.createInstance(ComponentTickFunction, this);
    this.componentTick.tickGroup = ETickGroup.DuringPhysics;
  }

  public init(): void {
    this.isInitialized = true;
  }

  public async beginPlay(): Promise<void> {}

  public async tick(context: IEngineLoopTickContext): Promise<void> {}

  public registerWithActor(actor: Actor): void {
    if (actor.hasComponent(this)) {
      throw new Error(`This instance is already registered for this actor.`);
    }

    this.owner = actor;
    this.onRegister();
  }

  public registerComponentTickFunction(): void {
    if (this.componentTick.canTick) {
      this.componentTick.register();
    }
  }

  protected async onRegister(): Promise<void> {}
}

export class ComponentTickFunction extends TickFunction<ActorComponent> {
  public override run(context: IEngineLoopTickContext): void {
    this.target.tick(context);
  }
}
