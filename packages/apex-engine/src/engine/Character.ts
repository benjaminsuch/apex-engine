import RAPIER from '@dimforge/rapier3d-compat';

import { IInstantiationService } from '../platform/di/common/InstantiationService';
import { IConsoleLogger } from '../platform/logging/common/ConsoleLogger';
import { type IEngineLoopTickContext } from './EngineLoop';
import { Pawn } from './Pawn';
import { CapsuleGeometry } from './renderer/geometries/CapsuleGeometry';
import { MeshStandardMaterial } from './renderer/materials/MeshStandardMaterial';
import { MeshComponent } from './renderer/MeshComponent';
import { ETickGroup, TickFunction } from './TickManager';

export class Character extends Pawn {
  protected readonly capsuleComponent: MeshComponent;

  public readonly postPhysicsTick: PostPhysicsTickFunction;

  constructor(radius: number = 1, length: number = 3, @IInstantiationService instantiationService: IInstantiationService, @IConsoleLogger logger: IConsoleLogger) {
    super(instantiationService, logger);

    this.capsuleComponent = this.addComponent(MeshComponent, new CapsuleGeometry(radius, length), new MeshStandardMaterial());
    this.capsuleComponent.visible = false;
    this.capsuleComponent.position.set(0, length + length / 2, 0);
    this.capsuleComponent.colliderShape = RAPIER.ShapeType.ConvexPolyhedron;
    this.capsuleComponent.setBodyType(RAPIER.RigidBodyType.KinematicPositionBased);

    this.rootComponent = this.capsuleComponent;

    this.postPhysicsTick = this.instantiationService.createInstance(PostPhysicsTickFunction, this);
    this.postPhysicsTick.canTick = true;
    this.postPhysicsTick.tickGroup = ETickGroup.PostPhysics;
    this.postPhysicsTick.register();
  }

  public updateComponentBody(): void {
    const rigidBody = this.capsuleComponent.rigidBody;

    if (rigidBody) {
      this.capsuleComponent.position.fromArray(rigidBody.position);
    }
  }
}

class PostPhysicsTickFunction extends TickFunction<Character> {
  public override run(context: IEngineLoopTickContext): void | Promise<void> {
    this.target.updateComponentBody();
  }
}
