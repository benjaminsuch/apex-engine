import { IInstantiationService } from '../platform/di/common/InstantiationService';
import { IConsoleLogger } from '../platform/logging/common/ConsoleLogger';
import { Actor } from './Actor';
import { type IEngineLoopTickContext } from './EngineLoop';
import { type Pawn } from './Pawn';
import { KinematicController } from './physics/KinematicController';

export class Controller extends Actor {
  protected kinematicController: KinematicController;

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
    // todo: Temporary solution. Remove when we determine the starting spot from the level file.
    this.startSpot = this.instantiationService.createInstance(Actor);
    this.kinematicController = this.instantiationService.createInstance(KinematicController, 0.1);
    this.actorTick.canTick = true;
  }

  public override tick(context: IEngineLoopTickContext): void {
    this.kinematicController.movement.x = Math.random() * 100;
    this.kinematicController.movement.y = Math.random() * 100;
    this.kinematicController.movement.z = Math.random() * 100;
  }

  public possess(pawn: Pawn): void {
    this.logger.debug(this.constructor.name, 'Possess new pawn:', pawn.constructor.name);
    this.onPossess(pawn);
    // todo: Broadcast event
  }

  public unpossess(): void {
    this.logger.debug(this.constructor.name, 'Unpossess old pawn:', this.pawn?.constructor.name);
    this.onUnPossess();
    // todo: Broadcast event
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
