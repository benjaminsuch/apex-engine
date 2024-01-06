import { type IMaterialJSON, type INormalizedMaterialJSON, type IObject3DJSON, type ISceneJSON, ITextureJSON, type Object3DChild } from 'three';

import { IInstantiationService } from '../platform/di/common/InstantiationService';
import { IConsoleLogger } from '../platform/logging/common/ConsoleLogger';
import { Actor } from './Actor';
import { type ILoadGLTFResponse } from './assets/Assets.worker';
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

    function traverseChildren(children: IObject3DJSON['children'] = [], parent: SceneComponent): void {
      for (const child of children) {
        const args = getComponentArgs(child, scene);
        // @ts-ignore
        const component = parent.getOwner().addComponent(getComponentClassByObjectType(child.type), ...args);

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

function getComponentArgs(child: Object3DChild, scene: ISceneJSON): any[] {
  if (child.type === 'Mesh') {
    let geometry = scene.geometries.find(({ uuid }) => child.geometry === uuid);
    let material: IMaterialJSON | INormalizedMaterialJSON | undefined = scene.materials.find(({ uuid }) => child.material === uuid);

    if (material) {
      material = {
        ...material,
        aoMap: scene.textures.find(({ uuid }) => uuid === material?.aoMap),
        map: scene.textures.find(({ uuid }) => uuid === material?.map),
        metalnessMap: scene.textures.find(({ uuid }) => uuid === material?.map),
        roughnessMap: scene.textures.find(({ uuid }) => uuid === material?.map),
      };
    }

    return [geometry, material];
  }
  return [];
}
