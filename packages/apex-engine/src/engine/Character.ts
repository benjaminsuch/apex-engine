import RAPIER from '@dimforge/rapier3d-compat';
import { CapsuleGeometry } from 'three';

import { IInstantiationService } from '../platform/di/common/InstantiationService';
import { IConsoleLogger } from '../platform/logging/common/ConsoleLogger';
import { MeshComponent } from './components/MeshComponent';
import { Pawn } from './Pawn';

export class Character extends Pawn {
  protected readonly capsuleComponent: MeshComponent;

  constructor(
    @IInstantiationService protected override readonly instantiationService: IInstantiationService,
    @IConsoleLogger protected override readonly logger: IConsoleLogger
  ) {
    super(instantiationService, logger);

    this.capsuleComponent = this.addComponent(MeshComponent, new CapsuleGeometry(1, 3), undefined);
    this.capsuleComponent.colliderShape = RAPIER.ShapeType.Capsule;
    this.capsuleComponent.setAsRoot(this);
  }
}
