import { CapsuleGeometry } from 'three';

import { IInstantiationService } from '../platform/di/common/InstantiationService';
import { IConsoleLogger } from '../platform/logging/common/ConsoleLogger';
import { CameraComponent } from './components/CameraComponent';
import { MeshComponent } from './components/MeshComponent';
import { Pawn } from './Pawn';

export class Character extends Pawn {
  private readonly cameraComponent: CameraComponent;

  protected readonly capsuleComponent: MeshComponent;

  constructor(
    @IInstantiationService protected override readonly instantiationService: IInstantiationService,
    @IConsoleLogger protected override readonly logger: IConsoleLogger
  ) {
    super(instantiationService, logger);

    this.capsuleComponent = this.addComponent(MeshComponent, new CapsuleGeometry(1, 3), undefined);
    this.capsuleComponent.setAsRoot(this);

    this.cameraComponent = this.addComponent(CameraComponent, 50, 1, 0.1, 2000);
    this.cameraComponent.attachToComponent(this.getRootComponent());
  }
}
