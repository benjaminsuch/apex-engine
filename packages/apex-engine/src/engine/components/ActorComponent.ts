import { MathUtils } from 'three';

import { IInstatiationService } from '../../platform/di/common';
import { IConsoleLogger } from '../../platform/logging/common';
import { Actor } from '../Actor';
import { type IEngineLoopTickContext } from '../EngineLoop';
import { ETickGroup, TickFunction } from '../TickFunctionManager';
import { World } from '../World';

export class ActorComponent {
  public readonly uuid: string = MathUtils.generateUUID();

  public readonly componentTick: ComponentTickFunction;

  /**
   * The actor that owns this component.
   */
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
  ) {
    this.componentTick = this.instantiationService.createInstance(ComponentTickFunction, this);
    this.componentTick.tickGroup = ETickGroup.DuringPhysics;
  }

  public init() {
    this.isInitialized = true;
  }

  public beginPlay() {}

  public tick(context: IEngineLoopTickContext) {}

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

  public registerComponentTickFunction() {
    if (this.componentTick.canTick) {
      this.componentTick.register();
    }
  }

  protected onRegister() {}
}

export class ComponentTickFunction extends TickFunction<ActorComponent> {
  public override run(context: IEngineLoopTickContext): boolean {
    this.target.tick(context);
    return super.run(context);
  }
}
