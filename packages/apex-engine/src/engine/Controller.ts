import { IInstantiationService } from '../platform/di/common/InstantiationService';
import { IConsoleLogger } from '../platform/logging/common/ConsoleLogger';
import { Actor } from './Actor';
import { type Pawn } from './Pawn';
import { type KinematicControllerProxy } from './physics/KinematicController';
import { IPhysicsWorkerContext } from './physics/PhysicsWorkerContext';

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

  public kinematicController: KinematicControllerProxy | null = null;

  public startSpot?: Actor;

  constructor(
    @IInstantiationService protected override readonly instantiationService: IInstantiationService,
    @IConsoleLogger protected override readonly logger: IConsoleLogger,
    @IPhysicsWorkerContext protected readonly physicsContext: IPhysicsWorkerContext
  ) {
    super(instantiationService, logger);
    // todo: Temporary solution. Remove when we determine the starting spot from the level file.
    this.startSpot = this.instantiationService.createInstance(Actor);
  }

  public override async beginPlay(): Promise<void> {
    await super.beginPlay();

    this.kinematicController = await this.physicsContext.registerKinematicController({ offset: 0.1 });
    this.kinematicController.setApplyImpulsesToDynamicBodies(true);
    this.kinematicController.enableAutostep(0.7, 0.3, true);
    this.kinematicController.enableSnapToGround(0.7);
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
