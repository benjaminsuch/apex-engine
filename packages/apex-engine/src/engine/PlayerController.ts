import { IInstantiationService } from '../platform/di/common/InstantiationService';
import { IConsoleLogger } from '../platform/logging/common/ConsoleLogger';
import { Controller } from './Controller';
import { type IEngineLoopTickContext } from './EngineLoop';
import { PlayerInput } from './input/PlayerInput';
import { type Pawn } from './Pawn';
import { IPhysicsWorkerContext } from './physics/PhysicsWorkerContext';
import { type Player } from './Player';
import { ETickGroup } from './TickManager';

export class PlayerController extends Controller {
  protected player?: Player;

  public getPlayer(): Player {
    if (!this.player) {
      throw new Error(`Player not set.`);
    }
    return this.player;
  }

  public setPlayer(player: Player): void {
    this.player = player;
  }

  public readonly playerInput: PlayerInput;

  constructor(
    @IInstantiationService protected override readonly instantiationService: IInstantiationService,
    @IConsoleLogger protected override readonly logger: IConsoleLogger,
    @IPhysicsWorkerContext protected override readonly physicsContext: IPhysicsWorkerContext
  ) {
    super(instantiationService, logger, physicsContext);

    this.playerInput = this.instantiationService.createInstance(PlayerInput);
    this.actorTick.canTick = true;
  }

  public override async tick(tick: IEngineLoopTickContext): Promise<void> {
    const inputComponent = this.getPawn().inputComponent;

    if (inputComponent) {
      this.playerInput.processInput(inputComponent, tick.delta);
    }

    super.tick(tick);
  }

  protected override onPossess(pawn: Pawn): void {
    if (this.pawn) {
      try {
        this.pawn.getController().unpossess();
      } catch {}
    }

    pawn.possessedBy(this);
    this.setPawn(pawn);

    if (IS_SERVER) {
      pawn.restart();
    } else {
      pawn.restart(true);
    }
  }
}
