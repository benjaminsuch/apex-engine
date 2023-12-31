import { type GetLeadingNonServiceArgs, IInstantiationService } from '../platform/di/common/InstantiationService';
import { IConsoleLogger } from '../platform/logging/common/ConsoleLogger';
import { type ActorComponent } from './components/ActorComponent';
import { type SceneComponent } from './components/SceneComponent';
import { type Level } from './Level';
import { type World } from './World';

export type ActorComponentType = new (...args: any[]) => ActorComponent;

export class Actor {
  protected rootComponent?: SceneComponent;

  public setRootComponent(component: SceneComponent): boolean {
    if (component === this.rootComponent) {
      return false;
    }

    // ? Can we just override?
    if (this.rootComponent) {
      this.logger.warn(`Cannot set root component: A root component is already defined.`);
      return false;
    }

    this.rootComponent = component;

    return true;
  }

  public getRootComponent(): SceneComponent {
    if (!this.rootComponent) {
      throw new Error(`A root component has not been set yet.`);
    }
    return this.rootComponent;
  }

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

  private level?: Level;

  public getLevel(): Level {
    if (!this.level) {
      throw new Error(`This actor has not been added to a level.`);
    }
    return this.level;
  }

  private world?: World;

  public getWorld(): World {
    if (!this.world) {
      throw new Error(`This actor is not part of a world.`);
    }
    return this.world;
  }

  constructor(
    @IInstantiationService protected readonly instantiationService: IInstantiationService,
    @IConsoleLogger protected readonly logger: IConsoleLogger,
  ) {}

  public beginPlay(): void {
    for (const component of this.components) {
      component.beginPlay();
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

  protected onRegister(): void {}
}
