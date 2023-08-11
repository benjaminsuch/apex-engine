import { IConsoleLogger } from '../../platform/logging/common';
import { Actor } from '../Actor';
import { EKeyEvent } from '../PlayerInput';
import { ActorComponent } from './ActorComponent';

export class InputComponent extends ActorComponent {
  private readonly actionBindings: Map<string, Function> = new Map();

  public blockInput: boolean = false;

  constructor(@IConsoleLogger protected readonly logger: IConsoleLogger) {
    super();
  }

  public bindAction<T extends Actor>(
    name: string,
    ref: T,
    fn: Function,
    event: EKeyEvent = EKeyEvent.Pressed
  ) {
    const binding = this.actionBindings.get(name);

    if (binding) {
      this.logger.warn(
        this.constructor.name,
        `An action binding for "${name}" already exists and will be unbound.`
      );
      this.unbindAction(name);
    }

    this.actionBindings.set(name, fn.bind(ref));
  }

  public unbindAction(name: string) {
    this.actionBindings.delete(name);
  }
}
