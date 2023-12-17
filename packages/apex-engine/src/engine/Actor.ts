import { type GetLeadingNonServiceArgs, IInstatiationService } from '../platform/di/common';
import { IConsoleLogger } from '../platform/logging/common';
import { IRenderingPlatform } from '../platform/rendering/common';
import { type ActorComponent, type SceneComponent } from './components';
import { type IEngineLoopTickContext } from './EngineLoop';
import { type Level } from './Level';
import { TickFunction } from './TickFunctionManager';
import { type World } from './World';

export type ActorComponentType = new (...args: any[]) => ActorComponent;

export class Actor {
  protected rootComponent?: SceneComponent;

  public setRootComponent(component: SceneComponent) {
    // todo: Dispose previous root component
    // todo: Send message to render-thread
    if (component === this.rootComponent) {
      return false;
    }

    if (this.rootComponent) {
      this.logger.warn(`Cannot set root component: A root component is already defined.`);
      return false;
    }

    this.rootComponent = component;

    return true;
  }

  public getRootComponent() {
    if (!this.rootComponent) {
      throw new Error(`A root component has not been set yet.`);
    }
    return this.rootComponent;
  }

  public readonly components: Set<ActorComponent> = new Set();

  public getComponent<T extends ActorComponentType>(ComponentClass: T) {
    for (const component of this.components) {
      if (component instanceof ComponentClass) {
        return component as InstanceType<T>;
      }
    }
  }

  public hasComponent(component: ActorComponent) {
    return this.components.has(component);
  }

  public addComponent<T extends ActorComponentType, R extends InstanceType<T>>(
    ComponentClass: T,
    ...args: GetLeadingNonServiceArgs<ConstructorParameters<T>>
  ): R {
    // I cast this as typeof ActorComponent as `createInstance` expects the correct constructor arguments
    // as a second parameter. I have to fix the type of `createInstance` (if that's possible).
    const component = this.instantiationService.createInstance(ComponentClass, ...args) as R;

    component.registerWithActor(this);
    this.components.add(component);

    return component;
  }

  private level?: Level;

  public getLevel() {
    if (!this.level) {
      throw new Error(`This actor has not been assigned to a level.`);
    }
    return this.level;
  }

  private world?: World;

  public getWorld() {
    if (!this.world) {
      throw new Error(`This actor is not part of a world.`);
    }
    return this.world;
  }

  public isInitialized: boolean = false;

  public actorTick: ActorTickFunction;

  constructor(
    @IInstatiationService protected readonly instantiationService: IInstatiationService,
    @IConsoleLogger protected readonly logger: IConsoleLogger,
    @IRenderingPlatform public readonly renderer: IRenderingPlatform
  ) {
    this.actorTick = this.instantiationService.createInstance(ActorTickFunction, this);
  }

  public beginPlay() {
    this.registerActorTickFunction();

    for (const component of this.components) {
      component.registerComponentTickFunction();
      component.beginPlay();
    }
  }

  public tick(context: IEngineLoopTickContext) {}

  public preInitComponents() {
    this.logger.debug(this.constructor.name, 'preInitComponents');

    for (const component of this.components) {
      component.world = this.getWorld();
    }
  }

  public initComponents() {
    for (const component of this.components) {
      component.init();
    }
  }

  public postInitComponents() {
    this.isInitialized = true;
  }

  public registerWithLevel(level: Level) {
    if (level.hasActor(this)) {
      throw new Error(`This instance is already registered in this level.`);
    }

    this.level = level;
    this.world = level.world;

    this.onRegister();
  }

  public dispose() {
    this.logger.debug(this.constructor.name, 'Dispose');

    for (const component of this.components) {
      component.dispose();
    }
  }

  /**
   * Registers it's own tick function and all of it's components.
   */
  public registerActorTickFunction() {
    if (this.actorTick.canTick) {
      this.actorTick.register();
    }
  }

  protected onRegister() {}
}

export class ActorTickFunction extends TickFunction<Actor> {
  public override run(context: IEngineLoopTickContext): void {
    this.target.tick(context);
  }
}
