import { type GetLeadingNonServiceArgs, IInstantiationService } from '../platform/di/common/InstantiationService';
import { IConsoleLogger } from '../platform/logging/common/ConsoleLogger';
import { type ActorComponent } from './components/ActorComponent';
import { type SceneComponent } from './components/SceneComponent';

export type ActorComponentType = new (...args: any[]) => ActorComponent;

export class Actor {
  protected rootComponent?: SceneComponent;

  public setRootComponent(component: SceneComponent): boolean {
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

  public getRootComponent(): SceneComponent {
    if (!this.rootComponent) {
      throw new Error(`A root component has not been set yet.`);
    }
    return this.rootComponent;
  }

  public readonly components: Set<ActorComponent> = new Set();

  public getComponent<T extends ActorComponentType>(ComponentClass: T): InstanceType<T> | void {
    for (const component of this.components) {
      if (component instanceof ComponentClass) {
        return component as InstanceType<T>;
      }
    }
  }

  public hasComponent(component: ActorComponent): boolean {
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

  constructor(
    @IInstantiationService protected readonly instantiationService: IInstantiationService,
    @IConsoleLogger protected readonly logger: IConsoleLogger,
  ) {
  }
}
