import { IInstantiationService } from '../platform/di/common/InstantiationService';
import { IConsoleLogger } from '../platform/logging/common/ConsoleLogger';
import { InputComponent } from './components/InputComponent';
import { Controller } from './Controller';
import { type IEngineLoopTickContext } from './EngineLoop';
import { type Pawn } from './Pawn';
import { type Player } from './Player';
import { PlayerInput } from './PlayerInput';

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
  ) {
    super(instantiationService, logger);

    this.playerInput = this.instantiationService.createInstance(PlayerInput);

    this.addComponent(InputComponent);
  }

  public override tick(tick: IEngineLoopTickContext): void {
    this.playerInput.processInputStack(this.buildInputStack(), tick.delta);
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

  private buildInputStack(): InputComponent[] {
    const stack: InputComponent[] = [];

    for (const actor of this.getWorld().actors) {
      const component = actor.getComponent(InputComponent);

      if (component) {
        stack.push(component);
      }
    }

    return stack;
  }
}
