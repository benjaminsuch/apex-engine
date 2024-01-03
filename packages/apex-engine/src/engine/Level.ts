import { IInstantiationService } from '../platform/di/common/InstantiationService';
import { IConsoleLogger } from '../platform/logging/common/ConsoleLogger';
import { Actor } from './Actor';
import { type LoadGLTFResponse } from './assets/AssetWorker';
import { getComponentClassByObjectType } from './components';
import { SceneComponent } from './components/SceneComponent';
import { type World } from './World';

export class Level {
  public readonly actors: Actor[] = [];

  public addActor<T extends typeof Actor>(ActorClass: T): InstanceType<T> {
    const actor = this.instantiationService.createInstance(ActorClass as typeof Actor);
    actor.registerWithLevel(this);
    this.actors.push(actor);
    return actor as InstanceType<T>;
  }

  public removeActor(actor: Actor): void {
    const idx = this.actors.indexOf(actor);

    if (idx === -1) {
      this.logger.warn(`Cannot remove actor from level: Actor is unknown.`);
      return;
    }

    this.actors.splice(idx, 1);
  }

  public hasActor(actor: Actor): boolean {
    return this.actors.includes(actor);
  }

  public world?: World;

  public getWorld(): World {
    if (!this.world) {
      throw new Error(`This level has not been assigned to a world yet.`);
    }
    return this.world;
  }

  constructor(
    @IInstantiationService protected readonly instantiationService: IInstantiationService,
    @IConsoleLogger protected readonly logger: IConsoleLogger
  ) {}

  public initActors(): void {}

  public beginPlay(): void {
    this.logger.debug(this.constructor.name, 'Begin play');
  }

  public isCurrentLevel(): boolean {
    return this.world?.getCurrentLevel() === this;
  }

  public load(content: LoadGLTFResponse): void {
    this.logger.debug('Loading content for level');

    const { scenes: [scene] } = content;

    function traverseChildren(children: THREE.Object3D[] = [], parent: SceneComponent): void {
      for (const child of children) {
        const component = parent.getOwner().addComponent(getComponentClassByObjectType(child.type));

        component.attachToComponent(parent);
        traverseChildren(child.children, component);
      }
    }

    for (const { children } of scene.object.children) {
      const actor = this.getWorld().spawnActor(Actor, this);
      const rootComponent = actor.addComponent(SceneComponent);

      rootComponent.setAsRoot(actor);
      traverseChildren(children, rootComponent);
    }
  }
}
