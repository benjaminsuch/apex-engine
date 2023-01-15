import { Scene } from 'three';

import { Actor } from './Actor';
import { World } from './World';

export class Level {
  public readonly scene: Scene = new Scene();

  private readonly actors: Set<Actor> = new Set();

  public addActor(ActorClass: typeof Actor) {
    const actor = new ActorClass();
    actor.registerWithLevel(this);
    return actor;
  }

  public getActors() {
    return Array.from(this.actors);
  }

  public hasActor(actor: Actor) {
    return this.actors.has(actor);
  }

  public owningWorld?: World;

  private isInitialized: boolean = false;

  public init() {
    this.isInitialized = true;
  }

  public initActors() {
    if (!this.isInitialized) {
      throw new Error(`Level has not been initialized.`);
    }

    for (const actor of this.getActors()) {
      if (actor.rootComponent) {
        this.scene.add(actor.rootComponent.object3D);
      }
    }

    for (const actor of this.getActors()) {
      actor.preInitComponents();
    }

    for (const actor of this.getActors()) {
      actor.initComponents();
      actor.postInitComponents();
    }
  }

  public beginPlay() {}

  public isCurrentLevel() {
    return this.owningWorld?.getCurrentLevel() === this;
  }

  public postLoad() {}
}
