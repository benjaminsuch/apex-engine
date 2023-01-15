import { ActorComponent, SceneComponent } from './components';
import { Level } from './Level';
import { World } from './World';

export class Actor {
  public rootComponent?: SceneComponent;

  private readonly components: Set<ActorComponent> = new Set();

  public getComponents() {
    return Array.from(this.components);
  }

  public hasComponent(component: ActorComponent) {
    return this.components.has(component);
  }

  public addComponent(ComponentClass: typeof ActorComponent, setAsRootComponent: boolean = false) {
    const component = new ComponentClass();

    component.registerWithActor(this);

    if (setAsRootComponent && component instanceof SceneComponent) {
      this.rootComponent = component;
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
    if (!this.level) {
      throw new Error(`This actor is not part of a world.`);
    }
    return this.world;
  }

  private isInitialized: boolean = false;

  public beginPlay() {}

  public tick() {}

  public preInitComponents() {}

  public initComponents() {}

  public postInitComponents() {
    this.isInitialized = true;
  }

  public registerWithLevel(level: Level) {
    if (level.hasActor(this)) {
      throw new Error(`This instance is already registered in this level.`);
    }

    this.level = level;
    this.world = level.owningWorld;

    this.onRegister();
  }

  protected onRegister() {}
}
