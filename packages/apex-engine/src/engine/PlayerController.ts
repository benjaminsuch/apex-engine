import { IInstantiationService } from '../platform/di/common/InstantiationService';
import { IConsoleLogger } from '../platform/logging/common/ConsoleLogger';
import { Actor } from './Actor';
import { InputComponent } from './components/InputComponent';
import { type IEngineLoopTickContext } from './EngineLoop';
import { type Pawn } from './Pawn';
import { type Player } from './Player';
import { PlayerInput } from './PlayerInput';

export class PlayerController extends Actor {
  protected pawn: Pawn | null = null;

  public getPawn(): Pawn {
    if (!this.pawn) {
      throw new Error(`Pawn not set.`);
    }
    return this.pawn;
  }

  public setPawn(pawn: PlayerController['pawn']): void {
    this.pawn = pawn;
  }

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

  protected camera?: any;

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

  public possess(pawn: Pawn): void {
    if (this.pawn) {
      this.pawn.getController().unpossess();
    }

    this.logger.debug(this.constructor.name, 'Possess new pawn:', pawn.constructor.name);
    this.setPawn(pawn);

    pawn.possessBy(this);
    pawn.restart();
  }

  public unpossess(): void {
    this.logger.debug(this.constructor.name, 'Unpossess old pawn:', this.pawn?.constructor.name);
    this.pawn?.unpossessed();
    this.setPawn(null);
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
