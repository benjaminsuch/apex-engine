import RAPIER from '@dimforge/rapier3d-compat';
import { CapsuleGeometry } from 'three';

import { IInstantiationService } from '../platform/di/common/InstantiationService';
import { IConsoleLogger } from '../platform/logging/common/ConsoleLogger';
import { type IEngineLoopTickContext } from './EngineLoop';
import { Pawn } from './Pawn';
import { MeshComponent } from './renderer/MeshComponent';
import { SceneComponent } from './renderer/SceneComponent';
import { ETickGroup, TickFunction } from './TickManager';

export class Character extends Pawn {
  protected readonly capsuleComponent: MeshComponent;

  public readonly postPhysicsTick: PostPhysicsTickFunction;

  constructor(@IInstantiationService instantiationService: IInstantiationService, @IConsoleLogger logger: IConsoleLogger) {
    super(instantiationService, logger);

    this.rootComponent = this.addComponent(SceneComponent);

    this.capsuleComponent = this.addComponent(MeshComponent, new CapsuleGeometry(1, 3), null);
    this.capsuleComponent.position.set(0, 4, 0);
    this.capsuleComponent.colliderShape = RAPIER.ShapeType.ConvexPolyhedron;
    this.capsuleComponent.setBodyType(RAPIER.RigidBodyType.KinematicPositionBased);
    this.capsuleComponent.attachToComponent(this.rootComponent);

    this.postPhysicsTick = this.instantiationService.createInstance(PostPhysicsTickFunction, this);
    this.postPhysicsTick.canTick = true;
    this.postPhysicsTick.tickGroup = ETickGroup.PostPhysics;
    this.postPhysicsTick.register();
  }

  public getCollider(): SceneComponent['collider'] {
    return this.capsuleComponent.collider;
  }

  public getRigidBody(): SceneComponent['rigidBody'] {
    return this.capsuleComponent.rigidBody;
  }

  public updateComponentBody(): void {
    const rigidBody = this.capsuleComponent.rigidBody;

    if (rigidBody) {
      this.rootComponent?.position.fromArray(rigidBody.position);
    }
  }
}

class PostPhysicsTickFunction extends TickFunction<Character> {
  public override run(context: IEngineLoopTickContext): void | Promise<void> {
    this.target.updateComponentBody();
  }
}
