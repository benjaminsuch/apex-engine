import { IInstantiationService } from '../platform/di/common/InstantiationService';
import { IConsoleLogger } from '../platform/logging/common/ConsoleLogger';
import { CapsuleComponent } from './components/CapsuleComponent';
import { Pawn } from './Pawn';

export class Character extends Pawn {
  protected readonly capsuleComponent: CapsuleComponent;

  constructor(
    @IInstantiationService protected override readonly instantiationService: IInstantiationService,
    @IConsoleLogger protected override readonly logger: IConsoleLogger
  ) {
    super(instantiationService, logger);

    this.capsuleComponent = this.addComponent(CapsuleComponent);
    this.capsuleComponent.setAsRoot(this);
  }
}
