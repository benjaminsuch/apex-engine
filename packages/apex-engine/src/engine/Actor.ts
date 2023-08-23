import { IInstatiationService } from '../platform/di/common';
import { IConsoleLogger } from '../platform/logging/common';
import { IRenderer } from '../platform/renderer/common';
import { type ActorComponent, SceneComponent } from './components';
import { type Level } from './Level';
import { type World } from './World';

export class Actor {
  private rootComponent?: SceneComponent;

  public setRootComponent(component: SceneComponent) {
    //todo: Dispose previous root component
    //todo: Send message to render-thread
    this.rootComponent = component;
  }

  public getRootComponent() {
    if (!this.rootComponent) {
      throw new Error(`A root component has not been set yet.`);
    }
    return this.rootComponent;
  }

  public readonly components: Set<ActorComponent> = new Set();

  public getComponent<T extends typeof ActorComponent>(ComponentClass: T) {
    for (const component of this.components) {
      if (component instanceof ComponentClass) {
        return component as InstanceType<T>;
      }
    }
  }

  public hasComponent(component: ActorComponent) {
    return this.components.has(component);
  }

  public addComponent<T extends typeof ActorComponent>(
    ComponentClass: T,
    setAsRootComponent: boolean = false
  ): InstanceType<T> {
    // I cast this as typeof ActorComponent as `createInstance` expects the correct constructor arguments
    // as a second parameter. I have to fix the type of `createInstance` (if that's possible).
    const component = this.instantiationService.createInstance(
      ComponentClass as typeof ActorComponent
    ) as InstanceType<T>;

    component.registerWithActor(this);

    //? What should we do, if `rootComponent` already exists? We have to dispose
    //? the previous `rootComponent` before assigning a new component. Can the
    //? disposal fail? And if so, how do we handle that?
    if (setAsRootComponent && component instanceof SceneComponent) {
      this.setRootComponent(component);
    }

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

  private isInitialized: boolean = false;

  constructor(
    @IInstatiationService protected readonly instantiationService: IInstatiationService,
    @IConsoleLogger protected readonly logger: IConsoleLogger,
    @IRenderer public readonly renderer: IRenderer
  ) {}

  public beginPlay() {
    for (const component of this.components) {
      component.beginPlay();
    }
  }

  public tick() {
    for (const component of this.components) {
      component.tick();
    }
  }

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
    for (const component of this.components) {
      component.dispose();
    }
  }

  protected onRegister() {}
}
