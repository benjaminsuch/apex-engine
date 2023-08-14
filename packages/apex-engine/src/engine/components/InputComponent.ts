import { IConsoleLogger } from '../../platform/logging/common';
import { Actor } from '../Actor';
import { EKeyEvent } from '../PlayerInput';
import { ActorComponent } from './ActorComponent';

export class InputComponent extends ActorComponent {
  public readonly actionBindings: InputActionBinding[] = [];

  public readonly axisBindings: InputAxisBinding[] = [];

  public blockInput: boolean = false;

  constructor(@IConsoleLogger protected readonly logger: IConsoleLogger) {
    super();
  }

  public bindAxis<T extends Actor>(name: InputAxisBinding['name'], ref: T, fn: Function) {
    const idx = this.axisBindings.findIndex(binding => binding.name === name);

    if (idx > -1) {
      this.logger.warn(
        this.constructor.name,
        `An axis binding for "${name}" already exists and will be unbound.`
      );
      this.unbindAxis(name);
    }

    this.axisBindings.push(new InputAxisBinding(name, fn.bind(ref)));
  }

  public unbindAxis(name: InputAxisBinding['name']) {
    this.axisBindings.splice(
      this.axisBindings.findIndex(binding => binding.name === name),
      1
    );
  }

  public bindAction<T extends Actor>(
    name: InputActionBinding['name'],
    ref: T,
    fn: Function,
    event: EKeyEvent
  ) {
    const idx = this.axisBindings.findIndex(binding => binding.name === name);

    if (idx > -1) {
      this.logger.warn(
        this.constructor.name,
        `An action binding for "${name}" already exists and will be unbound.`
      );
      this.unbindAction(name);
    }

    this.actionBindings.push(new InputActionBinding(name, fn.bind(ref), event));
  }

  public unbindAction(name: InputActionBinding['name']) {
    this.actionBindings.splice(
      this.actionBindings.findIndex(binding => binding.name === name),
      1
    );
  }
}

export class InputActionBinding {
  constructor(
    public readonly name: string,
    public readonly handle: Function,
    public readonly event: EKeyEvent
  ) {}
}

export class InputAxisBinding {
  constructor(public readonly name: string, public readonly handle: Function) {}
}
