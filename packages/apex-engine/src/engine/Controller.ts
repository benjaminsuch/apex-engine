import { IInstantiationService } from '../platform/di/common/InstantiationService';
import { IConsoleLogger } from '../platform/logging/common/ConsoleLogger';
import { Actor } from './Actor';
import { type Pawn } from './Pawn';

export class Controller extends Actor {
  protected pawn: Pawn | null = null;

  public getPawn(): Pawn {
    if (!this.pawn) {
      throw new Error(`Pawn not set.`);
    }
    return this.pawn;
  }

  public setPawn(pawn: Controller['pawn']): void {
    this.pawn = pawn;
  }

  public startSpot?: Actor;

  constructor(
    @IInstantiationService protected override readonly instantiationService: IInstantiationService,
    @IConsoleLogger protected override readonly logger: IConsoleLogger,
  ) {
    super(instantiationService, logger);
  }

  public possess(pawn: Pawn): void {
    this.logger.debug(this.constructor.name, 'Possess new pawn:', pawn.constructor.name);
    this.onPossess(pawn);
    // todo: Broadcast event
  }

  public unpossess(): void {
    this.logger.debug(this.constructor.name, 'Unpossess old pawn:', this.pawn?.constructor.name);
    this.onUnPossess();
  }

  protected onPossess(pawn: Pawn): void {
    if (this.pawn) {
      try {
        this.pawn.getController().unpossess();
      } catch {}
    }

    pawn.possessedBy(this);
    this.setPawn(pawn);
    pawn.restart();
  }

  protected onUnPossess(): void {
    if (this.pawn) {
      this.pawn.unpossessed();
      this.setPawn(null);
    }
  }
}
