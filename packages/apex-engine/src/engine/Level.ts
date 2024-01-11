import { type IObject3DJSON, type ISceneJSON, type Object3DChild } from 'three';

import { IInstantiationService } from '../platform/di/common/InstantiationService';
import { IConsoleLogger } from '../platform/logging/common/ConsoleLogger';
import { Actor } from './Actor';
import { type ILoadGLTFResponse } from './assets/Assets.worker';
import { resolveComponent } from './components';
import { type SceneComponent } from './components/SceneComponent';
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
      this.logger.warn(`Cannot remove actor from level: Actor is unknown.1`);
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

  /**
   * Creates the actors and its components.
   *
   * @param content The content from the AssetWorker's `loadGLTF`
   */
  public load(content: ILoadGLTFResponse): void {
    this.logger.debug('Loading content for level', content);

    const { scenes: [scene] } = content;

    function addComponent(child: Object3DChild, scene: ISceneJSON, actor: Actor): SceneComponent {
      const [ComponentConstructor, args] = resolveComponent(child, scene);
      // @ts-ignore
      return actor.addComponent(ComponentConstructor, ...args);
    }

    function traverseChildren(children: IObject3DJSON['children'] = [], parent: SceneComponent): void {
      for (const child of children) {
        const component = addComponent(child, scene, parent.getOwner());
        component.attachToComponent(parent);
        traverseChildren(child.children, component);
      }
    }

    for (const child of scene.object.children) {
      const actor = this.getWorld().spawnActor(Actor, this);
      const rootComponent = addComponent(child, scene, actor);

      rootComponent.setAsRoot(actor);
      traverseChildren(child.children, rootComponent);
    }
  }
}
