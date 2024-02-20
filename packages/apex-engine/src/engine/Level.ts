import { type Object3D } from 'three';
import { type GLTF } from 'three-stdlib';

import { IInstantiationService } from '../platform/di/common/InstantiationService';
import { IConsoleLogger } from '../platform/logging/common/ConsoleLogger';
import { Actor } from './Actor';
import { resolveComponent } from './renderer/components';
import { type SceneComponent } from './renderer/SceneComponent';
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

    this.actors.removeAtSwap(idx);
  }

  public hasActor(actor: Actor): boolean {
    return this.actors.includes(actor);
  }

  public world: World | null = null;

  public getWorld(): World {
    if (!this.world) {
      throw new Error(`This level has not been assigned to a world yet.`);
    }
    return this.world;
  }

  public isInitialized: boolean = false;

  constructor(
    @IInstantiationService protected readonly instantiationService: IInstantiationService,
    @IConsoleLogger protected readonly logger: IConsoleLogger
  ) {}

  public init(): void {
    if (this.isInitialized) {
      this.logger.warn(this.constructor.name, 'Already initialized.');
      return;
    }

    this.logger.debug(this.constructor.name, 'Initialize');

    this.isInitialized = true;
  }

  public initActors(): void {}

  public async beginPlay(): Promise<void> {
    this.logger.debug(this.constructor.name, 'Begin play');
  }

  public isCurrentLevel(): boolean {
    return this.world?.getCurrentLevel() === this;
  }

  /**
   * Creates the actors and its components.
   *
   * @param content The content from the AssetWorker's `loadGLTF`
   */
  public load({ scene }: GLTF): void {
    this.logger.debug(this.constructor.name, 'Loading content');

    function addComponent(child: Object3D, actor: Actor): SceneComponent {
      const [ComponentConstructor, args] = resolveComponent(child);
      // @ts-ignore
      return actor.addComponent(ComponentConstructor, ...args);
    }

    function traverseChildren(children: Object3D['children'] = [], parent: SceneComponent): void {
      for (const child of children) {
        const component = addComponent(child, parent.getOwner());
        component.copyFromObject3D(child);
        component.attachToComponent(parent);
        traverseChildren(child.children, component);
      }
    }

    for (const child of scene.children) {
      const actor = this.getWorld().spawnActor(Actor, this);
      const rootComponent = addComponent(child, actor);

      rootComponent.setAsRoot(actor);
      traverseChildren(child.children, rootComponent);
    }
  }
}
