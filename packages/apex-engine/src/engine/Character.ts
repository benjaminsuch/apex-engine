import RAPIER from '@dimforge/rapier3d-compat';
import { CapsuleGeometry } from 'three';

import { IInstantiationService } from '../platform/di/common/InstantiationService';
import { IConsoleLogger } from '../platform/logging/common/ConsoleLogger';
import { Pawn } from './Pawn';
import { MeshComponent } from './renderer/MeshComponent';

export class Character extends Pawn {
  protected readonly capsuleComponent: MeshComponent;

  constructor(@IInstantiationService instantiationService: IInstantiationService, @IConsoleLogger logger: IConsoleLogger) {
    super(instantiationService, logger);

    this.capsuleComponent = this.addComponent(MeshComponent, new CapsuleGeometry(1, 3), undefined);
    this.capsuleComponent.position.set(0, 4, 0);
    this.capsuleComponent.colliderShape = RAPIER.ShapeType.ConvexPolyhedron;
    this.capsuleComponent.setBodyType(RAPIER.RigidBodyType.KinematicPositionBased);
    this.capsuleComponent.setAsRoot(this);
  }
}
