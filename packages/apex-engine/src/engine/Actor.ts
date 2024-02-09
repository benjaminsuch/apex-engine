import { type GetLeadingNonServiceArgs, IInstantiationService } from '../platform/di/common/InstantiationService';
import { IConsoleLogger } from '../platform/logging/common/ConsoleLogger';
import { type ActorComponent } from './ActorComponent';
import { type SceneComponent } from './renderer/SceneComponent';
import { type IEngineLoopTickContext } from './EngineLoop';
import { type Level } from './Level';
import { TickFunction } from './TickManager';
import { type World } from './World';

export type ActorComponentType = new (...args: any[]) => ActorComponent;

export class Actor {
  private level: Level | null = null;

  public getLevel(): Level {
    if (!this.level) {
      throw new Error(`This actor has not been added to a level.`);
    }
    return this.level;
  }

  private world: World | null = null;

  public getWorld(): World {
    if (!this.world) {
      throw new Error(`This actor is not part of a world.`);
    }
    return this.world;
  }

  public rootComponent: SceneComponent | null = null;

  public readonly components: ActorComponent[] = [];

  public getComponent<T extends ActorComponentType>(ComponentClass: T): InstanceType<T> | void {
    for (const component of this.components) {
      if (component instanceof ComponentClass) {
        return component as InstanceType<T>;
      }
    }
  }

  public hasComponent(component: ActorComponent): boolean {
    return this.components.includes(component);
  }

  public addComponent<T extends ActorComponentType, R extends InstanceType<T>>(
    ComponentClass: T,
    ...args: GetLeadingNonServiceArgs<ConstructorParameters<T>>
  ): R {
    // I cast this as typeof ActorComponent as `createInstance` expects the correct constructor arguments
    // as a second parameter. I have to fix the type of `createInstance` (if that's possible).
    const component = this.instantiationService.createInstance(ComponentClass, ...args) as R;

    component.registerWithActor(this);
    this.components.push(component);

    return component;
  }

  public actorTick: ActorTickFunction;

  constructor(
    @IInstantiationService protected readonly instantiationService: IInstantiationService,
    @IConsoleLogger protected readonly logger: IConsoleLogger,
  ) {
    this.actorTick = this.instantiationService.createInstance(ActorTickFunction, this);
  }

  public tick(context: IEngineLoopTickContext): Promise<void> | void {}

  public async beginPlay(): Promise<void> {
    this.registerActorTickFunction();

    for (const component of this.components) {
      component.registerComponentTickFunction();
      await component.beginPlay();
    }
  }

  public registerWithLevel(level: Level): void {
    if (level.hasActor(this)) {
      throw new Error(`This instance is already registered in this level.`);
    }

    this.level = level;
    this.world = level.world;

    this.onRegister();
  }

  protected registerActorTickFunction(): void {
    if (this.actorTick.canTick) {
      this.actorTick.register();
    }
  }

  protected onRegister(): void {}
}

export class ActorTickFunction extends TickFunction<Actor> {
  public override run(context: IEngineLoopTickContext): void {
    this.target.tick(context);
  }
}
